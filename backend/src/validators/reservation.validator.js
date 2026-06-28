const { z } = require('zod');

// -- Create Reservation ---------------------------------------
const createReservationSchema = z.object({
    customer_name: z.string().min(2, 'Customer name must be at least 2 characters'),
    customer_phone: z.string().min(10, 'Valid phone number is required'),
    customer_email: z.string().email('Invalid email address').optional().nullable(),
    table_id: z.string().uuid('Invalid table ID').optional().nullable(),
    reserved_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date/time format',
    }).refine((val) => new Date(val) > new Date(), {
        message: 'Reservation must be in the future',
    }),
    party_size: z.preprocess(
        (val) => parseInt(val),
        z.number().int().min(1, 'Party size must be at least 1')
    ),
    notes: z.string().max(500, 'Notes too long').optional().nullable(),
});

// -- Update Reservation Status --------------------------------
const updateReservationStatusSchema = z.object({
    status: z.enum(['confirmed', 'seated', 'completed', 'cancelled'], {
        errorMap: () => ({ message: 'Invalid reservation status' }),
    }),
});

module.exports = {
    createReservationSchema,
    updateReservationStatusSchema,
};
