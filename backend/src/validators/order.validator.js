const { z } = require('zod');

// ── Modifier inside an order item ────────────────────────────
const orderItemModifierSchema = z.object({
    modifier_id: z.string().uuid('Invalid modifier ID'),
    extra_price: z.preprocess(
        (val) => parseFloat(val),
        z.number().min(0, 'Extra price must be >= 0')
    ).optional().default(0),
});

// ── Single order item ────────────────────────────────────────
const orderItemInputSchema = z.object({
    menu_item_id: z.string().uuid('Invalid menu_item_id'),
    variant_id:   z.string().uuid('Invalid variant_id').nullable().optional(),
    quantity:     z.preprocess(
        (val) => parseInt(val),
        z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100')
    ),
    notes:       z.string().max(500, 'Notes too long').optional().nullable(),
    modifiers:   z.array(orderItemModifierSchema).optional().default([]),
});

// ── Create Order ─────────────────────────────────────────────
const createOrderSchema = z.object({
    table_id:    z.string().uuid('Invalid table_id').nullable().optional(),
    customer_id: z.string().uuid('Invalid customer_id').nullable().optional(),
    type:        z.enum(['dine-in', 'takeaway', 'delivery'], {
        errorMap: () => ({ message: 'Type must be one of: dine-in, takeaway, delivery' }),
    }),
    items: z.array(orderItemInputSchema).optional().default([]),
});

// ── Add Item to existing Order ───────────────────────────────
const addOrderItemSchema = z.object({
    menu_item_id: z.string().uuid('Invalid menu_item_id'),
    variant_id:   z.string().uuid('Invalid variant_id').nullable().optional(),
    quantity:     z.preprocess(
        (val) => parseInt(val),
        z.number().int().min(1, 'Quantity must be at least 1').max(100)
    ),
    notes:       z.string().max(500).optional().nullable(),
    modifiers:   z.array(orderItemModifierSchema).optional().default([]),
});

// ── Void (remove) an order item ──────────────────────────────
const voidOrderItemSchema = z.object({
    reason: z.string().min(3, 'Void reason must be at least 3 characters').max(500, 'Reason too long'),
});

// ── Order Status Transition ───────────────────────────────────
const orderStatusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'closed'], {
        errorMap: () => ({ message: 'Invalid status value' }),
    }),
});

// ── Hold Order ───────────────────────────────────────────────
const holdOrderSchema = z.object({
    reason: z.string().max(500, 'Hold reason too long').optional().nullable(),
});

module.exports = {
    createOrderSchema,
    addOrderItemSchema,
    voidOrderItemSchema,
    orderStatusSchema,
    holdOrderSchema,
};
