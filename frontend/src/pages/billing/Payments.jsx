import React, { useState, useEffect } from 'react';
import { useGetPaymentsQuery } from '../../store/api/billingApi';
import { format } from 'date-fns';
import { 
    Search, 
    Filter, 
    Printer, 
    RotateCcw, 
    RefreshCcw,
    CreditCard,
    DollarSign,
    Split
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import PageHeader from '../../components/ui/PageHeader';
import { Badge, Spinner, EmptyState } from '../../components/ui/Common';
import PaymentModals from './PaymentModals';

const Payments = () => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Payment/Refund State
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isRefundModalOpen, setRefundModalOpen] = useState(false);

    const { data: paymentsData, isLoading, isFetching } = useGetPaymentsQuery({
        page,
        per_page: perPage,
        search: debouncedSearch,
        status: statusFilter || undefined,
        from_date: dateRange.from || undefined,
        to_date: dateRange.to || undefined
    });

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => { 
            setDebouncedSearch(searchTerm); 
            setPage(1); 
        }, 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDateRange({ from: '', to: '' });
        setPage(1);
    };

    const statusTone = {
        completed: 'green',
        refunded: 'rose',
    };

    const methodIcon = {
        cash: <DollarSign size={14} />,
        card: <CreditCard size={14} />,
        split: <Split size={14} />,
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <PageHeader 
                title="Payments" 
                description="Monitor and manage all payment transactions."
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`btn-secondary ${isFilterOpen ? 'bg-slate-100' : ''}`}
                        >
                            <Filter size={14} /> Filters
                        </button>
                        <button 
                            className="btn-secondary"
                            onClick={handleResetFilters}
                        >
                            <RefreshCcw size={14} /> Reset
                        </button>
                    </div>
                }
            />

            {/* Filter Panel */}
            {isFilterOpen && (
                <div className="panel bg-slate-50/50 border-dashed grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                        <select 
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="input-field py-2"
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</label>
                        <input 
                            type="date" 
                            value={dateRange.from}
                            onChange={(e) => { setDateRange(p => ({...p, from: e.target.value})); setPage(1); }}
                            className="input-field py-2"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</label>
                        <input 
                            type="date" 
                            value={dateRange.to}
                            onChange={(e) => { setDateRange(p => ({...p, to: e.target.value})); setPage(1); }}
                            className="input-field py-2"
                        />
                    </div>
                </div>
            )}

            <div className="panel p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-9 w-full"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">Show:</span>
                        <select
                            value={perPage}
                            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                            className="bg-transparent text-xs font-semibold focus:outline-none"
                        >
                            <option value={10}>10 records</option>
                            <option value={20}>20 records</option>
                            <option value={50}>50 records</option>
                        </select>
                    </div>
                </div>

                <div className="relative min-h-[360px]">
                    {(isLoading || isFetching) && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <Spinner label="Updating records..." size="md" />
                        </div>
                    )}

                    {!isLoading && (!paymentsData?.data || paymentsData.data.length === 0) ? (
                        <div className="py-20">
                            <EmptyState 
                                title="No payments found" 
                                description="Adjust your filters or initiate payments from the billing screen."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table-base w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                                        <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill ID</th>
                                        <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                                        <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                                        <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paymentsData?.data?.map((payment) => (
                                        <tr key={payment.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <span className="stat-mono font-medium text-xs text-ink">
                                                    {payment.id.split('-')[0]}…
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="stat-mono text-[10px] text-slate-400">
                                                    {payment.bill_id.split('-')[0]}…
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 capitalize text-sm">
                                                    {methodIcon[payment.method]}
                                                    {payment.method}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="stat-mono font-bold text-ink">
                                                    ৳{parseFloat(payment.amount).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs text-slate-500">
                                                    {format(new Date(payment.paid_at), 'MMM dd, hh:mm a')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge tone={statusTone[payment.status]}>{payment.status}</Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-ink" title="Print Receipt">
                                                        <Printer size={15} />
                                                    </button>
                                                    {payment.status === 'completed' && (
                                                        <button 
                                                            onClick={() => { setSelectedPayment(payment); setRefundModalOpen(true); }}
                                                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-slate-400 hover:text-rose-600"
                                                            title="Refund"
                                                        >
                                                            <RotateCcw size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {paymentsData?.meta?.total_pages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            Showing <strong>{(page - 1) * perPage + 1}</strong> –{' '}
                            <strong>{Math.min(page * perPage, paymentsData.meta.total)}</strong> of{' '}
                            <strong>{paymentsData.meta.total}</strong>
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(paymentsData.meta.total_pages, p + 1))}
                                disabled={page === paymentsData.meta.total_pages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <PaymentModals 
                isRefundModalOpen={isRefundModalOpen}
                setRefundModalOpen={setRefundModalOpen}
                selectedPayment={selectedPayment}
                onSuccess={() => paymentsData?.refetch?.()}
            />
        </motion.div>
    );
};

export default Payments;
