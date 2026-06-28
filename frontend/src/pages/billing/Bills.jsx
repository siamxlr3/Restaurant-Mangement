import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  RefreshCcw,
  Printer,
  RotateCcw,
  CreditCard,
  DollarSign,
  Split,
} from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, EmptyState } from '../../components/ui/Common'
import PaymentModals from './PaymentModals'
import {
  useGetBillsQuery,
  useGetPaymentsQuery,
  useUpdateBillStatusMutation,
  useDeleteBillMutation,
} from '../../store/api/billingApi'

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Draft',      value: 'draft' },
  { label: 'Issued',     value: 'issued' },
  { label: 'Paid',       value: 'paid' },
  { label: 'Refunded',   value: 'refunded' },
]

const billStatusTone = {
  draft:    'slate',
  issued:   'amber',
  paid:     'green',
  refunded: 'rose',
}

const paymentStatusTone = {
  completed: 'green',
  refunded:  'rose',
  pending:   'amber',
}

const methodIcon = {
  cash:  <DollarSign size={13} />,
  card:  <CreditCard size={13} />,
  split: <Split size={13} />,
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Bills() {
  const [page,            setPage]            = useState(1)
  const [perPage,         setPerPage]         = useState(20)
  const [searchTerm,      setSearchTerm]      = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter,    setStatusFilter]    = useState('')
  const [dateRange,       setDateRange]       = useState({ from: '', to: '' })
  const [isFilterOpen,    setIsFilterOpen]    = useState(false)
  const [openMenuId,      setOpenMenuId]      = useState(null)

  // Payment Modal State
  const [isCashModalOpen,    setCashModalOpen]    = useState(false)
  const [isCardModalOpen,    setCardModalOpen]    = useState(false)
  const [isRefundModalOpen,  setRefundModalOpen]  = useState(false)
  const [selectedBill,       setSelectedBill]     = useState(null)
  const [selectedPayment,    setSelectedPayment]  = useState(null)

  // RTK Query – Bills
  const { data, isLoading, isFetching } = useGetBillsQuery({
    page,
    per_page: perPage,
    search:    debouncedSearch,
    status:    statusFilter   || undefined,
    from_date: dateRange.from || undefined,
    to_date:   dateRange.to   || undefined,
  })

  // RTK Query – Payments (fetch all for current page so we can join)
  const { data: paymentsData } = useGetPaymentsQuery({
    per_page: 200, // generous limit to cover current bill page
  })

  const [updateStatus] = useUpdateBillStatusMutation()
  const [deleteBill]   = useDeleteBillMutation()

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const handleResetFilters = () => {
    setSearchTerm(''); setStatusFilter(''); setDateRange({ from: '', to: '' }); setPage(1)
  }

  const handleUpdateStatus = async (id, status) => {
    if (status === 'paid') {
      const bill = items.find(b => b.id === id)
      setSelectedBill(bill)
      setCashModalOpen(true)
      return
    }
    try   { await updateStatus({ id, status }).unwrap(); toast.success(`Status → ${status}`) }
    catch (err) { toast.error(err.data?.message || 'Failed to update') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return
    try   { await deleteBill(id).unwrap(); toast.success('Bill deleted') }
    catch (err) { toast.error(err.data?.message || 'Failed to delete') }
  }

  const items = data?.items || []
  const meta  = data?.meta  || {}

  // Build a map: bill_id → payment record (first/most recent payment)
  const paymentByBillId = useMemo(() => {
    const map = {}
    const list = paymentsData?.data || []
    list.forEach(p => {
      // keep only the most recent payment per bill (last one wins – list is asc)
      map[p.bill_id] = p
    })
    return map
  }, [paymentsData])

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="Bills & Payments"
        description="Consolidated view of all invoices and their payment details."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`btn-secondary ${isFilterOpen ? 'bg-slate-100' : ''}`}
            >
              <Filter size={14} /> Filters
            </button>
            <button className="btn-accent">
              <Download size={14} /> Export
            </button>
          </div>
        }
      />

      {/* ── Filter Panel ── */}
      {isFilterOpen && (
        <div className="panel bg-slate-50/50 border-dashed grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="input-field py-2"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setDateRange((p) => ({ ...p, from: e.target.value })); setPage(1) }}
              className="input-field py-2"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setDateRange((p) => ({ ...p, to: e.target.value })); setPage(1) }}
              className="input-field py-2"
            />
          </div>
          <div className="flex items-end pb-1">
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-ink flex items-center gap-1.5 font-medium"
            >
              <RefreshCcw size={13} /> Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* ── Data Table Panel ── */}
      <div className="panel p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by ID or table…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Table content */}
        <div className="relative min-h-[360px] overflow-x-auto">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Spinner label="Updating records…" size="md" />
            </div>
          )}

          {!isLoading && items.length === 0 ? (
            <div className="py-20">
              <EmptyState
                title="No bills found"
                description={
                  debouncedSearch || statusFilter || dateRange.from
                    ? 'Try adjusting your filters.'
                    : 'Start generating bills from the POS screen.'
                }
                action={
                  (debouncedSearch || statusFilter || dateRange.from) && (
                    <button onClick={handleResetFilters} className="btn-secondary">
                      Clear all filters
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <table className="table-base w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Bill ID</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Table</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Method</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Issued At</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Bill Status</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row) => {
                  const payment = paymentByBillId[row.id] || null

                  return (
                    <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                      {/* Bill ID */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="stat-mono font-medium text-xs text-ink truncate max-w-[100px]">
                            {row.id.split('-')[0]}…
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">{row.order?.type || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Table */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-ink text-sm">
                          {row.order?.table_name || 'Takeaway'}
                        </span>
                      </td>

                      {/* Method (from payment) */}
                      <td className="py-3 px-4">
                        {payment ? (
                          <div className="flex items-center gap-1 text-slate-600 capitalize text-sm">
                            {methodIcon[payment.method]}
                            <span className="text-xs">{payment.method}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>

                      {/* Amount (from payment) */}
                      <td className="py-3 px-4">
                        {payment ? (
                          <span className="stat-mono font-bold text-ink text-sm">
                            ৳{parseFloat(payment.amount).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>

                      {/* Issued At */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs text-slate-500">
                          {row.issued_at || row.created_at
                            ? format(new Date(row.issued_at || row.created_at), 'MMM dd, hh:mm a')
                            : '—'}
                        </span>
                        {!row.issued_at && (
                          <span className="block text-[10px] text-slate-400 italic">created</span>
                        )}
                      </td>

                      {/* Bill Status */}
                      <td className="py-3 px-4">
                        <Badge tone={billStatusTone[row.status]}>{row.status}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print receipt – only if paid */}
                          {payment && (
                            <button
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-ink"
                              title="Print Receipt"
                            >
                              <Printer size={14} />
                            </button>
                          )}

                          {/* Refund – only if payment is completed */}
                          {payment?.status === 'completed' && (
                            <button
                              onClick={() => { setSelectedPayment(payment); setRefundModalOpen(true) }}
                              className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-slate-400 hover:text-rose-600"
                              title="Refund"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          {/* View */}
                          <button
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-ink"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>

                          {/* More menu */}
                          <div
                            className="relative"
                            onMouseLeave={() => setOpenMenuId(null)}
                          >
                            <button
                              onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-ink"
                            >
                              <MoreVertical size={14} />
                            </button>
                            {openMenuId === row.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 text-left">
                                {row.status === 'draft' && (
                                  <button
                                    onClick={() => { handleUpdateStatus(row.id, 'issued'); setOpenMenuId(null) }}
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                  >
                                    Issue Bill
                                  </button>
                                )}
                                {row.status !== 'paid' && (
                                  <>
                                    <button
                                      onClick={() => { setSelectedBill(row); setCashModalOpen(true); setOpenMenuId(null) }}
                                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 flex items-center gap-2 text-emerald-600 font-medium"
                                    >
                                      Pay by Cash
                                    </button>
                                    <button
                                      onClick={() => { setSelectedBill(row); setCardModalOpen(true); setOpenMenuId(null) }}
                                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 flex items-center gap-2 text-blue-600 font-medium"
                                    >
                                      Pay by Card
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => { handleDelete(row.id); setOpenMenuId(null) }}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta?.total_pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing <strong>{(page - 1) * perPage + 1}</strong> –{' '}
              <strong>{Math.min(page * perPage, meta.total)}</strong> of{' '}
              <strong>{meta.total}</strong>
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              {[...Array(meta.total_pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                    page === i + 1 ? 'bg-ink text-white' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={page === meta.total_pages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Payment Modals ── */}
      <PaymentModals
        isCashModalOpen={isCashModalOpen}
        setCashModalOpen={setCashModalOpen}
        isCardModalOpen={isCardModalOpen}
        setCardModalOpen={setCardModalOpen}
        isRefundModalOpen={isRefundModalOpen}
        setRefundModalOpen={setRefundModalOpen}
        selectedBill={selectedBill}
        selectedPayment={selectedPayment}
      />
    </motion.div>
  )
}
