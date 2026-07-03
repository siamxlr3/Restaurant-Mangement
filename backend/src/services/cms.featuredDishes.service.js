const { supabase } = require('../config/supabase');
const { uploadImage, deleteImage } = require('../utils/storage');

const SELECT_FIELDS =
    'id, menu_item_id, name, image_url, price, rating, description, badge, sort_order, is_active, created_at, updated_at';

/**
 * Service for cms_featured_dishes (orderable list, optional FK to menu_item).
 */
class CmsFeaturedDishesService {
    async getAll(query = {}) {
        const { page = 1, per_page = 20, search, status, from_date, to_date } = query;
        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        // Use embedded select to JOIN menu_item
        let q = supabase
            .from('cms_featured_dishes')
            .select(`${SELECT_FIELDS}, menu_item:menu_item_id ( id, name, price:base_price, image_url )`, { count: 'exact' })
            .is('deleted_at', null);

        if (search)            q = q.ilike('name', `%${search}%`);
        if (status === 'active')   q = q.eq('is_active', true);
        if (status === 'inactive') q = q.eq('is_active', false);
        if (from_date && to_date)  q = q.gte('created_at', from_date).lte('created_at', `${to_date}T23:59:59Z`);

        q = q.range(offset, offset + limit - 1).order('sort_order', { ascending: true });

        const { data, error, count } = await q;
        if (error) throw new Error(`Failed to list featured dishes: ${error.message}`);
        return { items: data, total: count, page: parseInt(page), per_page: limit, total_pages: Math.ceil(count / limit) };
    }

    async getById(id) {
        const { data, error } = await supabase
            .from('cms_featured_dishes')
            .select(`${SELECT_FIELDS}, menu_item:menu_item_id ( id, name, price:base_price, image_url )`)
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        if (error) throw new Error(`Featured dish not found: ${error.message}`);
        return data;
    }

    async create(payload, imageBuffer, imageName) {
        const insert = { ...payload };
        if (imageBuffer) {
            const { imageUrl, imageKey } = await uploadImage(imageBuffer, imageName, 'image/webp');
            insert.image_url = imageUrl;
            insert.image_key = imageKey;
        }
        const { data, error } = await supabase
            .from('cms_featured_dishes')
            .insert([insert])
            .select(`${SELECT_FIELDS}, menu_item:menu_item_id ( id, name, price:base_price, image_url )`)
            .single();
        if (error) throw new Error(`Failed to create featured dish: ${error.message}`);
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
        }
        const { data, error } = await supabase
            .from('cms_featured_dishes')
            .update(updates)
            .eq('id', id)
            .is('deleted_at', null)
            .select(`${SELECT_FIELDS}, menu_item:menu_item_id ( id, name, price:base_price, image_url )`)
            .single();
        if (error) throw new Error(`Failed to update featured dish: ${error.message}`);
        return data;
    }

    async delete(id) {
        const { error } = await supabase
            .from('cms_featured_dishes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw new Error(`Failed to delete featured dish: ${error.message}`);
    }

    async reorder(ids) {
        await Promise.all(ids.map((id, index) =>
            supabase.from('cms_featured_dishes').update({ sort_order: index }).eq('id', id)
        ));
    }
}

module.exports = new CmsFeaturedDishesService();
