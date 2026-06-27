const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment.controller');
const {
    createPaymentSchema,
    refundPaymentSchema,
    queryPaymentSchema,
} = require('../../validators/payment.validator');
const validate = require('../../middlewares/validate');
const { billingReadLimiter, billingWriteLimiter } = require('../../middlewares/rateLimiter');
const { authenticate } = require('../../middlewares/auth');

router.get('/', billingReadLimiter, authenticate, validate(queryPaymentSchema, 'query'), paymentController.getAllPayments);
router.get('/:id', billingReadLimiter, authenticate, paymentController.getPaymentById);
router.post('/', billingWriteLimiter, authenticate, validate(createPaymentSchema), paymentController.createPayment);
router.post('/:id/refund', billingWriteLimiter, authenticate, validate(refundPaymentSchema), paymentController.refundPayment);

module.exports = router;
