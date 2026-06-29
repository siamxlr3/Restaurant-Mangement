const { z } = require('zod');

const ingredientSchema = z.object({
    name: z.string().min(1, 'Name is required').max(150, 'Name too long'),
    unit: z.string().min(1, 'Unit is required').max(50, 'Unit too long'),
    stock_qty: z.preprocess((v) => parseFloat(v), z.number().min(0, 'Stock qty must be >= 0')).optional(),
    low_stock_threshold: z.preprocess((v) => parseFloat(v), z.number().min(0)).optional(),
    avg_daily_usage: z.preprocess((v) => parseFloat(v), z.number().min(0)).optional(),
    reorder_point: z.preprocess((v) => parseFloat(v), z.number().min(0)).optional(),
    reorder_qty: z.preprocess((v) => parseFloat(v), z.number().min(0)).optional(),
    cost_per_unit: z.preprocess((v) => parseFloat(v), z.number().min(0)).optional(),
    is_active: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const updateIngredientSchema = ingredientSchema.partial();

const stockAdjustSchema = z.object({
    delta: z.preprocess((v) => parseFloat(v), z.number().refine((v) => v !== 0, 'Delta cannot be 0')),
    reason: z.string().min(1, 'Reason is required').max(500),
    adjusted_by: z.string().max(100).optional(),
});

module.exports = {
    ingredientSchema,
    updateIngredientSchema,
    stockAdjustSchema,
};
