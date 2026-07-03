class CmsLocationSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:             row.id,
            address:        row.address,
            parking_info:   row.parking_info,
            phone:          row.phone,
            lat:            row.lat,
            lng:            row.lng,
            directions_url: row.directions_url,
            call_cta:       row.call_cta,
            created_at:     row.created_at,
            updated_at:     row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsLocationSerializer;
