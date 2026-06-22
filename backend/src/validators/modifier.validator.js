const { z } = require('zod');

const modifierSchema = z.object({
    item_id: z.string().uuid('Invalid item ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    extra_price: z.preprocess((val) => parseFloat(val), z.number().min(0)),
    is_required: z.boolean().optional(),
});

const updateModifierSchema = modifierSchema.partial();

module.exports = {
    modifierSchema,
    updateModifierSchema,
};
