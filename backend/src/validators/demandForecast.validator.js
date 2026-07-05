const { z } = require('zod');

const queryForecastSchema = z.object({
    page: z.preprocess((val) => val ? parseInt(val) : 1, z.number().int().min(1).default(1)),
    per_page: z.preprocess((val) => val ? parseInt(val) : 20, z.number().int().min(1).max(100).default(20)),
    search: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid from_date format (YYYY-MM-DD)').optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid to_date format (YYYY-MM-DD)').optional(),
});

const updateActualQtySchema = z.object({
    actual_qty: z.preprocess((val) => parseFloat(val), z.number().min(0, 'Actual quantity must be at least 0')),
});

module.exports = {
    queryForecastSchema,
    updateActualQtySchema,
};
