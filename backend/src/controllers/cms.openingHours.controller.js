const hoursService = require('../services/cms.openingHours.service');
const HoursSerializer = require('../utils/serializers/cms.openingHours.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsOpeningHoursController {
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await hoursService.getAll(req.query);
            return sendResponse(res, 200, true, 'Opening hours retrieved', HoursSerializer.mapMany(items), { total, page, per_page, total_pages });
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async getById(req, res) {
        try {
            const data = await hoursService.getById(req.params.id);
            return sendResponse(res, 200, true, 'Opening hour retrieved', HoursSerializer.map(data));
        } catch (err) { return sendError(res, 404, err.message); }
    }
    async create(req, res) {
        try {
            const data = await hoursService.create(req.body);
            return sendResponse(res, 201, true, 'Opening hour created', HoursSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async update(req, res) {
        try {
            const data = await hoursService.update(req.params.id, req.body);
            return sendResponse(res, 200, true, 'Opening hour updated', HoursSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async delete(req, res) {
        try {
            await hoursService.delete(req.params.id);
            return sendResponse(res, 200, true, 'Opening hour deleted');
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsOpeningHoursController();
