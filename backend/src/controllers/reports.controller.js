const reportsService = require('../services/reports.service');
const {
    serializeSalesReportList,
    serializeMenuPerformanceList,
    serializeInventoryCostList,
    serializeAnomalyAlertList,
    serializeAnomalyAlert,
} = require('../utils/serializers/reports.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class ReportsController {
    /**
     * Get Sales report
     */
    async getSales(req, res, next) {
        try {
            const { from_date, to_date, page, per_page } = req.query;
            const { data, meta } = await reportsService.getSalesReport({
                from_date,
                to_date,
                page,
                per_page
            });

            return sendResponse(
                res,
                200,
                true,
                'Sales report retrieved successfully',
                serializeSalesReportList(data),
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Menu Performance report
     */
    async getMenuPerformance(req, res, next) {
        try {
            const { from_date, to_date, page, per_page, search, status, category_id } = req.query;
            const { data, meta } = await reportsService.getMenuPerformance({
                from_date,
                to_date,
                page,
                per_page,
                search,
                status,
                category_id
            });

            return sendResponse(
                res,
                200,
                true,
                'Menu performance report retrieved successfully',
                serializeMenuPerformanceList(data),
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Inventory Cost report
     */
    async getInventoryCost(req, res, next) {
        try {
            const { page, per_page, search } = req.query;
            const { data, meta } = await reportsService.getInventoryCost({
                page,
                per_page,
                search
            });

            return sendResponse(
                res,
                200,
                true,
                'Inventory cost report retrieved successfully',
                serializeInventoryCostList(data),
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Anomaly Alerts
     */
    async getAnomalies(req, res, next) {
        try {
            const { status, page, per_page } = req.query;
            const { data, meta } = await reportsService.getAnomalyAlerts({
                status,
                page,
                per_page
            });

            return sendResponse(
                res,
                200,
                true,
                'Anomaly alerts retrieved successfully',
                serializeAnomalyAlertList(data),
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update anomaly alert (is_read/is_dismissed)
     */
    async updateAnomaly(req, res, next) {
        try {
            const { id } = req.params;
            const { is_read, is_dismissed } = req.body;

            const updated = await reportsService.updateAnomalyAlert(id, { is_read, is_dismissed });
            if (!updated) {
                return sendError(res, 404, 'Anomaly alert not found');
            }

            return sendResponse(
                res,
                200,
                true,
                'Anomaly alert updated successfully',
                serializeAnomalyAlert(updated)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReportsController();
