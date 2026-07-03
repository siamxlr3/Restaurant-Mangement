const { z } = require('zod');

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
    page: z.preprocess((val) => val ? parseInt(val) : 1, z.number().int().min(1).default(1)),
    per_page: z.preprocess((val) => val ? parseInt(val) : 20, z.number().int().min(1).max(100).default(20)),
    from_date: z.string().regex(dateStringRegex, 'from_date must be in YYYY-MM-DD format (e.g. 2026-07-04)').optional(),
    to_date: z.string().regex(dateStringRegex, 'to_date must be in YYYY-MM-DD format (e.g. 2026-07-04)').optional(),
    search: z.string().optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    status: z.string().optional(),
});

const anomalyUpdateSchema = z.object({
    is_read: z.boolean().optional(),
    is_dismissed: z.boolean().optional(),
}).refine((data) => data.is_read !== undefined || data.is_dismissed !== undefined, {
    message: 'Either is_read or is_dismissed must be provided',
});

module.exports = {
    querySchema,
    anomalyUpdateSchema,
};
