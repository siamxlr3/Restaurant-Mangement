const { supabase } = require('../config/supabase');

class CustomerService {
    /**
     * Find or create a customer by phone number.
     */
    async findOrCreateCustomer({ name, phone, email }) {
        // Try to find existing customer
        const { data: existing, error: findError } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .is('deleted_at', null)
            .single();

        if (existing) {
            // Update email if provided and different
            if (email && existing.email !== email) {
                await supabase
                    .from('customers')
                    .update({ email })
                    .eq('id', existing.id);
            }
            return existing;
        }

        // Create new customer
        const { data: created, error: createError } = await supabase
            .from('customers')
            .insert([{ name, phone, email: email || null }])
            .select('*')
            .single();

        if (createError) throw new Error(`Failed to create customer: ${createError.message}`);
        return created;
    }

    async getCustomerById(id) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw new Error('Customer not found');
        return data;
    }
}

module.exports = new CustomerService();
