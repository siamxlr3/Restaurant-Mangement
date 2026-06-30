const express = require('express');
const router = express.Router();
const reorderController = require('../../controllers/reorder.controller');
const { reorderQuerySchema, acceptParamsSchema } = require('../../validators/reorder.validator');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/reorder-suggestions
 * @desc    Get all reorder suggestions (paginated, filtered, search)
 */
router.get(
    '/',
    readLimiter,
    validate(reorderQuerySchema, 'query'),
    reorderController.getAll
);

/**
 * @route   POST /api/v1/reorder-suggestions/:id/accept
 * @desc    Accept suggestion and draft purchase order (manager / admin only)
 */
router.post(
    '/:id/accept',
    writeLimiter,
    authenticate,
    rbac(['manager', 'admin']),
    validate(acceptParamsSchema, 'params'),
    reorderController.accept
);

/**
 * @route   PATCH /api/v1/reorder-suggestions/:id
 * @desc    Edit a suggestion suggested quantity
 */
router.patch(
    '/:id',
    writeLimiter,
    authenticate,
    rbac(['manager', 'admin']),
    validate(acceptParamsSchema, 'params'), // Reuses validation schema for param id
    reorderController.update
);

/**
 * @route   DELETE /api/v1/reorder-suggestions/:id
 * @desc    Delete/Dismiss suggestion
 */
router.delete(
    '/:id',
    writeLimiter,
    authenticate,
    rbac(['manager', 'admin']),
    validate(acceptParamsSchema, 'params'),
    reorderController.delete
);

/**
 * @route   POST /api/v1/reorder-suggestions/trigger
 * @desc    Manually trigger prediction job
 */
router.post(
    '/trigger',
    writeLimiter,
    reorderController.triggerJob
);

module.exports = router;
