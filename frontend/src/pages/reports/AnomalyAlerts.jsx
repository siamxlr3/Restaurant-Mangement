import { Radar, Clock } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Common'

const alerts = [
  { id: 'an1', title: 'Discount usage spike at Counter 2', detail: 'Manual discounts applied 3.2x more than 30-day average during the 7–9 PM window.', severity: 'high', time: '34 min ago' },
  { id: 'an2', title: 'Inventory variance: Basmati Rice', detail: 'Recipe-implied usage and actual depletion differ by 11kg this week.', severity: 'medium', time: '2 hrs ago' },
  { id: 'an3', title: 'Slow ticket times, Kitchen Line B', detail: 'Average fire-to-pass time up 6 minutes versus the weekly baseline.', severity: 'medium', time: '3 hrs ago' },
  { id: 'an4', title: 'Repeated void on same item', detail: 'Garlic Butter Prawns voided 5 times this week from the same terminal — worth checking prep consistency.', severity: 'low', time: 'Yesterday' },
]

const severityTone = { high: 'rose', medium: 'amber', low: 'slate' }

export default function AnomalyAlerts() {
  return (
    <div>
      <PageHeader
        title="Anomaly alerts"
        description="Unusual patterns flagged automatically across sales, inventory, and kitchen operations."
      />

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="ticket-card p-5 pt-6 flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <Radar size={16} className="text-slate-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge tone={severityTone[a.severity]}>{a.severity} severity</Badge>
                <p className="font-display font-semibold text-ink text-sm">{a.title}</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{a.detail}</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
              <Clock size={12} />
              {a.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
