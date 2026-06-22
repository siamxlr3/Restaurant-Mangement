const { z } = require('zod');

const itemSchema = z.object({
    category_id: z.string().uuid('Invalid category ID'),
    name: z.string().min(1, 'Item name is required').max(150, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    base_price: z.preprocess((val) => parseFloat(val), z.number().min(0)),
    food_cost: z.preprocess((val) => parseFloat(val), z.number().min(0)).optional(),
    is_available: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
    image_url: z.string().url('Invalid image URL').optional(),
    order_count_30d: z.preprocess((val) => parseInt(val), z.number().int().min(0)).optional(),
    revenue_30d: z.preprocess((val) => parseFloat(val), z.number().min(0)).optional(),
});

const updateItemSchema = itemSchema.partial();

const availabilitySchema = z.object({
    is_available: z.boolean(),
});

module.exports = {
    itemSchema,
    updateItemSchema,
    availabilitySchema,
};
