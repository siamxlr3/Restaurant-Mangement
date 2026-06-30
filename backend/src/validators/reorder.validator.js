const { z } = require('zod');

const reorderQuerySchema = z.object({
    page: z.string().regex(/^\d+$/, 'Page must be an integer').optional(),
    per_page: z.string().regex(/^\d+$/, 'per_page must be an integer').optional(),
    search: z.string().max(100, 'Search query is too long').optional(),
    status: z.enum(['all', 'pending', 'accepted', 'active', 'inactive'], {
        errorMap: () => ({ message: 'Status must be all, pending, or accepted' }),
    }).optional().or(z.literal('')),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from_date must be YYYY-MM-DD').optional().or(z.literal('')),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to_date must be YYYY-MM-DD').optional().or(z.literal('')),
});

const acceptParamsSchema = z.object({
    id: z.string().uuid('Invalid reorder suggestion ID'),
});

module.exports = {
    reorderQuerySchema,
    acceptParamsSchema,
};
