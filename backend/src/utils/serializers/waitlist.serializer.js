/**
 * Waitlist Serializer (DTO)
 */
const serializeWaitlist = (item) => {
    if (!item) return null;

    return {
        id: item.id,
        customer_id: item.customer_id,
        party_size: item.party_size,
        joined_at: item.joined_at,
        est_wait_mins: item.est_wait_mins,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        customer: item.customers ? {
            id: item.customers.id,
            name: item.customers.name,
            phone: item.customers.phone,
            email: item.customers.email
        } : null,
        notifications: item.waitlist_notifications ? item.waitlist_notifications.map(n => ({
            id: n.id,
            channel: n.channel,
            recipient: n.recipient,
            message: n.message,
            type: n.type,
            status: n.status,
            retry_count: n.retry_count,
            created_at: n.created_at
        })) : []
    };
};

const serializeWaitlists = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(serializeWaitlist);
};

module.exports = {
    serializeWaitlist,
    serializeWaitlists,
};
