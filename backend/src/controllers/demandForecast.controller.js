const demandForecastService = require('../services/demandForecast.service');
const {
    serializeDemandForecast,
    serializeDemandForecastList,
    serializeAiJobLog,
    serializeAiJobLogList
} = require('../utils/serializers/demandForecast.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class DemandForecastController {
    /**
     * GET /api/v1/demand-forecasts
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search, status, category_id, from_date, to_date } = req.query;
            const { data, meta } = await demandForecastService.getForecasts({
                page, per_page, search, status, category_id, from_date, to_date,
            });
            return sendResponse(
                res,
                200,
                true,
                'Demand forecasts retrieved successfully',
                serializeDemandForecastList(data),
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/demand-forecasts/logs
     */
    async getJobLogs(req, res, next) {
        try {
            const logs = await demandForecastService.getJobLogs();
            return sendResponse(
                res,
                200,
                true,
                'AI job logs retrieved successfully',
                serializeAiJobLogList(logs)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/v1/demand-forecasts/:id/actual
     */
    async updateActual(req, res, next) {
        try {
            const { actual_qty } = req.body;
            const updated = await demandForecastService.updateActualQty(req.params.id, actual_qty);
            return sendResponse(
                res,
                200,
                true,
                'Actual quantity updated successfully',
                serializeDemandForecast(updated)
            );
        } catch (error) {
            if (error.statusCode === 404) {
                return sendError(res, 404, error.message);
            }
            next(error);
        }
    }

    /**
     * POST /api/v1/demand-forecasts/trigger-job
     */
    async triggerJob(req, res, next) {
        try {
            const result = await demandForecastService.runDemandForecastingJob();
            return sendResponse(
                res,
                200,
                true,
                'AI Demand forecasting calculation completed successfully',
                result
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/demand-forecasts/:id
     */
    async delete(req, res, next) {
        try {
            await demandForecastService.deleteForecast(req.params.id);
            return sendResponse(res, 200, true, 'Demand forecast deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DemandForecastController();
