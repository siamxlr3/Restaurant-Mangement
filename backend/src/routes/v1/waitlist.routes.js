const express = require('express');
const router = express.Router();
const waitlistController = require('../../controllers/waitlist.controller');
const { createWaitlistSchema, updateWaitlistStatusSchema } = require('../../validators/waitlist.validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const rateLimit = require('express-rate-limit');

// -- Rate Limiting --------------------------------------------
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { success: false, message: 'Too many write requests, please try again later.' }
});

const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many read requests, please try again later.' }
});

// -- Routes ---------------------------------------------------

// APPLY AUTH TO ALL ROUTES
router.use(authenticate);

// READ ROUTES
router.get('/', readLimiter, authorize(['admin', 'host', 'manager', 'waiter']), waitlistController.index);
router.get('/:id', readLimiter, authorize(['admin', 'host', 'manager', 'waiter']), waitlistController.show);

// WRITE ROUTES (Requires specific roles)
router.post(
    '/',
    writeLimiter,
    authorize(['admin', 'host', 'manager']),
    validate(createWaitlistSchema),
    waitlistController.store
);

router.patch(
    '/:id/status',
    writeLimiter,
    authorize(['admin', 'host', 'manager']),
    validate(updateWaitlistStatusSchema),
    waitlistController.updateStatus
);

router.delete(
    '/:id',
    writeLimiter,
    authorize(['admin', 'manager']),
    waitlistController.destroy
);

module.exports = router;
