const { z } = require('zod');

const createFaqItemSchema = z.object({
    question:   z.string().min(1, 'Question is required').max(300),
    answer:     z.string().min(1, 'Answer is required').max(2000),
    sort_order: z.coerce.number().int().min(0).optional(),
    is_active:  z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const updateFaqItemSchema = createFaqItemSchema.partial();

module.exports = { createFaqItemSchema, updateFaqItemSchema };
