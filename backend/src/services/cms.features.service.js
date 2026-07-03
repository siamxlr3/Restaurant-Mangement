const { supabase } = require('../config/supabase');

const SELECT_FIELDS = 'id, icon, title, description, sort_order, is_active, created_at, updated_at';

/**
 * Service for cms_features (orderable list).
 */
class CmsFeaturesService {
    async getAll(query = {}) {
        const { page = 1, per_page = 20, search, status, from_date, to_date } = query;
        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        let q = supabase
            .from('cms_features')
            .select(SELECT_FIELDS, { count: 'exact' })
            .is('deleted_at', null);

        if (search)            q = q.ilike('title', `%${search}%`);
        if (status === 'active')   q = q.eq('is_active', true);
        if (status === 'inactive') q = q.eq('is_active', false);
        if (from_date && to_date)  q = q.gte('created_at', from_date).lte('created_at', `${to_date}T23:59:59Z`);

        q = q.range(offset, offset + limit - 1).order('sort_order', { ascending: true });

        const { data, error, count } = await q;
        if (error) throw new Error(`Failed to list features: ${error.message}`);
        return { items: data, total: count, page: parseInt(page), per_page: limit, total_pages: Math.ceil(count / limit) };
    }

    async getById(id) {
        const { data, error } = await supabase
            .from('cms_features')
            .select(SELECT_FIELDS)
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        if (error) throw new Error(`Feature not found: ${error.message}`);
        return data;
    }

    async create(payload) {
        const { data, error } = await supabase
            .from('cms_features')
            .insert([payload])
            .select(SELECT_FIELDS)
            .single();
        if (error) throw new Error(`Failed to create feature: ${error.message}`);
        return data;
    }

    async update(id, payload) {
        const { data, error } = await supabase
            .from('cms_features')
            .update(payload)
            .eq('id', id)
            .is('deleted_at', null)
            .select(SELECT_FIELDS)
            .single();
        if (error) throw new Error(`Failed to update feature: ${error.message}`);
        return data;
    }

    async delete(id) {
        const { error } = await supabase
            .from('cms_features')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw new Error(`Failed to delete feature: ${error.message}`);
    }

    async reorder(ids) {
        await Promise.all(ids.map((id, index) =>
            supabase.from('cms_features').update({ sort_order: index }).eq('id', id)
        ));
    }
}

module.exports = new CmsFeaturesService();
