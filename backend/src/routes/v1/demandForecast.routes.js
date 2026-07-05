const express = require('express');
const router = express.Router();
const demandForecastController = require('../../controllers/demandForecast.controller');
const { queryForecastSchema, updateActualQtySchema } = require('../../validators/demandForecast.validator');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/demand-forecasts
 * @desc    Get all demand forecasts (paginated, filtered, search)
 * @access  Public (Read Limited)
 */
router.get(
    '/',
    readLimiter,
    validate(queryForecastSchema, 'query'),
    demandForecastController.getAll
);

/**
 * @route   GET /api/v1/demand-forecasts/logs
 * @desc    Get AI job execution logs
 * @access  Public (Read Limited)
 */
router.get(
    '/logs',
    readLimiter,
    demandForecastController.getJobLogs
);

/**
 * @route   PATCH /api/v1/demand-forecasts/:id/actual
 * @desc    Update the actual quantity sold for a forecast
 * @access  Private (Admin/Manager/Staff)
 */
router.patch(
    '/:id/actual',
    writeLimiter,
    authenticate,
    rbac(['admin', 'manager', 'staff']),
    validate(updateActualQtySchema, 'body'),
    demandForecastController.updateActual
);

/**
 * @route   POST /api/v1/demand-forecasts/trigger-job
 * @desc    Manually trigger the nightly calculations job
 * @access  Private (Admin/Manager)
 */
router.post(
    '/trigger-job',
    writeLimiter,
    authenticate,
    rbac(['admin', 'manager']),
    demandForecastController.triggerJob
);

/**
 * @route   DELETE /api/v1/demand-forecasts/:id
 * @desc    Delete/Dismiss a forecast record
 * @access  Private (Admin/Manager)
 */
router.delete(
    '/:id',
    writeLimiter,
    authenticate,
    rbac(['admin', 'manager']),
    demandForecastController.delete
);

module.exports = router;
