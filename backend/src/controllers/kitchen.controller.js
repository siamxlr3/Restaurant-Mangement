const kitchenService = require('../services/kitchen.service');
const { serializeTicket, serializeTickets } = require('../utils/serializers/kitchen_ticket.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class KitchenController {
    /**
     * GET /kitchen/tickets
     * List all active kitchen tickets (excluding bumped unless requested)
     */
    async getTickets(req, res, next) {
        try {
            const filters = {
                page: req.query.page,
                per_page: req.query.per_page,
                station: req.query.station,
                status: req.query.status,
                from_date: req.query.from_date,
                to_date: req.query.to_date,
            };

            const result = await kitchenService.getAllTickets(filters);
            
            return sendResponse(
                res, 
                200, 
                true, 
                'Kitchen tickets retrieved successfully', 
                serializeTickets(result.items),
                {
                    page: result.page,
                    per_page: result.per_page,
                    total: result.total,
                    total_pages: result.total_pages
                }
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /kitchen/tickets
     * Manually create a kitchen ticket
     */
    async createTicket(req, res, next) {
        try {
            const ticket = await kitchenService.createTicket(req.body);
            return sendResponse(res, 201, true, 'Kitchen ticket created', serializeTicket(ticket));
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /kitchen/tickets/:id/status
     * Update ticket status (e.g., Prepared, Bumped)
     */
    async updateTicketStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const ticket = await kitchenService.updateTicketStatus(id, status);
            
            // Broadcast the update for realtime KDS
            await kitchenService.broadcastToKDS('TicketUpdated', serializeTicket(ticket));

            return sendResponse(res, 200, true, `Ticket status updated to ${status}`, serializeTicket(ticket));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new KitchenController();
