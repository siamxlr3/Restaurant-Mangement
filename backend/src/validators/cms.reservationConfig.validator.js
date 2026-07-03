const { z } = require('zod');

const updateReservationConfigSchema = z.object({
    time_slots:             z.array(z.string().max(20)).optional(),
    hold_duration_minutes:  z.coerce.number().int().min(1).max(120).optional(),
    max_party_size:         z.coerce.number().int().min(1).max(50).optional(),
    tables_available_count: z.coerce.number().int().min(0).max(500).optional(),
});

module.exports = { updateReservationConfigSchema };
