const { supabase } = require('../config/supabase');

const PO_FIELDS = `
    id, supplier_id, staff_id, ai_suggested, ordered_at, status, created_at, updated_at,
    supplier:supplier_id(id, name, contact),
    staff:staff_id(id, name),
    purchase_order_item(id, purchase_order_id, ingredient_id, qty, unit_cost, ingredient:ingredient_id(name, unit))
`;

class PurchaseOrderService {
    async getAllPurchaseOrders({
        page = 1,
        per_page = 20,
        supplier_id = null,
        status = 'all',
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('purchase_order')
            .select(PO_FIELDS, { count: 'exact' })
            .is('deleted_at', null);

        if (supplier_id) {
            query = query.eq('supplier_id', supplier_id);
        }

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        } else if (from_date) {
            query = query.gte('created_at', from_date);
        } else if (to_date) {
            query = query.lte('created_at', to_date);
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

    async getPurchaseOrderById(id) {
        const { data, error } = await supabase
            .from('purchase_order')
            .select(PO_FIELDS)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) return null;
        return data;
    }

    async createPurchaseOrder({ items, ...payload }) {
        // 1. Insert header
        const { data: po, error: poError } = await supabase
            .from('purchase_order')
            .insert([payload])
            .select(PO_FIELDS)
            .single();

        if (poError) throw poError;

        // 2. Insert items if present
        if (items && items.length > 0) {
            const poItems = items.map((item) => ({
                purchase_order_id: po.id,
                ingredient_id: item.ingredient_id,
                qty: parseFloat(item.qty),
                unit_cost: parseFloat(item.unit_cost),
            }));

            const { error: itemsError } = await supabase
                .from('purchase_order_item')
                .insert(poItems);

            if (itemsError) {
                // If it fails, delete PO to sync (simulate transaction)
                await supabase.from('purchase_order').delete().eq('id', po.id);
                throw itemsError;
            }
        }

        // Return updated object with items nested
        return this.getPurchaseOrderById(po.id);
    }

    async updatePurchaseOrder(id, { items, ...payload }) {
        // 1. Get current status to check transitions
        const currentPO = await this.getPurchaseOrderById(id);
        if (!currentPO) {
            const err = new Error('Purchase order not found');
            err.statusCode = 404;
            throw err;
        }

        // If PO is already received, restrict status updates
        if (currentPO.status === 'received') {
            const err = new Error('Cannot update a received purchase order');
            err.statusCode = 400;
            throw err;
        }

        let updatedStatus = payload.status || currentPO.status;

        // Draft PO can transition to ordered or received.
        // Ordered PO can transition to received.

        // If PO is transitioning to ordered, set ordered_at
        if (updatedStatus === 'ordered' && currentPO.status === 'draft') {
            payload.ordered_at = new Date().toISOString();
        }

        // If PO is transitioning to received:
        if (updatedStatus === 'received') {
            if (!payload.ordered_at && !currentPO.ordered_at) {
                payload.ordered_at = new Date().toISOString();
            }

            // Perform stock increments!
            // First fetch the latest items to verify we have them
            const poItems = currentPO.purchase_order_item || [];
            
            for (const item of poItems) {
                const { data: ing, error: ingError } = await supabase
                    .from('ingredient')
                    .select('id, stock_qty')
                    .eq('id', item.ingredient_id)
                    .is('deleted_at', null)
                    .single();

                if (ingError || !ing) {
                    console.error(`Unable to find ingredient: ${item.ingredient_id} for PO status update`);
                    continue;
                }

                const currentQty = parseFloat(ing.stock_qty) || 0;
                const addedQty = parseFloat(item.qty) || 0;
                const newQty = currentQty + addedQty;

                // Update stock qty
                const { error: updErr } = await supabase
                    .from('ingredient')
                    .update({ stock_qty: newQty })
                    .eq('id', item.ingredient_id);

                if (updErr) {
                    console.error(`Error updating stock quantity for ingredient ${item.ingredient_id}:`, updErr.message);
                } else {
                    // Log adjustment
                    await supabase
                        .from('stock_adjustment_log')
                        .insert([{
                            ingredient_id: item.ingredient_id,
                            delta: addedQty,
                            reason: `purchase_order_receive:${id}`,
                            adjusted_by: 'system',
                        }]);
                }
            }
        }

        // 2. Perform updates of other fields on PO
        const { error: poError } = await supabase
            .from('purchase_order')
            .update(payload)
            .eq('id', id);

        if (poError) throw poError;

        // 3. Update items list if modifying draft or ordered
        if (items && items.length > 0 && currentPO.status !== 'received') {
            // Delete old items
            await supabase.from('purchase_order_item').delete().eq('purchase_order_id', id);

            // Re-insert items
            const newItems = items.map((item) => ({
                purchase_order_id: id,
                ingredient_id: item.ingredient_id,
                qty: parseFloat(item.qty),
                unit_cost: parseFloat(item.unit_cost),
            }));

            const { error: itemsError } = await supabase
                .from('purchase_order_item')
                .insert(newItems);

            if (itemsError) throw itemsError;
        }

        return this.getPurchaseOrderById(id);
    }

    async softDeletePurchaseOrder(id) {
        const currentPO = await this.getPurchaseOrderById(id);
        if (!currentPO) {
            const err = new Error('Purchase order not found');
            err.statusCode = 404;
            throw err;
        }

        if (currentPO.status === 'received') {
            const err = new Error('Cannot delete a received purchase order');
            err.statusCode = 400;
            throw err;
        }

        const { error } = await supabase
            .from('purchase_order')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null);

        if (error) throw error;
        return true;
    }
}

module.exports = new PurchaseOrderService();
