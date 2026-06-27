const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/payment.gateway.webhook.controller');

// Webhook routes — intentionally public (no JWT auth).
// Security is enforced by signature verification inside each handler.
// Raw body is needed for signature verification — express.json() is fine here.

// POST /api/webhooks/bkash
router.post('/bkash', webhookController.bkashWebhook);

// POST /api/webhooks/rocket
router.post('/rocket', webhookController.rocketWebhook);

// POST /api/webhooks/nagad
router.post('/nagad', webhookController.nagadWebhook);

module.exports = router;
