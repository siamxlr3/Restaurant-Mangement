const { z } = require('zod');

const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
    sort_order: z.preprocess((val) => parseInt(val), z.number().int().min(0)).optional(),
    is_active: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

const updateCategorySchema = categorySchema.partial();

module.exports = {
    categorySchema,
    updateCategorySchema,
};
