const express = require('express');
const router = express.Router();
const gatewayController = require('../../controllers/payment.gateway.controller');
const { initiatePaymentSchema, executePaymentSchema } = require('../../validators/payment.gateway.validator');
const validate = require('../../middlewares/validate');
const { billingReadLimiter, billingWriteLimiter } = require('../../middlewares/rateLimiter');
const { authenticate } = require('../../middlewares/auth');

// GET /api/v1/payment-gateways/status
// Returns which gateways have credentials saved (no keys exposed)
router.get(
    '/status',
    billingReadLimiter,
    authenticate,
    gatewayController.getStatus,
);

// POST /api/v1/payment-gateways/initiate
// Initiates a payment with the specified provider (bkash | rocket | nagad)
router.post(
    '/initiate',
    billingWriteLimiter,
    authenticate,
    validate(initiatePaymentSchema),
    gatewayController.initiatePayment,
);

// POST /api/v1/payment-gateways/execute
// Executes (confirms) a pending payment
router.post(
    '/execute',
    billingWriteLimiter,
    authenticate,
    validate(executePaymentSchema),
    gatewayController.executePayment,
);

module.exports = router;
