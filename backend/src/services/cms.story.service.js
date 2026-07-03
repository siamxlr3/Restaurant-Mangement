const { supabase } = require('../config/supabase');

const SELECT_FIELDS =
    'id, heading, body_paragraphs, read_more_url, stat_est_year, stat_covers_night, stat_return_guests_pct, stat_ranking, created_at, updated_at';

/**
 * Service for cms_story (singleton).
 */
class CmsStoryService {
    async getStory() {
        const { data, error } = await supabase
            .from('cms_story')
            .select(SELECT_FIELDS)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(`Failed to get story: ${error.message}`);
        return data;
    }

    async upsertStory(payload) {
        const existing = await this.getStory();
        if (existing) {
            const { data, error } = await supabase
                .from('cms_story')
                .update(payload)
                .eq('id', existing.id)
                .select(SELECT_FIELDS)
                .single();
            if (error) throw new Error(`Failed to update story: ${error.message}`);
            return data;
        } else {
            const { data, error } = await supabase
                .from('cms_story')
                .insert([payload])
                .select(SELECT_FIELDS)
                .single();
            if (error) throw new Error(`Failed to create story: ${error.message}`);
            return data;
        }
    }
}

module.exports = new CmsStoryService();
