const { z } = require('zod');

// -- Create Waitlist -----------------------------------------
const createWaitlistSchema = z.object({
    customer_name: z.string().min(2, 'Customer name must be at least 2 characters'),
    customer_phone: z.string().min(10, 'Valid phone number is required'),
    customer_email: z.string().email('Invalid email address').optional().nullable(),
    party_size: z.preprocess(
        (val) => parseInt(val),
        z.number().int().min(1, 'Party size must be at least 1')
    ),
    est_wait_mins: z.preprocess(
        (val) => (val === undefined || val === null || val === '') ? undefined : parseInt(val),
        z.number().int().min(0, 'Estimated wait mins cannot be negative').optional()
    ),
});

// -- Update Waitlist Status ----------------------------------
const updateWaitlistStatusSchema = z.object({
    status: z.enum(['waiting', 'notified', 'seated', 'cancelled', 'no_show'], {
        errorMap: () => ({ message: 'Invalid waitlist status' }),
    }),
    table_id: z.string().uuid('Invalid table ID').optional().nullable(),
});

module.exports = {
    createWaitlistSchema,
    updateWaitlistStatusSchema,
};
