import { Sparkles, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner } from '../../components/ui/Common'
import { useGetReorderSuggestionsQuery } from '../../store/api/inventoryApi'

const urgencyTone = { high: 'rose', medium: 'amber', low: 'slate' }

export default function ReorderSuggestions() {
  const { data, isLoading } = useGetReorderSuggestionsQuery()

  return (
    <div>
      <PageHeader
        title="Reorder suggestions"
        description="AI-generated purchase recommendations based on stock trend and demand forecast."
      />

      <div className="ticket-card p-4 pt-5 mb-6 flex items-center gap-3 bg-ticket-orangeDim/40 border-ticket-orange/20">
        <Sparkles size={18} className="text-ticket-orange shrink-0" />
        <p className="text-sm text-ink">
          These suggestions update every hour using current stock levels, recipe usage rates, and the demand
          forecast. Approve to generate a draft purchase order.
        </p>
      </div>

      {isLoading ? (
        <Spinner label="Running the reorder model…" />
      ) : (
        <div className="space-y-3">
          {data.map((s) => (
            <div key={s.id} className="panel p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-ticket-orangeDim flex items-center justify-center shrink-0">
                <AlertTriangle size={17} className="text-ticket-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-ink">{s.ingredient}</p>
                  <Badge tone={urgencyTone[s.urgency]}>{s.urgency} urgency</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{s.reason}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="stat-mono font-semibold text-ink">
                  {s.suggestedQty} {s.unit}
                </p>
                <p className="text-xs text-slate-400">suggested qty</p>
              </div>
              <button className="btn-accent shrink-0">Approve</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
