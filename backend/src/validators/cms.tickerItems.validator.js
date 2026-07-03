const { z } = require('zod');

const createTickerItemSchema = z.object({
    text:       z.string().min(1, 'Text is required').max(200),
    dot_color:  z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
    sort_order: z.coerce.number().int().min(0).optional(),
    is_active:  z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const updateTickerItemSchema = createTickerItemSchema.partial();

module.exports = { createTickerItemSchema, updateTickerItemSchema };
