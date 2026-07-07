const menuAIService = require('../services/menuAI.service');
const { sendResponse, sendError } = require('../utils/apiResponse');

class MenuAIController {
    // ── Suggestions ──────────────────────────────────────────────────────────

    async getSuggestions(req, res) {
        try {
            const { page, per_page, action, is_applied, from_date, to_date, search } = req.query;
            const result = await menuAIService.getSuggestions({ page, per_page, action, is_applied, from_date, to_date, search });
            return sendResponse(res, 200, true, 'Menu AI suggestions retrieved successfully', result.data, result.meta);
        } catch (err) {
            return sendError(res, 500, err.message);
        }
    }

    async getSuggestionStats(req, res) {
        try {
            const stats = await menuAIService.getSuggestionStats();
            return sendResponse(res, 200, true, 'Stats retrieved', stats);
        } catch (err) {
            return sendError(res, 500, err.message);
        }
    }

    async triggerJob(req, res) {
        try {
            const result = await menuAIService.runMenuAIJob();
            return sendResponse(res, 200, true, `AI job completed. ${result.recordsProcessed} suggestions generated.`, result);
        } catch (err) {
            return sendError(res, 500, err.message);
        }
    }

    async applySuggestion(req, res) {
        try {
            const data = await menuAIService.applySuggestion(req.params.id);
            return sendResponse(res, 200, true, 'Suggestion applied successfully', data);
        } catch (err) {
            const status = err.statusCode || 500;
            return sendError(res, status, err.message);
        }
    }

    async dismissSuggestion(req, res) {
        try {
            await menuAIService.dismissSuggestion(req.params.id);
            return sendResponse(res, 200, true, 'Suggestion dismissed successfully');
        } catch (err) {
            return sendError(res, 500, err.message);
        }
    }

    // ── Insights ─────────────────────────────────────────────────────────────

    async getInsights(req, res) {
        try {
            const { page, per_page, feature, is_read, is_dismissed, from_date, to_date } = req.query;
            const result = await menuAIService.getInsights({ page, per_page, feature, is_read, is_dismissed, from_date, to_date });
            return sendResponse(res, 200, true, 'AI insights retrieved successfully', result.data, result.meta);
        } catch (err) {
            return sendError(res, 500, err.message);
        }
    }

    async markInsightRead(req, res) {
        try {
            const data = await menuAIService.markInsightRead(req.params.id);
            return sendResponse(res, 200, true, 'Insight marked as read', data);
        } catch (err) {
            const status = err.statusCode || 500;
            return sendError(res, status, err.message);
        }
    }

    async dismissInsight(req, res) {
        try {
            const data = await menuAIService.dismissInsight(req.params.id);
            return sendResponse(res, 200, true, 'Insight dismissed', data);
        } catch (err) {
            const status = err.statusCode || 500;
            return sendError(res, status, err.message);
        }
    }
}

module.exports = new MenuAIController();
