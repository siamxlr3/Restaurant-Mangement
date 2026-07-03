const storyService = require('../services/cms.story.service');
const StorySerializer = require('../utils/serializers/cms.story.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsStoryController {
    async get(req, res) {
        try {
            const data = await storyService.getStory();
            return sendResponse(res, 200, true, 'Story retrieved', StorySerializer.map(data));
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async upsert(req, res) {
        try {
            const payload = { ...req.body };
            // Handle body_paragraphs sent as JSON string from form data
            if (typeof payload.body_paragraphs === 'string') {
                try { payload.body_paragraphs = JSON.parse(payload.body_paragraphs); } catch {}
            }
            const data = await storyService.upsertStory(payload);
            return sendResponse(res, 200, true, 'Story updated', StorySerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsStoryController();
