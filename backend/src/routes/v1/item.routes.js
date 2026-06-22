const express = require('express');
const router = express.Router();
const multer = require('multer');
const itemController = require('../../controllers/item.controller');
const { itemSchema, updateItemSchema, availabilitySchema } = require('../../validators/item.validator');
const validate = require('../../middlewares/validate');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

// Multer config for in-memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    },
});

/**
 * @route   GET /api/v1/items
 * @desc    Get all items (paginated, filtered)
 * @access  Public
 */
router.get('/', readLimiter, itemController.getAll);

/**
 * @route   GET /api/v1/items/:id
 * @desc    Get item by ID
 * @access  Public
 */
router.get('/:id', readLimiter, itemController.getById);

/**
 * @route   POST /api/v1/items
 * @desc    Create a new item
 * @access  Private (Admin)
 */
router.post(
    '/',
    writeLimiter,
    upload.single('image'),
    validate(itemSchema),
    itemController.create
);

/**
 * @route   PATCH /api/v1/items/:id/availability
 * @desc    Update item availability (86 Feature)
 * @access  Private (Admin/Staff)
 */
router.patch(
    '/:id/availability',
    writeLimiter,
    validate(availabilitySchema),
    itemController.patchAvailability
);

/**
 * @route   PATCH /api/v1/items/:id
 * @desc    Update an item
 * @access  Private (Admin)
 */
router.patch(
    '/:id',
    writeLimiter,
    upload.single('image'),
    validate(updateItemSchema),
    itemController.update
);

/**
 * @route   DELETE /api/v1/items/:id
 * @desc    Delete an item (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', writeLimiter, itemController.delete);

module.exports = router;
