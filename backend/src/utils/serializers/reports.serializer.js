/**
 * Serializer for Sales Report
 */
const serializeSalesReport = (report) => {
    if (!report) return null;
    return {
        id: report.id,
        period_label: report.period_label,
        total_revenue: parseFloat(report.total_revenue || 0),
        subtotal_revenue: parseFloat(report.subtotal_revenue || 0),
        total_tax: parseFloat(report.total_tax || 0),
        total_discounts: parseFloat(report.total_discounts || 0),
        total_orders: parseInt(report.total_orders || 0),
        avg_order_value: parseFloat(report.avg_order_value || 0),
        dine_in_count: parseInt(report.dine_in_count || 0),
        takeaway_count: parseInt(report.takeaway_count || 0),
        delivery_count: parseInt(report.delivery_count || 0),
        dine_in_revenue: parseFloat(report.dine_in_revenue || 0),
        cash_collected: parseFloat(report.cash_collected || 0),
        card_collected: parseFloat(report.card_collected || 0),
        bkash_collected: parseFloat(report.bkash_collected || 0),
        void_count: parseInt(report.void_count || 0),
        refund_total: parseFloat(report.refund_total || 0),
        created_at: report.created_at,
        updated_at: report.updated_at,
    };
};

const serializeSalesReportList = (reports) => {
    if (!Array.isArray(reports)) return [];
    return reports.map(serializeSalesReport);
};

/**
 * Serializer for Menu Performance
 */
const serializeMenuPerformance = (perf) => {
    if (!perf) return null;
    return {
        id: perf.id,
        menu_item_id: perf.menu_item_id,
        item_name: perf.item_name,
        category_name: perf.category_name,
        total_qty_sold: parseInt(perf.total_qty_sold || 0),
        total_revenue: parseFloat(perf.total_revenue || 0),
        avg_unit_price: parseFloat(perf.avg_unit_price || 0),
        food_cost: parseFloat(perf.food_cost || 0),
        total_food_cost: parseFloat(perf.total_food_cost || 0),
        gross_profit: parseFloat(perf.gross_profit || 0),
        margin_pct: parseFloat(perf.margin_pct || 0),
        revenue_share_pct: parseFloat(perf.revenue_share_pct || 0),
        rank: parseInt(perf.rank || 0),
        category_revenue: parseFloat(perf.category_revenue || 0),
        is_slow_mover: !!perf.is_slow_mover,
        created_at: perf.created_at,
        updated_at: perf.updated_at,
    };
};

const serializeMenuPerformanceList = (perfs) => {
    if (!Array.isArray(perfs)) return [];
    return perfs.map(serializeMenuPerformance);
};

/**
 * Serializer for Inventory Cost
 */
const serializeInventoryCost = (inv) => {
    if (!inv) return null;
    return {
        id: inv.id,
        ingredient_id: inv.ingredient_id,
        ingredient_name: inv.ingredient_name,
        unit: inv.unit,
        current_stock_qty: parseFloat(inv.current_stock_qty || 0),
        cost_per_unit: parseFloat(inv.cost_per_unit || 0),
        current_stock_value: parseFloat(inv.current_stock_value || 0),
        qty_purchased: parseFloat(inv.qty_purchased || 0),
        purchase_cost: parseFloat(inv.purchase_cost || 0),
        qty_consumed_theoretical: parseFloat(inv.qty_consumed_theoretical || 0),
        qty_consumed_actual: parseFloat(inv.qty_consumed_actual || 0),
        wastage_qty: parseFloat(inv.wastage_qty || 0),
        wastage_value: parseFloat(inv.wastage_value || 0),
        ai_suggested_pos: parseInt(inv.ai_suggested_pos || 0),
        supplier_name: inv.supplier_name,
        created_at: inv.created_at,
        updated_at: inv.updated_at,
    };
};

const serializeInventoryCostList = (invs) => {
    if (!Array.isArray(invs)) return [];
    return invs.map(serializeInventoryCost);
};

/**
 * Serializer for Anomaly Alert
 */
const serializeAnomalyAlert = (alert) => {
    if (!alert) return null;
    return {
        id: alert.id,
        feature: alert.feature,
        type: alert.type,
        headline: alert.headline,
        body: alert.body,
        cta_label: alert.cta_label,
        cta_href: alert.cta_href,
        confidence: parseFloat(alert.confidence || 0),
        payload: alert.payload || {},
        is_read: !!alert.is_read,
        is_dismissed: !!alert.is_dismissed,
        generated_at: alert.generated_at,
    };
};

const serializeAnomalyAlertList = (alerts) => {
    if (!Array.isArray(alerts)) return [];
    return alerts.map(serializeAnomalyAlert);
};

module.exports = {
    serializeSalesReport,
    serializeSalesReportList,
    serializeMenuPerformance,
    serializeMenuPerformanceList,
    serializeInventoryCost,
    serializeInventoryCostList,
    serializeAnomalyAlert,
    serializeAnomalyAlertList,
};
