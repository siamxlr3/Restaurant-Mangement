const { supabase } = require('../config/supabase');
const { invalidateCache } = require('../config/redis');

class ReportsService {
    /**
     * Helper to get date boundaries for a day (local time start/end as ISO)
     */
    _getDayBoundaries(dateStr) {
        const start = `${dateStr}T00:00:00.000Z`;
        const end = `${dateStr}T23:59:59.999Z`;
        return { start, end };
    }

    /**
     * Compute and cache daily sales reports
     */
    async getSalesReport({ from_date, to_date, page = 1, per_page = 20 }) {
        // Enforce defaults: last 30 days if not provided
        const endDay = to_date ? new Date(to_date) : new Date();
        const startDay = from_date ? new Date(from_date) : new Date(new Date().setDate(endDay.getDate() - 30));

        const fromStr = startDay.toISOString().split('T')[0];
        const toStr = endDay.toISOString().split('T')[0];

        // Fetch bills created in the date range
        const { data: bills, error: billsError } = await supabase
            .from('bills')
            .select(`
                id,
                subtotal,
                tax,
                discount_total,
                total,
                status,
                created_at,
                order_id
            `)
            .is('deleted_at', null)
            .gte('created_at', `${fromStr}T00:00:00.000Z`)
            .lte('created_at', `${toStr}T23:59:59.999Z`);

        if (billsError) throw billsError;

        // Fetch orders associated with these bills
        const orderIds = [...new Set(bills.map(b => b.order_id))];
        let ordersMap = {};
        if (orderIds.length > 0) {
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, type, status, void_reason')
                .in('id', orderIds);
            
            if (ordersError) throw ordersError;
            orders.forEach(o => {
                ordersMap[o.id] = o;
            });
        }

        // Fetch payments for these bills
        const billIds = bills.map(b => b.id);
        let payments = [];
        if (billIds.length > 0) {
            const { data: payData, error: payError } = await supabase
                .from('payments')
                .select('id, bill_id, method, amount, status')
                .in('bill_id', billIds)
                .is('deleted_at', null);
            if (payError) throw payError;
            payments = payData || [];
        }

        // Group billing data by day
        const dailyData = {};
        bills.forEach(bill => {
            const dayKey = bill.created_at.split('T')[0];
            const order = ordersMap[bill.order_id] || { type: 'dine-in', status: 'pending', void_reason: null };
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    period_label: dayKey,
                    total_revenue: 0,
                    subtotal_revenue: 0,
                    total_tax: 0,
                    total_discounts: 0,
                    total_orders: 0,
                    dine_in_count: 0,
                    takeaway_count: 0,
                    delivery_count: 0,
                    dine_in_revenue: 0,
                    cash_collected: 0,
                    card_collected: 0,
                    bkash_collected: 0,
                    void_count: 0,
                    refund_total: 0,
                    order_ids: new Set()
                };
            }

            const dayObj = dailyData[dayKey];

            // Calculations based on bill status
            const isPaid = bill.status === 'paid';
            const isRefunded = bill.status === 'refunded';

            if (isPaid || isRefunded) {
                dayObj.total_revenue += parseFloat(bill.total);
                dayObj.subtotal_revenue += parseFloat(bill.subtotal);
                dayObj.total_tax += parseFloat(bill.tax);
                dayObj.total_discounts += parseFloat(bill.discount_total);

                if (order.type === 'dine-in') {
                    dayObj.dine_in_revenue += parseFloat(bill.total);
                }
            }

            if (!dayObj.order_ids.has(bill.order_id)) {
                dayObj.order_ids.add(bill.order_id);
                dayObj.total_orders += 1;
                
                if (order.type === 'dine-in') dayObj.dine_in_count += 1;
                else if (order.type === 'takeaway') dayObj.takeaway_count += 1;
                else if (order.type === 'delivery') dayObj.delivery_count += 1;

                if (order.void_reason || order.status === 'voided') {
                    dayObj.void_count += 1;
                }
            }
        });

        // Add payment collection metrics to appropriate day
        payments.forEach(payment => {
            const matchedBill = bills.find(b => b.id === payment.bill_id);
            if (!matchedBill) return;
            const dayKey = matchedBill.created_at.split('T')[0];
            const dayObj = dailyData[dayKey];
            if (!dayObj) return;

            if (payment.status === 'completed') {
                if (payment.method === 'cash') dayObj.cash_collected += parseFloat(payment.amount);
                else if (payment.method === 'card') dayObj.card_collected += parseFloat(payment.amount);
                else if (payment.method === 'bkash') dayObj.bkash_collected += parseFloat(payment.amount);
            } else if (payment.status === 'refunded') {
                dayObj.refund_total += parseFloat(payment.amount);
            }
        });

        // Format and finalize daily records
        const recordsToUpsert = Object.values(dailyData).map(day => {
            const avg_order_value = day.total_orders > 0 ? (day.total_revenue / day.total_orders) : 0;
            delete day.order_ids; // cleanup helper set
            return {
                ...day,
                avg_order_value
            };
        });

        // Save snapshots back to database table sale_report
        if (recordsToUpsert.length > 0) {
            const { error: upsertError } = await supabase
                .from('sale_report')
                .upsert(recordsToUpsert, { onConflict: 'period_label' });
            if (upsertError) console.error('Error caching daily sales reports:', upsertError.message);
        }

        // Retrieve paginated records from the sale_report table
        const limit = Math.min(per_page, 100);
        const offset = (page - 1) * limit;

        const { data: dbData, error: dbError, count } = await supabase
            .from('sale_report')
            .select('*', { count: 'exact' })
            .gte('period_label', fromStr)
            .lte('period_label', toStr)
            .order('period_label', { ascending: false })
            .range(offset, offset + limit - 1);

        if (dbError) throw dbError;

        return {
            data: dbData || [],
            meta: {
                page,
                per_page: limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            }
        };
    }

    /**
     * Menu item performance evaluation
     */
    async getMenuPerformance({ from_date, to_date, page = 1, per_page = 20, search = '', status = 'all', category_id = null }) {
        // Fetch all categories and active menu items
        let itemsQuery = supabase
            .from('menu_item')
            .select('id, name, base_price, food_cost, is_available, category_id, menu_category(name)')
            .is('deleted_at', null);

        if (category_id) {
            itemsQuery = itemsQuery.eq('category_id', category_id);
        }
        if (search) {
            itemsQuery = itemsQuery.ilike('name', `%${search}%`);
        }
        if (status === 'active') {
            itemsQuery = itemsQuery.eq('is_available', true);
        } else if (status === 'inactive') {
            itemsQuery = itemsQuery.eq('is_available', false);
        }

        const { data: items, error: itemsError } = await itemsQuery;
        if (itemsError) throw itemsError;

        if (items.length === 0) {
            return { data: [], meta: { page, per_page, total: 0, total_pages: 0 } };
        }

        // Fetch order items (transactions) in date range
        let itemSalesMap = {};
        let orderItemsQuery = supabase
            .from('order_items')
            .select('menu_item_id, quantity, unit_price')
            .neq('status', 'voided');

        if (from_date && to_date) {
            orderItemsQuery = orderItemsQuery
                .gte('created_at', `${from_date}T00:00:00.000Z`)
                .lte('created_at', `${to_date}T23:59:59.999Z`);
        } else {
            // Default: last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            orderItemsQuery = orderItemsQuery.gte('created_at', thirtyDaysAgo.toISOString());
        }

        const { data: soldItems, error: soldError } = await orderItemsQuery;
        if (soldError) throw soldError;

        (soldItems || []).forEach(si => {
            if (!itemSalesMap[si.menu_item_id]) {
                itemSalesMap[si.menu_item_id] = { qty: 0, revenue: 0 };
            }
            itemSalesMap[si.menu_item_id].qty += parseInt(si.quantity || 0);
            itemSalesMap[si.menu_item_id].revenue += (parseInt(si.quantity || 0) * parseFloat(si.unit_price || 0));
        });

        // Compute Category Revenue totals
        const categoryRevMap = {};
        items.forEach(item => {
            const sales = itemSalesMap[item.id] || { qty: 0, revenue: 0 };
            const categoryName = item.menu_category ? item.menu_category.name : 'Uncategorized';
            categoryRevMap[categoryName] = (categoryRevMap[categoryName] || 0) + sales.revenue;
        });

        // Map items to performance metrics
        let perfRecords = items.map(item => {
            const sales = itemSalesMap[item.id] || { qty: 0, revenue: 0 };
            const qty = sales.qty;
            const revenue = sales.revenue;

            const categoryName = item.menu_category ? item.menu_category.name : 'Uncategorized';
            const itemFoodCost = parseFloat(item.food_cost || 0);
            const totalFoodCost = itemFoodCost * qty;
            const grossProfit = revenue - totalFoodCost;
            
            const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
            const catRevenue = categoryRevMap[categoryName] || 0;
            const revenueSharePct = catRevenue > 0 ? (revenue / catRevenue) * 100 : 0;
            const avgUnitPrice = qty > 0 ? (revenue / qty) : parseFloat(item.base_price || 0);

            return {
                menu_item_id: item.id,
                item_name: item.name,
                category_name: categoryName,
                total_qty_sold: qty,
                total_revenue: revenue,
                avg_unit_price: avgUnitPrice,
                food_cost: itemFoodCost,
                total_food_cost: totalFoodCost,
                gross_profit: grossProfit,
                margin_pct: marginPct,
                revenue_share_pct: revenueSharePct,
                category_revenue: catRevenue,
                is_slow_mover: false, // will rank and calculate below
                rank: 0
            };
        });

        // Rank items by revenue descending
        perfRecords.sort((a, b) => b.total_revenue - a.total_revenue);
        perfRecords.forEach((rec, idx) => {
            rec.rank = idx + 1;
        });

        // Mark slow movers: bottom 20% by rank OR sold quantity < 5
        const totalItemsCount = perfRecords.length;
        perfRecords = perfRecords.map(rec => {
            const isBottom20 = rec.rank >= Math.ceil(totalItemsCount * 0.8);
            const isSlow = isBottom20 || rec.total_qty_sold < 5;
            return {
                ...rec,
                is_slow_mover: isSlow
            };
        });

        // Save snapshots back to database table menu_performence
        if (perfRecords.length > 0) {
            // Delete old records for clean caching/snapshotting (since rank changes daily)
            await supabase.from('menu_performence').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { error: upsertError } = await supabase
                .from('menu_performence')
                .insert(perfRecords);
            if (upsertError) console.error('Error caching menu performance:', upsertError.message);
        }

        // Apply pagination
        const limit = Math.min(per_page, 100);
        const offset = (page - 1) * limit;
        const total = perfRecords.length;
        const slicedRecords = perfRecords.slice(offset, offset + limit);

        return {
            data: slicedRecords,
            meta: {
                page,
                per_page: limit,
                total,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Inventory stock cost and wastage calculation
     */
    async getInventoryCost({ page = 1, per_page = 20, search = '' }) {
        // Query ingredients
        let ingQuery = supabase
            .from('ingredient')
            .select('id, name, unit, stock_qty, cost_per_unit')
            .is('deleted_at', null);

        if (search) {
            ingQuery = ingQuery.ilike('name', `%${search}%`);
        }

        const { data: ingredients, error: ingError } = await ingQuery;
        if (ingError) throw ingError;

        if (ingredients.length === 0) {
            return { data: [], meta: { page, per_page, total: 0, total_pages: 0 } };
        }

        // Fetch received Purchase Orders (received status)
        const { data: poItems, error: poItemsError } = await supabase
            .from('purchase_order_item')
            .select(`
                qty,
                unit_cost,
                ingredient_id,
                purchase_order!inner(id, supplier_id, status)
            `)
            .eq('purchase_order.status', 'received');
        if (poItemsError) throw poItemsError;

        // Fetch supplier details
        const { data: suppliers, error: supError } = await supabase
            .from('supplier')
            .select('id, name')
            .is('deleted_at', null);
        if (supError) throw supError;
        const supplierMap = (suppliers || []).reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {});

        // Fetch default configurations for wastage
        const { data: wastageLogs, error: wastageError } = await supabase
            .from('stock_adjustment_log')
            .select('ingredient_id, delta, reason')
            .in('reason', ['wastage', 'spoilage']);
        if (wastageError) throw wastageError;

        // Get AI reorder suggestions
        const { data: reorderSuggestions, error: reorderError } = await supabase
            .from('reorder_suggestion')
            .select('ingredient_id, suggested_qty')
            .eq('is_accepted', false);
        if (reorderError) throw reorderError;

        // Get all menu items sold and calculate recipe requirements
        const { data: recipes, error: recipesError } = await supabase
            .from('recipe')
            .select('item_id, ingredient_id, qty_used');
        if (recipesError) throw recipesError;

        const { data: orderItems, error: orderItemsError } = await supabase
            .from('order_items')
            .select('menu_item_id, quantity')
            .neq('status', 'voided');
        if (orderItemsError) throw orderItemsError;

        // Core maps calculations
        const theoreticalUsageMap = {};
        (orderItems || []).forEach(oi => {
            const itemRecipes = recipes.filter(r => r.item_id === oi.menu_item_id);
            itemRecipes.forEach(ir => {
                const qtyVal = parseFloat(ir.qty_used) * parseInt(oi.quantity);
                theoreticalUsageMap[ir.ingredient_id] = (theoreticalUsageMap[ir.ingredient_id] || 0) + qtyVal;
            });
        });

        // Compute results
        const result = ingredients.map(ing => {
            const cleanCostPerUnit = parseFloat(ing.cost_per_unit || 0);
            const currentStock = parseFloat(ing.stock_qty || 0);

            // Purchase quantities
            const matchedPOItems = (poItems || []).filter(item => item.ingredient_id === ing.id);
            const qtyPurchased = matchedPOItems.reduce((acc, item) => acc + parseFloat(item.qty || 0), 0);
            const purchaseCost = matchedPOItems.reduce((acc, item) => acc + (parseFloat(item.qty || 0) * parseFloat(item.unit_cost || 0)), 0);

            // Wastage checks
            const matchedWastages = (wastageLogs || []).filter(log => log.ingredient_id === ing.id);
            const wastageQty = Math.abs(matchedWastages.reduce((acc, log) => acc + parseFloat(log.delta || 0), 0));

            // Theoretical & Actual consumptions
            const qtyTheoretical = theoreticalUsageMap[ing.id] || 0;
            const qtyActual = qtyTheoretical + wastageQty;

            // AI suggested POS
            const rawSuggestions = (reorderSuggestions || []).filter(s => s.ingredient_id === ing.id);
            const aiSuggested = rawSuggestions.reduce((acc, s) => acc + Math.ceil(parseFloat(s.suggested_qty || 0)), 0);

            // Fetch supplier name from latest PO
            let supplierName = null;
            if (matchedPOItems.length > 0) {
                const latestPOItem = matchedPOItems[matchedPOItems.length - 1];
                const supplierId = latestPOItem.purchase_order ? latestPOItem.purchase_order.supplier_id : null;
                supplierName = supplierMap[supplierId];
            }

            return {
                ingredient_id: ing.id,
                ingredient_name: ing.name,
                unit: ing.unit,
                current_stock_qty: currentStock,
                cost_per_unit: cleanCostPerUnit,
                current_stock_value: currentStock * cleanCostPerUnit,
                qty_purchased: qtyPurchased,
                purchase_cost: purchaseCost,
                qty_consumed_theoretical: qtyTheoretical,
                qty_consumed_actual: qtyActual,
                wastage_qty: wastageQty,
                wastage_value: wastageQty * cleanCostPerUnit,
                ai_suggested_pos: aiSuggested,
                supplier_name: supplierName || 'No POs Created'
            };
        });

        // Sync back into database inventory_cost table
        if (result.length > 0) {
            await supabase.from('inventory_cost').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { error: upsertError } = await supabase
                .from('inventory_cost')
                .insert(result);
            if (upsertError) console.error('Error caching inventory cost:', upsertError.message);
        }

        // Paginate results
        const limit = Math.min(per_page, 100);
        const offset = (page - 1) * limit;
        const total = result.length;
        const sliced = result.slice(offset, offset + limit);

        return {
            data: sliced,
            meta: {
                page,
                per_page: limit,
                total,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Compute and fetch revenue anomaly alerts
     */
    async getAnomalyAlerts({ status = 'all', page = 1, per_page = 20 }) {
        // Automatically check/run anomaly detection for today on fetch to keep records fresh
        await this.detectRevenueAnomaly();

        let query = supabase
            .from('anomaly_alerts')
            .select('*', { count: 'exact' });

        if (status === 'read') {
            query = query.eq('is_read', true);
        } else if (status === 'unread') {
            query = query.eq('is_read', false);
        } else if (status === 'dismissed') {
            query = query.eq('is_dismissed', true);
        }

        const limit = Math.min(per_page, 100);
        const offset = (page - 1) * limit;

        const { data, error, count } = await query
            .order('generated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            data: data || [],
            meta: {
                page,
                per_page: limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit)
            }
        };
    }

    /**
     * Trigger updating is_read/is_dismissed state on an anomaly alert
     */
    async updateAnomalyAlert(id, updateData) {
        const { data, error } = await supabase
            .from('anomaly_alerts')
            .update({
                ...updateData
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidate redis cache on mutation
        await invalidateCache('reports:anomalies');

        return data;
    }

    /**
     * Run daily revenue anomaly logic
     */
    async detectRevenueAnomaly() {
        const todayStr = new Date().toISOString().split('T')[0];
        const { start: todayStart, end: todayEnd } = this._getDayBoundaries(todayStr);

        // Check if an anomaly alert has already been run today to avoid duplicate entries
        const { data: existingAlerts, error: checkError } = await supabase
            .from('anomaly_alerts')
            .select('id')
            .eq('feature', 'revenue')
            .gte('generated_at', todayStart)
            .lte('generated_at', todayEnd);

        if (checkError) console.error('Error checking anomaly history:', checkError.message);
        if (existingAlerts && existingAlerts.length > 0) {
            // Already checked today
            return;
        }

        // Seed mock anomaly alerts in development mode if the table is empty
        if (process.env.NODE_ENV === 'development') {
            const { count: totalCount, error: countError } = await supabase
                .from('anomaly_alerts')
                .select('id', { count: 'exact', head: true });

            if (!countError && totalCount === 0) {
                console.log('[SUPABASE SEED] Seeding mock anomaly alerts in development mode...');
                const mockAlerts = [
                    {
                        feature: 'revenue',
                        type: 'revenue_drop',
                        headline: 'Significant Sunday Revenue Drop Detected',
                        body: "Today's revenue of $1,508.00 is 35.0% lower than the 4-week Sunday average of $2,320.00.",
                        cta_label: 'View Sales Report',
                        cta_href: '/reports/sales',
                        confidence: 0.92,
                        payload: {
                            today_revenue: 1508.00,
                            historical_average: 2320.00,
                            deviation: -0.35,
                            same_weekdays_history: [2500, 2100, 2400, 2280]
                        },
                        generated_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
                    },
                    {
                        feature: 'inventory',
                        type: 'inventory',
                        headline: 'High Ingredient Wastage Spike',
                        body: 'Wastage of Beef Patty increased by 42.0% over the baseline average this week, costing an additional $180.00.',
                        cta_label: 'View Inventory Cost',
                        cta_href: '/reports/inventory-cost',
                        confidence: 0.88,
                        payload: {
                            ingredient: 'Beef Patty',
                            wastage_qty: 30,
                            cost: 180.00
                        },
                        generated_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
                    },
                    {
                        feature: 'kitchen',
                        type: 'kitchen',
                        headline: 'Preparation Time Delay Alert',
                        body: 'Average preparation time for Ribeye Steak surged to 32 minutes today (+40.0% compared to average). Check kitchen logs.',
                        cta_label: 'View Menu Performance',
                        cta_href: '/reports/menu-performance',
                        confidence: 0.95,
                        payload: {
                            item: 'Ribeye Steak',
                            avg_prep_time: 32,
                            baseline_prep_time: 22.8
                        },
                        generated_at: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
                    }
                ];
                const { error: seedError } = await supabase
                    .from('anomaly_alerts')
                    .insert(mockAlerts);
                if (seedError) {
                    console.error('[SUPABASE SEED ERROR] Failed to seed mock alerts:', seedError.message);
                } else {
                    console.log('[SUPABASE SEED SUCCESS] Seeded 3 mock alerts.');
                }
            }
        }

        // 1. Calculate today's paid bill totals
        const { data: bills, error: billError } = await supabase
            .from('bills')
            .select('total')
            .eq('status', 'paid')
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd);

        if (billError) throw billError;
        const todayRevenue = (bills || []).reduce((acc, b) => acc + parseFloat(b.total || 0), 0);

        // 2. Fetch history for the last 4 same-weekdays
        const todayObj = new Date();
        const datesToQuery = [];
        for (let i = 1; i <= 4; i++) {
            const historyDay = new Date(todayObj.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
            datesToQuery.push(historyDay.toISOString().split('T')[0]);
        }

        let historicalRevenues = [];
        for (const dateStr of datesToQuery) {
            const { start, end } = this._getDayBoundaries(dateStr);
            const { data: hBills, error: hbError } = await supabase
                .from('bills')
                .select('total')
                .eq('status', 'paid')
                .gte('created_at', start)
                .lte('created_at', end);

            if (hbError) continue;
            const rev = (hBills || []).reduce((acc, b) => acc + parseFloat(b.total || 0), 0);
            historicalRevenues.push(rev);
        }

        if (historicalRevenues.length === 0) return; // not enough historical metrics

        const avgHistorical = historicalRevenues.reduce((a, b) => a + b, 0) / historicalRevenues.length;
        if (avgHistorical === 0) return; // avoid division by zero

        // 3. Compare: trigger alert if deviation is > 25% (absolute value)
        const deviation = (todayRevenue - avgHistorical) / avgHistorical;

        if (Math.abs(deviation) > 0.25) {
            const type = deviation < 0 ? 'drop' : 'spike';
            const pct = (deviation * 100).toFixed(1);
            
            const alertData = {
                feature: 'revenue',
                type: `revenue_${type}`,
                headline: `Significant Revenue ${deviation < 0 ? 'Drop' : 'Spike'} Detected`,
                body: `Today's revenue of $${todayRevenue.toFixed(2)} is ${Math.abs(parseFloat(pct))}% ${deviation < 0 ? 'lower' : 'higher'} than the 4-week average of $${avgHistorical.toFixed(2)} for ${todayObj.toLocaleDateString('en-US', { weekday: 'long' })}.`,
                cta_label: 'View Sales Report',
                cta_href: '/reports/sales',
                confidence: 0.95,
                payload: {
                    today_revenue: todayRevenue,
                    historical_average: avgHistorical,
                    deviation,
                    same_weekdays_history: historicalRevenues
                },
                generated_at: new Date().toISOString()
            };

            const { error: alertInsertError } = await supabase
                .from('anomaly_alerts')
                .insert([alertData]);
            
            if (alertInsertError) console.error('Error inserting anomaly alert:', alertInsertError.message);
        }
    }
}

module.exports = new ReportsService();
