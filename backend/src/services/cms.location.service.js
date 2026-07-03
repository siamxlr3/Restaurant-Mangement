const { supabase } = require('../config/supabase');

const SELECT_FIELDS = 'id, address, parking_info, phone, lat, lng, directions_url, call_cta, created_at, updated_at';

/**
 * Service for cms_location (singleton).
 */
class CmsLocationService {
    async getLocation() {
        const { data, error } = await supabase
            .from('cms_location')
            .select(SELECT_FIELDS)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(`Failed to get location: ${error.message}`);
        return data;
    }

    async upsertLocation(payload) {
        const existing = await this.getLocation();
        if (existing) {
            const { data, error } = await supabase
                .from('cms_location')
                .update(payload)
                .eq('id', existing.id)
                .select(SELECT_FIELDS)
                .single();
            if (error) throw new Error(`Failed to update location: ${error.message}`);
            return data;
        } else {
            const { data, error } = await supabase
                .from('cms_location')
                .insert([payload])
                .select(SELECT_FIELDS)
                .single();
            if (error) throw new Error(`Failed to create location: ${error.message}`);
            return data;
        }
    }
}

module.exports = new CmsLocationService();
