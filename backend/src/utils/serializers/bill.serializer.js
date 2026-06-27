const serializeBill = (bill) => {
    if (!bill) return null;

    return {
        id: bill.id,
        order_id: bill.order_id,
        subtotal: parseFloat(bill.subtotal),
        tax: parseFloat(bill.tax),
        discount_total: parseFloat(bill.discount_total || 0),
        total: parseFloat(bill.total),
        status: bill.status,
        issued_at: bill.issued_at,
        created_at: bill.created_at,
        updated_at: bill.updated_at,
        order: bill.orders ? {
            id: bill.orders.id,
            type: bill.orders.type,
            status: bill.orders.status,
            table_name: bill.orders.restaurant_table?.name || 'N/A'
        } : null,
        details: bill.orders?.order_items ? bill.orders.order_items.map(item => ({
            id: item.id,
            name: item.menu_item?.name,
            variant: item.menu_variant?.label,
            quantity: item.quantity,
            unit_price: parseFloat(item.unit_price),
            status: item.status,
            modifiers: item.order_item_modifiers?.map(mod => ({
                name: mod.menu_modifier?.name,
                extra_price: parseFloat(mod.extra_price)
            })) || []
        })) : []
    };
};

module.exports = {
    serializeBill
};
