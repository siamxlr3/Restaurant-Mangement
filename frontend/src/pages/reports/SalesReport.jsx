import { useState } from 'react'
import { FiDownload, FiFileText, FiTrendingUp, FiShoppingCart, FiUsers, FiCreditCard } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { Spinner, EmptyState } from '../../components/ui/Common'
import { useGetSalesReportQuery } from '../../store/api/reportsApi'
import { exportCSV, exportPDF } from '../../utils/exportUtils'

const COLUMNS = [
  { header: 'Date', key: 'period_label', csv: (r) => r.period_label },
  { header: 'Revenue', key: 'total_revenue', csv: (r) => `৳${parseFloat(r.total_revenue).toFixed(2)}` },
  { header: 'Subtotal', key: 'subtotal_revenue', csv: (r) => `৳${parseFloat(r.subtotal_revenue).toFixed(2)}` },
  { header: 'Tax', key: 'total_tax', csv: (r) => `৳${parseFloat(r.total_tax).toFixed(2)}` },
  { header: 'Discounts', key: 'total_discounts', csv: (r) => `৳${parseFloat(r.total_discounts).toFixed(2)}` },
  { header: 'Orders', key: 'total_orders', csv: (r) => r.total_orders },
  { header: 'Avg Order', key: 'avg_order_value', csv: (r) => `৳${parseFloat(r.avg_order_value).toFixed(2)}` },
  { header: 'Voids', key: 'void_count', csv: (r) => r.void_count },
]

function TableSkeleton({ rows = 8 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-50">
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className={`h-3 rounded bg-slate-100 ${j === 0 ? 'w-24' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function SalesReport() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [page, setPage] = useState(1)

  const params = { from_date: fromDate, to_date: toDate, page, per_page: 20 }
  const { data: res, isFetching, isError } = useGetSalesReportQuery(params)
  const rows = res?.data ?? []
  const meta = res?.meta

  // Aggregated summary stats across current page
  const totalRevenue = rows.reduce((s, r) => s + parseFloat(r.total_revenue || 0), 0)
  const totalOrders = rows.reduce((s, r) => s + parseInt(r.total_orders || 0), 0)
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const totalVoids = rows.reduce((s, r) => s + parseInt(r.void_count || 0), 0)

  const handleCSV = () => exportCSV('sales_report', COLUMNS, rows)
  const handlePDF = () => exportPDF('Sales Report', COLUMNS, rows)

  return (
    <div>
      <PageHeader
        title="Sales Report"
        description="Daily revenue, order breakdown, and payment collection by date range."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleCSV} className="btn-secondary flex items-center gap-1.5 text-xs">
              <FiDownload size={14} /> CSV
            </button>
            <button onClick={handlePDF} className="btn-secondary flex items-center gap-1.5 text-xs">
              <FiFileText size={14} /> PDF
            </button>
          </div>
        }
      />

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
            className="input-field w-40" max={toDate} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1) }}
            className="input-field w-40" min={fromDate} />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={totalRevenue} prefix="৳" icon={FiTrendingUp} />
        <StatCard label="Total Orders" value={totalOrders} icon={FiShoppingCart} />
        <StatCard label="Avg Order Value" value={avgOrder.toFixed(2)} prefix="৳" icon={FiCreditCard} />
        <StatCard label="Void Count" value={totalVoids} icon={FiUsers} />
      </div>

      {/* Bar Chart */}
      {rows.length > 0 && (
        <div className="panel p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Daily Revenue</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rows} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEDE6" />
              <XAxis dataKey="period_label" tick={{ fontSize: 11, fill: '#83858F' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#83858F' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `৳${parseFloat(v).toLocaleString('en-IN')}`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="total_revenue" name="Revenue" radius={[3, 3, 0, 0]}>
                {rows.map((_, i) => <Cell key={i} fill="#FF5A1F" fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Table */}
      <div className="panel overflow-hidden">
        <AnimatePresence mode="wait">
          {isFetching ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TableSkeleton />
            </motion.div>
          ) : isError ? (
            <EmptyState title="Failed to load sales data" description="Check your connection or try again." />
          ) : rows.length === 0 ? (
            <EmptyState title="No sales data found" description="Adjust your date range to see results." />
          ) : (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      {COLUMNS.map((c) => <th key={c.key}>{c.header}</th>)}
                      <th>Dine-in</th>
                      <th>Takeaway</th>
                      <th>Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="font-mono text-xs">{r.period_label}</td>
                        <td className="font-semibold text-ticket-orange stat-mono">৳{parseFloat(r.total_revenue).toLocaleString('en-IN')}</td>
                        <td className="stat-mono">৳{parseFloat(r.subtotal_revenue).toLocaleString('en-IN')}</td>
                        <td className="stat-mono text-amber-600">৳{parseFloat(r.total_tax).toFixed(2)}</td>
                        <td className="stat-mono text-rose-signal">৳{parseFloat(r.total_discounts).toFixed(2)}</td>
                        <td>{r.total_orders}</td>
                        <td className="stat-mono">৳{parseFloat(r.avg_order_value).toFixed(2)}</td>
                        <td>{r.void_count > 0 ? <span className="badge badge-rose">{r.void_count}</span> : <span className="text-slate-300">—</span>}</td>
                        <td>{r.dine_in_count} / ৳{parseFloat(r.dine_in_revenue).toFixed(0)}</td>
                        <td>{r.takeaway_count}</td>
                        <td>{r.delivery_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {rows.length} of {meta.total} records
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">Prev</button>
              <span className="text-xs px-2">{page} / {meta.total_pages}</span>
              <button onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages}
                className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
