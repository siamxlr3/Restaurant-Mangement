const heroService = require('../services/cms.hero.service');
const HeroSerializer = require('../utils/serializers/cms.hero.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsHeroController {
    async get(req, res) {
        try {
            const data = await heroService.getHero();
            return sendResponse(res, 200, true, 'Hero retrieved', HeroSerializer.map(data));
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async upsert(req, res) {
        try {
            const data = await heroService.upsertHero(req.body);
            return sendResponse(res, 200, true, 'Hero updated', HeroSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsHeroController();
