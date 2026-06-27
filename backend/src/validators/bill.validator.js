const { z } = require('zod');

const generateBillSchema = z.object({
    order_id: z.string({ required_error: 'Order ID is required' }).uuid('Invalid Order ID format'),
});

const updateBillStatusSchema = z.object({
    status: z.enum(['draft', 'issued', 'paid', 'refunded'], {
        required_error: 'Status is required',
        invalid_type_error: 'Invalid status type',
    }),
});

const queryBillSchema = z.object({
    page: z.preprocess((val) => parseInt(val, 10), z.number().int().min(1).default(1)),
    per_page: z.preprocess((val) => parseInt(val, 10), z.number().int().min(1).max(100).default(20)),
    search: z.string().optional(),
    status: z.enum(['draft', 'issued', 'paid', 'refunded']).optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid from_date format (YYYY-MM-DD)').optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid to_date format (YYYY-MM-DD)').optional(),
});

module.exports = {
    generateBillSchema,
    updateBillStatusSchema,
    queryBillSchema,
};
