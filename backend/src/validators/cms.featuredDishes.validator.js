const { z } = require('zod');

const VALID_BADGES = ['BESTSELLER', "CHEF'S SIGNATURE", 'NEW', 'SEASONAL'];

const createFeaturedDishSchema = z.object({
    menu_item_id: z.string().uuid('Invalid menu_item_id').optional().nullable(),
    name:         z.string().min(1, 'Name is required').max(100),
    price:        z.string().max(30).optional(),
    rating:       z.coerce.number().min(1).max(5).optional(),
    description:  z.string().max(500).optional(),
    badge:        z.enum(['BESTSELLER', "CHEF'S SIGNATURE", 'NEW', 'SEASONAL']).optional().nullable(),
    sort_order:   z.coerce.number().int().min(0).optional(),
    is_active:    z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const updateFeaturedDishSchema = createFeaturedDishSchema.partial();

module.exports = { createFeaturedDishSchema, updateFeaturedDishSchema };
