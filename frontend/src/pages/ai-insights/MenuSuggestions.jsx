import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Common'

const suggestions = [
  {
    id: 1,
    type: 'promote',
    item: 'Garlic Butter Prawns',
    reasoning: 'High margin (57%) and strong repeat-order rate, but appears on page 2 of the digital menu — visibility is limiting volume.',
    impact: '+৳18,000/mo est.',
  },
  {
    id: 2,
    type: 'reprice',
    item: 'Mango Lassi',
    reasoning: 'Price has stayed flat for 14 months while ingredient cost rose 22%. Comparable items in the area are priced ৳20–30 higher.',
    impact: 'Margin +6pts',
  },
  {
    id: 3,
    type: 'retire',
    item: 'Seasonal Veg Curry',
    reasoning: 'Ordered fewer than 4 times per week over the last month, with no clear seasonal upswing expected.',
    impact: 'Frees up prep capacity',
  },
  {
    id: 4,
    type: 'bundle',
    item: 'Beef Tehari + Borhani',
    reasoning: 'These two are already ordered together 40% of the time — a formal combo could lift attach rate further.',
    impact: '+৳9,500/mo est.',
  },
]

const typeConfig = {
  promote: { label: 'Promote', icon: TrendingUp, tone: 'green' },
  reprice: { label: 'Reprice', icon: Sparkles, tone: 'orange' },
  retire: { label: 'Consider retiring', icon: TrendingDown, tone: 'rose' },
  bundle: { label: 'Bundle opportunity', icon: Sparkles, tone: 'amber' },
}

export default function MenuSuggestions() {
  return (
    <div>
      <PageHeader
        title="Menu suggestions"
        description="AI recommendations to improve menu profitability and engagement, based on 90 days of order history."
      />

      <div className="space-y-3">
        {suggestions.map((s) => {
          const cfg = typeConfig[s.type]
          const Icon = cfg.icon
          return (
            <div key={s.id} className="ticket-card p-5 pt-6 flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone={cfg.tone}>{cfg.label}</Badge>
                  <p className="font-display font-semibold text-ink text-sm">{s.item}</p>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{s.reasoning}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="stat-mono text-sm font-semibold text-pass-green">{s.impact}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
