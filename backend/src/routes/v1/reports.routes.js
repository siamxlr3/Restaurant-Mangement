const express = require('express');
const router = express.Router();
const reportsController = require('../../controllers/reports.controller');
const { querySchema, anomalyUpdateSchema } = require('../../validators/reports.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');
const { authenticate, authorize } = require('../../middlewares/auth');

// RBAC: Only Admin and Manager roles can access reports/analytics
const reportsRbac = authorize(['admin', 'manager']);

/**
 * @route   GET /api/v1/reports/sales
 * @desc    Get Sales analytics report (paginated, date field range)
 * @access  Private (Admin/Manager)
 */
router.get(
    '/sales',
    readLimiter,
    authenticate,
    reportsRbac,
    validate(querySchema, 'query'),
    reportsController.getSales
);

/**
 * @route   GET /api/v1/reports/menu-performance
 * @desc    Get Menu Item performance metrics
 * @access  Private (Admin/Manager)
 */
router.get(
    '/menu-performance',
    readLimiter,
    authenticate,
    reportsRbac,
    validate(querySchema, 'query'),
    reportsController.getMenuPerformance
);

/**
 * @route   GET /api/v1/reports/inventory-cost
 * @desc    Get Inventory list cost analysis
 * @access  Private (Admin/Manager)
 */
router.get(
    '/inventory-cost',
    readLimiter,
    authenticate,
    reportsRbac,
    validate(querySchema, 'query'),
    reportsController.getInventoryCost
);

/**
 * @route   GET /api/v1/reports/anomalies
 * @desc    Get system anomalies and alerts list
 * @access  Private (Admin/Manager)
 */
router.get(
    '/anomalies',
    readLimiter,
    authenticate,
    reportsRbac,
    validate(querySchema, 'query'),
    reportsController.getAnomalies
);

/**
 * @route   PATCH /api/v1/reports/anomalies/:id
 * @desc    Update anomaly alert status (read/dismiss properties)
 * @access  Private (Admin/Manager)
 */
router.patch(
    '/anomalies/:id',
    writeLimiter,
    authenticate,
    reportsRbac,
    validate(anomalyUpdateSchema),
    reportsController.updateAnomaly
);

module.exports = router;
