const reviewsService = require('../services/cms.reviews.service');
const ReviewsSerializer = require('../utils/serializers/cms.reviews.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsReviewsController {
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await reviewsService.getAll(req.query);
            return sendResponse(res, 200, true, 'Reviews retrieved', ReviewsSerializer.mapMany(items), { total, page, per_page, total_pages });
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async getById(req, res) {
        try {
            const data = await reviewsService.getById(req.params.id);
            return sendResponse(res, 200, true, 'Review retrieved', ReviewsSerializer.map(data));
        } catch (err) { return sendError(res, 404, err.message); }
    }
    async create(req, res) {
        try {
            const data = await reviewsService.create(req.body);
            return sendResponse(res, 201, true, 'Review created', ReviewsSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async update(req, res) {
        try {
            const data = await reviewsService.update(req.params.id, req.body);
            return sendResponse(res, 200, true, 'Review updated', ReviewsSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async delete(req, res) {
        try {
            await reviewsService.delete(req.params.id);
            return sendResponse(res, 200, true, 'Review deleted');
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async reorder(req, res) {
        try {
            await reviewsService.reorder(req.body.ids);
            return sendResponse(res, 200, true, 'Reviews reordered');
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsReviewsController();
