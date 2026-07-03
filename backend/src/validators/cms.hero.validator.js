const { z } = require('zod');

const updateHeroSchema = z.object({
    headline_part1:     z.string().max(100).optional(),
    headline_part2:     z.string().max(100).optional(),
    subheadline:        z.string().max(300).optional(),
    cta_primary_text:   z.string().max(60).optional(),
    cta_primary_url:    z.string().max(500).optional(),
    cta_secondary_text: z.string().max(60).optional(),
    cta_secondary_url:  z.string().max(500).optional(),
    stat_rating:        z.string().max(100).optional(),
    stat_reviews:       z.string().max(100).optional(),
    stat_years:         z.string().max(100).optional(),
});

module.exports = { updateHeroSchema };
