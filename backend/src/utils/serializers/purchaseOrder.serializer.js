const serializePurchaseOrderItem = (row) => {
    if (!row) return null;
    return {
        id:                row.id,
        purchase_order_id: row.purchase_order_id,
        ingredient_id:     row.ingredient_id,
        qty:               parseFloat(row.qty) || 0,
        unit_cost:         parseFloat(row.unit_cost) || 0,
        ingredient:        row.ingredient ? {
            name: row.ingredient.name,
            unit: row.ingredient.unit,
        } : undefined,
        created_at:        row.created_at,
        updated_at:        row.updated_at,
    };
};

const serializePurchaseOrder = (row) => {
    if (!row) return null;
    return {
        id:           row.id,
        supplier_id:  row.supplier_id,
        staff_id:     row.staff_id,
        ai_suggested: row.ai_suggested,
        ordered_at:   row.ordered_at,
        status:       row.status,
        supplier:     row.supplier ? {
            name: row.supplier.name,
            contact: row.supplier.contact,
        } : undefined,
        staff:        row.staff ? {
            name: row.staff.name,
        } : undefined,
        items:        Array.isArray(row.purchase_order_item)
            ? row.purchase_order_item.map(serializePurchaseOrderItem)
            : [],
        created_at:   row.created_at,
        updated_at:   row.updated_at,
    };
};

const serializePurchaseOrderList = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(serializePurchaseOrder);
};

module.exports = {
    serializePurchaseOrderItem,
    serializePurchaseOrder,
    serializePurchaseOrderList,
};
