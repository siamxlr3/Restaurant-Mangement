import { Sparkles, TrendingUp, AlertTriangle, Radar } from 'lucide-react'

const typeConfig = {
  opportunity: { icon: TrendingUp, label: 'Opportunity', badge: 'badge-green' },
  risk: { icon: AlertTriangle, label: 'Risk', badge: 'badge-amber' },
  anomaly: { icon: Radar, label: 'Anomaly', badge: 'badge-rose' },
  default: { icon: Sparkles, label: 'Insight', badge: 'badge-orange' },
}

export default function AIInsightCard({ insight, onAction }) {
  const cfg = typeConfig[insight.type] || typeConfig.default
  const Icon = cfg.icon

  return (
    <div className="ticket-card p-5 pt-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className={`badge ${cfg.badge}`}>
          <Icon size={12} />
          {cfg.label}
        </span>
        <span className="stat-mono text-xs text-slate-400">{insight.confidence}% confidence</span>
      </div>
      <h3 className="font-display font-semibold text-ink text-[15px] leading-snug">
        {insight.title}
      </h3>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed flex-1">{insight.body}</p>
      <button
        onClick={() => onAction?.(insight)}
        className="mt-4 text-sm font-semibold text-ticket-orange hover:text-orange-600 transition-colors text-left flex items-center gap-1"
      >
        {insight.action} →
      </button>
    </div>
  )
}
