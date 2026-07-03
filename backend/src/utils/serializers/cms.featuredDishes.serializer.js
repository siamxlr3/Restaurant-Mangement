class CmsFeaturedDishSerializer {
    static map(row) {
        if (!row) return null;
        return {
            id:           row.id,
            menu_item_id: row.menu_item_id,
            name:         row.name,
            image_url:    row.image_url,
            price:        row.price,
            rating:       row.rating,
            description:  row.description,
            badge:        row.badge,
            sort_order:   row.sort_order,
            is_active:    row.is_active,
            // Live data from joined menu_item (if linked)
            menu_item:    row.menu_item ? {
                id:        row.menu_item.id,
                name:      row.menu_item.name,
                price:     row.menu_item.price,
                image_url: row.menu_item.image_url,
            } : null,
            created_at:   row.created_at,
            updated_at:   row.updated_at,
        };
    }
    static mapMany(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(this.map);
    }
}
module.exports = CmsFeaturedDishSerializer;
