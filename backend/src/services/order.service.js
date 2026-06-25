const { supabase } = require('../config/supabase');
const kitchenService = require('./kitchen.service');
const { serializeTicket } = require('../utils/serializers/kitchen_ticket.serializer');

// ── Status lifecycle ─────────────────────────────────────────
const STATUS_TRANSITIONS = {
    pending:   'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready:     'served',
    served:    'closed',
};

// ── POS Menu SELECT fields ───────────────────────────────────
const POS_MENU_SELECT = `
    id, name, description, base_price, is_available, image_url,
    menu_category!inner(id, name, is_active),
    menu_variant(id, label, extra_price),
    menu_modifier(id, name, extra_price, is_required)
`;

// ── Order SELECT fields (full detail) ────────────────────────
const ORDER_DETAIL_SELECT = `
    id, table_id, customer_id, type, status, hold_reason, void_reason, created_at, updated_at,
    restaurant_table(id, name),
    order_items(
        id, menu_item_id, variant_id, quantity, unit_price, status, notes, created_at, updated_at,
        menu_item(id, name),
        menu_variant(id, label),
        order_item_modifiers(order_item_id, modifier_id, extra_price, menu_modifier(id, name))
    )
`;

// ── Order SELECT fields (list view) ──────────────────────────
const ORDER_LIST_SELECT = `
    id, table_id, customer_id, type, status, created_at, updated_at,
    restaurant_table(id, name),
    order_items(id, status)
`;

class OrderService {
    /**
     * GET /orders/pos-menu
     * Returns available menu items with variants and modifiers for the POS screen.
     */
    async getPosMenu() {
        const { data, error } = await supabase
            .from('menu_item')
            .select(POS_MENU_SELECT)
            .eq('is_available', true)
            .eq('menu_category.is_active', true)
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    }

    /**
     * GET /orders
     * Paginated list with search, status, type, date range filters.
     */
    async getAllOrders({
        page = 1,
        per_page = 20,
        search = '',
        status = 'all',
        type = 'all',
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('orders')
            .select(ORDER_LIST_SELECT, { count: 'exact' })
            .is('deleted_at', null);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (type && type !== 'all') {
            query = query.eq('type', type);
        }
        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        }

        const limit  = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw new Error(error.message);

        return {
            items:       data || [],
            total:       count,
            page:        parseInt(page),
            per_page:    limit,
            total_pages: Math.ceil(count / limit),
        };
    }

    /**
     * GET /orders/:id
     * Full order with items and modifiers.
     */
    async getOrderById(id) {
        const { data, error } = await supabase
            .from('orders')
            .select(ORDER_DETAIL_SELECT)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw new Error('Order not found');
        return data;
    }

    /**
     * POST /orders
     * Create order + items + modifiers. Marks table occupied for dine-in.
     */
    async createOrder({ table_id, customer_id, type, items = [] }) {
        // Validate table for dine-in
        if (type === 'dine-in') {
            if (!table_id) throw new Error('table_id is required for dine-in orders');
            const { data: table } = await supabase
                .from('restaurant_table')
                .select('id, status')
                .eq('id', table_id)
                .is('deleted_at', null)
                .single();
            if (!table) throw new Error('Table not found');
            if (table.status === 'occupied') throw new Error('Table is already occupied');
        }

        // Insert order
        const orderPayload = {
            type,
            status: 'pending',
            ...(table_id    ? { table_id }    : {}),
            ...(customer_id ? { customer_id } : {}),
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderPayload])
            .select('id, type, status, table_id')
            .single();

        if (orderError) throw new Error(orderError.message);

        // Insert items if provided
        if (items.length > 0) {
            await this._insertOrderItems(order.id, items);
        }

        // --- Kitchen Integration ---
        // Automatically create a kitchen ticket if order is dine-in or confirmed
        // For simplicity, we'll create a ticket for 'Main Kitchen' station
        const kitchenTicket = await kitchenService.createTicket({
            order_id: order.id,
            station: 'Main Kitchen',
            status: 'pending'
        });

        // Broadcast new ticket to KDS
        await kitchenService.broadcastToKDS('TicketCreated', serializeTicket(kitchenTicket));
        // ---------------------------

        // Mark table occupied for dine-in
        if (type === 'dine-in' && table_id) {
            await supabase
                .from('restaurant_table')
                .update({ status: 'occupied' })
                .eq('id', table_id);
        }

        return this.getOrderById(order.id);
    }

    /**
     * POST /orders/:id/items
     * Add a new item to an existing open order.
     */
    async addOrderItem(orderId, item) {
        const order = await this._ensureOrderEditable(orderId);
        await this._insertOrderItems(order.id, [item]);
        return this.getOrderById(orderId);
    }

    /**
     * DELETE /orders/:id/items/:itemId
     * Void a single order item (soft delete with reason).
     */
    async voidOrderItem(orderId, itemId, reason) {
        await this._ensureOrderEditable(orderId);

        const { data: item } = await supabase
            .from('order_items')
            .select('id, status')
            .eq('id', itemId)
            .eq('order_id', orderId)
            .single();

        if (!item) throw new Error('Order item not found');
        if (item.status === 'voided') throw new Error('Item is already voided');

        const { error } = await supabase
            .from('order_items')
            .update({ status: 'voided' })
            .eq('id', itemId);

        if (error) throw new Error(error.message);

        // Store reason on order level for audit
        await supabase
            .from('orders')
            .update({ void_reason: reason })
            .eq('id', orderId);

        return this.getOrderById(orderId);
    }

    /**
     * PATCH /orders/:id/status
     * Transition order through lifecycle: pending→confirmed→preparing→ready→served→closed.
     */
    async transitionOrderStatus(orderId, newStatus) {
        const { data: current, error } = await supabase
            .from('orders')
            .select('id, status, type, table_id')
            .eq('id', orderId)
            .is('deleted_at', null)
            .single();

        if (error) throw new Error('Order not found');

        const allowedNext = STATUS_TRANSITIONS[current.status];
        if (newStatus !== allowedNext) {
            throw new Error(
                `Invalid transition. "${current.status}" can only move to "${allowedNext}", not "${newStatus}"`
            );
        }

        const { data: updated, error: updateError } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)
            .select('id, status, type, table_id')
            .single();

        if (updateError) throw new Error(updateError.message);

        // --- Kitchen Integration ---
        if (newStatus === 'confirmed') {
            // Ensure a kitchen ticket exists or is updated
            // In a real app, maybe we'd update existing ticket status
        }
        // ---------------------------

        // Release table when order closes for dine-in
        if (newStatus === 'closed' && current.type === 'dine-in' && current.table_id) {
            await supabase
                .from('restaurant_table')
                .update({ status: 'cleaning' })
                .eq('id', current.table_id);
        }

        return this.getOrderById(orderId);
    }

    /**
     * PATCH /orders/:id/hold
     * Save order as a draft (remain pending, set hold_reason).
     */
    async holdOrder(orderId, reason) {
        const { data: current } = await supabase
            .from('orders')
            .select('id, status')
            .eq('id', orderId)
            .is('deleted_at', null)
            .single();

        if (!current) throw new Error('Order not found');
        if (!['pending', 'confirmed'].includes(current.status)) {
            throw new Error('Only pending or confirmed orders can be held');
        }

        const { error } = await supabase
            .from('orders')
            .update({ status: 'pending', hold_reason: reason || null })
            .eq('id', orderId);

        if (error) throw new Error(error.message);
        return this.getOrderById(orderId);
    }

    /**
     * DELETE /orders/:id
     * Soft delete an order (only if pending).
     */
    async softDeleteOrder(orderId) {
        const { data: current } = await supabase
            .from('orders')
            .select('id, status')
            .eq('id', orderId)
            .is('deleted_at', null)
            .single();

        if (!current) throw new Error('Order not found');
        if (!['pending'].includes(current.status)) {
            throw new Error('Only pending orders can be deleted');
        }

        const { error } = await supabase
            .from('orders')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', orderId);

        if (error) throw new Error(error.message);
        return true;
    }

    // ── Private helpers ─────────────────────────────────────────

    /**
     * Ensure the order is in an editable state (pending or confirmed).
     */
    async _ensureOrderEditable(orderId) {
        const { data: order } = await supabase
            .from('orders')
            .select('id, status')
            .eq('id', orderId)
            .is('deleted_at', null)
            .single();

        if (!order) throw new Error('Order not found');
        if (!['pending', 'confirmed'].includes(order.status)) {
            throw new Error(`Order cannot be modified when status is "${order.status}"`);
        }
        return order;
    }

    /**
     * Insert order_items + order_item_modifiers for a given orderId.
     * Fetches current unit_price from menu_item (+ variant extra_price).
     */
    async _insertOrderItems(orderId, items) {
        for (const item of items) {
            // Fetch base price
            const { data: menuItem } = await supabase
                .from('menu_item')
                .select('id, base_price')
                .eq('id', item.menu_item_id)
                .is('deleted_at', null)
                .single();

            if (!menuItem) throw new Error(`Menu item ${item.menu_item_id} not found`);

            let unitPrice = parseFloat(menuItem.base_price);

            // Add variant price if selected
            if (item.variant_id) {
                const { data: variant } = await supabase
                    .from('menu_variant')
                    .select('id, extra_price')
                    .eq('id', item.variant_id)
                    .is('deleted_at', null)
                    .single();
                if (variant) unitPrice += parseFloat(variant.extra_price);
            }

            // Insert order_item
            const { data: orderItem, error: itemError } = await supabase
                .from('order_items')
                .insert([{
                    order_id:     orderId,
                    menu_item_id: item.menu_item_id,
                    variant_id:   item.variant_id   || null,
                    quantity:     item.quantity,
                    unit_price:   unitPrice,
                    notes:        item.notes         || null,
                }])
                .select('id')
                .single();

            if (itemError) throw new Error(itemError.message);

            // Insert modifiers
            const modifiers = item.modifiers || [];
            if (modifiers.length > 0) {
                const modRows = modifiers.map((m) => ({
                    order_item_id: orderItem.id,
                    modifier_id:   m.modifier_id,
                    extra_price:   m.extra_price || 0,
                }));
                const { error: modError } = await supabase
                    .from('order_item_modifiers')
                    .insert(modRows);
                if (modError) throw new Error(modError.message);
            }
        }
    }
}

module.exports = new OrderService();
