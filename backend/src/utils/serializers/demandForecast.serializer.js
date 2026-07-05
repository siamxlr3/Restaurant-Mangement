const serializeDemandForecast = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        forecast_date: row.forecast_date,
        menu_item_id: row.menu_item_id,
        predicted_qty: parseFloat(row.predicted_qty) || 0,
        actual_qty: row.actual_qty !== null ? parseFloat(row.actual_qty) : null,
        confidence: parseFloat(row.confidence) || 0,
        generated_at: row.generated_at,
        created_at: row.created_at,
        menu_item: row.menu_item ? {
            id: row.menu_item.id,
            name: row.menu_item.name,
            is_available: row.menu_item.is_available,
            category_id: row.menu_item.category_id,
            base_price: parseFloat(row.menu_item.base_price) || 0
        } : undefined
    };
};

const serializeDemandForecastList = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(serializeDemandForecast);
};

const serializeAiJobLog = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        job_type: row.job_type,
        status: row.status,
        records_processed: row.records_processed,
        error_message: row.error_message,
        ran_at: row.ran_at,
        duration_ms: row.duration_ms
    };
};

const serializeAiJobLogList = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(serializeAiJobLog);
};

module.exports = {
    serializeDemandForecast,
    serializeDemandForecastList,
    serializeAiJobLog,
    serializeAiJobLogList,
};
