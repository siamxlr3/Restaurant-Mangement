import { Plus, Calendar } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Common'
import { useGetShiftsQuery } from '../../store/api/staffApi'

export default function Shifts() {
  const { data, isLoading } = useGetShiftsQuery()

  return (
    <div>
      <PageHeader
        title="Shifts"
        description="Upcoming and active shift schedule."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            Schedule shift
          </button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading the schedule…" />
      ) : (
        <div className="panel divide-y divide-slate-50">
          {data.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Calendar size={15} className="text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{s.staff}</p>
                <p className="text-xs text-slate-400">{s.role}</p>
              </div>
              <div className="text-right">
                <p className="stat-mono text-sm text-ink">
                  {s.start} – {s.end}
                </p>
                <p className="text-xs text-slate-400">{s.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
