const serializeReorderSuggestion = (row) => {
    if (!row) return null;
    return {
        id:              row.id,
        ingredient_id:   row.ingredient_id,
        suggested_qty:   parseFloat(row.suggested_qty) || 0,
        reason:          row.reason,
        avg_daily_usage: parseFloat(row.avg_daily_usage) || 0,
        days_remaining:  row.days_remaining !== null ? parseFloat(row.days_remaining) : null,
        is_accepted:     row.is_accepted,
        generated_at:    row.generated_at,
        ingredient:      row.ingredient ? {
            id: row.ingredient.id,
            name: row.ingredient.name,
            unit: row.ingredient.unit,
            stock_qty: parseFloat(row.ingredient.stock_qty) || 0,
            cost_per_unit: parseFloat(row.ingredient.cost_per_unit) || 0,
        } : undefined,
    };
};

const serializeReorderSuggestionList = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(serializeReorderSuggestion);
};

module.exports = {
    serializeReorderSuggestion,
    serializeReorderSuggestionList,
};
