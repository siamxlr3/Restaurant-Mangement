const gatewayService = require('../services/payment.gateway.service');
const { sendResponse, sendError } = require('../utils/apiResponse');

class PaymentGatewayController {
    async getStatus(req, res) {
        try {
            const status = await gatewayService.getGatewayStatus();
            return sendResponse(res, 200, true, 'Gateway status retrieved', status);
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }

    async initiatePayment(req, res) {
        try {
            const { provider, amount, bill_id, callback_url } = req.body;
            const result = await gatewayService.initiatePayment({
                provider,
                amount: parseFloat(amount),
                billId: bill_id,
                callbackURL: callback_url,
            });
            return sendResponse(res, 201, true, `${provider} payment initiated`, result);
        } catch (error) {
            return sendError(res, 400, error.message);
        }
    }

    async executePayment(req, res) {
        try {
            const { provider, payment_id } = req.body;
            const result = await gatewayService.executePayment({ provider, paymentID: payment_id });
            return sendResponse(res, 200, true, `${provider} payment executed successfully`, result);
        } catch (error) {
            return sendError(res, 400, error.message);
        }
    }
}

module.exports = new PaymentGatewayController();
