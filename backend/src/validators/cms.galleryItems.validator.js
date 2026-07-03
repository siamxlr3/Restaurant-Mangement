const { z } = require('zod');

const GALLERY_CATEGORIES = ['Kitchen', 'Plates', 'Dining Room', 'Events'];

const createGalleryItemSchema = z.object({
    category:       z.enum(['Kitchen', 'Plates', 'Dining Room', 'Events']),
    caption:        z.string().max(300).optional(),
    filename_label: z.string().max(100).optional(),
    sort_order:     z.coerce.number().int().min(0).optional(),
    is_active:      z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const updateGalleryItemSchema = createGalleryItemSchema.partial();

module.exports = { createGalleryItemSchema, updateGalleryItemSchema, GALLERY_CATEGORIES };
