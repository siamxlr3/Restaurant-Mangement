const { supabase } = require('../config/supabase');
const { uploadImage, deleteImage } = require('../utils/storage');

const SELECT_FIELDS = 'id, image_url, category, caption, filename_label, sort_order, is_active, created_at, updated_at';

/**
 * Service for cms_gallery_items (orderable list with category filter).
 */
class CmsGalleryItemsService {
    async getAll(query = {}) {
        const { page = 1, per_page = 20, search, status, from_date, to_date, category } = query;
        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        let q = supabase
            .from('cms_gallery_items')
            .select(SELECT_FIELDS, { count: 'exact' })
            .is('deleted_at', null);

        if (search)            q = q.ilike('caption', `%${search}%`);
        if (category)          q = q.eq('category', category);
        if (status === 'active')   q = q.eq('is_active', true);
        if (status === 'inactive') q = q.eq('is_active', false);
        if (from_date && to_date)  q = q.gte('created_at', from_date).lte('created_at', `${to_date}T23:59:59Z`);

        q = q.range(offset, offset + limit - 1).order('sort_order', { ascending: true });

        const { data, error, count } = await q;
        if (error) throw new Error(`Failed to list gallery items: ${error.message}`);
        return { items: data, total: count, page: parseInt(page), per_page: limit, total_pages: Math.ceil(count / limit) };
    }

    async getById(id) {
        const { data, error } = await supabase
            .from('cms_gallery_items')
            .select(SELECT_FIELDS)
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        if (error) throw new Error(`Gallery item not found: ${error.message}`);
        return data;
    }

    async create(payload, imageBuffer, imageName) {
        if (!imageBuffer) throw new Error('Image is required for gallery items');
        const { imageUrl, imageKey } = await uploadImage(imageBuffer, imageName, 'image/webp');
        const { data, error } = await supabase
            .from('cms_gallery_items')
            .insert([{ ...payload, image_url: imageUrl, image_key: imageKey, filename_label: payload.filename_label || imageName }])
            .select(SELECT_FIELDS)
            .single();
        if (error) {
            await deleteImage(imageKey);
            throw new Error(`Failed to create gallery item: ${error.message}`);
        }
        return data;
    }

    async update(id, payload, imageBuffer, imageName) {
        const updates = { ...payload };
        if (imageBuffer) {
            const existing = await this.getById(id);
            if (existing.image_key) await deleteImage(existing.image_key);
            const { imageUrl, imageKey } = await uploadImage(imageBuffer, imageName, 'image/webp');
            updates.image_url = imageUrl;
            updates.image_key = imageKey;
            if (!updates.filename_label) updates.filename_label = imageName;
        }
        const { data, error } = await supabase
            .from('cms_gallery_items')
            .update(updates)
            .eq('id', id)
            .is('deleted_at', null)
            .select(SELECT_FIELDS)
            .single();
        if (error) throw new Error(`Failed to update gallery item: ${error.message}`);
        return data;
    }

    async delete(id) {
        const existing = await this.getById(id);
        if (existing?.image_key) await deleteImage(existing.image_key);
        const { error } = await supabase
            .from('cms_gallery_items')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw new Error(`Failed to delete gallery item: ${error.message}`);
    }

    async reorder(ids) {
        await Promise.all(ids.map((id, index) =>
            supabase.from('cms_gallery_items').update({ sort_order: index }).eq('id', id)
        ));
    }
}

module.exports = new CmsGalleryItemsService();
