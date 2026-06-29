const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../../controllers/purchaseOrder.controller');
const { purchaseOrderSchema, updatePurchaseOrderSchema } = require('../../validators/purchaseOrder.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/purchase-orders
 * @desc    Get all purchase orders (paginated, filtered)
 */
router.get('/', readLimiter, purchaseOrderController.getAll);

/**
 * @route   GET /api/v1/purchase-orders/:id
 * @desc    Get purchase order by ID
 */
router.get('/:id', readLimiter, purchaseOrderController.getById);

/**
 * @route   POST /api/v1/purchase-orders
 * @desc    Create a new purchase order
 */
router.post('/', writeLimiter, validate(purchaseOrderSchema), purchaseOrderController.create);

/**
 * @route   PATCH /api/v1/purchase-orders/:id
 * @desc    Update purchase order (status transitions, items)
 */
router.patch('/:id', writeLimiter, validate(updatePurchaseOrderSchema), purchaseOrderController.update);

/**
 * @route   DELETE /api/v1/purchase-orders/:id
 * @desc    Soft-delete a purchase order
 */
router.delete('/:id', writeLimiter, purchaseOrderController.delete);

module.exports = router;
