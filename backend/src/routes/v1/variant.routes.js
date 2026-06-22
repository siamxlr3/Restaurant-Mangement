const express = require('express');
const router = express.Router();
const variantController = require('../../controllers/variant.controller');
const { variantSchema, updateVariantSchema } = require('../../validators/variant.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/variants
 * @desc    Get all variants (paginated, filtered)
 * @access  Public
 */
router.get('/', readLimiter, variantController.getAll);

/**
 * @route   GET /api/v1/variants/item/:itemId
 * @desc    Get variants by item ID
 * @access  Public
 */
router.get('/item/:itemId', readLimiter, variantController.getByItemId);

/**
 * @route   POST /api/v1/variants
 * @desc    Create a new variant
 * @access  Private (Admin)
 */
router.post(
    '/',
    writeLimiter,
    validate(variantSchema),
    variantController.create
);

/**
 * @route   PATCH /api/v1/variants/:id
 * @desc    Update a variant
 * @access  Private (Admin)
 */
router.patch(
    '/:id',
    writeLimiter,
    validate(updateVariantSchema),
    variantController.update
);

/**
 * @route   DELETE /api/v1/variants/:id
 * @desc    Delete a variant (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', writeLimiter, variantController.delete);

module.exports = router;
