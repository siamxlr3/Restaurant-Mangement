const express = require('express');
const router = express.Router();
const ingredientController = require('../../controllers/ingredient.controller');
const { ingredientSchema, updateIngredientSchema, stockAdjustSchema } = require('../../validators/ingredient.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/ingredients
 * @desc    Get all ingredients (paginated, filtered)
 */
router.get('/', readLimiter, ingredientController.getAll);

/**
 * @route   GET /api/v1/ingredients/low-stock
 * @desc    Get all ingredients with stock_qty < low_stock_threshold
 */
router.get('/low-stock', readLimiter, ingredientController.getLowStock);

/**
 * @route   GET /api/v1/ingredients/:id
 * @desc    Get ingredient by ID
 */
router.get('/:id', readLimiter, ingredientController.getById);

/**
 * @route   POST /api/v1/ingredients
 * @desc    Create a new ingredient
 */
router.post('/', writeLimiter, validate(ingredientSchema), ingredientController.create);

/**
 * @route   PATCH /api/v1/ingredients/:id
 * @desc    Update ingredient details
 */
router.patch('/:id', writeLimiter, validate(updateIngredientSchema), ingredientController.update);

/**
 * @route   PATCH /api/v1/ingredients/:id/adjust-stock
 * @desc    Manual stock adjustment (wastage, spoilage, restock)
 */
router.patch('/:id/adjust-stock', writeLimiter, validate(stockAdjustSchema), ingredientController.adjustStock);

/**
 * @route   DELETE /api/v1/ingredients/:id
 * @desc    Soft-delete an ingredient
 */
router.delete('/:id', writeLimiter, ingredientController.delete);

module.exports = router;
