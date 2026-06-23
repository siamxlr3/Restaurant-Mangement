/**
 * Serializer for restaurant_table objects.
 */
class TableSerializer {
    /**
     * Map a single table record.
     */
    static map(table) {
        if (!table) return null;
        return {
            id: table.id,
            name: table.name,
            capacity: table.capacity,
            status: table.status,
            section: table.section,
            waiter_id: table.waiter_id || null,
            waiter: table.staff
                ? {
                      id: table.staff.id,
                      name: table.staff.name,
                      role: table.staff.role,
                  }
                : null,
            created_at: table.created_at,
            updated_at: table.updated_at,
        };
    }

    /**
     * Map an array of table records.
     */
    static mapMany(tables) {
        if (!tables || !Array.isArray(tables)) return [];
        return tables.map(TableSerializer.map);
    }
}

module.exports = TableSerializer;
