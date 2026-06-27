const { z } = require('zod');

const createPaymentSchema = z.object({
    bill_id: z.string().uuid('Invalid Bill ID'),
    method: z.enum(['cash', 'card', 'split', 'bkash', 'rocket', 'nagad']),
    amount: z.number().positive('Amount must be positive'),
    reference_number: z.string().optional(),
    received_amount: z.number().min(0).optional(),
    change_amount: z.number().min(0).optional(),
});

const refundPaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

const queryPaymentSchema = z.object({
    page: z.string().transform(Number).optional(),
    per_page: z.string().transform(Number).optional(),
    search: z.string().optional(),
    status: z.enum(['completed', 'refunded']).optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
});

module.exports = {
    createPaymentSchema,
    refundPaymentSchema,
    queryPaymentSchema,
};
