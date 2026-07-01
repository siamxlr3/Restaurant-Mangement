const { supabase } = require('../config/supabase');
const purchaseOrderService = require('./purchaseOrder.service');

class ReorderService {
    /**
     * Compute ingredient average daily usage and generate reorder suggestions.
     * Calculated over order items from the last 30 days.
     */
    async runReorderPredictionJob() {
        const startTime = Date.now();
        let recordsProcessed = 0;

        try {
            console.log('[Reorder Engine] Calculating ingredient usages and suggestions...');

            // 1. Fetch recipes & active ingredients
            const { data: ingredients, error: ingError } = await supabase
                .from('ingredient')
                .select('id, name, unit, stock_qty, cost_per_unit')
                .is('deleted_at', null)
                .eq('is_active', true);

            if (ingError) throw ingError;

            const { data: recipes, error: recipeError } = await supabase
                .from('recipe')
                .select('item_id, ingredient_id, qty_used');

            if (recipeError) throw recipeError;

            // 2. Fetch order items from last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: orderItems, error: orderError } = await supabase
                .from('order_items')
                .select('menu_item_id, quantity, status, orders!inner(created_at, deleted_at)')
                .gte('orders.created_at', thirtyDaysAgo.toISOString())
                .is('orders.deleted_at', null)
                .neq('status', 'voided');

            if (orderError) throw orderError;

            // 3. Compute usage per ingredient
            const ingredientUsage = {};
            for (const item of orderItems) {
                const itemRecipes = recipes.filter(r => r.item_id === item.menu_item_id);
                for (const rec of itemRecipes) {
                    const qtyUsed = parseFloat(rec.qty_used) || 0;
                    const orderQty = parseFloat(item.quantity) || 0;
                    const totalQty = qtyUsed * orderQty;
                    ingredientUsage[rec.ingredient_id] = (ingredientUsage[rec.ingredient_id] || 0) + totalQty;
                }
            }

            // 4. Delete old pending (non-accepted) suggestions to avoid duplicates
            const { error: deleteError } = await supabase
                .from('reorder_suggestion')
                .delete()
                .eq('is_accepted', false);

            if (deleteError) throw deleteError;

            // 5. Calculate metrics for each ingredient
            for (const ing of ingredients) {
                const totalUsed = ingredientUsage[ing.id] || 0;
                const avgDailyUsage = totalUsed / 30;

                // Determine lead_time_days of supplier
                // Find latest purchase order supplier for this ingredient
                const { data: poItems, error: poError } = await supabase
                    .from('purchase_order_item')
                    .select(`
                        ingredient_id,
                        purchase_order!inner(
                            supplier_id,
                            created_at,
                            supplier!inner(lead_time_days)
                        )
                    `)
                    .eq('ingredient_id', ing.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                let leadTimeDays = 3; // Default fallback
                let supplierId = null;

                if (!poError && poItems && poItems.length > 0) {
                    leadTimeDays = poItems[0].purchase_order.supplier.lead_time_days;
                    supplierId = poItems[0].purchase_order.supplier_id;
                } else {
                    // Fall back to first active supplier in system
                    const { data: firstSupplier } = await supabase
                        .from('supplier')
                        .select('id, lead_time_days')
                        .eq('is_active', true)
                        .is('deleted_at', null)
                        .limit(1);

                    if (firstSupplier && firstSupplier.length > 0) {
                        leadTimeDays = firstSupplier[0].lead_time_days;
                        supplierId = firstSupplier[0].id;
                    }
                }

                // formulas
                // reorder_point = avg_daily_usage * lead_time_days * 1.2
                // reorder_qty = avg_daily_usage * 14
                const reorderPoint = avgDailyUsage * leadTimeDays * 1.2;
                const reorderQty = avgDailyUsage * 14;

                // Update ingredient parameters in the DB
                await supabase
                    .from('ingredient')
                    .update({
                        avg_daily_usage: avgDailyUsage,
                        reorder_point: reorderPoint,
                        reorder_qty: reorderQty
                    })
                    .eq('id', ing.id);

                const currentStock = parseFloat(ing.stock_qty) || 0;

                // If stock <= reorderPoint, create suggestion
                // (Only if not already suggested and accepted - checking is_accepted is done since we deleted non-accepted)
                if (currentStock <= reorderPoint && (avgDailyUsage > 0 || currentStock === 0)) {
                    // check if there's already an accepted suggestion logic
                    const { data: existingAccepted } = await supabase
                        .from('reorder_suggestion')
                        .select('id')
                        .eq('ingredient_id', ing.id)
                        .eq('is_accepted', true)
                        .limit(1);

                    if (!existingAccepted || existingAccepted.length === 0) {
                        // calculate days remaining safely
                        const daysRemaining = avgDailyUsage > 0 ? (currentStock / avgDailyUsage) : 999;

                        const suggestedQty = reorderQty > 0 ? reorderQty : 10; // default qty if usage is zero but threshold tripped

                        await supabase
                            .from('reorder_suggestion')
                            .insert([{
                                ingredient_id: ing.id,
                                suggested_qty: suggestedQty,
                                avg_daily_usage: avgDailyUsage,
                                days_remaining: daysRemaining,
                                reason: `Stock level (${currentStock.toFixed(1)} ${ing.unit}) fell below reorder point (${reorderPoint.toFixed(1)} ${ing.unit}).`,
                                is_accepted: false,
                            }]);

                        recordsProcessed += 1;
                    }
                }
            }

            // Log job run as success
            const duration = Date.now() - startTime;
            await supabase
                .from('ai_job_log')
                .insert([{
                    job_type: 'nightly_reorder_suggestion',
                    status: 'success',
                    records_processed: recordsProcessed,
                    duration_ms: duration
                }]);

            return { success: true, recordsProcessed };
        } catch (error) {
            console.error('[Reorder Engine] Prediction job failed:', error.message);
            const duration = Date.now() - startTime;
            await supabase
                .from('ai_job_log')
                .insert([{
                    job_type: 'nightly_reorder_suggestion',
                    status: 'failed',
                    records_processed: recordsProcessed,
                    error_message: error.message,
                    duration_ms: duration
                }]);

            throw error;
        }
    }

    /**
     * Get suggestions list with search, status filters, and date range filters (paginated).
     */
    async getAllSuggestions({
        page = 1,
        per_page = 20,
        search = '',
        status = 'all', // 'all' | 'pending' | 'accepted'
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('reorder_suggestion')
            .select(`
                id,
                ingredient_id,
                suggested_qty,
                reason,
                avg_daily_usage,
                days_remaining,
                is_accepted,
                generated_at,
                ingredient:ingredient_id!inner(id, name, unit, stock_qty, cost_per_unit)
            `, { count: 'exact' });

        if (search) {
            // Supabase does not support ilike on embedded foreign table columns.
            // We first look up matching ingredient IDs and then filter by them.
            const { data: matchedIngs } = await supabase
                .from('ingredient')
                .select('id')
                .ilike('name', `%${search}%`)
                .is('deleted_at', null);

            const ids = (matchedIngs || []).map((i) => i.id);
            if (ids.length === 0) {
                // No ingredient matched — return empty result immediately
                return {
                    data: [],
                    meta: {
                        page: parseInt(page) || 1,
                        per_page: parseInt(per_page) || 20,
                        total: 0,
                        total_pages: 0,
                    },
                };
            }
            query = query.in('ingredient_id', ids);
        }

        if (status === 'pending' || status === 'inactive') {
            query = query.eq('is_accepted', false);
        } else if (status === 'accepted' || status === 'active') {
            query = query.eq('is_accepted', true);
        }

        // Apply on generated_at using: BETWEEN from_date AND to_date
        if (from_date && to_date) {
            query = query.gte('generated_at', `${from_date}T00:00:00.000Z`).lte('generated_at', `${to_date}T23:59:59.999Z`);
        } else if (from_date) {
            query = query.gte('generated_at', `${from_date}T00:00:00.000Z`);
        } else if (to_date) {
            query = query.lte('generated_at', `${to_date}T23:59:59.999Z`);
        }

        const limit = Math.min(parseInt(per_page) || 20, 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

        query = query.range(offset, offset + limit - 1).order('generated_at', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data || [],
            meta: {
                page: parseInt(page) || 1,
                per_page: limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        };
    }

    /**
     * Accept reorder suggestion to draft purchase order.
     */
    async acceptSuggestion(id, staffId = null) {
        // 1. Fetch suggestion with ingredient details
        const { data: suggestion, error: sugErr } = await supabase
            .from('reorder_suggestion')
            .select(`
                id,
                ingredient_id,
                suggested_qty,
                is_accepted,
                ingredient:ingredient_id(cost_per_unit)
            `)
            .eq('id', id)
            .single();

        if (sugErr || !suggestion) {
            const error = new Error('Reorder suggestion not found');
            error.statusCode = 404;
            throw error;
        }

        if (suggestion.is_accepted) {
            const error = new Error('Reorder suggestion is already accepted');
            error.statusCode = 400;
            throw error;
        }

        // 2. Determine supplier to construct PO
        // Find latest purchase order supplier for this ingredient
        const { data: poItems } = await supabase
            .from('purchase_order_item')
            .select(`
                purchase_order!inner(supplier_id)
            `)
            .eq('ingredient_id', suggestion.ingredient_id)
            .order('created_at', { ascending: false })
            .limit(1);

        let supplierId = null;
        if (poItems && poItems.length > 0) {
            supplierId = poItems[0].purchase_order.supplier_id;
        } else {
            // Fall back to first active supplier
            const { data: firstSupplier } = await supabase
                .from('supplier')
                .select('id')
                .eq('is_active', true)
                .is('deleted_at', null)
                .limit(1);

            if (firstSupplier && firstSupplier.length > 0) {
                supplierId = firstSupplier[0].id;
            }
        }

        if (!supplierId) {
            const error = new Error('No active supplier found in system to assign purchase order');
            error.statusCode = 400;
            throw error;
        }

        const costPerUnit = parseFloat(suggestion.ingredient.cost_per_unit) || 0;

        // 3. Create Draft PO with ai_suggested = true
        const purchaseOrder = await purchaseOrderService.createPurchaseOrder({
            supplier_id: supplierId,
            staff_id: staffId,
            ai_suggested: true,
            status: 'draft',
            items: [{
                ingredient_id: suggestion.ingredient_id,
                qty: parseFloat(suggestion.suggested_qty),
                unit_cost: costPerUnit
            }]
        });

        // 4. Mark suggestion as accepted
        const { error: updateErr } = await supabase
            .from('reorder_suggestion')
            .update({ is_accepted: true })
            .eq('id', id);

        if (updateErr) throw updateErr;

        return purchaseOrder;
    }

    /**
     * Delete/Dismiss suggestion.
     */
    async deleteSuggestion(id) {
        const { error } = await supabase
            .from('reorder_suggestion')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    /**
     * Update suggested quantity.
     */
    async updateSuggestion(id, suggestedQty) {
        const { data, error } = await supabase
            .from('reorder_suggestion')
            .update({ suggested_qty: parseFloat(suggestedQty) })
            .eq('id', id)
            .select(`
                id,
                ingredient_id,
                suggested_qty,
                reason,
                avg_daily_usage,
                days_remaining,
                is_accepted,
                generated_at,
                ingredient:ingredient_id(id, name, unit, stock_qty, cost_per_unit)
            `)
            .single();

        if (error) throw error;
        return data;
    }
}

module.exports = new ReorderService();
