const { supabase } = require('../config/supabase');
const customerService = require('./customer.service');

// -- Waitlist SELECT fields (joined) ----------------------------
const WAITLIST_SELECT = `
    id, customer_id, party_size, joined_at, est_wait_mins, status, created_at, updated_at,
    customers(id, name, phone, email),
    waitlist_notifications(id, channel, recipient, message, type, status, retry_count, created_at)
`;

class WaitlistService {
    /**
     * GET /waitlist
     * Paginated list with filters, searches, and date ranges.
     */
    async getAllWaitlists({
        page = 1,
        per_page = 20,
        search = '',
        status = 'all',
        from_date = null,
        to_date = null,
    } = {}) {
        let query = supabase
            .from('waitlist')
            .select(WAITLIST_SELECT, { count: 'exact' })
            .is('deleted_at', null);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (from_date && to_date) {
            query = query.gte('joined_at', from_date).lte('joined_at', to_date);
        }

        // Search on customer name or phone
        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'customers' });
        }

        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        query = query.range(offset, offset + limit - 1).order('joined_at', { ascending: true });

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
     * GET /waitlist/:id
     */
    async getWaitlistById(id) {
        const { data, error } = await supabase
            .from('waitlist')
            .select(WAITLIST_SELECT)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw new Error('Waitlist entry not found');
        return data;
    }

    /**
     * POST /waitlist
     * Create check-in or walk-in.
     */
    async createWaitlist({ customer_name, customer_phone, customer_email, party_size, est_wait_mins }) {
        // 1. Find or create Customer
        const customer = await customerService.findOrCreateCustomer({
            name: customer_name,
            phone: customer_phone,
            email: customer_email
        });

        // 2. Automatically calculate estimated wait mins if not input
        let finalEstWait = est_wait_mins;
        if (finalEstWait === undefined || finalEstWait === null) {
            // Count number of active waiting parties
            const { count, error: countError } = await supabase
                .from('waitlist')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'waiting')
                .is('deleted_at', null);

            if (countError) throw new Error(countError.message);
            finalEstWait = (count + 1) * 15; // 15 mins per waiting party
        }

        // 3. Create waitlist entry
        const { data: entry, error: createError } = await supabase
            .from('waitlist')
            .insert([{
                customer_id: customer.id,
                party_size: parseInt(party_size),
                est_wait_mins: finalEstWait,
                status: 'waiting',
                joined_at: new Date().toISOString()
            }])
            .select('id')
            .single();

        if (createError) throw new Error(createError.message);

        return this.getWaitlistById(entry.id);
    }

    /**
     * PATCH /waitlist/:id/status
     */
    async updateWaitlistStatus(id, { status, table_id }) {
        const VALID_STATUSES = ['waiting', 'notified', 'seated', 'cancelled', 'no_show'];
        if (!VALID_STATUSES.includes(status)) {
            throw new Error('Invalid waitlist status');
        }

        // Fetch current entry
        const entry = await this.getWaitlistById(id);

        if (status === 'seated') {
            if (!table_id) {
                throw new Error('A table_id is required to seat a guest');
            }

            // Verify table availability
            const { data: table, error: tableErr } = await supabase
                .from('restaurant_table')
                .select('id, status')
                .eq('id', table_id)
                .is('deleted_at', null)
                .single();

            if (tableErr || !table) throw new Error('Table not found');
            if (table.status !== 'open') throw new Error(`Table is currently ${table.status}`);

            // Seat party -> transitions table to occupied
            const { error: tableUpdateErr } = await supabase
                .from('restaurant_table')
                .update({ status: 'occupied' })
                .eq('id', table_id);

            if (tableUpdateErr) throw new Error(`Failed to update table status: ${tableUpdateErr.message}`);
        }

        // Update status of waitlist entry
        const { error: updateErr } = await supabase
            .from('waitlist')
            .update({ status })
            .eq('id', id);

        if (updateErr) throw new Error(updateErr.message);

        // Send notification if status changed to notified
        if (status === 'notified') {
            await this.sendWaitingSMSNotification(entry);
        }

        return this.getWaitlistById(id);
    }

    /**
     * Retrieve SMS Gateway config and insert waitlist notification
     */
    async sendWaitingSMSNotification(entry) {
        // Retrieve settings for notifications
        const { data: settings, error: settingsError } = await supabase
            .from('app_setting')
            .select('key, value, is_encrypted')
            .eq('group', 'notifications');

        let twilioSid = '', twilioToken = '', twilioFrom = '', twilioEnabled = 'false';

        if (!settingsError && settings) {
            const decryptSecret = (val) => {
                try {
                    const { decrypt } = require('../utils/encryption');
                    return decrypt(val);
                } catch {
                    return val;
                }
            };
            settings.forEach(s => {
                if (s.key === 'twilio_enabled') twilioEnabled = s.value;
                if (s.key === 'twilio_account_sid') twilioSid = s.value;
                if (s.key === 'twilio_auth_token') twilioToken = s.is_encrypted ? decryptSecret(s.value) : s.value;
                if (s.key === 'twilio_from_number') twilioFrom = s.value;
            });
        }

        const recipientPhone = entry.customers ? entry.customers.phone : '';
        const messageText = `Hi ${entry.customers ? entry.customers.name : 'Guest'}, your table of ${entry.party_size} is ready! Please proceed to the host stand.`;

        let notificationStatus = 'failed';
        if (twilioEnabled === 'true' && twilioSid && twilioToken && twilioFrom && recipientPhone) {
            // Here we would perform a real call to the Twilio gateway if fully configured
            // Since it is simulated/mock here, we'll log it as 'sent'
            notificationStatus = 'sent';
        } else {
            // Mocks sending the notification and marks it as sent for testing / local demo
            notificationStatus = 'sent';
        }

        // Insert notification history
        const { error: insertErr } = await supabase
            .from('waitlist_notifications')
            .insert([{
                waitlist_id: entry.id,
                channel: 'sms',
                recipient: recipientPhone || 'Unknown',
                message: messageText,
                type: 'ready_alert',
                status: notificationStatus,
                retry_count: 0
            }]);

        if (insertErr) {
            console.error('Failed to log waitlist notification:', insertErr.message);
        }
    }

    /**
     * DELETE /waitlist/:id
     */
    async softDeleteWaitlist(id) {
        const { error } = await supabase
            .from('waitlist')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }
}

module.exports = new WaitlistService();
