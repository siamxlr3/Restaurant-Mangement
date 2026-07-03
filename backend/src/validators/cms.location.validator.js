const { z } = require('zod');

const updateLocationSchema = z.object({
    address:        z.string().max(300).optional(),
    parking_info:   z.string().max(300).optional(),
    phone:          z.string().max(30).optional(),
    lat:            z.coerce.number().min(-90).max(90).optional().nullable(),
    lng:            z.coerce.number().min(-180).max(180).optional().nullable(),
    directions_url: z.string().max(500).optional().nullable(),
    call_cta:       z.string().max(60).optional(),
});

module.exports = { updateLocationSchema };
