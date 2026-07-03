const featuresService = require('../services/cms.features.service');
const FeaturesSerializer = require('../utils/serializers/cms.features.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsFeaturesController {
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await featuresService.getAll(req.query);
            return sendResponse(res, 200, true, 'Features retrieved', FeaturesSerializer.mapMany(items), { total, page, per_page, total_pages });
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async getById(req, res) {
        try {
            const data = await featuresService.getById(req.params.id);
            return sendResponse(res, 200, true, 'Feature retrieved', FeaturesSerializer.map(data));
        } catch (err) { return sendError(res, 404, err.message); }
    }
    async create(req, res) {
        try {
            const data = await featuresService.create(req.body);
            return sendResponse(res, 201, true, 'Feature created', FeaturesSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async update(req, res) {
        try {
            const data = await featuresService.update(req.params.id, req.body);
            return sendResponse(res, 200, true, 'Feature updated', FeaturesSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async delete(req, res) {
        try {
            await featuresService.delete(req.params.id);
            return sendResponse(res, 200, true, 'Feature deleted');
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async reorder(req, res) {
        try {
            await featuresService.reorder(req.body.ids);
            return sendResponse(res, 200, true, 'Features reordered');
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsFeaturesController();
