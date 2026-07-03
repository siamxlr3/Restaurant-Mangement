const { supabase } = require('../config/supabase');

const SELECT_FIELDS =
    'id, headline_part1, headline_part2, subheadline, cta_primary_text, cta_primary_url, cta_secondary_text, cta_secondary_url, stat_rating, stat_reviews, stat_years, created_at, updated_at';

/**
 * Service for cms_hero (singleton).
 */
class CmsHeroService {
    async getHero() {
        const { data, error } = await supabase
            .from('cms_hero')
            .select(SELECT_FIELDS)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(`Failed to get hero: ${error.message}`);
        return data;
    }

    async upsertHero(payload) {
        const existing = await this.getHero();
        if (existing) {
            const { data, error } = await supabase
                .from('cms_hero')
                .update(payload)
                .eq('id', existing.id)
                .select(SELECT_FIELDS)
                .single();
            if (error) throw new Error(`Failed to update hero: ${error.message}`);
            return data;
        } else {
            const { data, error } = await supabase
                .from('cms_hero')
                .insert([payload])
                .select(SELECT_FIELDS)
                .single();
            if (error) throw new Error(`Failed to create hero: ${error.message}`);
            return data;
        }
    }
}

module.exports = new CmsHeroService();
