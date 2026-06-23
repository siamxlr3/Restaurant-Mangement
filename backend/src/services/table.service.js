const { supabase } = require('../config/supabase');

// Allowed status transitions
const STATUS_TRANSITIONS = {
    open: 'occupied',
    occupied: 'cleaning',
    cleaning: 'open',
};

class TableService {
    /**
     * Get all tables with pagination, search, and filters.
     */
    async getAllTables({
        page = 1,
        per_page = 20,
        search = '',
        status = 'all',
        section = null,
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('restaurant_table')
            .select(
                'id, name, capacity, status, section, waiter_id, created_at, updated_at, staff:waiter_id(id, name, role)',
                { count: 'exact' }
            )
            .is('deleted_at', null);

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (section) {
            query = query.eq('section', section);
        }

        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        }

        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        query = query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: true });

        const { data, error, count } = await query;
        if (error) throw new Error(error.message);

        return {
            items: data,
            total: count,
            page: parseInt(page),
            per_page: limit,
            total_pages: Math.ceil(count / limit),
        };
    }

    /**
     * Get a table by ID.
     */
    async getTableById(id) {
        const { data, error } = await supabase
            .from('restaurant_table')
            .select('id, name, capacity, status, section, waiter_id, created_at, updated_at, staff:waiter_id(id, name, role)')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw new Error('Table not found');
        return data;
    }

    /**
     * Create a new table.
     */
    async createTable({ name, capacity, section, waiter_id }) {
        // Check for duplicate name
        const { data: existing } = await supabase
            .from('restaurant_table')
            .select('id')
            .eq('name', name)
            .is('deleted_at', null)
            .maybeSingle();

        if (existing) throw new Error(`Table with name "${name}" already exists`);

        const payload = {
            name: name.trim(),
            capacity: parseInt(capacity),
            section: section ? section.trim() : 'Main Hall',
            ...(waiter_id ? { waiter_id } : {}),
        };

        const { data, error } = await supabase
            .from('restaurant_table')
            .insert([payload])
            .select('id, name, capacity, status, section, waiter_id, created_at, updated_at, staff:waiter_id(id, name, role)')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Update table details (name, capacity, section).
     */
    async updateTable(id, { name, capacity, section, waiter_id }) {
        // Check for duplicate name (exclude self)
        if (name) {
            const { data: existing } = await supabase
                .from('restaurant_table')
                .select('id')
                .eq('name', name)
                .neq('id', id)
                .is('deleted_at', null)
                .maybeSingle();

            if (existing) throw new Error(`Table with name "${name}" already exists`);
        }

        const updatePayload = {};
        if (name !== undefined) updatePayload.name = name.trim();
        if (capacity !== undefined) updatePayload.capacity = parseInt(capacity);
        if (section !== undefined) updatePayload.section = section.trim();
        if (waiter_id !== undefined) updatePayload.waiter_id = waiter_id || null;

        const { data, error } = await supabase
            .from('restaurant_table')
            .update(updatePayload)
            .eq('id', id)
            .is('deleted_at', null)
            .select('id, name, capacity, status, section, waiter_id, created_at, updated_at, staff:waiter_id(id, name, role)')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Transition table status: open → occupied → cleaning → open
     */
    async transitionStatus(id, newStatus) {
        // Fetch current status
        const { data: current, error: fetchError } = await supabase
            .from('restaurant_table')
            .select('id, status')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError) throw new Error('Table not found');

        const allowedNext = STATUS_TRANSITIONS[current.status];
        if (newStatus !== allowedNext) {
            throw new Error(
                `Invalid status transition. "${current.status}" can only transition to "${allowedNext}", not "${newStatus}"`
            );
        }

        const { data, error } = await supabase
            .from('restaurant_table')
            .update({ status: newStatus })
            .eq('id', id)
            .is('deleted_at', null)
            .select('id, name, status')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Assign or unassign a waiter to a table.
     */
    async assignWaiter(id, waiter_id) {
        // Validate waiter exists if provided
        if (waiter_id) {
            const { data: waiter } = await supabase
                .from('staff')
                .select('id')
                .eq('id', waiter_id)
                .is('deleted_at', null)
                .maybeSingle();

            if (!waiter) throw new Error('Waiter not found');
        }

        const { data, error } = await supabase
            .from('restaurant_table')
            .update({ waiter_id: waiter_id || null })
            .eq('id', id)
            .is('deleted_at', null)
            .select('id, name, waiter_id, staff:waiter_id(id, name, role)')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Soft delete a table.
     */
    async deleteTable(id) {
        const { error } = await supabase
            .from('restaurant_table')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null);

        if (error) throw new Error(error.message);
        return true;
    }

    /**
     * Get all unique sections for the tab filter.
     */
    async getSections() {
        const { data, error } = await supabase
            .from('restaurant_table')
            .select('section')
            .is('deleted_at', null)
            .order('section', { ascending: true });

        if (error) throw new Error(error.message);

        const sections = [...new Set(data.map((r) => r.section))];
        return sections;
    }
}

module.exports = new TableService();
