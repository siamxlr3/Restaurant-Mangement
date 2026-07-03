class CmsReservationConfigSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:                     row.id,
            time_slots:             row.time_slots,
            hold_duration_minutes:  row.hold_duration_minutes,
            max_party_size:         row.max_party_size,
            tables_available_count: row.tables_available_count,
            created_at:             row.created_at,
            updated_at:             row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsReservationConfigSerializer;
