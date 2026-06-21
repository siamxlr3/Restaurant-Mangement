import { Plus, Users, Percent } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Common'

const promotions = [
  { id: 'pr1', name: 'Friday Biryani Night', channel: 'In-app + SMS', status: 'live', reach: 4200, redemptions: 318 },
  { id: 'pr2', name: 'Bring-a-Friend Weekend', channel: 'Social', status: 'live', reach: 8600, redemptions: 540 },
  { id: 'pr3', name: 'Eid Pre-booking Offer', channel: 'Email', status: 'scheduled', reach: 0, redemptions: 0 },
]

const statusTone = { live: 'green', scheduled: 'amber', ended: 'slate' }

export default function Promotions() {
  return (
    <div>
      <PageHeader
        title="Promotions"
        description="Campaigns running across SMS, email, social, and in-app channels."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            New promotion
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {promotions.map((p) => (
          <div key={p.id} className="panel p-5">
            <div className="flex items-center justify-between mb-3">
              <Badge tone={statusTone[p.status]}>{p.status}</Badge>
              <span className="text-xs text-slate-400">{p.channel}</span>
            </div>
            <p className="font-display font-semibold text-ink mb-4">{p.name}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Users size={12} />
                  Reach
                </p>
                <p className="stat-mono font-semibold text-ink">{p.reach.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Percent size={12} />
                  Redemptions
                </p>
                <p className="stat-mono font-semibold text-ink">{p.redemptions.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
