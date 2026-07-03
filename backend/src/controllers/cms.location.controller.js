const locationService = require('../services/cms.location.service');
const LocationSerializer = require('../utils/serializers/cms.location.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsLocationController {
    async get(req, res) {
        try {
            const data = await locationService.getLocation();
            return sendResponse(res, 200, true, 'Location retrieved', LocationSerializer.map(data));
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async upsert(req, res) {
        try {
            const data = await locationService.upsertLocation(req.body);
            return sendResponse(res, 200, true, 'Location updated', LocationSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsLocationController();
