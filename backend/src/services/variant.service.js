const { supabase } = require('../config/supabase');

class VariantService {
    /**
     * Get all variants with pagination and filters
     */
    async getAll({ 
        page = 1, 
        per_page = 20, 
        search = '', 
        from_date = null,
        to_date = null
    }) {
        let query = supabase
            .from('menu_variant')
            .select('*, menu_item(name)', { count: 'exact' })
            .is('deleted_at', null);

        if (search) {
            query = query.or(`label.ilike.%${search}%,menu_item.name.ilike.%${search}%`);
        }

        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        }

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
     * Get all variants for an item
     */
    async getByItemId(itemId) {
        const { data, error } = await supabase
            .from('menu_variant')
            .select('*')
            .eq('item_id', itemId)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Create variant
     */
    async create(variantData) {
        const { data, error } = await supabase
            .from('menu_variant')
            .insert([variantData])
            .select('*')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update variant
     */
    async update(id, updateData) {
        const { data, error } = await supabase
            .from('menu_variant')
            .update(updateData)
            .eq('id', id)
            .is('deleted_at', null)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Soft delete variant
     */
    async delete(id) {
        const { error } = await supabase
            .from('menu_variant')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null);

        if (error) throw error;
        return true;
    }
}

module.exports = new VariantService();
