class CmsStorySerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:                     row.id,
            heading:                row.heading,
            body_paragraphs:        row.body_paragraphs,
            read_more_url:          row.read_more_url,
            stat_est_year:          row.stat_est_year,
            stat_covers_night:      row.stat_covers_night,
            stat_return_guests_pct: row.stat_return_guests_pct,
            stat_ranking:           row.stat_ranking,
            created_at:             row.created_at,
            updated_at:             row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsStorySerializer;
