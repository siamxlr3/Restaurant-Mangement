const { supabase } = require('../config/supabase');

const SELECT_FIELDS = 'id, day_label, open_time, close_time, is_today, is_closed, sort_order, created_at, updated_at';

/**
 * Service for cms_opening_hours (per-day schedule).
 */
class CmsOpeningHoursService {
    async getAll(query = {}) {
        const { page = 1, per_page = 100 } = query;
        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        const { data, error, count } = await supabase
            .from('cms_opening_hours')
            .select(SELECT_FIELDS, { count: 'exact' })
            .is('deleted_at', null)
            .range(offset, offset + limit - 1)
            .order('sort_order', { ascending: true });

        if (error) throw new Error(`Failed to list opening hours: ${error.message}`);
        return { items: data, total: count, page: parseInt(page), per_page: limit, total_pages: Math.ceil(count / limit) };
    }

    async getById(id) {
        const { data, error } = await supabase
            .from('cms_opening_hours')
            .select(SELECT_FIELDS)
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        if (error) throw new Error(`Opening hours entry not found: ${error.message}`);
        return data;
    }

    async create(payload) {
        const { data, error } = await supabase
            .from('cms_opening_hours')
            .insert([payload])
            .select(SELECT_FIELDS)
            .single();
        if (error) throw new Error(`Failed to create opening hour: ${error.message}`);
        return data;
    }

    async update(id, payload) {
        const { data, error } = await supabase
            .from('cms_opening_hours')
            .update(payload)
            .eq('id', id)
            .is('deleted_at', null)
            .select(SELECT_FIELDS)
            .single();
        if (error) throw new Error(`Failed to update opening hour: ${error.message}`);
        return data;
    }

    async delete(id) {
        const { error } = await supabase
            .from('cms_opening_hours')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw new Error(`Failed to delete opening hour: ${error.message}`);
    }
}

module.exports = new CmsOpeningHoursService();
