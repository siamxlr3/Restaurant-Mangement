const express    = require('express');
const router     = express.Router();
const orderController = require('../../controllers/order.controller');
const {
    createOrderSchema,
    addOrderItemSchema,
    voidOrderItemSchema,
    orderStatusSchema,
    holdOrderSchema,
} = require('../../validators/order.validator');
const validate    = require('../../middlewares/validate');
const { orderReadLimiter, orderWriteLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/orders/pos-menu
 * @desc    Get available menu items for POS screen
 * @access  Public
 */
router.get('/pos-menu', orderReadLimiter, orderController.getPosMenu);

/**
 * @route   GET /api/v1/orders
 * @desc    List all orders (paginated, filterable by status/type/date)
 * @access  Public
 */
router.get('/', orderReadLimiter, orderController.getAll);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID (with items and modifiers)
 * @access  Public
 */
router.get('/:id', orderReadLimiter, orderController.getById);

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new order (dine-in / takeaway / delivery)
 * @access  Private
 */
router.post('/', orderWriteLimiter, validate(createOrderSchema), orderController.create);

/**
 * @route   POST /api/v1/orders/:id/items
 * @desc    Add an item to an existing active order
 * @access  Private
 */
router.post('/:id/items', orderWriteLimiter, validate(addOrderItemSchema), orderController.addItem);

/**
 * @route   DELETE /api/v1/orders/:id/items/:itemId
 * @desc    Void (soft-remove) an order item with a reason
 * @access  Private
 */
router.delete('/:id/items/:itemId', orderWriteLimiter, validate(voidOrderItemSchema), orderController.voidItem);

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Transition order status along lifecycle
 * @access  Private
 */
router.patch('/:id/status', orderWriteLimiter, validate(orderStatusSchema), orderController.updateStatus);

/**
 * @route   PATCH /api/v1/orders/:id/hold
 * @desc    Place order on hold (save as draft)
 * @access  Private
 */
router.patch('/:id/hold', orderWriteLimiter, validate(holdOrderSchema), orderController.holdOrder);

/**
 * @route   DELETE /api/v1/orders/:id
 * @desc    Soft-delete an order (pending only)
 * @access  Private
 */
router.delete('/:id', orderWriteLimiter, orderController.delete);

module.exports = router;
