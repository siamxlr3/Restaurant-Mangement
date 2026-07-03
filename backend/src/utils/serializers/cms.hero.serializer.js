class CmsHeroSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:                  row.id,
            headline_part1:      row.headline_part1,
            headline_part2:      row.headline_part2,
            subheadline:         row.subheadline,
            cta_primary_text:    row.cta_primary_text,
            cta_primary_url:     row.cta_primary_url,
            cta_secondary_text:  row.cta_secondary_text,
            cta_secondary_url:   row.cta_secondary_url,
            stat_rating:         row.stat_rating,
            stat_reviews:        row.stat_reviews,
            stat_years:          row.stat_years,
            created_at:          row.created_at,
            updated_at:          row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsHeroSerializer;
