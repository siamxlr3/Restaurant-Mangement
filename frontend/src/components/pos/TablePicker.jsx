import { useMemo } from 'react'
import { useGetTablesQuery } from '../../store/api/tablesApi'
import { RiUserLine } from 'react-icons/ri'

const STATUS_STYLE = {
  open:     { bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  occupied: { bg: 'bg-rose-50 border-rose-200 cursor-not-allowed opacity-60', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  cleaning: { bg: 'bg-amber-50 border-amber-200 cursor-not-allowed opacity-60', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
}

function TableCard({ table, selectedId, onSelect }) {
  const style   = STATUS_STYLE[table.status] || STATUS_STYLE.open
  const canPick = table.status === 'open'
  const selected = selectedId === table.id

  return (
    <button
      disabled={!canPick}
      onClick={() => canPick && onSelect(table)}
      className={`panel p-4 text-left transition-all duration-200 border-2 ${style.bg} ${
        selected ? '!border-ticket-orange !bg-orange-50 shadow-card' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="font-display font-semibold text-ink text-sm">{table.name}</p>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <RiUserLine size={12} />
        <span>{table.capacity} seats</span>
      </div>
      {table.waiter && (
        <p className="mt-1 text-xs text-slate-400 truncate">Waiter: {table.waiter.name}</p>
      )}
    </button>
  )
}

function SectionGroup({ section, tables, selectedId, onSelect }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{section}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tables.map((t) => (
          <TableCard key={t.id} table={t} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

/**
 * TablePicker — visual table grid grouped by section.
 * Props:
 *   selectedTableId (string|null)
 *   onSelect        (fn) — called with table object
 */
export default function TablePicker({ selectedTableId, onSelect }) {
  const { data: response, isLoading } = useGetTablesQuery({ per_page: 100 })

  const tables  = response?.data || []
  const grouped = useMemo(() => {
    const map = {}
    tables.forEach((t) => {
      const sec = t.section || 'Main Hall'
      if (!map[sec]) map[sec] = []
      map[sec].push(t)
    })
    return map
  }, [tables])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="panel p-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded mb-3 w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!tables.length) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-sm">No tables found. Create tables in the Tables module first.</p>
      </div>
    )
  }

  return (
    <div>
      {Object.entries(grouped).map(([section, sectionTables]) => (
        <SectionGroup
          key={section}
          section={section}
          tables={sectionTables}
          selectedId={selectedTableId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
