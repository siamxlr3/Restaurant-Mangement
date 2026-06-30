const reorderService = require('../services/reorder.service');
const { serializeReorderSuggestion, serializeReorderSuggestionList } = require('../utils/serializers/reorder.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class ReorderController {
    /**
     * GET /api/v1/reorder-suggestions
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search, status, from_date, to_date } = req.query;
            const { data, meta } = await reorderService.getAllSuggestions({
                page, per_page, search, status, from_date, to_date,
            });
            return sendResponse(
                res,
                200,
                true,
                'Reorder suggestions retrieved successfully',
                serializeReorderSuggestionList(data),
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/reorder-suggestions/:id/accept
     */
    async accept(req, res, next) {
        try {
            const staffId = req.user ? req.user.id : null;
            const po = await reorderService.acceptSuggestion(req.params.id, staffId);
            return sendResponse(res, 200, true, 'Reorder suggestion accepted and purchase order drafted successfully', po);
        } catch (error) {
            if (error.statusCode === 404) return sendError(res, 404, error.message);
            if (error.statusCode === 400) return sendError(res, 400, error.message);
            next(error);
        }
    }

    /**
     * POST /api/v1/reorder-suggestions/trigger (Manually trigger calculation)
     */
    async triggerJob(req, res, next) {
        try {
            const result = await reorderService.runReorderPredictionJob();
            return sendResponse(res, 200, true, 'Prediction calculations executed successfully', result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/reorder-suggestions/:id
     */
    async delete(req, res, next) {
        try {
            await reorderService.deleteSuggestion(req.params.id);
            return sendResponse(res, 200, true, 'Reorder suggestion deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/v1/reorder-suggestions/:id
     */
    async update(req, res, next) {
        try {
            const data = await reorderService.updateSuggestion(req.params.id, req.body.suggested_qty);
            return sendResponse(
                res,
                200,
                true,
                'Reorder suggestion updated successfully',
                serializeReorderSuggestion(data)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReorderController();
