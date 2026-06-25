const { supabase } = require('../config/supabase');

class KitchenService {
    /**
     * SELECT fields for tickets with related order data
     */
    get TICKET_SELECT() {
        return `
            *,
            orders:order_id (
                id, type, status,
                restaurant_table (id, name),
                order_items (
                    id, quantity, notes,
                    menu_item (id, name),
                    menu_variant (id, label),
                    order_item_modifiers (
                        extra_price,
                        menu_modifier (id, name)
                    )
                )
            )
        `;
    }

    /**
     * GET /kitchen/tickets
     * Paginated list with filtering by station, status, and date range.
     */
    async getAllTickets({
        page = 1,
        per_page = 20,
        station = null,
        status = 'all',
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('kitchen_ticket')
            .select(this.TICKET_SELECT, { count: 'exact' })
            .is('deleted_at', null);

        if (station) {
            query = query.eq('station', station);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        } else {
            // By default, don't show bumped tickets unless requested
            query = query.neq('status', 'bumped');
        }

        if (from_date && to_date) {
            query = query.gte('created_at', from_date).lte('created_at', to_date);
        }

        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        query = query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: true });

        const { data, error, count } = await query;

        if (error) throw new Error(error.message);

        return {
            items: data || [],
            total: count,
            page: parseInt(page),
            per_page: limit,
            total_pages: Math.ceil(count / limit),
        };
    }

    /**
     * POST /kitchen/tickets
     * Manually create a kitchen ticket
     */
    async createTicket(payload) {
        const { data, error } = await supabase
            .from('kitchen_ticket')
            .insert([payload])
            .select(this.TICKET_SELECT)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * PATCH /kitchen/tickets/:id/status
     * Update ticket status (e.g., bump it)
     */
    async updateTicketStatus(id, status) {
        const updateData = { status };
        
        if (status === 'bumped') {
            updateData.bumped_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('kitchen_ticket')
            .update(updateData)
            .eq('id', id)
            .select(this.TICKET_SELECT)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Realtime Helper: Broadcast to KDS
     */
    async broadcastToKDS(event, payload) {
        // Using Supabase Realtime channel
        return supabase.channel('kitchen').send({
            type: 'broadcast',
            event,
            payload
        });
    }
}

module.exports = new KitchenService();
