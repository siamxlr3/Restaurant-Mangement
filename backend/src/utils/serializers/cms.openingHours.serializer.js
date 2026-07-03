class CmsOpeningHourSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:         row.id,
            day_label:  row.day_label,
            open_time:  row.open_time,
            close_time: row.close_time,
            is_today:   row.is_today,
            is_closed:  row.is_closed,
            sort_order: row.sort_order,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsOpeningHourSerializer;
