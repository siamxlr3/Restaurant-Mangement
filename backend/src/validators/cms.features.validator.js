const { z } = require('zod');

const createFeatureSchema = z.object({
    icon:        z.string().min(1, 'Icon is required').max(50),
    title:       z.string().min(1, 'Title is required').max(100),
    description: z.string().min(1, 'Description is required').max(500),
    sort_order:  z.coerce.number().int().min(0).optional(),
    is_active:   z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const updateFeatureSchema = createFeatureSchema.partial();

module.exports = { createFeatureSchema, updateFeatureSchema };
