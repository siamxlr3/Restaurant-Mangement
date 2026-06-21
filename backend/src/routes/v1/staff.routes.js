const express = require('express');
const router = express.Router();
const multer = require('multer');
const staffController = require('../../controllers/staff.controller');
const { createStaffSchema, updateStaffSchema } = require('../../validators/staff.validator');
const validate = require('../../middlewares/validate');
const { staffReadLimiter, staffWriteLimiter } = require('../../middlewares/rateLimiter');

// Multer config for in-memory storage (to be processed by sharp)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
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
 * @route   POST /api/v1/staff
 * @desc    Create a new staff member
 * @access  Private (Admin/Manager)
 */
router.post(
    '/',
    staffWriteLimiter,
    upload.single('image'),
    validate(createStaffSchema),
    staffController.create
);

/**
 * @route   GET /api/v1/staff
 * @desc    Get all staff (paginated, searchable)
 * @access  Private (Authenticated)
 */
router.get(
    '/',
    staffReadLimiter,
    staffController.getAll
);

/**
 * @route   GET /api/v1/staff/:id
 * @desc    Get staff by ID
 * @access  Private (Authenticated)
 */
router.get(
    '/:id',
    staffReadLimiter,
    staffController.getById
);

/**
 * @route   PATCH /api/v1/staff/:id
 * @desc    Update staff details
 * @access  Private (Admin/Manager)
 */
router.patch(
    '/:id',
    staffWriteLimiter,
    upload.single('image'),
    validate(updateStaffSchema),
    staffController.update
);

/**
 * @route   DELETE /api/v1/staff/:id
 * @desc    Delete staff (soft delete)
 * @access  Private (Admin)
 */
router.delete(
    '/:id',
    staffWriteLimiter,
    staffController.delete
);

module.exports = router;
