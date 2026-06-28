const express = require('express');
const router = express.Router();
const reservationController = require('../../controllers/reservation.controller');
const { createReservationSchema, updateReservationStatusSchema } = require('../../validators/reservation.validator');
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
router.get('/', readLimiter, reservationController.index);
router.get('/:id', readLimiter, reservationController.show);

// WRITE ROUTES (Requires specific roles if RBAC is enabled)
router.post(
    '/', 
    writeLimiter, 
    authorize(['admin', 'host', 'manager']), 
    validate(createReservationSchema), 
    reservationController.store
);

router.patch(
    '/:id/status', 
    writeLimiter, 
    authorize(['admin', 'host', 'manager']), 
    validate(updateReservationStatusSchema), 
    reservationController.updateStatus
);

router.delete(
    '/:id', 
    writeLimiter, 
    authorize(['admin', 'manager']), 
    reservationController.destroy
);

module.exports = router;
