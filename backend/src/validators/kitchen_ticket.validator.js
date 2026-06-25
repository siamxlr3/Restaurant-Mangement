const { z } = require('zod');

/**
 * Kitchen Ticket Validators
 */
const updateTicketStatusSchema = z.object({
    status: z.enum(['pending', 'preparing', 'ready', 'bumped']),
});

const createTicketSchema = z.object({
    order_id: z.string().uuid(),
    station: z.string().min(1),
    status: z.enum(['pending', 'preparing', 'ready', 'bumped']).optional(),
});

module.exports = {
    updateTicketStatusSchema,
    createTicketSchema,
};
