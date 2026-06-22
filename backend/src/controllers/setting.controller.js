const settingService = require('../services/setting.service');
const SettingSerializer = require('../utils/serializers/setting.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

/**
 * Controller for Application Settings endpoints.
 * All business logic lives in SettingService — this is thin.
 */
class SettingController {
    /**
     * GET /api/v1/settings
     * Returns all settings, grouped by their "group" field.
     */
    async getAll(req, res) {
        try {
            const settings = await settingService.getAll();
            const grouped  = SettingSerializer.mapGrouped(settings);
            return sendResponse(res, 200, true, 'Settings retrieved successfully', grouped);
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }

    /**
     * GET /api/v1/settings/:group
     * Returns settings for the specified group.
     */
    async getByGroup(req, res) {
        try {
            const settings = await settingService.getByGroup(req.params.group);
            return sendResponse(
                res,
                200,
                true,
                `Settings for group '${req.params.group}' retrieved successfully`,
                SettingSerializer.mapMany(settings)
            );
        } catch (error) {
            const status = error.message.includes('Invalid settings group') ? 400 : 500;
            return sendError(res, status, error.message);
        }
    }

    /**
     * POST /api/v1/settings/:group
     * Bulk upsert settings for the specified group.
     */
    async upsertGroup(req, res) {
        try {
            const saved = await settingService.upsertGroup(req.params.group, req.body.settings);
            return sendResponse(
                res,
                200,
                true,
                `Settings for group '${req.params.group}' saved successfully`,
                SettingSerializer.mapMany(saved)
            );
        } catch (error) {
            const status = error.message.includes('Invalid settings group') ? 400 : 500;
            return sendError(res, status, error.message);
        }
    }

    /**
     * POST /api/v1/settings/test-connection
     * Test a third-party API integration with the provided key.
     */
    async testConnection(req, res) {
        try {
            const { provider, key } = req.body;
            const result = await settingService.testConnection(provider, key);
            return sendResponse(
                res,
                200,
                result.success,
                result.message,
                { provider, connected: result.success }
            );
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }
}

module.exports = new SettingController();
