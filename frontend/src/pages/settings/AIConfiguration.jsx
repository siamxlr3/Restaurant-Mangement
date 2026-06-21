import { Sparkles } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'

function Toggle({ defaultOn = false }) {
  return (
    <button className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${defaultOn ? 'bg-ticket-orange' : 'bg-slate-200'}`}>
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-card transition-all ${defaultOn ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  )
}

const aiFeatures = [
  { name: 'AI insight cards on dashboard', desc: 'Surface opportunities, risks, and anomalies on the overview page', on: true },
  { name: 'Reorder suggestions', desc: 'Recommend purchase quantities based on stock and demand trend', on: true },
  { name: 'Demand forecasting', desc: 'Predict covers and dish-level demand for upcoming days', on: true },
  { name: 'Feedback sentiment scoring', desc: 'Automatically score guest feedback as positive, negative, or mixed', on: true },
  { name: 'Anomaly detection', desc: 'Flag unusual patterns in discounts, voids, and kitchen timing', on: false },
  { name: 'Menu suggestions', desc: 'Recommend pricing, promotion, and retirement changes to the menu', on: false },
]

export default function AIConfiguration() {
  return (
    <div>
      <PageHeader title="AI configuration" description="Control which AI features are active across the dashboard." />

      <div className="ticket-card p-4 pt-5 mb-6 flex items-center gap-3 bg-ticket-orangeDim/40 border-ticket-orange/20">
        <Sparkles size={18} className="text-ticket-orange shrink-0" />
        <p className="text-sm text-ink">
          AI features use your sales, inventory, staff, and feedback data to generate recommendations. No data is
          shared outside your organization.
        </p>
      </div>

      <div className="panel divide-y divide-slate-50">
        {aiFeatures.map((f) => (
          <div key={f.name} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{f.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
            </div>
            <Toggle defaultOn={f.on} />
          </div>
        ))}
      </div>

      <div className="panel p-5 mt-6 max-w-md">
        <label className="text-sm font-medium text-ink block mb-1.5">AI suggestion sensitivity</label>
        <p className="text-xs text-slate-400 mb-3">Higher sensitivity surfaces more suggestions, including lower-confidence ones.</p>
        <input type="range" min="1" max="3" defaultValue="2" className="w-full accent-ticket-orange" />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Conservative</span>
          <span>Balanced</span>
          <span>Aggressive</span>
        </div>
      </div>
    </div>
  )
}
