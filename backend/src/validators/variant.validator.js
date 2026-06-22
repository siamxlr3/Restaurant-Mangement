const { z } = require('zod');

const variantSchema = z.object({
    item_id: z.string().uuid('Invalid item ID'),
    label: z.string().min(1, 'Label is required').max(100, 'Label too long'),
    extra_price: z.preprocess((val) => parseFloat(val), z.number().min(0)),
});

const updateVariantSchema = variantSchema.partial();

module.exports = {
    variantSchema,
    updateVariantSchema,
};
