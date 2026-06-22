const { supabase } = require('../config/supabase');

class CategoryService {
    /**
     * Get all categories with pagination and search
     */
    async getAllCategories({ page = 1, per_page = 20, search = '', status = 'all' }) {
        let query = supabase
            .from('menu_category')
            .select('id, name, sort_order, is_active, created_at, updated_at', { count: 'exact' })
            .is('deleted_at', null);

        // Apply filters
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (status === 'active') {
            query = query.eq('is_active', true);
        } else if (status === 'inactive') {
            query = query.eq('is_active', false);
        }

        // Apply pagination
        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        query = query
            .range(offset, offset + limit - 1)
            .order('sort_order', { ascending: true })
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
     * Get category by ID
     */
    async getCategoryById(id) {
        const { data, error } = await supabase
            .from('menu_category')
            .select('id, name, sort_order, is_active, created_at, updated_at')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create category
     */
    async createCategory(categoryData) {
        const { data, error } = await supabase
            .from('menu_category')
            .insert([categoryData])
            .select('id, name, sort_order, is_active, created_at, updated_at')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Category name already exists');
            }
            throw error;
        }

        return data;
    }

    /**
     * Update category
     */
    async updateCategory(id, updateData) {
        const { data, error } = await supabase
            .from('menu_category')
            .update(updateData)
            .eq('id', id)
            .is('deleted_at', null)
            .select('id, name, sort_order, is_active, created_at, updated_at')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Soft delete category
     */
    async deleteCategory(id) {
        const { error } = await supabase
            .from('menu_category')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null);

        if (error) throw error;
        return true;
    }

    /**
     * Bulk update sort order
     */
    async updateSortOrder(items) {
        // items is array of { id, sort_order }
        const promises = items.map(item => 
            supabase
                .from('menu_category')
                .update({ sort_order: item.sort_order })
                .eq('id', item.id)
        );

        const results = await Promise.all(promises);
        const error = results.find(r => r.error);
        if (error) throw error.error;

        return true;
    }
}

module.exports = new CategoryService();
