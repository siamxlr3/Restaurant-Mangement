const serializeSupplier = (row) => {
    if (!row) return null;
    return {
        id:             row.id,
        name:           row.name,
        contact:        row.contact,
        lead_time_days: parseInt(row.lead_time_days) || 0,
        is_active:      row.is_active,
        created_at:     row.created_at,
        updated_at:     row.updated_at,
    };
};

const serializeSupplierList = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(serializeSupplier);
};

module.exports = {
    serializeSupplier,
    serializeSupplierList,
};
