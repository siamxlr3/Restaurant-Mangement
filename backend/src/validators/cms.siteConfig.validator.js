const { z } = require('zod');

const updateSiteConfigSchema = z.object({
    brand_name:    z.string().min(1, 'Brand name is required').max(100).optional(),
    tagline:       z.string().max(200).optional(),
    primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g. #FF6B35)').optional(),
    timezone:      z.string().min(1).max(60).optional(),
});

module.exports = { updateSiteConfigSchema };
