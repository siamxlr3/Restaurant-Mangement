const billService = require('../services/bill.service');
const { serializeBill } = require('../utils/serializers/bill.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class BillController {
    /**
     * POST /bills/generate
     */
    async generateBill(req, res, next) {
        try {
            const { order_id } = req.body;
            const bill = await billService.generateBill(order_id);
            return sendResponse(res, 201, true, 'Bill generated successfully', serializeBill(bill));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /bills
     */
    async getAllBills(req, res, next) {
        try {
            const result = await billService.getAllBills(req.query);
            return sendResponse(res, 200, true, 'Bills retrieved successfully', {
                items: result.items.map(serializeBill),
            }, {
                page: result.page,
                per_page: result.per_page,
                total: result.total,
                total_pages: result.total_pages
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /bills/:id
     */
    async getBillById(req, res, next) {
        try {
            const bill = await billService.getBillById(req.params.id);
            return sendResponse(res, 200, true, 'Bill retrieved successfully', serializeBill(bill));
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /bills/:id/status
     */
    async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            const bill = await billService.updateBillStatus(req.params.id, status);
            return sendResponse(res, 200, true, 'Bill status updated successfully', serializeBill(bill));
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /bills/:id
     */
    async deleteBill(req, res, next) {
        try {
            await billService.softDeleteBill(req.params.id);
            return sendResponse(res, 200, true, 'Bill deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BillController();
