const tickerService = require('../services/cms.tickerItems.service');
const TickerSerializer = require('../utils/serializers/cms.tickerItems.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsTickerItemsController {
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await tickerService.getAll(req.query);
            return sendResponse(res, 200, true, 'Ticker items retrieved', TickerSerializer.mapMany(items), { total, page, per_page, total_pages });
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async getById(req, res) {
        try {
            const data = await tickerService.getById(req.params.id);
            return sendResponse(res, 200, true, 'Ticker item retrieved', TickerSerializer.map(data));
        } catch (err) { return sendError(res, 404, err.message); }
    }
    async create(req, res) {
        try {
            const data = await tickerService.create(req.body);
            return sendResponse(res, 201, true, 'Ticker item created', TickerSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async update(req, res) {
        try {
            const data = await tickerService.update(req.params.id, req.body);
            return sendResponse(res, 200, true, 'Ticker item updated', TickerSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async delete(req, res) {
        try {
            await tickerService.delete(req.params.id);
            return sendResponse(res, 200, true, 'Ticker item deleted');
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async reorder(req, res) {
        try {
            await tickerService.reorder(req.body.ids);
            return sendResponse(res, 200, true, 'Ticker items reordered');
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsTickerItemsController();
