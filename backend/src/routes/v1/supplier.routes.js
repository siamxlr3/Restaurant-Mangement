const express = require('express');
const router = express.Router();
const supplierController = require('../../controllers/supplier.controller');
const { supplierSchema, updateSupplierSchema } = require('../../validators/supplier.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

/**
 * @route   GET /api/v1/suppliers
 * @desc    Get all suppliers (paginated, filtered, search)
 */
router.get('/', readLimiter, supplierController.getAll);

/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Get supplier by ID
 */
router.get('/:id', readLimiter, supplierController.getById);

/**
 * @route   POST /api/v1/suppliers
 * @desc    Create a new supplier
 */
router.post('/', writeLimiter, validate(supplierSchema), supplierController.create);

/**
 * @route   PATCH /api/v1/suppliers/:id
 * @desc    Update supplier details
 */
router.patch('/:id', writeLimiter, validate(updateSupplierSchema), supplierController.update);

/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Soft-delete a supplier
 */
router.delete('/:id', writeLimiter, supplierController.delete);

module.exports = router;
