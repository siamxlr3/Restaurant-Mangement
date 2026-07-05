const { supabase } = require('../config/supabase');

class DemandForecastService {
    /**
     * Get forecasts with search, category filtering, status, and custom date range (paginated).
     */
    async getForecasts({
        page = 1,
        per_page = 20,
        search = '',
        status = undefined, // 'active' | 'inactive'
        category_id = null,
        from_date = null,
        to_date = null,
    } = {}) {
        // Enforce server-side limit cap
        const limit = Math.min(parseInt(per_page) || 20, 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

        // Perform basic menu-item filtering and return IDs to avoid complex join query issues in Supabase JS SDK
        let itemQuery = supabase
            .from('menu_item')
            .select('id')
            .is('deleted_at', null);

        if (search) {
            itemQuery = itemQuery.ilike('name', `%${search}%`);
        }
        if (category_id) {
            itemQuery = itemQuery.eq('category_id', category_id);
        }
        if (status === 'active') {
            itemQuery = itemQuery.eq('is_available', true);
        } else if (status === 'inactive') {
            itemQuery = itemQuery.eq('is_available', false);
        }

        const { data: matchedItems, error: itemErr } = await itemQuery;
        if (itemErr) throw itemErr;

        const matchedItemIds = (matchedItems || []).map(i => i.id);

        // If a filter was applied but no items matched, return empty results immediately
        if ((search || category_id || status) && matchedItemIds.length === 0) {
            return {
                data: [],
                meta: {
                    page: parseInt(page) || 1,
                    per_page: limit,
                    total: 0,
                    total_pages: 0
                }
            };
        }

        // Build core demand_forecast query
        let query = supabase
            .from('demand_forecast')
            .select(`
                id,
                forecast_date,
                menu_item_id,
                predicted_qty,
                actual_qty,
                confidence,
                generated_at,
                created_at,
                menu_item:menu_item_id(id, name, is_available, category_id, base_price)
            `, { count: 'exact' });

        // Filter by menu item IDs
        if (matchedItemIds.length > 0) {
            query = query.in('menu_item_id', matchedItemIds);
        }

        // Apply on created_at using: BETWEEN from_date AND to_date
        if (from_date && to_date) {
            query = query.gte('created_at', `${from_date}T00:00:00.000Z`).lte('created_at', `${to_date}T23:59:59.999Z`);
        } else if (from_date) {
            query = query.gte('created_at', `${from_date}T00:00:00.000Z`);
        } else if (to_date) {
            query = query.lte('created_at', `${to_date}T23:59:59.999Z`);
        }

        query = query
            .range(offset, offset + limit - 1)
            .order('forecast_date', { ascending: true })
            .order('created_at', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data || [],
            meta: {
                page: parseInt(page) || 1,
                per_page: limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit)
            }
        };
    }

    /**
     * Get job run logs for monitoring AI engine runs.
     */
    async getJobLogs() {
        const { data, error } = await supabase
            .from('ai_job_log')
            .select('*')
            .eq('job_type', 'demand_forecasting')
            .order('ran_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data || [];
    }

    /**
     * Allows manual actual quantity update for correcting or comparing numbers.
     */
    async updateActualQty(id, actual_qty) {
        const { data, error } = await supabase
            .from('demand_forecast')
            .update({ actual_qty })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                const err = new Error('Demand forecast record not found');
                err.statusCode = 404;
                throw err;
            }
            throw error;
        }

        return data;
    }

    /**
     * Nightly demand forecasting batch processing job.
     */
    async runDemandForecastingJob() {
        const startTime = Date.now();
        let recordsProcessed = 0;

        try {
            console.log('[Demand Forecast Engine] Starting nightly calculations...');

            // 1. Fetch all items currently active (skip soft deleted)
            const { data: menuItems, error: itemsErr } = await supabase
                .from('menu_item')
                .select('id, name')
                .is('deleted_at', null);

            if (itemsErr) throw itemsErr;
            if (!menuItems || menuItems.length === 0) {
                console.log('[Demand Forecast Engine] No items to forecast.');
                return { success: true, recordsProcessed: 0 };
            }

            // 2. Fetch order items for the past 12 weeks (12 * 7 days = 84 days)
            const today = new Date();
            const twelveWeeksAgo = new Date();
            twelveWeeksAgo.setDate(today.getDate() - 84);

            const { data: orderItems, error: orderErr } = await supabase
                .from('order_items')
                .select('menu_item_id, quantity, created_at, orders!inner(status, deleted_at)')
                .gte('created_at', twelveWeeksAgo.toISOString())
                .is('orders.deleted_at', null)
                .neq('status', 'voided');

            if (orderErr) throw orderErr;

            // 3. Initialize grid for item x Day of Week (0-6) x Week Ago (1-12)
            const salesGrid = {};
            for (const item of menuItems) {
                salesGrid[item.id] = Array.from({ length: 7 }, () => Array(13).fill(0));
            }

            // Populate current sales numbers into the grid
            const todayMidnight = new Date(today);
            todayMidnight.setHours(0, 0, 0, 0);

            for (const oi of orderItems || []) {
                const itemId = oi.menu_item_id;
                if (!salesGrid[itemId]) continue; // Skip items we don't have listed

                const qty = parseFloat(oi.quantity) || 0;
                const orderDate = new Date(oi.created_at);
                const dow = orderDate.getDay();

                // Compute days difference between order date and midnight of today
                const diffTime = todayMidnight.getTime() - orderDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) continue; // Skip future orders

                // Math: 0-6 days ago = week 1, 7-13 days ago = week 2, ...
                const weekAgo = Math.floor(diffDays / 7) + 1;

                if (weekAgo >= 1 && weekAgo <= 12) {
                    salesGrid[itemId][dow][weekAgo] += qty;
                }
            }

            // 4. Generate forecasts for the next 7 days (starting tomorrow)
            // Weight structure: latest week (1) has weight 12, oldest week (12) has weight 1.
            const weights = Array.from({ length: 12 }, (_, i) => 12 - i);
            const sumOfWeights = weights.reduce((a, b) => a + b, 0); // 78

            const forecastsToInsert = [];

            for (const item of menuItems) {
                const itemId = item.id;

                for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
                    const targetDate = new Date(todayMidnight);
                    targetDate.setDate(todayMidnight.getDate() + dayOffset);
                    const targetDOW = targetDate.getDay();

                    // Retrieve historical vector for this day of week
                    const history = salesGrid[itemId][targetDOW];
                    
                    let weightedSum = 0;
                    let activeWeeksCount = 0;

                    for (let w = 1; w <= 12; w++) {
                        const weeklyQty = history[w];
                        weightedSum += weeklyQty * weights[w - 1];
                        if (weeklyQty > 0) {
                            activeWeeksCount++;
                        }
                    }

                    // Compute values
                    const predictedQtyStr = (weightedSum / sumOfWeights).toFixed(2);
                    const predictedQty = parseFloat(predictedQtyStr);
                    const confidenceStr = (activeWeeksCount / 12).toFixed(4);
                    const confidence = parseFloat(confidenceStr);

                    // Insert or update on conflict (item_id + forecast_date)
                    forecastsToInsert.push({
                        forecast_date: targetDate.toISOString().split('T')[0],
                        menu_item_id: itemId,
                        predicted_qty: predictedQty,
                        confidence: confidence,
                        generated_at: new Date().toISOString()
                    });
                }
            }

            // 5. Batch Upsert to Supabase
            if (forecastsToInsert.length > 0) {
                const { error: upsertErr } = await supabase
                    .from('demand_forecast')
                    .upsert(forecastsToInsert, { onConflict: 'menu_item_id, forecast_date' });

                if (upsertErr) throw upsertErr;
                recordsProcessed = forecastsToInsert.length;
            }

            // 6. Automatically update actual quantities for past forecast records
            await this.updatePastActualQuantities();

            // Log job run as success
            const duration = Date.now() - startTime;
            await supabase
                .from('ai_job_log')
                .insert([{
                    job_type: 'demand_forecasting',
                    status: 'success',
                    records_processed: recordsProcessed,
                    duration_ms: duration,
                    ran_at: new Date().toISOString()
                }]);

            console.log(`[Demand Forecast Engine] Calculation job completed. Processed ${recordsProcessed} predictions.`);
            return { success: true, recordsProcessed };

        } catch (error) {
            console.error('[Demand Forecast Engine] Calculation job failed:', error.message);
            const duration = Date.now() - startTime;
            await supabase
                .from('ai_job_log')
                .insert([{
                    job_type: 'demand_forecasting',
                    status: 'failed',
                    records_processed: 0,
                    error_message: error.message,
                    duration_ms: duration,
                    ran_at: new Date().toISOString()
                }]);

            throw error;
        }
    }

    /**
     * Compute actual sold quantities for historical forecasts.
     */
    async updatePastActualQuantities() {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Find forecast records for past dates where actual_qty is null
        const { data: forecasts, error: forecastErr } = await supabase
            .from('demand_forecast')
            .select('id, forecast_date, menu_item_id')
            .lt('forecast_date', todayStr)
            .is('actual_qty', null);

        if (forecastErr) {
            console.error('[Demand Forecast Engine] Error fetching past forecasts:', forecastErr.message);
            return;
        }

        if (!forecasts || forecasts.length === 0) {
            return;
        }

        // Update actual qty for each forecast
        for (const fc of forecasts) {
            const startDate = `${fc.forecast_date}T00:00:00.000Z`;
            const endDate = `${fc.forecast_date}T23:59:59.999Z`;

            const { data: sales, error: salesErr } = await supabase
                .from('order_items')
                .select('quantity, orders!inner(status, deleted_at)')
                .eq('menu_item_id', fc.menu_item_id)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .is('orders.deleted_at', null)
                .neq('status', 'voided');

            if (salesErr) {
                console.error(`[Demand Forecast Engine] Error querying sales for menu_item ${fc.menu_item_id} on ${fc.forecast_date}:`, salesErr.message);
                continue;
            }

            const totalSold = (sales || []).reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

            await supabase
                .from('demand_forecast')
                .update({ actual_qty: totalSold })
                .eq('id', fc.id);
        }
    }

    /**
     * Delete/Dismiss a forecast record.
     */
    async deleteForecast(id) {
        const { error } = await supabase
            .from('demand_forecast')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
}

module.exports = new DemandForecastService();
