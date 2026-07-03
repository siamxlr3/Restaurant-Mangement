const siteConfigService = require('../services/cms.siteConfig.service');
const SiteConfigSerializer = require('../utils/serializers/cms.siteConfig.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsSiteConfigController {
    async get(req, res) {
        try {
            const data = await siteConfigService.getConfig();
            return sendResponse(res, 200, true, 'Site config retrieved', SiteConfigSerializer.map(data));
        } catch (err) { return sendError(res, 500, err.message); }
    }

    async upsert(req, res) {
        try {
            const logoBuffer   = req.files?.logo?.[0]?.buffer   ?? null;
            const logoName     = req.files?.logo?.[0]?.originalname ?? null;
            const faviconBuffer = req.files?.favicon?.[0]?.buffer  ?? null;
            const faviconName   = req.files?.favicon?.[0]?.originalname ?? null;

            const data = await siteConfigService.upsertConfig(req.body, logoBuffer, logoName, faviconBuffer, faviconName);
            return sendResponse(res, 200, true, 'Site config updated', SiteConfigSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsSiteConfigController();
