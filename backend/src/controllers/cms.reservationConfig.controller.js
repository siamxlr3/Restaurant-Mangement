const configService = require('../services/cms.reservationConfig.service');
const ConfigSerializer = require('../utils/serializers/cms.reservationConfig.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsReservationConfigController {
    async get(req, res) {
        try {
            const data = await configService.getConfig();
            return sendResponse(res, 200, true, 'Reservation config retrieved', ConfigSerializer.map(data));
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async upsert(req, res) {
        try {
            const payload = { ...req.body };
            if (typeof payload.time_slots === 'string') {
                try { payload.time_slots = JSON.parse(payload.time_slots); } catch {}
            }
            const data = await configService.upsertConfig(payload);
            return sendResponse(res, 200, true, 'Reservation config updated', ConfigSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsReservationConfigController();
