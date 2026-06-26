import { useState, useEffect } from 'react'
import {
  DollarSign,
  Receipt,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  RefreshCcw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { Badge, Spinner, EmptyState } from '../../components/ui/Common'
import PaymentModals from './PaymentModals'
import {
  useGetBillsQuery,
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

const statusTone = {
  draft:    'slate',
  issued:   'amber',
  paid:     'green',
  refunded: 'rose',
}

const STATUS_COLORS = ['#FF5A1F', '#F5A623', '#1F8A5F', '#E05C5C']

// ── Column definition ────────────────────────────────────────────────────────
const buildColumns = (handleUpdateStatus, handleDelete) => [
  {
    key: 'id',
    header: 'Bill ID',
    render: (r) => (
      <div className="flex flex-col">
        <span className="stat-mono font-medium text-xs text-ink truncate max-w-[110px]">
          {r.id.split('-')[0]}…
        </span>
        <span className="text-[10px] text-slate-400 capitalize">{r.order?.type || 'N/A'}</span>
      </div>
    ),
  },
  {
    key: 'table',
    header: 'Table',
    render: (r) => (
      <span className="font-semibold text-ink text-sm">
        {r.order?.table_name || 'Takeaway'}
      </span>
    ),
  },
  {
    key: 'issued_at',
    header: 'Issued At',
    render: (r) => (
      <span className="text-xs text-slate-500">
        {r.issued_at ? format(new Date(r.issued_at), 'MMM dd, hh:mm a') : '—'}
      </span>
    ),
  },
  {
    key: 'total',
    header: 'Total',
    render: (r) => (
      <div className="flex flex-col">
        <span className="stat-mono font-bold text-ink">৳{r.total.toLocaleString('en-IN')}</span>
        <span className="text-[10px] text-slate-400">Tax ৳{r.tax}</span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge>,
  },
  {
    key: 'actions',
    header: '',
    render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <button
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-ink"
          title="View Details"
        >
          <Eye size={15} />
        </button>
        <div className="relative group">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <MoreVertical size={15} />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 hidden group-hover:block z-20">
            {r.status === 'draft' && (
              <button
                onClick={() => handleUpdateStatus(r.id, 'issued')}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                Issue Bill
              </button>
            )}
            {r.status !== 'paid' && (
              <button
                onClick={() => handleUpdateStatus(r.id, 'paid')}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 flex items-center gap-2 text-emerald-600 font-medium"
              >
                Mark as Paid
              </button>
            )}
            <button
              onClick={() => handleDelete(r.id)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-rose-50 flex items-center gap-2 text-rose-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ),
  },
]

// ── Helpers: derive KPIs & chart data from items ─────────────────────────────
function deriveStats(items) {
  const paid     = items.filter((b) => b.status === 'paid')
  const issued   = items.filter((b) => b.status === 'issued')
  const revenue  = paid.reduce((s, b) => s + (b.total || 0), 0)
  const tax      = paid.reduce((s, b) => s + (b.tax   || 0), 0)
  return { revenue, tax, outstanding: issued.length, total: items.length }
}

function buildStatusSplit(items) {
  const counts = { draft: 0, issued: 0, paid: 0, refunded: 0 }
  items.forEach((b) => { if (counts[b.status] !== undefined) counts[b.status]++ })
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Bills() {
  const [page,           setPage]           = useState(1)
  const [perPage,        setPerPage]        = useState(20)
  const [searchTerm,     setSearchTerm]     = useState('')
  const [debouncedSearch,setDebouncedSearch]= useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [dateRange,      setDateRange]      = useState({ from: '', to: '' })
  const [isFilterOpen,   setIsFilterOpen]   = useState(false)

  // Payment Modal State
  const [isCashModalOpen, setCashModalOpen] = useState(false)
  const [isCardModalOpen, setCardModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)

  // RTK Query
  const { data, isLoading, isFetching } = useGetBillsQuery({
    page,
    per_page: perPage,
    search:    debouncedSearch,
    status:    statusFilter   || undefined,
    from_date: dateRange.from || undefined,
    to_date:   dateRange.to   || undefined,
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
      // For now default to cash modal, or could show a choice
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

  const items      = data?.items || []
  const meta       = data?.meta  || {}
  const stats      = deriveStats(items)
  const statusSplit = buildStatusSplit(items)

  const columns = buildColumns(handleUpdateStatus, handleDelete)

  // Dummy 7-day revenue trend from current page items (replace with real endpoint if available)
  const trendData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const buckets = Object.fromEntries(days.map((d) => [d, 0]))
    items
      .filter((b) => b.status === 'paid' && b.issued_at)
      .forEach((b) => {
        const d = format(new Date(b.issued_at), 'EEE')
        if (buckets[d] !== undefined) buckets[d] += b.total || 0
      })
    return days.map((d) => ({ day: d, revenue: buckets[d] }))
  })()

  // KPI cards
  const kpiCards = [
    { id: 'revenue',     label: 'Total Revenue',     value: stats.revenue, prefix: '৳', icon: DollarSign },
    { id: 'outstanding', label: 'Outstanding Bills',  value: stats.outstanding, icon: Clock    },
    { id: 'tax',         label: 'Tax Collected',      value: stats.tax,  prefix: '৳', icon: Receipt   },
    { id: 'total',       label: 'Total Bills',        value: stats.total,            icon: RefreshCcw },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="Bills"
        description="Manage restaurant invoices and payments."
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

      {/* ── KPI Stat Row ── */}
      {isLoading ? (
        <Spinner label="Loading billing data…" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {kpiCards.map((kpi) => (
            <StatCard key={kpi.id} {...kpi} />
          ))}
        </div>
      )}

      {/* ── Charts Row ── */}
      {!isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          {/* Revenue Area Chart */}
          <div className="panel p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink">Revenue, this page</h2>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ticket-orange inline-block" /> Paid bills
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="billRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#FF5A1F" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEDE6" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#83858F' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#83858F' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                />
                <Tooltip
                  formatter={(v) => `৳${v.toLocaleString('en-IN')}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E9E9EB', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF5A1F" strokeWidth={2.5} fill="url(#billRevFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Split Donut */}
          <div className="panel p-5">
            <h2 className="font-display font-semibold text-ink mb-4">Status split</h2>
            {statusSplit.length === 0 ? (
              <p className="text-sm text-slate-400 text-center mt-10">No data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusSplit}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {statusSplit.map((entry, i) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} bills`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statusSplit.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600 capitalize">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                        {s.name}
                      </span>
                      <span className="stat-mono font-medium text-ink">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
        <div className="relative min-h-[360px]">
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
                    ? "Try adjusting your filters."
                    : "Start generating bills from the POS screen."
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
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                      {columns.map((col) => (
                        <td key={col.key} className="py-3 px-4">
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      <PaymentModals 
        isCashModalOpen={isCashModalOpen}
        setCashModalOpen={setCashModalOpen}
        isCardModalOpen={isCardModalOpen}
        setCardModalOpen={setCardModalOpen}
        selectedBill={selectedBill}
      />
    </motion.div>
  )
}
