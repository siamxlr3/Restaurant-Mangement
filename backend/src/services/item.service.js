const { supabase, supabaseAdmin } = require('../config/supabase');

class ItemService {
    /**
     * Get all items with pagination, search, and filters
     */
    async getAllItems({ 
        page = 1, 
        per_page = 20, 
        search = '', 
        status = 'all', 
        category_id = null,
        from_date = null,
        to_date = null
    }) {
        let query = supabase
            .from('menu_item')
            .select('*, menu_category(name), menu_variant(*), menu_modifier(*)', { count: 'exact' })
            .is('deleted_at', null)
            .is('menu_variant.deleted_at', null)
            .is('menu_modifier.deleted_at', null);

        // Apply filters
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (status === 'active') {
            query = query.eq('is_available', true);
        } else if (status === 'inactive') {
            query = query.eq('is_available', false);
        }

        if (category_id) {
            query = query.eq('category_id', category_id);
        }

        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        }

        // Apply pagination
        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        query = query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        return {
            data,
            meta: {
                page: parseInt(page),
                per_page: limit,
                total: count,
                total_pages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * Get item by ID
     */
    async getItemById(id) {
        const { data, error } = await supabase
            .from('menu_item')
            .select('*, menu_category(name), menu_variant(*), menu_modifier(*)')
            .eq('id', id)
            .is('deleted_at', null)
            .is('menu_variant.deleted_at', null)
            .is('menu_modifier.deleted_at', null)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create item
     */
    async createItem(itemData) {
        const { data, error } = await supabase
            .from('menu_item')
            .insert([itemData])
            .select('*, menu_category(name)')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update item
     */
    async updateItem(id, updateData) {
        const { data, error } = await supabase
            .from('menu_item')
            .update(updateData)
            .eq('id', id)
            .is('deleted_at', null)
            .select('*, menu_category(name)')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update availability (86 Feature)
     */
    async updateAvailability(id, is_available) {
        const { data, error } = await supabase
            .from('menu_item')
            .update({ is_available })
            .eq('id', id)
            .is('deleted_at', null)
            .select('id, name, is_available')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Soft delete item
     */
    async deleteItem(id) {
        const { error } = await supabase
            .from('menu_item')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null);

        if (error) throw error;
        return true;
    }

    /**
     * Upload image to Supabase Storage
     */
    async uploadImage(file) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('menu-items')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('menu-items')
            .getPublicUrl(filePath);

        return publicUrl;
    }
}

module.exports = new ItemService();
