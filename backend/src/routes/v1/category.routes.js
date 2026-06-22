const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/category.controller');
const { categorySchema, updateCategorySchema } = require('../../validators/category.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Public (POS/Admin)
 */
router.get('/', readLimiter, categoryController.getAll);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', readLimiter, categoryController.getById);

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private (Admin)
 */
router.post('/', writeLimiter, validate(categorySchema), categoryController.create);

/**
 * @route   PATCH /api/v1/categories/order
 * @desc    Update categories sort order
 * @access  Private (Admin)
 */
router.patch('/order', writeLimiter, categoryController.updateOrder);

/**
 * @route   PATCH /api/v1/categories/:id
 * @desc    Update a category
 * @access  Private (Admin)
 */
router.patch('/:id', writeLimiter, validate(updateCategorySchema), categoryController.update);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete a category (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', writeLimiter, categoryController.delete);

module.exports = router;
