/**
 * OrderStatusBadge — color-coded status pill for orders.
 */
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  preparing: { label: 'Preparing', cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
  ready:     { label: 'Ready',     cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  served:    { label: 'Served',    cls: 'bg-teal-100 text-teal-700 border border-teal-200' },
  closed:    { label: 'Closed',    cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
}

export default function OrderStatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || { label: status, cls: 'bg-slate-100 text-slate-500' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${size === 'lg' ? 'text-sm' : 'text-xs'} ${config.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  )
}
