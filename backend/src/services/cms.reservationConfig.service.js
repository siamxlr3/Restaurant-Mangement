const { supabase } = require('../config/supabase');

const SELECT_FIELDS = 'id, time_slots, hold_duration_minutes, max_party_size, tables_available_count, created_at, updated_at';

/**
 * Service for cms_reservation_config (singleton).
 */
class CmsReservationConfigService {
    async getConfig() {
        const { data, error } = await supabase
            .from('cms_reservation_config')
            .select(SELECT_FIELDS)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(`Failed to get reservation config: ${error.message}`);
        return data;
    }

    async upsertConfig(payload) {
        const existing = await this.getConfig();
        if (existing) {
            const { data, error } = await supabase
                .from('cms_reservation_config')
                .update(payload)
                .eq('id', existing.id)
                .select(SELECT_FIELDS)
                .single();
            if (error) throw new Error(`Failed to update reservation config: ${error.message}`);
            return data;
        } else {
            const { data, error } = await supabase
                .from('cms_reservation_config')
                .insert([payload])
                .select(SELECT_FIELDS)
                .single();
            if (error) throw new Error(`Failed to create reservation config: ${error.message}`);
            return data;
        }
    }
}

module.exports = new CmsReservationConfigService();
