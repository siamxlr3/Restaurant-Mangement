const paymentService = require('../services/payment.service');
const { sendResponse, sendError } = require('../utils/apiResponse');

class PaymentController {
    async createPayment(req, res) {
        try {
            const payment = await paymentService.createPayment(req.body);
            return sendResponse(res, 201, true, 'Payment recorded successfully', payment);
        } catch (error) {
            return sendError(res, 400, error.message);
        }
    }

    async getAllPayments(req, res) {
        try {
            const result = await paymentService.getPayments(req.query);
            return sendResponse(res, 200, true, 'Payments retrieved successfully', result.data, result.meta);
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }

    async getPaymentById(req, res) {
        try {
            const payment = await paymentService.getPaymentById(req.params.id);
            return sendResponse(res, 200, true, 'Payment retrieved successfully', payment);
        } catch (error) {
            return sendError(res, 404, error.message);
        }
    }

    async refundPayment(req, res) {
        try {
            const payment = await paymentService.refundPayment(req.params.id, req.body);
            return sendResponse(res, 200, true, 'Payment refunded successfully', payment);
        } catch (error) {
            return sendError(res, 400, error.message);
        }
    }
}

module.exports = new PaymentController();
