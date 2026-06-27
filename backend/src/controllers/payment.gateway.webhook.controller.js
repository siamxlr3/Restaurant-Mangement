const gatewayService = require('../services/payment.gateway.service');
const { sendResponse, sendError } = require('../utils/apiResponse');

/**
 * Webhook Controller
 *
 * Receives POST callbacks from bKash / Rocket / Nagad.
 * Verifies signature, then updates the payment record in the DB.
 * These routes are intentionally unauthenticated (public) — security is
 * enforced via gateway signature verification inside the service.
 */
class PaymentGatewayWebhookController {
    async bkashWebhook(req, res) {
        try {
            const { valid, paymentID, status, error: verifyError } = await gatewayService.verifyBkashWebhook(
                req.headers,
                req.body,
            );

            if (!valid) {
                return sendError(res, 401, verifyError || 'Invalid bKash webhook signature');
            }

            if (paymentID && status) {
                await gatewayService.recordWebhookPaymentStatus({
                    provider:        'bkash',
                    referenceNumber: paymentID,
                    transactionID:   req.body.trxID || null,
                    status,
                });
            }

            // bKash requires HTTP 200 with empty body to acknowledge receipt
            return res.status(200).json({ status: 'received' });
        } catch (error) {
            console.error('[WEBHOOK] bKash error:', error.message);
            return res.status(200).json({ status: 'received' }); // always 200 to prevent retries
        }
    }

    async rocketWebhook(req, res) {
        try {
            const { valid, paymentID, transactionID, status, error: verifyError } =
                await gatewayService.verifyRocketWebhook(req.headers, req.body);

            if (!valid) {
                // Log but still return 200 to prevent excessive retries in sandbox
                console.warn('[WEBHOOK] Rocket invalid signature:', verifyError);
            }

            if (valid && paymentID && status) {
                await gatewayService.recordWebhookPaymentStatus({
                    provider:        'rocket',
                    referenceNumber: paymentID,
                    transactionID,
                    status,
                });
            }

            return res.status(200).json({ status: 'received' });
        } catch (error) {
            console.error('[WEBHOOK] Rocket error:', error.message);
            return res.status(200).json({ status: 'received' });
        }
    }

    async nagadWebhook(req, res) {
        try {
            const { valid, paymentID, transactionID, status, error: verifyError } =
                await gatewayService.verifyNagadWebhook(req.headers, req.body);

            if (!valid) {
                console.warn('[WEBHOOK] Nagad invalid signature:', verifyError);
            }

            if (valid && paymentID && status) {
                await gatewayService.recordWebhookPaymentStatus({
                    provider:        'nagad',
                    referenceNumber: paymentID,
                    transactionID,
                    status,
                });
            }

            return res.status(200).json({ status: 'received' });
        } catch (error) {
            console.error('[WEBHOOK] Nagad error:', error.message);
            return res.status(200).json({ status: 'received' });
        }
    }
}

module.exports = new PaymentGatewayWebhookController();
