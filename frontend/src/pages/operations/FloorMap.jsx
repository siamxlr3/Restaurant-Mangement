import { useState } from 'react'
import { Users } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Common'
import { useGetTablesQuery } from '../../store/api/operationsApi'

const statusStyles = {
  occupied: 'bg-ticket-orangeDim border-ticket-orange text-ticket-orange',
  available: 'bg-pass-greenDim border-pass-green text-pass-green',
  reserved: 'bg-amber-signal/10 border-amber-signal text-amber-700',
  'needs-cleaning': 'bg-slate-100 border-slate-300 text-slate-500',
}

const statusLabels = {
  occupied: 'Occupied',
  available: 'Available',
  reserved: 'Reserved',
  'needs-cleaning': 'Needs cleaning',
}

export default function FloorMap() {
  const { data: tables, isLoading } = useGetTablesQuery()
  const [floor, setFloor] = useState(1)

  const floorTables = tables?.filter((t) => t.floor === floor) || []

  return (
    <div>
      <PageHeader
        title="Floor map"
        description="Live table status across the dining room."
        actions={
          <div className="flex items-center gap-1 bg-slate-100 rounded-md p-1">
            {[1, 2].map((f) => (
              <button
                key={f}
                onClick={() => setFloor(f)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  floor === f ? 'bg-white text-ink shadow-card' : 'text-slate-500'
                }`}
              >
                Floor {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex items-center gap-4 mb-5 flex-wrap">
        {Object.entries(statusLabels).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-3 h-3 rounded border ${statusStyles[key]}`} />
            {label}
          </span>
        ))}
      </div>

      {isLoading ? (
        <Spinner label="Mapping the floor…" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {floorTables.map((table) => (
            <div
              key={table.id}
              className={`relative rounded-lg border-2 p-4 aspect-square flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-card transition-shadow ${statusStyles[table.status]}`}
            >
              <p className="font-display font-bold text-lg stat-mono">{table.id}</p>
              <p className="flex items-center gap-1 text-xs mt-1 opacity-80">
                <Users size={11} />
                {table.seats} seats
              </p>
              {table.status === 'occupied' && (
                <p className="stat-mono text-xs font-semibold mt-2">৳{table.orderTotal.toLocaleString('en-IN')}</p>
              )}
              {table.server && <p className="text-[11px] mt-0.5 opacity-70">{table.server}</p>}
              {table.startedAt && table.status === 'reserved' && (
                <p className="text-[11px] mt-1 font-medium">{table.startedAt}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
