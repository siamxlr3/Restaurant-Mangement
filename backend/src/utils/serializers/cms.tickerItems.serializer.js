class CmsTickerItemSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:         row.id,
            text:       row.text,
            dot_color:  row.dot_color,
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
module.exports = CmsTickerItemSerializer;
