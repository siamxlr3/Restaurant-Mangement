const express = require('express');
const router = express.Router();
const tableController = require('../../controllers/table.controller');
const {
    createTableSchema,
    updateTableSchema,
    statusTransitionSchema,
    assignWaiterSchema,
} = require('../../validators/table.validator');
const validate = require('../../middlewares/validate');
const { tableReadLimiter, tableWriteLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/tables/sections
 * @desc    Get all unique sections
 * @access  Public
 */
router.get('/sections', tableReadLimiter, tableController.getSections);

/**
 * @route   GET /api/v1/tables
 * @desc    List all tables (paginated, searchable, filterable)
 * @access  Public
 */
router.get('/', tableReadLimiter, tableController.getAll);

/**
 * @route   GET /api/v1/tables/:id
 * @desc    Get table by ID
 * @access  Public
 */
router.get('/:id', tableReadLimiter, tableController.getById);

/**
 * @route   POST /api/v1/tables
 * @desc    Create a new table
 * @access  Private (Admin/Manager)
 */
router.post('/', tableWriteLimiter, validate(createTableSchema), tableController.create);

/**
 * @route   PATCH /api/v1/tables/:id
 * @desc    Update table details
 * @access  Private (Admin/Manager)
 */
router.patch('/:id', tableWriteLimiter, validate(updateTableSchema), tableController.update);

/**
 * @route   DELETE /api/v1/tables/:id
 * @desc    Soft delete a table
 * @access  Private (Admin)
 */
router.delete('/:id', tableWriteLimiter, tableController.delete);

/**
 * @route   PATCH /api/v1/tables/:id/status
 * @desc    Transition table status (open→occupied→cleaning→open)
 * @access  Private (Admin/Manager/Staff)
 */
router.patch('/:id/status', tableWriteLimiter, validate(statusTransitionSchema), tableController.transitionStatus);

/**
 * @route   PATCH /api/v1/tables/:id/waiter
 * @desc    Assign or unassign a waiter to a table
 * @access  Private (Admin/Manager)
 */
router.patch('/:id/waiter', tableWriteLimiter, validate(assignWaiterSchema), tableController.assignWaiter);

module.exports = router;
