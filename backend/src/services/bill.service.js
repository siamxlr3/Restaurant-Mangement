const { supabase } = require('../config/supabase');

class BillService {
    /**
     * Generate or update a bill based on an order
     */
    async generateBill(orderId) {
        // 1. Fetch order details with items and modifiers
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                id, status, type,
                order_items(
                    id, quantity, unit_price, status,
                    order_item_modifiers(extra_price)
                )
            `)
            .eq('id', orderId)
            .is('deleted_at', null)
            .single();

        if (orderError || !order) throw new Error('Order not found');
        if (order.status === 'closed') throw new Error('Order is already closed');

        // 2. Calculate subtotal
        let subtotal = 0;
        order.order_items.forEach(item => {
            if (item.status !== 'voided') {
                let itemTotal = parseFloat(item.unit_price);
                item.order_item_modifiers.forEach(mod => {
                    itemTotal += parseFloat(mod.extra_price);
                });
                subtotal += itemTotal * item.quantity;
            }
        });

        // 3. Fetch tax rate from app_setting
        const { data: taxSetting } = await supabase
            .from('app_setting')
            .select('value')
            .eq('group', 'general')
            .eq('key', 'tax_rate')
            .single();

        const taxPercent = taxSetting ? parseFloat(taxSetting.value) : 10; // Default 10%
        const tax = subtotal * (taxPercent / 100);
        const total = subtotal + tax;

        // 4. Create or update bill
        const { data: existingBill } = await supabase
            .from('bills')
            .select('id')
            .eq('order_id', orderId)
            .is('deleted_at', null)
            .single();

        const billData = {
            order_id: orderId,
            subtotal,
            tax,
            total,
            status: 'draft'
        };

        let result;
        if (existingBill) {
            const { data, error } = await supabase
                .from('bills')
                .update(billData)
                .eq('id', existingBill.id)
                .select()
                .single();
            if (error) throw new Error(error.message);
            result = data;
        } else {
            const { data, error } = await supabase
                .from('bills')
                .insert([billData])
                .select()
                .single();
            if (error) throw new Error(error.message);
            result = data;
        }

        return result;
    }

    /**
     * Get all bills with pagination and filters
     */
    async getAllBills({ page = 1, per_page = 20, search = '', status, from_date, to_date }) {
        let query = supabase
            .from('bills')
            .select(`
                *,
                orders(id, type, status, table_id, restaurant_table(name))
            `, { count: 'exact' })
            .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        }

        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw new Error(error.message);

        return {
            items: data || [],
            total: count,
            page: parseInt(page),
            per_page: limit,
            total_pages: Math.ceil((count || 0) / limit)
        };
    }

    /**
     * Get single bill by ID
     */
    async getBillById(id) {
        const { data, error } = await supabase
            .from('bills')
            .select(`
                *,
                orders(
                    id, type, status, created_at,
                    restaurant_table(id, name),
                    order_items(
                        id, quantity, unit_price, status, notes,
                        menu_item(name),
                        menu_variant(label),
                        order_item_modifiers(extra_price, menu_modifier(name))
                    )
                )
            `)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw new Error('Bill not found');
        return data;
    }

    /**
     * Update bill status and handle side effects (closing order)
     */
    async updateBillStatus(id, status) {
        const { data: bill, error: fetchError } = await supabase
            .from('bills')
            .select('id, order_id, status')
            .eq('id', id)
            .single();

        if (fetchError || !bill) throw new Error('Bill not found');

        const updateData = { status };
        if (status === 'issued') {
            updateData.issued_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('bills')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        // If paid, close the order
        if (status === 'paid') {
            await supabase
                .from('orders')
                .update({ status: 'closed' })
                .eq('id', bill.order_id);

            // Fetch order details to release table if dine-in
            const { data: ord } = await supabase
                .from('orders')
                .select('type, table_id')
                .eq('id', bill.order_id)
                .single();

            if (ord && ord.type === 'dine-in' && ord.table_id) {
                await supabase
                    .from('restaurant_table')
                    .update({ status: 'cleaning' })
                    .eq('id', ord.table_id);
            }
        }

        return data;
    }

    /**
     * Soft delete bill
     */
    async softDeleteBill(id) {
        const { error } = await supabase
            .from('bills')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }
}

module.exports = new BillService();
