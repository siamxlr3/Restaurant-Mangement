class CmsFaqItemSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:         row.id,
            question:   row.question,
            answer:     row.answer,
            sort_order: row.sort_order,
            is_active:  row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsFaqItemSerializer;
