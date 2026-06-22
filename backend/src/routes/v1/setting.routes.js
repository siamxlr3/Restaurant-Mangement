const express = require('express');
const router  = express.Router();
const settingController = require('../../controllers/setting.controller');
const { upsertGroupSchema, testConnectionSchema } = require('../../validators/setting.validator');
const validate = require('../../middlewares/validate');
const { settingReadLimiter, settingWriteLimiter } = require('../../middlewares/rateLimiter');

/**
 * NOTE: test-connection route MUST be registered before /:group
 * to prevent Express matching "test-connection" as a :group param.
 */

/**
 * @route   POST /api/v1/settings/test-connection
 * @desc    Test a third-party integration (Stripe, OpenAI, etc.)
 * @access  Public (no auth while auth is removed)
 */
router.post(
    '/test-connection',
    settingWriteLimiter,
    validate(testConnectionSchema),
    settingController.testConnection
);

/**
 * @route   GET /api/v1/settings
 * @desc    Get all settings grouped
 * @access  Public
 */
router.get(
    '/',
    settingReadLimiter,
    settingController.getAll
);

/**
 * @route   GET /api/v1/settings/:group
 * @desc    Get settings for a specific group (general|payments|ai|notifications)
 * @access  Public
 */
router.get(
    '/:group',
    settingReadLimiter,
    settingController.getByGroup
);

/**
 * @route   POST /api/v1/settings/:group
 * @desc    Bulk upsert settings for a group
 * @access  Public
 */
router.post(
    '/:group',
    settingWriteLimiter,
    validate(upsertGroupSchema),
    settingController.upsertGroup
);

module.exports = router;
