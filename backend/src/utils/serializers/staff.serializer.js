/**
 * Serializer for staff objects.
 */
class StaffSerializer {
    /**
     * Map a single staff object.
     */
    static map(staff) {
        if (!staff) return null;
        return {
            id: staff.id,
            name: staff.name,
            phone: staff.phone,
            role: staff.role,
            is_active: staff.is_active,
            image_url: staff.image_url,
            created_at: staff.created_at,
            updated_at: staff.updated_at,
        };
    }

    /**
     * Map an array of staff objects.
     */
    static mapMany(staffList) {
        if (!staffList || !Array.isArray(staffList)) return [];
        return staffList.map(this.map);
    }
}

module.exports = StaffSerializer;
