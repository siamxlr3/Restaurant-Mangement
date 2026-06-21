import { Flame, Clock, Check } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Common'
import { useGetKitchenTicketsQuery } from '../../store/api/operationsApi'

export default function KitchenDisplay() {
  const { data: tickets, isLoading } = useGetKitchenTicketsQuery()

  return (
    <div>
      <PageHeader
        title="Kitchen display"
        description="Live ticket rail for the line — oldest and rush tickets surface first."
      />

      {isLoading ? (
        <Spinner label="Pulling tickets from the line…" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tickets.map((ticket) => {
            const isRush = ticket.priority === 'rush'
            return (
              <div
                key={ticket.id}
                className={`ticket-card-dark p-4 pt-6 ${isRush ? 'ring-1 ring-ticket-orange' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="stat-mono font-semibold text-paper text-sm">{ticket.id}</span>
                    <span className="badge badge-slate !bg-white/10 !text-slate-300">
                      {ticket.table}
                    </span>
                  </div>
                  {isRush && (
                    <span className="badge !bg-ticket-orange/20 !text-ticket-orange">
                      <Flame size={11} />
                      Rush
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">{ticket.course}</p>

                <ul className="space-y-1.5 mb-4">
                  {ticket.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-200">
                      <span className="stat-mono text-ticket-orange mr-1.5">{item.qty}×</span>
                      {item.name}
                      {item.notes && <span className="block text-xs text-slate-500 ml-6">{item.notes}</span>}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-3 border-t border-ink-border">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={12} />
                    {ticket.elapsedMin} min
                  </span>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-pass-green hover:text-emerald-400">
                    <Check size={13} />
                    Mark fired
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
