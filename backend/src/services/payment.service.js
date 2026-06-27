const { supabase } = require('../config/supabase');

class PaymentService {
    async createPayment(paymentData) {
        const { bill_id, method, amount, reference_number, received_amount, change_amount } = paymentData;

        const { data: bill, error: billError } = await supabase
            .from('bills')
            .select('id, total, status')
            .eq('id', bill_id)
            .single();

        if (billError || !bill) {
            throw new Error('Bill not found');
        }

        if (bill.status === 'paid') {
            throw new Error('Bill is already fully paid');
        }

        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                bill_id,
                method,
                amount,
                reference_number,
                received_amount,
                change_amount,
                status: 'completed',
                paid_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (paymentError) {
            throw new Error(paymentError.message);
        }

        const { data: allPayments, error: sumError } = await supabase
            .from('payments')
            .select('amount')
            .eq('bill_id', bill_id)
            .eq('status', 'completed');

        if (sumError) {
            throw new Error('Error calculating paid amount');
        }

        const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

        if (totalPaid >= parseFloat(bill.total)) {
            const { error: updateError } = await supabase
                .from('bills')
                .update({ status: 'paid' })
                .eq('id', bill_id);

            if (updateError) {
                console.error('Error updating bill status:', updateError);
            }
        }

        return payment;
    }

    async getPayments({ page = 1, per_page = 20, search, status, from_date, to_date }) {
        const limit = Math.min(per_page, 100);
        const offset = (page - 1) * limit;

        let query = supabase
            .from('payments')
            .select('*, bills(id, total, order_id)', { count: 'exact' })
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);
        if (from_date) query = query.gte('created_at', from_date);
        if (to_date) query = query.lte('created_at', to_date);
        
        if (search) {
            query = query.ilike('method', `%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw new Error(error.message);

        return {
            data,
            meta: {
                page,
                per_page: limit,
                total: count,
                total_pages: Math.ceil(count / limit)
            }
        };
    }

    async getPaymentById(id) {
        const { data, error } = await supabase
            .from('payments')
            .select('*, bills(*)')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async refundPayment(id, refundData) {
        const { amount, reason } = refundData;

        const { data: payment, error: pError } = await supabase
            .from('payments')
            .select('*')
            .eq('id', id)
            .single();

        if (pError || !payment) throw new Error('Payment not found');

        if (payment.status === 'refunded') throw new Error('Payment already refunded');

        const { data, error } = await supabase
            .from('payments')
            .update({
                status: 'refunded',
                refund_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        const { data: allPayments } = await supabase
            .from('payments')
            .select('amount')
            .eq('bill_id', payment.bill_id)
            .eq('status', 'completed');

        const totalPaid = allPayments ? allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0) : 0;
        
        const { data: bill } = await supabase
            .from('bills')
            .select('total')
            .eq('id', payment.bill_id)
            .single();

        if (bill && totalPaid < parseFloat(bill.total)) {
            await supabase
                .from('bills')
                .update({ status: 'issued' })
                .eq('id', payment.bill_id);
        }

        return data;
    }
}

module.exports = new PaymentService();
