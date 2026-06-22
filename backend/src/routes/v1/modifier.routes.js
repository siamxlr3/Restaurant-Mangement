const express = require('express');
const router = express.Router();
const modifierController = require('../../controllers/modifier.controller');
const { modifierSchema, updateModifierSchema } = require('../../validators/modifier.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/modifiers
 * @desc    Get all modifiers (paginated, filtered)
 * @access  Public
 */
router.get('/', readLimiter, modifierController.getAll);

/**
 * @route   GET /api/v1/modifiers/item/:itemId
 * @desc    Get modifiers by item ID
 * @access  Public
 */
router.get('/item/:itemId', readLimiter, modifierController.getByItemId);

/**
 * @route   POST /api/v1/modifiers
 * @desc    Create a new modifier
 * @access  Private (Admin)
 */
router.post(
    '/',
    writeLimiter,
    validate(modifierSchema),
    modifierController.create
);

/**
 * @route   PATCH /api/v1/modifiers/:id
 * @desc    Update a modifier
 * @access  Private (Admin)
 */
router.patch(
    '/:id',
    writeLimiter,
    validate(updateModifierSchema),
    modifierController.update
);

/**
 * @route   DELETE /api/v1/modifiers/:id
 * @desc    Delete a modifier (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', writeLimiter, modifierController.delete);

module.exports = router;
