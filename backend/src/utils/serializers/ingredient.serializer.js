/**
 * Compute stock_status from stock_qty vs low_stock_threshold
 * - critical : stock_qty == 0
 * - low      : stock_qty <= low_stock_threshold
 * - healthy  : above threshold
 */
const getStockStatus = (stock_qty, low_stock_threshold) => {
    const qty = parseFloat(stock_qty) || 0;
    const threshold = parseFloat(low_stock_threshold) || 0;
    if (qty <= 0) return 'critical';
    if (threshold > 0 && qty <= threshold) return 'low';
    return 'healthy';
};

const serializeIngredient = (row) => {
    if (!row) return null;
    return {
        id:                  row.id,
        name:                row.name,
        unit:                row.unit,
        stock_qty:           parseFloat(row.stock_qty) || 0,
        low_stock_threshold: parseFloat(row.low_stock_threshold) || 0,
        avg_daily_usage:     parseFloat(row.avg_daily_usage) || 0,
        reorder_point:       parseFloat(row.reorder_point) || 0,
        reorder_qty:         parseFloat(row.reorder_qty) || 0,
        cost_per_unit:       parseFloat(row.cost_per_unit) || 0,
        is_active:           row.is_active,
        stock_status:        getStockStatus(row.stock_qty, row.low_stock_threshold),
        created_at:          row.created_at,
        updated_at:          row.updated_at,
    };
};

const serializeIngredientList = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(serializeIngredient);
};

module.exports = {
    serializeIngredient,
    serializeIngredientList,
};
