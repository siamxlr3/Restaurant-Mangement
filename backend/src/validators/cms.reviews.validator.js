const { z } = require('zod');

const createReviewSchema = z.object({
    quote:         z.string().min(1, 'Quote is required').max(1000),
    author_name:   z.string().min(1, 'Author name is required').max(100),
    author_handle: z.string().max(60).optional(),
    visit_count:   z.coerce.number().int().min(1).optional(),
    rating:        z.coerce.number().int().min(1).max(5).optional(),
    sort_order:    z.coerce.number().int().min(0).optional(),
    is_active:     z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const updateReviewSchema = createReviewSchema.partial();

module.exports = { createReviewSchema, updateReviewSchema };
