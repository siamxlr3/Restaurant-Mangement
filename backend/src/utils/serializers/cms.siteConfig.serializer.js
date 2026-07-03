class CmsSiteConfigSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id: row.id,
            brand_name:   row.brand_name,
            tagline:      row.tagline,
            logo_url:     row.logo_url,
            favicon_url:  row.favicon_url,
            primary_color: row.primary_color,
            timezone:     row.timezone,
            created_at:   row.created_at,
            updated_at:   row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsSiteConfigSerializer;
