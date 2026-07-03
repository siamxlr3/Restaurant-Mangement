import { useState } from 'react'
import { FiActivity, FiClock, FiCheck, FiX, FiDownload, FiFileText, FiBell, FiAlertTriangle } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { EmptyState } from '../../components/ui/Common'
import { useGetAnomalyAlertsQuery, useUpdateAnomalyAlertMutation } from '../../store/api/reportsApi'
import { exportCSV, exportPDF } from '../../utils/exportUtils'

const COLUMNS = [
  { header: 'Feature', key: 'feature' },
  { header: 'Type', key: 'type' },
  { header: 'Headline', key: 'headline' },
  { header: 'Body', key: 'body' },
  { header: 'Confidence', key: 'confidence', csv: (r) => `${(parseFloat(r.confidence || 0) * 100).toFixed(0)}%` },
  { header: 'Status', key: 'is_read', csv: (r) => r.is_read ? 'Read' : 'Unread' },
  { header: 'Generated', key: 'generated_at', csv: (r) => new Date(r.generated_at).toLocaleString() },
]

const typeColors = {
  revenue_drop: 'rose',
  revenue_spike: 'amber',
  inventory: 'amber',
  kitchen: 'orange',
  default: 'slate',
}

function AlertSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="ticket-card p-5 pt-6 flex items-start gap-4">
          <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AnomalyAlerts() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const params = { status: statusFilter !== 'all' ? statusFilter : undefined, page, per_page: 20 }
  const { data: res, isFetching, isError } = useGetAnomalyAlertsQuery(params)
  const alerts = res?.data ?? []
  const meta = res?.meta

  const [updateAlert, { isLoading: isUpdating }] = useUpdateAnomalyAlertMutation()

  const unread = alerts.filter((a) => !a.is_read && !a.is_dismissed).length
  const dismissed = alerts.filter((a) => a.is_dismissed).length
  const total = meta?.total ?? 0

  const handleMarkRead = async (alert) => {
    if (alert.is_read) return
    try {
      await updateAlert({ id: alert.id, is_read: true }).unwrap()
      toast.success('Marked as read')
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleDismiss = async (alert) => {
    if (alert.is_dismissed) return
    try {
      await updateAlert({ id: alert.id, is_dismissed: true }).unwrap()
      toast.success('Alert dismissed')
    } catch {
      toast.error('Failed to dismiss alert')
    }
  }

  const handleCSV = () => exportCSV('anomaly_alerts', COLUMNS, alerts)
  const handlePDF = () => exportPDF('Anomaly Alerts', COLUMNS, alerts)

  return (
    <div>
      <PageHeader
        title="Anomaly Alerts"
        description="AI-powered deviation alerts — revenue spikes/drops vs. same-weekday historical average (>25% threshold)."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleCSV} className="btn-secondary text-xs flex items-center gap-1.5"><FiDownload size={14} /> CSV</button>
            <button onClick={handlePDF} className="btn-secondary text-xs flex items-center gap-1.5"><FiFileText size={14} /> PDF</button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Alerts" value={total} icon={FiBell} />
        <StatCard label="Unread" value={unread} icon={FiAlertTriangle} />
        <StatCard label="Dismissed" value={dismissed} icon={FiCheck} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-0">
        {['all', 'unread', 'read', 'dismissed'].map((f) => (
          <button
            key={f}
            onClick={() => { setStatusFilter(f); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              statusFilter === f
                ? 'border-ticket-orange text-ticket-orange'
                : 'border-transparent text-slate-400 hover:text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      <AnimatePresence mode="wait">
        {isFetching ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AlertSkeleton />
          </motion.div>
        ) : isError ? (
          <EmptyState title="Failed to load alerts" description="Check your connection or try again." />
        ) : alerts.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState
              title="No anomalies detected"
              description="All clear! The system will alert you when revenue deviates more than 25% from the 4-week weekday average."
            />
          </motion.div>
        ) : (
          <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {alerts.map((alert) => {
              const tone = typeColors[alert.type] ?? typeColors.default
              const isDismissed = alert.is_dismissed
              const isRead = alert.is_read
              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isDismissed ? 0.45 : 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`ticket-card p-5 pt-6 flex items-start gap-4 ${!isRead && !isDismissed ? 'ring-1 ring-ticket-orange/30' : ''}`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    tone === 'rose' ? 'bg-rose-50' : tone === 'amber' ? 'bg-amber-50' : 'bg-slate-50'
                  }`}>
                    <FiActivity size={16} className={
                      tone === 'rose' ? 'text-rose-signal' : tone === 'amber' ? 'text-amber-500' : 'text-slate-400'
                    } />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge badge-${tone === 'rose' ? 'rose' : tone === 'amber' ? 'amber' : 'slate'}`}>
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      {!isRead && !isDismissed && (
                        <span className="w-2 h-2 rounded-full bg-ticket-orange" />
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        {(parseFloat(alert.confidence || 0) * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="font-display font-semibold text-ink text-sm leading-snug">{alert.headline}</p>
                    <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{alert.body}</p>
                    {alert.cta_href && (
                      <a href={alert.cta_href} className="inline-flex items-center gap-1 text-xs text-ticket-orange font-semibold mt-2 hover:underline">
                        {alert.cta_label} →
                      </a>
                    )}
                  </div>

                  {/* Time + Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <FiClock size={11} /> {timeAgo(alert.generated_at)}
                    </span>
                    {!isDismissed && (
                      <div className="flex items-center gap-1">
                        {!isRead && (
                          <button
                            onClick={() => handleMarkRead(alert)}
                            disabled={isUpdating}
                            title="Mark as read"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-pass-green transition-colors"
                          >
                            <FiCheck size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(alert)}
                          disabled={isUpdating}
                          title="Dismiss alert"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-signal transition-colors"
                        >
                          <FiX size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-slate-400">Showing {alerts.length} of {meta.total} alerts</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">Prev</button>
            <span className="text-xs px-2">{page} / {meta.total_pages}</span>
            <button onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
