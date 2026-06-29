const { z } = require('zod');

const supplierSchema = z.object({
    name: z.string().min(1, 'Name is required').max(150, 'Name too long'),
    contact: z.string().max(500, 'Contact info too long').optional().nullable(),
    lead_time_days: z.preprocess((v) => parseInt(v), z.number().int().min(0, 'Lead time must be >= 0')).optional(),
    is_active: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const updateSupplierSchema = supplierSchema.partial();

module.exports = {
    supplierSchema,
    updateSupplierSchema,
};
