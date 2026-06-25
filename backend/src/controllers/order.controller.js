const orderService    = require('../services/order.service');
const OrderSerializer = require('../utils/serializers/order.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

/**
 * Thin controller — all business logic lives in orderService.
 */
class OrderController {
    /** GET /api/v1/orders/pos-menu */
    async getPosMenu(req, res) {
        try {
            const items = await orderService.getPosMenu();
            return sendResponse(res, 200, true, 'POS menu retrieved successfully', items);
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }

    /** GET /api/v1/orders */
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } =
                await orderService.getAllOrders(req.query);
            return sendResponse(
                res, 200, true,
                'Orders retrieved successfully',
                OrderSerializer.mapMany(items),
                { total, page, per_page, total_pages }
            );
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }

    /** GET /api/v1/orders/:id */
    async getById(req, res) {
        try {
            const order = await orderService.getOrderById(req.params.id);
            return sendResponse(res, 200, true, 'Order retrieved successfully', OrderSerializer.map(order));
        } catch (error) {
            return sendError(res, 404, error.message);
        }
    }

    /** POST /api/v1/orders */
    async create(req, res) {
        try {
            const order = await orderService.createOrder(req.body);
            return sendResponse(res, 201, true, 'Order created successfully', OrderSerializer.map(order));
        } catch (error) {
            const status = error.message.includes('not found') ? 404
                : error.message.includes('occupied')           ? 409
                : 400;
            return sendError(res, status, error.message);
        }
    }

    /** POST /api/v1/orders/:id/items */
    async addItem(req, res) {
        try {
            const order = await orderService.addOrderItem(req.params.id, req.body);
            return sendResponse(res, 201, true, 'Item added to order', OrderSerializer.map(order));
        } catch (error) {
            const status = error.message.includes('not found') ? 404
                : error.message.includes('cannot be modified') ? 422
                : 400;
            return sendError(res, status, error.message);
        }
    }

    /** DELETE /api/v1/orders/:id/items/:itemId */
    async voidItem(req, res) {
        try {
            const order = await orderService.voidOrderItem(
                req.params.id, req.params.itemId, req.body.reason
            );
            return sendResponse(res, 200, true, 'Order item voided', OrderSerializer.map(order));
        } catch (error) {
            const status = error.message.includes('not found') ? 404
                : error.message.includes('already voided')     ? 409
                : error.message.includes('cannot be modified') ? 422
                : 400;
            return sendError(res, status, error.message);
        }
    }

    /** PATCH /api/v1/orders/:id/status */
    async updateStatus(req, res) {
        try {
            const order = await orderService.transitionOrderStatus(req.params.id, req.body.status);
            return sendResponse(res, 200, true, `Order status updated to "${req.body.status}"`, OrderSerializer.map(order));
        } catch (error) {
            const status = error.message.includes('not found')   ? 404
                : error.message.includes('Invalid transition')   ? 422
                : 400;
            return sendError(res, status, error.message);
        }
    }

    /** PATCH /api/v1/orders/:id/hold */
    async holdOrder(req, res) {
        try {
            const order = await orderService.holdOrder(req.params.id, req.body.reason);
            return sendResponse(res, 200, true, 'Order placed on hold', OrderSerializer.map(order));
        } catch (error) {
            const status = error.message.includes('not found') ? 404
                : error.message.includes('cannot be held')     ? 422
                : 400;
            return sendError(res, status, error.message);
        }
    }

    /** DELETE /api/v1/orders/:id */
    async delete(req, res) {
        try {
            await orderService.softDeleteOrder(req.params.id);
            return sendResponse(res, 200, true, 'Order deleted successfully');
        } catch (error) {
            const status = error.message.includes('not found') ? 404
                : error.message.includes('Only pending')       ? 422
                : 400;
            return sendError(res, status, error.message);
        }
    }
}

module.exports = new OrderController();
