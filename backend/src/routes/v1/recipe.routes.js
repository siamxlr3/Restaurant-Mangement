const express = require('express');
const router = express.Router();
const recipeController = require('../../controllers/recipe.controller');
const { upsertRecipeSchema } = require('../../validators/recipe.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/recipes
 * @desc    Get all menu items with their recipes (paginated)
 */
router.get('/', readLimiter, recipeController.getAll);

/**
 * @route   GET /api/v1/recipes/:item_id
 * @desc    Get ingredients/recipe for a specific menu item
 */
router.get('/:item_id', readLimiter, recipeController.getByItemId);

/**
 * @route   POST /api/v1/recipes/:item_id
 * @desc    Upsert recipe for a menu item (replaces all existing recipe rows)
 */
router.post('/:item_id', writeLimiter, validate(upsertRecipeSchema), recipeController.upsert);

/**
 * @route   DELETE /api/v1/recipes/:item_id
 * @desc    Delete all recipe lines for a menu item
 */
router.delete('/:item_id', writeLimiter, recipeController.delete);

module.exports = router;
