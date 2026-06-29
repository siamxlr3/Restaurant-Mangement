const { supabase } = require('../config/supabase');

// ── Selected columns (no SELECT *) ──────────────────────────────────────────
const INGREDIENT_FIELDS =
    'id, name, unit, stock_qty, low_stock_threshold, avg_daily_usage, reorder_point, reorder_qty, cost_per_unit, is_active, created_at, updated_at';

class IngredientService {
    /**
     * GET /ingredients — paginated list with filters
     */
    async getAllIngredients({
        page = 1,
        per_page = 20,
        search = '',
        status = 'all',
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('ingredient')
            .select(INGREDIENT_FIELDS, { count: 'exact' })
            .is('deleted_at', null);

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (status === 'active') {
            query = query.eq('is_active', true);
        } else if (status === 'inactive') {
            query = query.eq('is_active', false);
        }

        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        }

        const limit = Math.min(parseInt(per_page) || 20, 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

        query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

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
     * GET /ingredients/low-stock — where stock_qty < low_stock_threshold
     */
    async getLowStockIngredients() {
        const { data, error } = await supabase
            .from('ingredient')
            .select(INGREDIENT_FIELDS)
            .is('deleted_at', null)
            .eq('is_active', true)
            .filter('stock_qty', 'lt', supabase.raw ? undefined : null) // handled below via rpc/raw
            .order('stock_qty', { ascending: true });

        // Supabase JS: filter where stock_qty < low_stock_threshold (two columns)
        // Use a raw filter with .lt on a formula — Supabase doesn't directly support
        // cross-column comparisons in the client, so we'll fetch all and filter in JS
        const { data: allData, error: allError } = await supabase
            .from('ingredient')
            .select(INGREDIENT_FIELDS)
            .is('deleted_at', null)
            .eq('is_active', true)
            .order('stock_qty', { ascending: true });

        if (allError) throw allError;
        return (allData || []).filter(
            (r) => parseFloat(r.stock_qty) < parseFloat(r.low_stock_threshold)
        );
    }

    /**
     * GET /ingredients/:id
     */
    async getIngredientById(id) {
        const { data, error } = await supabase
            .from('ingredient')
            .select(INGREDIENT_FIELDS)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) return null;
        return data;
    }

    /**
     * POST /ingredients
     */
    async createIngredient(payload) {
        const { data, error } = await supabase
            .from('ingredient')
            .insert([payload])
            .select(INGREDIENT_FIELDS)
            .single();

        if (error) {
            if (error.code === '23505') {
                const err = new Error('An ingredient with this name already exists');
                err.statusCode = 409;
                throw err;
            }
            throw error;
        }
        return data;
    }

    /**
     * PATCH /ingredients/:id
     */
    async updateIngredient(id, payload) {
        const { data, error } = await supabase
            .from('ingredient')
            .update(payload)
            .eq('id', id)
            .is('deleted_at', null)
            .select(INGREDIENT_FIELDS)
            .single();

        if (error) {
            if (error.code === '23505') {
                const err = new Error('An ingredient with this name already exists');
                err.statusCode = 409;
                throw err;
            }
            throw error;
        }
        return data;
    }

    /**
     * PATCH /ingredients/:id/adjust-stock
     * Manual stock adjustment with audit log
     */
    async adjustStock(id, { delta, reason, adjusted_by = 'system' }) {
        // 1. Fetch current stock
        const ingredient = await this.getIngredientById(id);
        if (!ingredient) {
            const err = new Error('Ingredient not found');
            err.statusCode = 404;
            throw err;
        }

        const newQty = parseFloat(ingredient.stock_qty) + parseFloat(delta);
        if (newQty < 0) {
            const err = new Error('Adjustment would result in negative stock quantity');
            err.statusCode = 422;
            throw err;
        }

        // 2. Update stock_qty
        const { data: updatedIngredient, error: updateError } = await supabase
            .from('ingredient')
            .update({ stock_qty: newQty })
            .eq('id', id)
            .is('deleted_at', null)
            .select(INGREDIENT_FIELDS)
            .single();

        if (updateError) throw updateError;

        // 3. Insert audit log
        const { error: logError } = await supabase
            .from('stock_adjustment_log')
            .insert([{
                ingredient_id: id,
                delta: parseFloat(delta),
                reason,
                adjusted_by,
            }]);

        if (logError) console.error('Stock log insert failed:', logError.message);

        return updatedIngredient;
    }

    /**
     * DELETE /ingredients/:id — soft delete
     */
    async softDeleteIngredient(id) {
        const { error } = await supabase
            .from('ingredient')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null);

        if (error) throw error;
        return true;
    }

    /**
     * Decrement stock for all ingredients used in a given order item (by recipe)
     * Called when order_item.status → preparing
     * @param {string} orderId
     * @param {Array<{ item_id: string, quantity: number }>} orderItems
     */
    async decrementStockForOrder(orderId, orderItems) {
        if (!orderItems || orderItems.length === 0 || !orderId) return;

        // Check if deduction was already done for this order to prevent double-deduction
        const { data: existingLogs } = await supabase
            .from('stock_adjustment_log')
            .select('id')
            .eq('reason', `order_deduction:${orderId}`)
            .limit(1);

        if (existingLogs && existingLogs.length > 0) {
            return;
        }

        for (const { item_id, quantity } of orderItems) {
            // Fetch recipe for this menu item
            const { data: recipeRows, error: recipeError } = await supabase
                .from('recipe')
                .select('ingredient_id, qty_used')
                .eq('item_id', item_id);

            if (recipeError || !recipeRows || recipeRows.length === 0) continue;

            for (const row of recipeRows) {
                const deduction = parseFloat(row.qty_used) * (quantity || 1);

                // Fetch current stock
                const { data: ing } = await supabase
                    .from('ingredient')
                    .select('id, stock_qty')
                    .eq('id', row.ingredient_id)
                    .is('deleted_at', null)
                    .single();

                if (!ing) continue;

                const newQty = Math.max(0, parseFloat(ing.stock_qty) - deduction);

                await supabase
                    .from('ingredient')
                    .update({ stock_qty: newQty })
                    .eq('id', row.ingredient_id);

                // Log the deduction with specific order ID context
                await supabase
                    .from('stock_adjustment_log')
                    .insert([{
                        ingredient_id: row.ingredient_id,
                        delta: -deduction,
                        reason: `order_deduction:${orderId}`,
                        adjusted_by: 'system',
                    }]);
            }
        }
    }
}

module.exports = new IngredientService();
