const { z } = require('zod');

const updateStorySchema = z.object({
    heading:                z.string().max(200).optional(),
    body_paragraphs:        z.array(z.string().max(1000)).optional(),
    read_more_url:          z.string().max(500).optional(),
    stat_est_year:          z.string().max(100).optional(),
    stat_covers_night:      z.string().max(100).optional(),
    stat_return_guests_pct: z.string().max(100).optional(),
    stat_ranking:           z.string().max(100).optional(),
});

module.exports = { updateStorySchema };
