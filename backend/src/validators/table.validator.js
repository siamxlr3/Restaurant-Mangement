const { z } = require('zod');

const createTableSchema = z.object({
    name: z.string().min(1, 'Table name is required').max(50, 'Table name too long'),
    capacity: z.preprocess(
        (val) => parseInt(val),
        z.number().int().min(1, 'Capacity must be at least 1').max(50, 'Capacity cannot exceed 50')
    ),
    section: z.string().min(1, 'Section is required').max(100, 'Section name too long').optional().default('Main Hall'),
    waiter_id: z.string().uuid('Invalid waiter ID').nullable().optional(),
});

const updateTableSchema = z.object({
    name: z.string().min(1, 'Table name is required').max(50, 'Table name too long').optional(),
    capacity: z.preprocess(
        (val) => val !== undefined ? parseInt(val) : undefined,
        z.number().int().min(1, 'Capacity must be at least 1').max(50, 'Capacity cannot exceed 50').optional()
    ),
    section: z.string().min(1, 'Section is required').max(100, 'Section name too long').optional(),
    waiter_id: z.string().uuid('Invalid waiter ID').nullable().optional(),
});

const statusTransitionSchema = z.object({
    status: z.enum(['open', 'occupied', 'cleaning'], {
        errorMap: () => ({ message: 'Status must be one of: open, occupied, cleaning' }),
    }),
});

const assignWaiterSchema = z.object({
    waiter_id: z.string().uuid('Invalid waiter ID').nullable(),
});

module.exports = {
    createTableSchema,
    updateTableSchema,
    statusTransitionSchema,
    assignWaiterSchema,
};
