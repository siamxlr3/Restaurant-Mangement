/**
 * Reservation Serializer (DTO)
 */
const serializeReservation = (res) => {
    if (!res) return null;

    return {
        id: res.id,
        table_id: res.table_id,
        customer_id: res.customer_id,
        reserved_at: res.reserved_at,
        party_size: res.party_size,
        status: res.status,
        notes: res.notes,
        created_at: res.created_at,
        updated_at: res.updated_at,
        // Include joined data if available
        table: res.restaurant_table ? {
            id: res.restaurant_table.id,
            name: res.restaurant_table.name,
            capacity: res.restaurant_table.capacity,
            section: res.restaurant_table.section
        } : null,
        customer: res.customers ? {
            id: res.customers.id,
            name: res.customers.name,
            phone: res.customers.phone,
            email: res.customers.email
        } : null
    };
};

const serializeReservations = (reservations) => {
    if (!reservations || !Array.isArray(reservations)) return [];
    return reservations.map(serializeReservation);
};

module.exports = {
    serializeReservation,
    serializeReservations,
};
