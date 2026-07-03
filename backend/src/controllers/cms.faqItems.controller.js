const faqService = require('../services/cms.faqItems.service');
const FaqSerializer = require('../utils/serializers/cms.faqItems.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsFaqItemsController {
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await faqService.getAll(req.query);
            return sendResponse(res, 200, true, 'FAQ items retrieved', FaqSerializer.mapMany(items), { total, page, per_page, total_pages });
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async getById(req, res) {
        try {
            const data = await faqService.getById(req.params.id);
            return sendResponse(res, 200, true, 'FAQ item retrieved', FaqSerializer.map(data));
        } catch (err) { return sendError(res, 404, err.message); }
    }
    async create(req, res) {
        try {
            const data = await faqService.create(req.body);
            return sendResponse(res, 201, true, 'FAQ item created', FaqSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async update(req, res) {
        try {
            const data = await faqService.update(req.params.id, req.body);
            return sendResponse(res, 200, true, 'FAQ item updated', FaqSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async delete(req, res) {
        try {
            await faqService.delete(req.params.id);
            return sendResponse(res, 200, true, 'FAQ item deleted');
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async reorder(req, res) {
        try {
            await faqService.reorder(req.body.ids);
            return sendResponse(res, 200, true, 'FAQ items reordered');
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsFaqItemsController();
