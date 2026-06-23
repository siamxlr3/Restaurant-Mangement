const tableService = require('../services/table.service');
const tableSerializer = require('../utils/serializers/table.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

/**
 * Controller for handling restaurant table requests.
 */
class TableController {
    /**
     * GET /api/v1/tables
     */
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await tableService.getAllTables(req.query);
            return sendResponse(
                res, 200, true,
                'Tables retrieved successfully',
                tableSerializer.mapMany(items),
                { total, page, per_page, total_pages }
            );
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }

    /**
     * GET /api/v1/tables/:id
     */
    async getById(req, res) {
        try {
            const table = await tableService.getTableById(req.params.id);
            return sendResponse(res, 200, true, 'Table retrieved successfully', tableSerializer.map(table));
        } catch (error) {
            return sendError(res, 404, error.message);
        }
    }

    /**
     * POST /api/v1/tables
     */
    async create(req, res) {
        try {
            const table = await tableService.createTable(req.body);
            return sendResponse(res, 201, true, 'Table created successfully', tableSerializer.map(table));
        } catch (error) {
            const status = error.message.includes('already exists') ? 409 : 400;
            return sendError(res, status, error.message);
        }
    }

    /**
     * PATCH /api/v1/tables/:id
     */
    async update(req, res) {
        try {
            const table = await tableService.updateTable(req.params.id, req.body);
            return sendResponse(res, 200, true, 'Table updated successfully', tableSerializer.map(table));
        } catch (error) {
            const status = error.message.includes('already exists') ? 409 : 400;
            return sendError(res, status, error.message);
        }
    }

    /**
     * DELETE /api/v1/tables/:id
     */
    async delete(req, res) {
        try {
            await tableService.deleteTable(req.params.id);
            return sendResponse(res, 200, true, 'Table deleted successfully');
        } catch (error) {
            return sendError(res, 400, error.message);
        }
    }

    /**
     * PATCH /api/v1/tables/:id/status
     */
    async transitionStatus(req, res) {
        try {
            const table = await tableService.transitionStatus(req.params.id, req.body.status);
            return sendResponse(res, 200, true, `Table status updated to "${table.status}"`, table);
        } catch (error) {
            const status = error.message.includes('not found') ? 404 : 422;
            return sendError(res, status, error.message);
        }
    }

    /**
     * PATCH /api/v1/tables/:id/waiter
     */
    async assignWaiter(req, res) {
        try {
            const table = await tableService.assignWaiter(req.params.id, req.body.waiter_id);
            return sendResponse(res, 200, true, 'Waiter assigned successfully', tableSerializer.map(table));
        } catch (error) {
            const status = error.message.includes('not found') ? 404 : 400;
            return sendError(res, status, error.message);
        }
    }

    /**
     * GET /api/v1/tables/sections
     */
    async getSections(req, res) {
        try {
            const sections = await tableService.getSections();
            return sendResponse(res, 200, true, 'Sections retrieved successfully', sections);
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }
}

module.exports = new TableController();
