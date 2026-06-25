const upsellService = require('../services/upsell.service');
const { sendResponse, sendError } = require('../utils/apiResponse');

/**
 * Controller for AI-driven Upsell Engine.
 */
class UpsellController {
    /**
     * Get recommendations for a specific item.
     * GET /api/v1/upsell/recommendations/:itemId
     */
    async getRecommendations(req, res) {
        try {
            const { itemId } = req.params;
            const { limit } = req.query;

            const recommendations = await upsellService.getRecommendations(itemId, limit);

            return sendResponse(res, 200, true, 'Recommendations fetched successfully', recommendations);
        } catch (error) {
            console.error('[UpsellController] getRecommendations error:', error);
            return sendError(res, 400, error.message || 'Failed to fetch recommendations');
        }
    }

    /**
     * Get all upsell pairs for management.
     * GET /api/v1/upsell/pairs
     */
    async getPairs(req, res) {
        try {
            const filters = {
                page: req.query.page,
                per_page: req.query.per_page,
                search: req.query.search
            };

            const result = await upsellService.getAllPairs(filters);

            return sendResponse(res, 200, true, 'Upsell pairs fetched successfully', result.data, result.meta);
        } catch (error) {
            console.error('[UpsellController] getPairs error:', error);
            return sendError(res, 500, error.message || 'Failed to fetch upsell pairs');
        }
    }

    /**
     * Force recalculate the co-occurrence matrix.
     * POST /api/v1/upsell/recalculate
     */
    async recalculate(req, res) {
        try {
            const result = await upsellService.computeCoOccurrenceMatrix();
            return sendResponse(res, 200, true, result.message);
        } catch (error) {
            console.error('[UpsellController] recalculate error:', error);
            return sendError(res, 500, error.message || 'Failed to recalulate matrix');
        }
    }
}

module.exports = new UpsellController();
