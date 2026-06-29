const { z } = require('zod');

const purchaseOrderItemSchema = z.object({
    ingredient_id: z.string().uuid('Invalid ingredient ID'),
    qty: z.preprocess((v) => parseFloat(v), z.number().positive('Quantity must be greater than 0')),
    unit_cost: z.preprocess((v) => parseFloat(v), z.number().nonnegative('Unit cost must be >= 0')),
});

const purchaseOrderSchema = z.object({
    supplier_id: z.string().uuid('Invalid supplier ID'),
    staff_id: z.string().uuid('Invalid staff ID').optional().nullable(),
    ai_suggested: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
    ordered_at: z.string().optional().nullable(), // Allow string formats
    status: z.enum(['draft', 'ordered', 'received']).optional(),
    items: z.array(purchaseOrderItemSchema).optional(),
});

const updatePurchaseOrderSchema = z.object({
    supplier_id: z.string().uuid('Invalid supplier ID').optional(),
    staff_id: z.string().uuid('Invalid staff ID').optional().nullable(),
    ai_suggested: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
    ordered_at: z.string().optional().nullable(),
    status: z.enum(['draft', 'ordered', 'received']).optional(),
    items: z.array(purchaseOrderItemSchema).optional(),
});

module.exports = {
    purchaseOrderItemSchema,
    purchaseOrderSchema,
    updatePurchaseOrderSchema,
};
