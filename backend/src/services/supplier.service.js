const { supabase } = require('../config/supabase');

const SUPPLIER_FIELDS = 'id, name, contact, lead_time_days, is_active, created_at, updated_at';

class SupplierService {
    async getAllSuppliers({
        page = 1,
        per_page = 20,
        search = '',
        status = 'all',
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('supplier')
            .select(SUPPLIER_FIELDS, { count: 'exact' })
            .is('deleted_at', null);

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (status === 'active') {
            query = query.eq('is_active', true);
        } else if (status === 'inactive') {
            query = query.eq('is_active', false);
        }

        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        } else if (from_date) {
            query = query.gte('created_at', from_date);
        } else if (to_date) {
            query = query.lte('created_at', to_date);
        }

        const limit = Math.min(parseInt(per_page) || 20, 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

        query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data || [],
            meta: {
                page: parseInt(page) || 1,
                per_page: limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        };
    }

    async getSupplierById(id) {
        const { data, error } = await supabase
            .from('supplier')
            .select(SUPPLIER_FIELDS)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) return null;
        return data;
    }

    async createSupplier(payload) {
        const { data, error } = await supabase
            .from('supplier')
            .insert([payload])
            .select(SUPPLIER_FIELDS)
            .single();

        if (error) {
            if (error.code === '23505') {
                const err = new Error('A supplier with this name already exists');
                err.statusCode = 409;
                throw err;
            }
            throw error;
        }
        return data;
    }

    async updateSupplier(id, payload) {
        const { data, error } = await supabase
            .from('supplier')
            .update(payload)
            .eq('id', id)
            .is('deleted_at', null)
            .select(SUPPLIER_FIELDS)
            .single();

        if (error) {
            if (error.code === '23505') {
                const err = new Error('A supplier with this name already exists');
                err.statusCode = 409;
                throw err;
            }
            throw error;
        }
        return data;
    }

    async softDeleteSupplier(id) {
        const { error } = await supabase
            .from('supplier')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null);

        if (error) throw error;
        return true;
    }
}

module.exports = new SupplierService();
