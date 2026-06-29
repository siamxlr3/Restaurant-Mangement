const purchaseOrderService = require('../services/purchaseOrder.service');
const { serializePurchaseOrder, serializePurchaseOrderList } = require('../utils/serializers/purchaseOrder.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class PurchaseOrderController {
    /**
     * GET /api/v1/purchase-orders
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, supplier_id, status, from_date, to_date } = req.query;
            const { data, meta } = await purchaseOrderService.getAllPurchaseOrders({
                page, per_page, supplier_id, status, from_date, to_date,
            });
            return sendResponse(res, 200, true, 'Purchase orders retrieved successfully', serializePurchaseOrderList(data), meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/purchase-orders/:id
     */
    async getById(req, res, next) {
        try {
            const po = await purchaseOrderService.getPurchaseOrderById(req.params.id);
            if (!po) return sendError(res, 404, 'Purchase order not found');
            return sendResponse(res, 200, true, 'Purchase order retrieved successfully', serializePurchaseOrder(po));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/purchase-orders
     */
    async create(req, res, next) {
        try {
            const po = await purchaseOrderService.createPurchaseOrder(req.body);
            return sendResponse(res, 201, true, 'Purchase order created successfully', serializePurchaseOrder(po));
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/v1/purchase-orders/:id
     */
    async update(req, res, next) {
        try {
            const po = await purchaseOrderService.updatePurchaseOrder(req.params.id, req.body);
            return sendResponse(res, 200, true, 'Purchase order updated successfully', serializePurchaseOrder(po));
        } catch (error) {
            if (error.statusCode === 404) return sendError(res, 404, error.message);
            if (error.statusCode === 400) return sendError(res, 400, error.message);
            next(error);
        }
    }

    /**
     * DELETE /api/v1/purchase-orders/:id
     */
    async delete(req, res, next) {
        try {
            await purchaseOrderService.softDeletePurchaseOrder(req.params.id);
            return sendResponse(res, 200, true, 'Purchase order deleted successfully');
        } catch (error) {
            if (error.statusCode === 404) return sendError(res, 404, error.message);
            if (error.statusCode === 400) return sendError(res, 400, error.message);
            next(error);
        }
    }
}

module.exports = new PurchaseOrderController();
