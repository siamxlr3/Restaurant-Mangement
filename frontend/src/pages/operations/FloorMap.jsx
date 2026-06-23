import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FiPlus, FiEdit2, FiTrash2, FiUsers, FiRefreshCw,
  FiWifi, FiUserCheck, FiFilter, FiGrid,
} from 'react-icons/fi'
import { RiTableLine } from 'react-icons/ri'
import PageHeader from '../../components/ui/PageHeader'
import TableForm from '../../components/floor/TableForm'
import {
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useTransitionStatusMutation,
} from '../../store/api/tablesApi'

// ─── Status configuration ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  open: {
    label: 'Open',
    next: 'occupied',
    nextLabel: 'Seat Guests',
    cardBg: 'bg-pass-greenDim',
    border: 'border-pass-green',
    text: 'text-pass-green',
    badge: 'bg-pass-green/15 text-pass-green',
    dot: 'bg-pass-green',
    actionBg: 'bg-pass-green/10 hover:bg-pass-green/20 text-pass-green',
  },
  occupied: {
    label: 'Occupied',
    next: 'cleaning',
    nextLabel: 'Mark Cleaning',
    cardBg: 'bg-ticket-orangeDim',
    border: 'border-ticket-orange',
    text: 'text-ticket-orange',
    badge: 'bg-ticket-orange/15 text-ticket-orange',
    dot: 'bg-ticket-orange',
    actionBg: 'bg-ticket-orange/10 hover:bg-ticket-orange/20 text-ticket-orange',
  },
  cleaning: {
    label: 'Cleaning',
    next: 'open',
    nextLabel: 'Mark Open',
    cardBg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-500',
    badge: 'bg-slate-200 text-slate-600',
    dot: 'bg-slate-400',
    actionBg: 'bg-slate-100 hover:bg-slate-200 text-slate-600',
  },
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-5 animate-pulse aspect-square flex flex-col gap-3 items-center justify-center">
      <div className="w-12 h-5 bg-slate-200 rounded" />
      <div className="w-16 h-3 bg-slate-200 rounded" />
      <div className="w-10 h-3 bg-slate-200 rounded" />
    </div>
  )
}

// ─── Single table card ────────────────────────────────────────────────────────
function TableCard({ table, onEdit, onDelete, onTransition, transitioning }) {
  const s = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.open

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border-2 ${s.cardBg} ${s.border} p-4 flex flex-col gap-2 group hover:shadow-lg transition-shadow`}
    >
      {/* Live status dot */}
      <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot}`} />

      {/* Table name + section */}
      <div>
        <p className={`font-display font-bold text-xl stat-mono ${s.text}`}>{table.name}</p>
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{table.section}</span>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <FiUsers size={11} />
        <span>{table.capacity} seats</span>
      </div>

      {/* Waiter */}
      {table.waiter ? (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <FiUserCheck size={11} />
          <span className="truncate">{table.waiter.name}</span>
        </div>
      ) : (
        <div className="text-xs text-slate-300 italic">No waiter</div>
      )}

      {/* Status badge */}
      <span className={`inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>

      {/* Actions — show on hover */}
      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-black/5">
        {/* Status transition */}
        <button
          onClick={() => onTransition(table, s.next)}
          disabled={transitioning}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-medium transition-colors ${s.actionBg} disabled:opacity-50`}
        >
          {transitioning ? (
            <FiRefreshCw size={11} className="animate-spin" />
          ) : (
            <FiRefreshCw size={11} />
          )}
          {s.nextLabel}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(table)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-ticket-orange hover:bg-ticket-orange/10 transition-colors"
        >
          <FiEdit2 size={13} />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(table)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────
function DeleteDialog({ table, onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <FiTrash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-ink">Delete Table</h3>
            <p className="text-sm text-slate-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          Are you sure you want to delete <strong>{table.name}</strong>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            {isLoading && <FiRefreshCw size={13} className="animate-spin" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main FloorMap page
// ═══════════════════════════════════════════════════════════════════════════════
export default function FloorMap() {
  const [activeSection, setActiveSection] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [transitioning, setTransitioning] = useState(null) // table id

  // Fetch all tables (no pagination needed for floor view — we load all)
  const { data: res, isLoading, isFetching } = useGetTablesQuery({ per_page: 100 })
  const tables = res?.data ?? []

  // RTK mutations
  const [createTable, { isLoading: creating }] = useCreateTableMutation()
  const [updateTable, { isLoading: updating }] = useUpdateTableMutation()
  const [deleteTable, { isLoading: deleting }] = useDeleteTableMutation()
  const [transitionStatus] = useTransitionStatusMutation()

  // Build dynamic section tabs from data
  const sections = useMemo(() => {
    const set = new Set(tables.map((t) => t.section))
    return ['All', ...Array.from(set).sort()]
  }, [tables])

  // Filter by active section
  const filteredTables = useMemo(() => {
    if (activeSection === 'All') return tables
    return tables.filter((t) => t.section === activeSection)
  }, [tables, activeSection])

  // Stats summary
  const stats = useMemo(() => ({
    total: tables.length,
    open: tables.filter((t) => t.status === 'open').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    cleaning: tables.filter((t) => t.status === 'cleaning').length,
  }), [tables])

  // ── Handlers ──
  const handleOpenCreate = () => {
    setEditTarget(null)
    setShowForm(true)
  }

  const handleOpenEdit = (table) => {
    setEditTarget(table)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditTarget(null)
  }

  const handleFormSubmit = async (data) => {
    try {
      if (editTarget) {
        await updateTable({ id: editTarget.id, ...data }).unwrap()
        toast.success(`Table "${data.name}" updated`)
      } else {
        await createTable(data).unwrap()
        toast.success(`Table "${data.name}" created`)
      }
      handleCloseForm()
    } catch (err) {
      toast.error(err?.data?.message ?? 'Something went wrong')
    }
  }

  const handleTransition = async (table, newStatus) => {
    setTransitioning(table.id)
    try {
      await transitionStatus({ id: table.id, status: newStatus }).unwrap()
      toast.success(`${table.name} → ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`)
    } catch (err) {
      toast.error(err?.data?.message ?? 'Status change failed')
    } finally {
      setTransitioning(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteTable(deleteTarget.id).unwrap()
      toast.success(`Table "${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err?.data?.message ?? 'Delete failed')
    }
  }

  return (
    <div>
      {/* ── Page header ── */}
      <PageHeader
        title="Floor Map"
        description="Live table status and management across all sections."
        actions={
          <div className="flex items-center gap-2">
            {isFetching && !isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <FiWifi size={12} className="animate-pulse text-pass-green" /> Live
              </span>
            )}
            <button
              onClick={handleOpenCreate}
              className="btn-primary flex items-center gap-1.5"
            >
              <FiPlus size={15} />
              Add Table
            </button>
          </div>
        }
      />

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Tables', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Open', value: stats.open, color: 'text-pass-green', bg: 'bg-pass-greenDim border-pass-green/30' },
          { label: 'Occupied', value: stats.occupied, color: 'text-ticket-orange', bg: 'bg-ticket-orangeDim border-ticket-orange/30' },
          { label: 'Cleaning', value: stats.cleaning, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
        ].map((stat) => (
          <div key={stat.label} className={`panel border ${stat.bg} px-4 py-3 rounded-xl flex items-center justify-between`}>
            <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
            <span className={`font-display font-bold text-xl stat-mono ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Status legend + section tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Section tabs */}
        {sections.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 overflow-x-auto">
            <FiFilter size={13} className="text-slate-400 ml-1 shrink-0" />
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSection === sec
                    ? 'bg-white text-ink shadow-card'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Floor grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <TableSkeleton key={i} />)}
        </div>
      ) : filteredTables.length === 0 ? (
        // ── Empty state ──
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <RiTableLine size={28} className="text-slate-300" />
          </div>
          <h3 className="font-display font-semibold text-slate-700 mb-1">
            {activeSection === 'All' ? 'No tables yet' : `No tables in "${activeSection}"`}
          </h3>
          <p className="text-sm text-slate-400 mb-5 max-w-xs">
            {activeSection === 'All'
              ? 'Add your first table to start managing your floor layout.'
              : 'Try switching sections or create a table for this area.'}
          </p>
          {activeSection === 'All' && (
            <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-1.5">
              <FiPlus size={14} /> Add First Table
            </button>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
                onTransition={handleTransition}
                transitioning={transitioning === table.id}
              />
            ))}
          </AnimatePresence>

          {/* Add Table ghost card */}
          <motion.button
            layout
            onClick={handleOpenCreate}
            className="rounded-2xl border-2 border-dashed border-slate-200 aspect-square flex flex-col items-center justify-center gap-2 text-slate-300 hover:border-ticket-orange hover:text-ticket-orange transition-colors group"
          >
            <FiGrid size={22} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Add Table</span>
          </motion.button>
        </motion.div>
      )}

      {/* ── TableForm modal ── */}
      <AnimatePresence>
        {showForm && (
          <TableForm
            initialData={editTarget}
            onSubmit={handleFormSubmit}
            onClose={handleCloseForm}
            isLoading={creating || updating}
          />
        )}
      </AnimatePresence>

      {/* ── Delete dialog ── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteDialog
            table={deleteTarget}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
            isLoading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
