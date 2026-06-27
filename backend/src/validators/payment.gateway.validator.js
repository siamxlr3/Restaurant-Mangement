const { z } = require('zod');

const PROVIDERS = ['bkash', 'rocket', 'nagad'];

const initiatePaymentSchema = z.object({
    provider:   z.enum(PROVIDERS, { errorMap: () => ({ message: `Provider must be one of: ${PROVIDERS.join(', ')}` }) }),
    amount:     z.number().positive('Amount must be positive'),
    bill_id:    z.string().uuid('Invalid bill ID'),
    callback_url: z.string().url().optional(),
});

const executePaymentSchema = z.object({
    provider:    z.enum(PROVIDERS, { errorMap: () => ({ message: `Provider must be one of: ${PROVIDERS.join(', ')}` }) }),
    payment_id:  z.string().min(1, 'payment_id is required'),
});

module.exports = { initiatePaymentSchema, executePaymentSchema };
