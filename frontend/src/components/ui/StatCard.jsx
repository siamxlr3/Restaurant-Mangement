import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function StatCard({ label, value, prefix = '', suffix = '', delta, trend, icon: Icon }) {
  const isUp = trend === 'up'
  return (
    <div className="ticket-card p-5 pt-6">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        {Icon && <Icon size={16} className="text-slate-300" />}
      </div>
      <p className="stat-mono text-2xl font-semibold text-ink mt-2">
        {prefix}
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        {suffix}
      </p>
      {delta !== undefined && (
        <div
          className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold ${
            isUp ? 'text-pass-green' : 'text-rose-signal'
          }`}
        >
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span className="stat-mono">{Math.abs(delta)}%</span>
          <span className="text-slate-400 font-normal">vs last week</span>
        </div>
      )}
    </div>
  )
}
