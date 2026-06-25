/**
 * Serializer for Order objects.
 * DTOs ensure no raw DB shape leaks to API consumers.
 */
class OrderSerializer {
    /**
     * Serialize a single order_item_modifier record.
     */
    static mapModifier(mod) {
        if (!mod) return null;
        return {
            modifier_id:  mod.modifier_id,
            name:         mod.menu_modifier?.name  || null,
            extra_price:  parseFloat(mod.extra_price) || 0,
        };
    }

    /**
     * Serialize a single order_item record.
     */
    static mapItem(item) {
        if (!item) return null;
        return {
            id:           item.id,
            menu_item_id: item.menu_item_id,
            menu_item:    item.menu_item?.name || null,
            variant_id:   item.variant_id   || null,
            variant:      item.menu_variant?.label || null,
            quantity:     item.quantity,
            unit_price:   parseFloat(item.unit_price),
            status:       item.status,
            notes:        item.notes        || null,
            modifiers:    Array.isArray(item.order_item_modifiers)
                ? item.order_item_modifiers.map(OrderSerializer.mapModifier)
                : [],
            created_at:   item.created_at,
            updated_at:   item.updated_at,
        };
    }

    /**
     * Serialize a single order record (with items).
     */
    static map(order) {
        if (!order) return null;
        return {
            id:          order.id,
            table_id:    order.table_id    || null,
            table_name:  order.restaurant_table?.name || null,
            customer_id: order.customer_id || null,
            type:        order.type,
            status:      order.status,
            hold_reason: order.hold_reason || null,
            void_reason: order.void_reason || null,
            items:       Array.isArray(order.order_items)
                ? order.order_items.map(OrderSerializer.mapItem)
                : [],
            created_at:  order.created_at,
            updated_at:  order.updated_at,
        };
    }

    /**
     * Serialize a list of orders (without deep item nesting for list views).
     */
    static mapList(order) {
        if (!order) return null;
        return {
            id:          order.id,
            table_id:    order.table_id    || null,
            table_name:  order.restaurant_table?.name || null,
            customer_id: order.customer_id || null,
            type:        order.type,
            status:      order.status,
            item_count:  Array.isArray(order.order_items)
                ? order.order_items.filter((i) => i.status !== 'voided').length
                : 0,
            created_at:  order.created_at,
            updated_at:  order.updated_at,
        };
    }

    static mapMany(orders) {
        if (!orders || !Array.isArray(orders)) return [];
        return orders.map(OrderSerializer.mapList);
    }
}

module.exports = OrderSerializer;
