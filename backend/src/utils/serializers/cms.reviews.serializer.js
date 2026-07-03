class CmsReviewSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:            row.id,
            quote:         row.quote,
            author_name:   row.author_name,
            author_handle: row.author_handle,
            visit_count:   row.visit_count,
            rating:        row.rating,
            sort_order:    row.sort_order,
            is_active:     row.is_active,
            created_at:    row.created_at,
            updated_at:    row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsReviewSerializer;
