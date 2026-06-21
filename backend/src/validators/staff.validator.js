const { z } = require('zod');

const createStaffSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^\d{10,15}$/, 'Invalid phone number'),
    role: z.enum(['admin', 'manager', 'staff'], {
        errorMap: () => ({ message: 'Invalid role' }),
    }),
    pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must contain only digits'),
    is_active: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

const updateStaffSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().regex(/^\d{10,15}$/, 'Invalid phone number').optional(),
    role: z.enum(['admin', 'manager', 'staff']).optional(),
    pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must contain only digits').optional(),
    is_active: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

module.exports = {
    createStaffSchema,
    updateStaffSchema,
};
