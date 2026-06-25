/**
 * Kitchen Ticket Serializer (DTO)
 */
const serializeTicket = (ticket) => {
    if (!ticket) return null;

    return {
        id: ticket.id,
        order_id: ticket.order_id,
        station: ticket.station,
        status: ticket.status,
        sent_at: ticket.sent_at,
        bumped_at: ticket.bumped_at,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        // Include order details if joined
        order: ticket.orders ? {
            id: ticket.orders.id,
            type: ticket.orders.type,
            status: ticket.orders.status,
            table: ticket.orders.restaurant_table ? {
                id: ticket.orders.restaurant_table.id,
                name: ticket.orders.restaurant_table.name
            } : null,
            items: ticket.orders.order_items ? ticket.orders.order_items.map(item => ({
                id: item.id,
                name: item.menu_item ? item.menu_item.name : 'Unknown Item',
                quantity: item.quantity,
                notes: item.notes,
                variant: item.menu_variant ? item.menu_variant.label : null,
                modifiers: item.order_item_modifiers ? item.order_item_modifiers.map(mod => ({
                    name: mod.menu_modifier ? mod.menu_modifier.name : 'Unknown Modifier'
                })) : []
            })) : []
        } : null
    };
};

const serializeTickets = (tickets) => {
    if (!tickets || !Array.isArray(tickets)) return [];
    return tickets.map(serializeTicket);
};

module.exports = {
    serializeTicket,
    serializeTickets,
};
