import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search, Filter, RefreshCcw, RotateCcw, X, Smartphone,
  CreditCard, Wallet, Zap, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, AlertCircle, ArrowRight, Eye,
} from 'lucide-react'
import {
  useGetGatewayStatusQuery,
  useInitiatePaymentMutation,
  useExecutePaymentMutation,
} from '../../store/api/paymentGatewayApi'
import { useGetPaymentsQuery, useRefundPaymentMutation } from '../../store/api/billingApi'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, EmptyState } from '../../components/ui/Common'
import { format } from 'date-fns'

// ── Gateway brand config ──────────────────────────────────────────────────────
const GATEWAY_META = {
  bkash:  { label: 'bKash',         color: 'text-pink-600',   bg: 'bg-pink-50',   border: 'border-pink-200',   dot: 'bg-pink-500'   },
  rocket: { label: 'Rocket (DBBL)', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
  nagad:  { label: 'Nagad',         color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
}

// ── Status badge tones ─────────────────────────────────────────────────────────
const STATUS_TONE   = { completed: 'green', pending: 'amber', failed: 'rose', refunded: 'rose' }
const STATUS_ICON   = {
  completed: <CheckCircle2 size={12} />,
  pending:   <Clock size={12} />,
  failed:    <AlertCircle size={12} />,
  refunded:  <RotateCcw size={12} />,
}

// ── Method icon mapping ────────────────────────────────────────────────────────
const METHOD_ICON = {
  bkash:  <Smartphone size={14} className="text-pink-500" />,
  rocket: <Wallet     size={14} className="text-violet-500" />,
  nagad:  <Zap        size={14} className="text-orange-500" />,
  cash:   <CreditCard size={14} className="text-slate-400" />,
  card:   <CreditCard size={14} className="text-slate-400" />,
}

// ── Skeleton row ────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[...Array(7)].map((_, i) => (
      <td key={i} className="py-3 px-4">
        <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: `${40 + i * 10}%` }} />
      </td>
    ))}
  </tr>
)

// ── Gateway Status Pills ───────────────────────────────────────────────────────
function GatewayStatusPills({ status, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-7 w-24 bg-slate-100 rounded-full animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(GATEWAY_META).map(([key, meta]) => {
        const configured = status?.[key]
        const enabled    = status?.[`${key}_enabled`]
        const live       = configured && enabled
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
              ${live ? `${meta.bg} ${meta.color} ${meta.border}` : 'bg-slate-50 text-slate-400 border-slate-200'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${live ? meta.dot : 'bg-slate-300'}`} />
            {meta.label}
            <span className="opacity-60">{!configured ? '· No Key' : !enabled ? '· Disabled' : '· Live'}</span>
          </span>
        )
      })}
    </div>
  )
}

// ── View Detail Modal ──────────────────────────────────────────────────────────
function ViewModal({ payment, onClose }) {
  if (!payment) return null
  const meta = GATEWAY_META[payment.method] || {}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${meta.bg || 'bg-slate-50'} flex items-center justify-center`}>
              {METHOD_ICON[payment.method] || <CreditCard size={14} />}
            </div>
            <h3 className="font-semibold text-ink">Payment Details</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Payment ID', value: payment.id },
              { label: 'Bill ID', value: payment.bill_id },
              { label: 'Method', value: meta.label || payment.method },
              { label: 'Amount', value: `৳${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
              { label: 'Status', value: payment.status },
              { label: 'Reference', value: payment.reference_number || '—' },
              { label: 'Paid At', value: payment.paid_at ? format(new Date(payment.paid_at), 'MMM dd yyyy, hh:mm a') : '—' },
              { label: 'Created At', value: payment.created_at ? format(new Date(payment.created_at), 'MMM dd yyyy') : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm text-ink font-medium break-all stat-mono">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Initiate Payment Modal ─────────────────────────────────────────────────────
function InitiateModal({ gatewayStatus, onClose, onSuccess }) {
  const [initiatePayment, { isLoading }] = useInitiatePaymentMutation()
  const [provider,  setProvider]  = useState('')
  const [amount,    setAmount]    = useState('')
  const [billId,    setBillId]    = useState('')

  const availableProviders = Object.entries(GATEWAY_META).filter(
    ([key]) => gatewayStatus?.[key] && gatewayStatus?.[`${key}_enabled`]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!provider) return toast.error('Select a payment provider')
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter a valid amount')
    if (!billId) return toast.error('Enter a Bill ID')

    try {
      const result = await initiatePayment({
        provider,
        amount: parseFloat(amount),
        bill_id: billId,
      }).unwrap()

      toast.success(`${GATEWAY_META[provider]?.label} payment initiated successfully`)
      if (result?.bkashURL || result?.paymentURL) {
        toast('Redirect URL received. Open in POS to complete.', { duration: 6000 })
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Payment initiation failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-ink">Initiate Gateway Payment</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Provider selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Provider</label>
            {availableProviders.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>No gateways are configured. Add credentials in <strong>Settings → Payment Gateways</strong>.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {availableProviders.map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setProvider(key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                      ${provider === key
                        ? `${meta.border} ${meta.bg} ${meta.color}`
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                  >
                    <span className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center border ${meta.border}`}>
                      {METHOD_ICON[key]}
                    </span>
                    <span className="text-sm font-semibold">{meta.label}</span>
                    {provider === key && <CheckCircle2 size={16} className="ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount (BDT)</label>
            <input
              type="number" step="0.01" min="1" required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="0.00"
            />
          </div>

          {/* Bill ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill ID (UUID)</label>
            <input
              type="text" required
              value={billId}
              onChange={(e) => setBillId(e.target.value)}
              className="input-field font-mono text-sm"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || availableProviders.length === 0}
            className="btn-accent w-full py-3 h-auto flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Spinner size="sm" /> Processing…</>
            ) : (
              <><ArrowRight size={16} /> Initiate Payment</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ── Refund Confirm Modal ───────────────────────────────────────────────────────
function RefundModal({ payment, onClose, onSuccess }) {
  const [refundPayment, { isLoading }] = useRefundPaymentMutation()
  const [reason, setReason] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await refundPayment({ id: payment.id, amount: payment.amount, reason }).unwrap()
      toast.success('Payment refunded successfully')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Refund failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-ink">Process Refund</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-semibold">
                Refund ৳{parseFloat(payment?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] opacity-80">via {GATEWAY_META[payment?.method]?.label || payment?.method}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</label>
            <textarea
              required value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field min-h-[80px] py-3 text-sm"
              placeholder="e.g. Customer cancelled, order error…"
            />
          </div>
          <button
            type="submit" disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            {isLoading ? 'Processing…' : 'Confirm Refund'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PaymentGatewayManagement() {
  const [page,           setPage]           = useState(1)
  const [perPage,        setPerPage]        = useState(20)
  const [search,         setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [methodFilter,   setMethodFilter]   = useState('')
  const [dateRange,      setDateRange]      = useState({ from: '', to: '' })
  const [isFilterOpen,   setIsFilterOpen]   = useState(false)

  // Modal state
  const [viewPayment,       setViewPayment]       = useState(null)
  const [refundPayment,     setRefundPayment]     = useState(null)
  const [showInitiateModal, setShowInitiateModal] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: gatewayStatus, isLoading: statusLoading } = useGetGatewayStatusQuery()

  const { data: paymentsData, isLoading, isFetching } = useGetPaymentsQuery({
    page,
    per_page: perPage,
    search:    debouncedSearch || undefined,
    status:    statusFilter || undefined,
    from_date: dateRange.from || undefined,
    to_date:   dateRange.to   || undefined,
  })

  // Gateway payments are all payments (including cash/card) — filter client-side by method if set
  const rawPayments = paymentsData?.data || []
  const payments = methodFilter
    ? rawPayments.filter((p) => p.method === methodFilter)
    : rawPayments

  const handleReset = () => {
    setSearch(''); setStatusFilter(''); setMethodFilter('')
    setDateRange({ from: '', to: '' }); setPage(1)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Payment Gateways"
        description="Manage digital payment transactions via bKash, Rocket, and Nagad."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowInitiateModal(true)}
              className="btn-accent flex items-center gap-2"
            >
              <Zap size={14} /> Initiate Payment
            </button>
            <button
              onClick={() => setIsFilterOpen((o) => !o)}
              className={`btn-secondary ${isFilterOpen ? 'bg-slate-100' : ''}`}
            >
              <Filter size={14} /> Filters
            </button>
            <button onClick={handleReset} className="btn-secondary">
              <RefreshCcw size={14} /> Reset
            </button>
          </div>
        }
      />

      {/* Gateway status pills */}
      <div className="mb-5">
        <GatewayStatusPills status={gatewayStatus} isLoading={statusLoading} />
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="panel bg-slate-50/50 border-dashed grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                  className="input-field py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="refunded">Refunded</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provider</label>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="input-field py-2"
                >
                  <option value="">All Providers</option>
                  <option value="bkash">bKash</option>
                  <option value="rocket">Rocket (DBBL)</option>
                  <option value="nagad">Nagad</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</label>
                <input
                  type="date" max={today} value={dateRange.from}
                  onChange={(e) => { setDateRange((p) => ({ ...p, from: e.target.value })); setPage(1) }}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</label>
                <input
                  type="date" max={today} value={dateRange.to}
                  onChange={(e) => { setDateRange((p) => ({ ...p, to: e.target.value })); setPage(1) }}
                  className="input-field py-2"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <div className="panel p-0 overflow-hidden">
        {/* Table toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search reference or amount…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Show:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="bg-transparent text-xs font-semibold focus:outline-none"
            >
              <option value={10}>10 records</option>
              <option value={20}>20 records</option>
              <option value={50}>50 records</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="relative min-h-[360px]">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Spinner label="Loading transactions…" size="md" />
            </div>
          )}

          {!isLoading && payments.length === 0 ? (
            <div className="py-20">
              <EmptyState
                title="No gateway transactions found"
                description="Initiate a bKash, Rocket, or Nagad payment to see it here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    {['ID', 'Bill ID', 'Provider', 'Amount', 'Reference', 'Time', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className={`py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading
                    ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                    : payments.map((payment) => {
                        const meta = GATEWAY_META[payment.method] || {}
                        return (
                          <tr key={payment.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="stat-mono font-medium text-xs text-ink">
                                {payment.id.split('-')[0]}…
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="stat-mono text-[10px] text-slate-400">
                                {payment.bill_id?.split('-')[0]}…
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                                ${meta.bg || 'bg-slate-50'} ${meta.color || 'text-slate-600'} ${meta.border || 'border-slate-200'}`}
                              >
                                {METHOD_ICON[payment.method]}
                                {meta.label || payment.method}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="stat-mono font-bold text-ink">
                                ৳{parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs text-slate-500 stat-mono">
                                {payment.reference_number || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs text-slate-500">
                                {payment.paid_at
                                  ? format(new Date(payment.paid_at), 'MMM dd, hh:mm a')
                                  : '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                                ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : ''}
                                ${payment.status === 'refunded'  ? 'bg-rose-50 text-rose-700'     : ''}
                                ${payment.status === 'pending'   ? 'bg-amber-50 text-amber-700'   : ''}
                                ${payment.status === 'failed'    ? 'bg-red-50 text-red-700'       : ''}
                              `}>
                                {STATUS_ICON[payment.status]}
                                {payment.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewPayment(payment)}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-ink"
                                  title="View Details"
                                >
                                  <Eye size={15} />
                                </button>
                                {payment.status === 'completed' && (
                                  <button
                                    onClick={() => setRefundPayment(payment)}
                                    className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-slate-400 hover:text-rose-600"
                                    title="Refund"
                                  >
                                    <RotateCcw size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {paymentsData?.meta?.total_pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing <strong>{(page - 1) * perPage + 1}</strong>–
              <strong>{Math.min(page * perPage, paymentsData.meta.total)}</strong> of{' '}
              <strong>{paymentsData.meta.total}</strong>
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium">
                {page} / {paymentsData.meta.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(paymentsData.meta.total_pages, p + 1))}
                disabled={page === paymentsData.meta.total_pages}
                className="p-2 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewPayment && <ViewModal payment={viewPayment} onClose={() => setViewPayment(null)} />}
      {refundPayment && (
        <RefundModal
          payment={refundPayment}
          onClose={() => setRefundPayment(null)}
          onSuccess={() => setRefundPayment(null)}
        />
      )}
      {showInitiateModal && (
        <InitiateModal
          gatewayStatus={gatewayStatus}
          onClose={() => setShowInitiateModal(false)}
          onSuccess={() => setShowInitiateModal(false)}
        />
      )}
    </motion.div>
  )
}
