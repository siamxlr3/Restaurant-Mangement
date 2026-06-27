import React, { useState } from 'react';
import { 
    X, 
    DollarSign, 
    CreditCard, 
    RotateCcw,
    AlertCircle
} from 'lucide-react';
import { useCreatePaymentMutation, useRefundPaymentMutation } from '../../store/api/billingApi';
import { toast } from 'sonner';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-display font-semibold text-ink">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const PaymentModals = ({ 
    isCashModalOpen, setCashModalOpen,
    isCardModalOpen, setCardModalOpen,
    isRefundModalOpen, setRefundModalOpen,
    selectedBill,
    selectedPayment,
    onSuccess
}) => {
    const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
    const [refundPayment, { isLoading: isRefunding }] = useRefundPaymentMutation();

    // Cash state
    const [receivedAmount, setReceivedAmount] = useState('');
    const change = receivedAmount ? (parseFloat(receivedAmount) - (selectedBill?.total || 0)) : 0;

    // Card state
    const [reference, setReference] = useState('');

    // Refund state
    const [refundReason, setRefundReason] = useState('');

    const handleCashSubmit = async (e) => {
        e.preventDefault();
        if (parseFloat(receivedAmount) < (selectedBill?.total || 0)) {
            return toast.error('Received amount is less than bill total');
        }
        try {
            await createPayment({
                bill_id: selectedBill.id,
                method: 'cash',
                amount: selectedBill.total,
                received_amount: parseFloat(receivedAmount),
                change_amount: change
            }).unwrap();
            toast.success('Cash payment recorded');
            setCashModalOpen(false);
            setReceivedAmount('');
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.data?.message || 'Payment failed');
        }
    };

    const handleCardSubmit = async (e) => {
        e.preventDefault();
        try {
            await createPayment({
                bill_id: selectedBill.id,
                method: 'card',
                amount: selectedBill.total,
                reference_number: reference
            }).unwrap();
            toast.success('Card payment recorded');
            setCardModalOpen(false);
            setReference('');
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.data?.message || 'Payment failed');
        }
    };

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        try {
            await refundPayment({
                id: selectedPayment.id,
                amount: selectedPayment.amount,
                reason: refundReason
            }).unwrap();
            toast.success('Payment refunded');
            setRefundModalOpen(false);
            setRefundReason('');
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.data?.message || 'Refund failed');
        }
    };

    return (
        <>
            {/* Cash Modal */}
            <Modal isOpen={isCashModalOpen} onClose={() => setCashModalOpen(false)} title="Cash Payment">
                <form onSubmit={handleCashSubmit} className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Bill Amount</span>
                            <span className="stat-mono text-ink">৳{selectedBill?.total?.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Received Amount</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="number" 
                                step="0.01"
                                required
                                value={receivedAmount}
                                onChange={(e) => setReceivedAmount(e.target.value)}
                                className="input-field pl-9"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    {receivedAmount && (
                        <div className={`p-4 rounded-xl flex justify-between items-center ${change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            <span className="text-sm font-medium">{change >= 0 ? 'Change to Return' : 'Shortfall'}</span>
                            <span className="stat-mono font-bold text-lg">৳{Math.abs(change).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isCreating || change < 0}
                        className="btn-accent w-full py-3 h-auto"
                    >
                        {isCreating ? 'Processing...' : 'Confirm Cash Payment'}
                    </button>
                </form>
            </Modal>

            {/* Card Modal */}
            <Modal isOpen={isCardModalOpen} onClose={() => setCardModalOpen(false)} title="Card Payment">
                <form onSubmit={handleCardSubmit} className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Amount to Charge</span>
                            <span className="stat-mono text-ink">৳{selectedBill?.total?.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference Number / Auth Code</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="input-field pl-9"
                                placeholder="Optional"
                                autoFocus
                            />
                        </div>
                        <p className="text-[10px] text-slate-400">Manual entry of code from card terminal.</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isCreating}
                        className="btn-accent w-full py-3 h-auto"
                    >
                        {isCreating ? 'Processing...' : 'Mark as Card Paid'}
                    </button>
                </form>
            </Modal>

            {/* Refund Modal */}
            <Modal isOpen={isRefundModalOpen} onClose={() => setRefundModalOpen(false)} title="Process Refund">
                <form onSubmit={handleRefundSubmit} className="space-y-4">
                    <div className="p-4 bg-rose-50 rounded-xl flex items-start gap-3 text-rose-700">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-semibold">Confirming full refund of ৳{selectedPayment?.amount?.toLocaleString('en-IN')}</p>
                            <p className="text-[11px] opacity-80">This will revert the bill status and log the refund.</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Refund</label>
                        <textarea 
                            required
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            className="input-field min-h-[100px] py-3 text-sm"
                            placeholder="e.g. Order cancelled, Customer complaint..."
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isRefunding}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={16} />
                        {isRefunding ? 'Processing...' : 'Confirm Refund'}
                    </button>
                </form>
            </Modal>
        </>
    );
};

export default PaymentModals;
