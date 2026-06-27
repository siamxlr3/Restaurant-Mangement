const express = require('express');
const router = express.Router();
const billController = require('../../controllers/bill.controller');
const {
    generateBillSchema,
    updateBillStatusSchema,
    queryBillSchema,
} = require('../../validators/bill.validator');
const validate = require('../../middlewares/validate');
const { billingReadLimiter, billingWriteLimiter } = require('../../middlewares/rateLimiter');
const { authenticate } = require('../../middlewares/auth');

/**
 * @route   GET /api/v1/bills
 * @desc    List all bills (paginated, filterable)
 * @access  Private
 */
router.get('/', billingReadLimiter, authenticate, validate(queryBillSchema, 'query'), billController.getAllBills);

/**
 * @route   GET /api/v1/bills/:id
 * @desc    Get bill by ID
 * @access  Private
 */
router.get('/:id', billingReadLimiter, authenticate, billController.getBillById);

/**
 * @route   POST /api/v1/bills/generate
 * @desc    Generate a bill for an order
 * @access  Private
 */
router.post('/generate', billingWriteLimiter, authenticate, validate(generateBillSchema), billController.generateBill);

/**
 * @route   PATCH /api/v1/bills/:id/status
 * @desc    Update bill status (draft, issued, paid, refunded)
 * @access  Private
 */
router.patch('/:id/status', billingWriteLimiter, authenticate, validate(updateBillStatusSchema), billController.updateStatus);

/**
 * @route   DELETE /api/v1/bills/:id
 * @desc    Soft-delete a bill
 * @access  Private
 */
router.delete('/:id', billingWriteLimiter, authenticate, billController.deleteBill);

module.exports = router;
