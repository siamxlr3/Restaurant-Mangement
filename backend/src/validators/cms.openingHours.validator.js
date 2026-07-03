const { z } = require('zod');

const createOpeningHourSchema = z.object({
    day_label:  z.string().min(1, 'Day label is required').max(20),
    open_time:  z.string().max(20).nullable().optional(),
    close_time: z.string().max(20).nullable().optional(),
    is_today:   z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
    is_closed:  z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
    sort_order: z.coerce.number().int().min(0).optional(),
});

const updateOpeningHourSchema = createOpeningHourSchema.partial();

module.exports = { createOpeningHourSchema, updateOpeningHourSchema };
