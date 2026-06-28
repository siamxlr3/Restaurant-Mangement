const { supabase } = require('../config/supabase');
const customerService = require('./customer.service');

// -- Reservation SELECT fields (joined) -------------------------
const RESERVATION_SELECT = `
    id, table_id, customer_id, reserved_at, party_size, status, notes, created_at, updated_at,
    restaurant_table(id, name, capacity, section),
    customers(id, name, phone, email)
`;

class ReservationService {
    /**
     * GET /reservations
     * Paginated list with filters.
     */
    async getAllReservations({
        page = 1,
        per_page = 20,
        search = '',
        status = 'all',
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('reservations')
            .select(RESERVATION_SELECT, { count: 'exact' })
            .is('deleted_at', null);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (from_date && to_date) {
            query = query.gte('reserved_at', from_date).lte('reserved_at', to_date);
        }

        // Search in customer name or phone if provided
        if (search) {
            // Note: complex cross-table ILIKE search in Supabase might need raw SQL or multiple steps if not careful
            // For now, we'll search on customer.name via inner join hint or just use a specific filter
            // Supabase allows searching joined tables like this:
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'customers' });
        }

        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        query = query.range(offset, offset + limit - 1).order('reserved_at', { ascending: true });

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
     * GET /reservations/:id
     */
    async getReservationById(id) {
        const { data, error } = await supabase
            .from('reservations')
            .select(RESERVATION_SELECT)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw new Error('Reservation not found');
        return data;
    }

    /**
     * POST /reservations
     */
    async createReservation({ customer_name, customer_phone, customer_email, table_id, reserved_at, party_size, notes }) {
        // 1. Identify/Create Customer
        const customer = await customerService.findOrCreateCustomer({
            name: customer_name,
            phone: customer_phone,
            email: customer_email
        });

        // 2. Validate Table and Party Size
        if (table_id) {
            const { data: table } = await supabase
                .from('restaurant_table')
                .select('id, capacity')
                .eq('id', table_id)
                .is('deleted_at', null)
                .single();
            
            if (!table) throw new Error('Selected table not found');
            if (party_size > table.capacity) {
                throw new Error(`Party size (${party_size}) exceeds table capacity (${table.capacity})`);
            }

            // Check for conflicting reservations at the same time (simplified check)
            // In a real app, you'd check a time window (e.g., +/- 2 hours)
            const { data: conflicts } = await supabase
                .from('reservations')
                .select('id')
                .eq('table_id', table_id)
                .eq('reserved_at', reserved_at)
                .eq('status', 'confirmed')
                .is('deleted_at', null);
            
            if (conflicts && conflicts.length > 0) {
                throw new Error('Table is already reserved for this time');
            }
        }

        // 3. Create Reservation
        const { data: reservation, error: createError } = await supabase
            .from('reservations')
            .insert([{
                customer_id: customer.id,
                table_id: table_id || null,
                reserved_at,
                party_size,
                notes,
                status: 'confirmed'
            }])
            .select('id')
            .single();
        
        if (createError) throw new Error(createError.message);

        return this.getReservationById(reservation.id);
    }

    /**
     * PATCH /reservations/:id/status
     */
    async updateReservationStatus(id, status) {
        const VALID_STATUSES = ['confirmed', 'seated', 'completed', 'cancelled'];
        if (!VALID_STATUSES.includes(status)) {
            throw new Error('Invalid status');
        }

        const { data: reservation, error: fetchError } = await supabase
            .from('reservations')
            .select('id, table_id')
            .eq('id', id)
            .single();
        
        if (fetchError) throw new Error('Reservation not found');

        const { error: updateError } = await supabase
            .from('reservations')
            .update({ status })
            .eq('id', id);
        
        if (updateError) throw new Error(updateError.message);

        // If seated, mark table as occupied if it exists
        if (status === 'seated' && reservation.table_id) {
            await supabase
                .from('restaurant_table')
                .update({ status: 'occupied' })
                .eq('id', reservation.table_id);
        }

        // If completed or cancelled, mark table as cleaning if it was occupied
        if (['completed', 'cancelled'].includes(status) && reservation.table_id) {
             // Logic to check if we should release the table
             // For now, we manually handle it or let staff do it
        }

        return this.getReservationById(id);
    }

    /**
     * DELETE /reservations/:id
     */
    async softDeleteReservation(id) {
        const { error } = await supabase
            .from('reservations')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }
}

module.exports = new ReservationService();
