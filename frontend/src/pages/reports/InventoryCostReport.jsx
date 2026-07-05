import { useState } from 'react'
import { FiDownload, FiFileText, FiAlertTriangle, FiDollarSign, FiTrash2 } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { EmptyState } from '../../components/ui/Common'
import { useGetInventoryCostQuery } from '../../store/api/reportsApi'
import { exportCSV, exportPDF } from '../../utils/exportUtils'

const COLUMNS = [
  { header: 'Ingredient', key: 'ingredient_name' },
  { header: 'Unit', key: 'unit' },
  { header: 'Stock Qty', key: 'current_stock_qty', csv: (r) => parseFloat(r.current_stock_qty).toFixed(3) },
  { header: 'Cost/Unit', key: 'cost_per_unit', csv: (r) => `৳${parseFloat(r.cost_per_unit).toFixed(4)}` },
  { header: 'Qty Purchased', key: 'qty_purchased', csv: (r) => parseFloat(r.qty_purchased).toFixed(3) },
  { header: 'Purchase Cost', key: 'purchase_cost', csv: (r) => `৳${parseFloat(r.purchase_cost).toFixed(2)}` },
  { header: 'Theoretical Use', key: 'qty_consumed_theoretical', csv: (r) => parseFloat(r.qty_consumed_theoretical).toFixed(3) },
  { header: 'Actual Use', key: 'qty_consumed_actual', csv: (r) => parseFloat(r.qty_consumed_actual).toFixed(3) },
  { header: 'Wastage', key: 'wastage_value', csv: (r) => `৳${parseFloat(r.wastage_value).toFixed(2)}` },
  { header: 'Supplier', key: 'supplier_name' },
]

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-50">
          <div className="flex-1 h-3 rounded bg-slate-100" />
          <div className="w-12 h-3 rounded bg-slate-100" />
          <div className="w-16 h-3 rounded bg-slate-100" />
          <div className="w-20 h-3 rounded bg-slate-100" />
          <div className="w-16 h-3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export default function InventoryCostReport() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const params = { search: search || undefined, page, per_page: 20 }
  const { data: res, isFetching, isError } = useGetInventoryCostQuery(params)
  const rows = res?.data ?? []
  const meta = res?.meta

  const totalPurchaseCost = rows.reduce((s, r) => s + parseFloat(r.purchase_cost || 0), 0)
  const totalWastageValue = rows.reduce((s, r) => s + parseFloat(r.wastage_value || 0), 0)
  const highWastage = rows.filter((r) => parseFloat(r.wastage_value) > 100).length

  const handleCSV = () => exportCSV('inventory_cost', COLUMNS, rows)
  const handlePDF = () => exportPDF('Inventory Cost Report', COLUMNS, rows)

  // Top 10 wastage items for the chart
  const wastageChart = [...rows]
    .filter((r) => parseFloat(r.wastage_value) > 0)
    .sort((a, b) => parseFloat(b.wastage_value) - parseFloat(a.wastage_value))
    .slice(0, 10)

  return (
    <div>
      <PageHeader
        title="Inventory Cost"
        description="Stock valuation, purchase cost, theoretical vs. actual consumption, and wastage analysis."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleCSV} className="btn-secondary text-xs flex items-center gap-1.5"><FiDownload size={14} /> CSV</button>
            <button onClick={handlePDF} className="btn-secondary text-xs flex items-center gap-1.5"><FiFileText size={14} /> PDF</button>
          </div>
        }
      />

      {/* Search filter */}
      <div className="mb-6">
        <input type="text" value={search} placeholder="Search ingredient…"
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field max-w-xs" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Purchase Cost" value={totalPurchaseCost.toFixed(0)} prefix="৳" icon={FiDollarSign} />
        <StatCard label="Total Wastage" value={totalWastageValue.toFixed(0)} prefix="৳" icon={FiTrash2} />
        <StatCard label="High Wastage Items" value={highWastage} icon={FiAlertTriangle} />
      </div>

      {/* Wastage Bar Chart */}
      {wastageChart.length > 0 && (
        <div className="panel p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Top Wastage by Ingredient (৳)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wastageChart} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EFEDE6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#83858F' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `৳${v.toFixed(0)}`} />
              <YAxis dataKey="ingredient_name" type="category" tick={{ fontSize: 11, fill: '#83858F' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v) => `৳${parseFloat(v).toFixed(2)}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="wastage_value" name="Wastage" radius={[0, 3, 3, 0]}>
                {wastageChart.map((_, i) => (
                  <Cell key={i} fill={parseFloat(_.wastage_value) > 200 ? '#f43f5e' : parseFloat(_.wastage_value) > 100 ? '#f59e0b' : '#d1d5db'} />
                ))}
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
            <EmptyState title="Failed to load inventory data" description="Check your connection or try again." />
          ) : rows.length === 0 ? (
            <EmptyState title="No inventory data found" description="Add ingredients and purchase orders to see cost analysis." />
          ) : (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Unit</th>
                      <th>Stock Qty</th>
                      <th>Purchased</th>
                      <th>Purch. Cost</th>
                      <th>Theoretical</th>
                      <th>Actual</th>
                      <th>Wastage ৳</th>
                      <th>AI POS</th>
                      <th>Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const wastage = parseFloat(r.wastage_value || 0)
                      const isHighWastage = wastage > 100
                      return (
                        <tr key={r.ingredient_id || r.ingredient_name}>
                          <td className="font-medium text-ink">{r.ingredient_name}</td>
                          <td className="text-slate-400 text-xs">{r.unit}</td>
                          <td className="stat-mono">{parseFloat(r.current_stock_qty).toFixed(2)}</td>
                          <td className="stat-mono">{parseFloat(r.qty_purchased).toFixed(2)}</td>
                          <td className="stat-mono">৳{parseFloat(r.purchase_cost).toFixed(2)}</td>
                          <td className="stat-mono text-slate-500">{parseFloat(r.qty_consumed_theoretical).toFixed(2)}</td>
                          <td className="stat-mono">{parseFloat(r.qty_consumed_actual).toFixed(2)}</td>
                          <td>
                            <span className={`stat-mono text-xs font-semibold ${isHighWastage ? 'text-rose-signal' : 'text-slate-600'}`}>
                              {isHighWastage && <FiAlertTriangle className="inline mr-1" size={11} />}
                              ৳{wastage.toFixed(2)}
                            </span>
                          </td>
                          <td className="stat-mono text-slate-400">{r.ai_suggested_pos > 0 ? r.ai_suggested_pos : '—'}</td>
                          <td className="text-xs text-slate-500">{r.supplier_name || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Showing {rows.length} of {meta.total} ingredients</p>
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
