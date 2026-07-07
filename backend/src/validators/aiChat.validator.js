const { z } = require('zod');

const sendMessageSchema = z.object({
    message: z
        .string({ required_error: 'Message is required' })
        .min(1, 'Message cannot be empty')
        .max(2000, 'Message must be 2000 characters or fewer')
        .transform((val) => val.trim()),
});

const sessionQuerySchema = z.object({
    page: z.preprocess((val) => (val ? parseInt(val) : 1), z.number().int().min(1).default(1)),
    per_page: z.preprocess((val) => (val ? parseInt(val) : 20), z.number().int().min(1).max(100).default(20)),
    staff_id: z.string().optional(),
});

module.exports = {
    sendMessageSchema,
    sessionQuerySchema,
};
