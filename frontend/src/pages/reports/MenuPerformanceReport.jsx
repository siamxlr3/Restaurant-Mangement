import { useState } from 'react'
import { FiDownload, FiFileText, FiAward, FiTrendingDown, FiTag, FiBarChart2 } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { EmptyState, Badge } from '../../components/ui/Common'
import { useGetMenuPerformanceQuery } from '../../store/api/reportsApi'
import { exportCSV, exportPDF } from '../../utils/exportUtils'

const COLUMNS = [
  { header: 'Rank', key: 'rank' },
  { header: 'Item', key: 'item_name' },
  { header: 'Category', key: 'category_name' },
  { header: 'Qty Sold', key: 'total_qty_sold' },
  { header: 'Revenue', key: 'total_revenue', csv: (r) => `৳${parseFloat(r.total_revenue).toFixed(2)}` },
  { header: 'Avg Price', key: 'avg_unit_price', csv: (r) => `৳${parseFloat(r.avg_unit_price).toFixed(2)}` },
  { header: 'Profit', key: 'gross_profit', csv: (r) => `৳${parseFloat(r.gross_profit).toFixed(2)}` },
  { header: 'Margin %', key: 'margin_pct', csv: (r) => `${parseFloat(r.margin_pct).toFixed(1)}%` },
  { header: 'Rev Share %', key: 'revenue_share_pct', csv: (r) => `${parseFloat(r.revenue_share_pct).toFixed(1)}%` },
  { header: 'Slow Mover', key: 'is_slow_mover', csv: (r) => r.is_slow_mover ? 'Yes' : 'No' },
]

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-50">
          <div className="w-6 h-3 rounded bg-slate-100" />
          <div className="flex-1 h-3 rounded bg-slate-100" />
          <div className="w-20 h-3 rounded bg-slate-100" />
          <div className="w-16 h-3 rounded bg-slate-100" />
          <div className="w-16 h-3 rounded bg-slate-100" />
          <div className="w-12 h-3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export default function MenuPerformanceReport() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [page, setPage] = useState(1)

  const params = { from_date: fromDate, to_date: toDate, search: search || undefined, status: status !== 'all' ? status : undefined, page, per_page: 20 }
  const { data: res, isFetching, isError } = useGetMenuPerformanceQuery(params)
  const rows = res?.data ?? []
  const meta = res?.meta

  const topItem = rows[0]
  const slowMovers = rows.filter((r) => r.is_slow_mover).length
  const avgMargin = rows.length > 0 ? rows.reduce((s, r) => s + parseFloat(r.margin_pct || 0), 0) / rows.length : 0
  const totalRevenue = rows.reduce((s, r) => s + parseFloat(r.total_revenue || 0), 0)

  const handleCSV = () => exportCSV('menu_performance', COLUMNS, rows)
  const handlePDF = () => exportPDF('Menu Performance Report', COLUMNS, rows)

  // Top 5 for radar
  const radarData = rows.slice(0, 5).map((r) => ({
    name: r.item_name.length > 14 ? r.item_name.slice(0, 14) + '…' : r.item_name,
    Revenue: parseFloat(r.total_revenue || 0),
    Margin: parseFloat(r.margin_pct || 0),
    Qty: parseInt(r.total_qty_sold || 0),
  }))

  return (
    <div>
      <PageHeader
        title="Menu Performance"
        description="Best-selling items ranked by revenue contribution, margins, and slow-mover detection."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleCSV} className="btn-secondary text-xs flex items-center gap-1.5"><FiDownload size={14} /> CSV</button>
            <button onClick={handlePDF} className="btn-secondary text-xs flex items-center gap-1.5"><FiFileText size={14} /> PDF</button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Search Item</label>
          <input
            type="text" value={search} placeholder="Search menu item…"
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Availability</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input-field">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1) }} className="input-field w-40" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1) }} className="input-field w-40" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Top Seller" value={topItem?.item_name ?? '—'} icon={FiAward} />
        <StatCard label="Avg Margin" value={`${avgMargin.toFixed(1)}%`} icon={FiBarChart2} />
        <StatCard label="Total Revenue" value={totalRevenue} prefix="৳" icon={FiTag} />
        <StatCard label="Slow Movers" value={slowMovers} icon={FiTrendingDown} />
      </div>

      {/* Radar Chart — top 5 items */}
      {radarData.length > 0 && (
        <div className="panel p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Top 5 Items Performance Overview</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#83858F' }} />
              <Radar name="Revenue" dataKey="Revenue" stroke="#FF5A1F" fill="#FF5A1F" fillOpacity={0.25} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
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
            <EmptyState title="Failed to load menu performance" description="Check your connection or try again." />
          ) : rows.length === 0 ? (
            <EmptyState title="No items found" description="Adjust your filters to see performance data." />
          ) : (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Revenue</th>
                      <th>Avg Price</th>
                      <th>Gross Profit</th>
                      <th>Margin</th>
                      <th>Rev Share</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.menu_item_id || r.item_name}>
                        <td>
                          <span className={`stat-mono text-xs font-semibold ${r.rank <= 3 ? 'text-ticket-orange' : 'text-slate-400'}`}>
                            #{r.rank}
                          </span>
                        </td>
                        <td className="font-medium text-ink">{r.item_name}</td>
                        <td><span className="badge badge-slate">{r.category_name || '—'}</span></td>
                        <td className="stat-mono">{r.total_qty_sold}</td>
                        <td className="stat-mono font-semibold text-ticket-orange">৳{parseFloat(r.total_revenue).toLocaleString('en-IN')}</td>
                        <td className="stat-mono">৳{parseFloat(r.avg_unit_price).toFixed(2)}</td>
                        <td className="stat-mono text-pass-green">৳{parseFloat(r.gross_profit).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${parseFloat(r.margin_pct) >= 40 ? 'badge-green' : parseFloat(r.margin_pct) >= 20 ? 'badge-amber' : 'badge-rose'}`}>
                            {parseFloat(r.margin_pct).toFixed(1)}%
                          </span>
                        </td>
                        <td className="stat-mono text-slate-500">{parseFloat(r.revenue_share_pct).toFixed(1)}%</td>
                        <td>
                          {r.is_slow_mover
                            ? <span className="badge badge-amber">Slow Mover</span>
                            : <span className="badge badge-green">Active</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Showing {rows.length} of {meta.total} items</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">Prev</button>
              <span className="text-xs px-2">{page} / {meta.total_pages}</span>
              <button onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
