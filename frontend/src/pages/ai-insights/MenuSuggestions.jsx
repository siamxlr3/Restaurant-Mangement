import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LuSparkles, LuCircleAlert, LuTrendingUp, LuTrendingDown,
  LuRefreshCw, LuCheck, LuX, LuFilter, LuCalendar, LuSearch,
  LuChevronLeft, LuChevronRight, LuBrainCircuit, LuTag,
} from 'react-icons/lu'
import PageHeader from '../../components/ui/PageHeader'
import {
  useGetMenuSuggestionsQuery,
  useGetMenuSuggestionStatsQuery,
  useTriggerMenuAIJobMutation,
  useApplySuggestionMutation,
  useDismissSuggestionMutation,
} from '../../store/api/menuAIApi'

// ── Constants ────────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
  remove:  { label: 'Remove',  Icon: LuTrendingDown, bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700' },
  reprice: { label: 'Reprice', Icon: LuTag,          bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
  promote: { label: 'Promote', Icon: LuTrendingUp,   bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700' },
  bundle:  { label: 'Bundle',  Icon: LuSparkles,     bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
}

const PER_PAGE_OPTIONS = [10, 20, 50]

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, subLabel, accent }) {
  const accentMap = {
    orange:  'from-orange-500 to-amber-500',
    emerald: 'from-emerald-500 to-teal-500',
    blue:    'from-blue-500 to-indigo-500',
  }
  return (
    <div className="panel p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center shrink-0`}>
        <LuBrainCircuit className="text-white" size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value ?? '—'}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
      </div>
    </div>
  )
}

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.promote
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function SuggestionCard({ suggestion, onApply, onDismiss, isApplying, isDismissing }) {
  const cfg = ACTION_CONFIG[suggestion.action] || ACTION_CONFIG.promote
  const itemName = suggestion.menu_item?.name || 'Unknown Item'
  const itemPrice = suggestion.menu_item?.base_price
    ? `৳${parseFloat(suggestion.menu_item.base_price).toFixed(2)}`
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`panel p-5 border-l-4 ${cfg.border}`}
    >
      <div className="flex items-start gap-4">
        {/* Action icon */}
        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
          <cfg.Icon className={cfg.text} size={18} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <ActionBadge action={suggestion.action} />
            <span className="font-semibold text-ink text-sm">{itemName}</span>
            {itemPrice && <span className="text-xs text-slate-400">({itemPrice})</span>}
            {suggestion.is_applied && (
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <LuCheck size={10} /> Applied
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{suggestion.reason}</p>
          {suggestion.impact_estimate && (
            <p className="mt-2 text-sm font-semibold text-emerald-600">{suggestion.impact_estimate}</p>
          )}
        </div>

        {/* Actions */}
        {!suggestion.is_applied && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onApply(suggestion.id)}
              disabled={isApplying || isDismissing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              {isApplying ? <LuRefreshCw size={12} className="animate-spin" /> : <LuCheck size={12} />}
              Apply
            </button>
            <button
              onClick={() => onDismiss(suggestion.id)}
              disabled={isApplying || isDismissing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 text-xs font-semibold transition-colors"
            >
              {isDismissing ? <LuRefreshCw size={12} className="animate-spin" /> : <LuX size={12} />}
              Dismiss
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="panel p-5 animate-pulse border-l-4 border-slate-200">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
            <div className="h-5 w-32 bg-slate-100 rounded" />
          </div>
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="panel p-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
        <LuBrainCircuit size={28} className="text-slate-300" />
      </div>
      <p className="font-semibold text-ink mb-1">No suggestions found</p>
      <p className="text-sm text-slate-400 max-w-xs">
        {hasFilters
          ? 'No suggestions match your current filters.'
          : 'Run an AI analysis to generate menu recommendations based on your last 30 days of sales data.'}
      </p>
      {hasFilters && (
        <button onClick={onReset} className="mt-4 text-sm text-orange-500 hover:underline font-medium">
          Clear filters
        </button>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MenuSuggestions() {
  // Filters
  const [filters, setFilters] = useState({
    page:       1,
    per_page:   20,
    search:     '',
    action:     '',
    is_applied: '',
    from_date:  '',
    to_date:    '',
  })
  const [searchInput, setSearchInput] = useState('')

  // Debounce search
  const [searchTimer, setSearchTimer] = useState(null)
  const handleSearchChange = (val) => {
    setSearchInput(val)
    clearTimeout(searchTimer)
    const t = setTimeout(() => setFilters(f => ({ ...f, search: val, page: 1 })), 300)
    setSearchTimer(t)
  }

  const setFilter = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: val, page: 1 }))
  }, [])

  const resetFilters = () => {
    setSearchInput('')
    setFilters({ page: 1, per_page: 20, search: '', action: '', is_applied: '', from_date: '', to_date: '' })
  }

  // Build API params (omit empty strings)
  const apiParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
  )

  // RTK Query
  const { data, isLoading, isFetching } = useGetMenuSuggestionsQuery(apiParams)
  const { data: statsData } = useGetMenuSuggestionStatsQuery()
  const [triggerJob, { isLoading: isTriggering }] = useTriggerMenuAIJobMutation()
  const [applyMut] = useApplySuggestionMutation()
  const [dismissMut] = useDismissSuggestionMutation()

  // Per-row loading state
  const [loadingIds, setLoadingIds] = useState({})
  const setRowLoading = (id, key, val) =>
    setLoadingIds(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }))

  const suggestions = data?.data || []
  const meta        = data?.meta || {}
  const stats       = statsData?.data || {}

  const hasFilters = filters.search || filters.action || filters.is_applied || filters.from_date || filters.to_date

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTrigger = async () => {
    try {
      const res = await triggerJob().unwrap()
      toast.success(`Analysis complete! ${res.data?.recordsProcessed ?? 0} suggestions generated.`)
    } catch (err) {
      toast.error(err?.data?.message || 'AI analysis failed. Check your Anthropic API key in Settings.')
    }
  }

  const handleApply = async (id) => {
    setRowLoading(id, 'applying', true)
    try {
      await applyMut(id).unwrap()
      toast.success('Suggestion applied successfully')
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to apply suggestion')
    } finally {
      setRowLoading(id, 'applying', false)
    }
  }

  const handleDismiss = async (id) => {
    setRowLoading(id, 'dismissing', true)
    try {
      await dismissMut(id).unwrap()
      toast.success('Suggestion dismissed')
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to dismiss suggestion')
    } finally {
      setRowLoading(id, 'dismissing', false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Menu Suggestions"
          description="AI-powered recommendations to improve menu profitability, based on your last 30 days of sales data."
        />
        <button
          onClick={handleTrigger}
          disabled={isTriggering}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-all"
        >
          {isTriggering
            ? <LuRefreshCw size={15} className="animate-spin" />
            : <LuSparkles size={15} />}
          {isTriggering ? 'Analysing…' : 'Run AI Analysis'}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50/60">
        <LuCircleAlert size={16} className="text-orange-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600">
          Suggestions are generated by <span className="font-semibold">Claude AI</span> using your encrypted Anthropic API key stored in{' '}
          <span className="font-medium">Settings → AI Configuration</span>. Data never leaves your organization.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Suggestions" value={stats.total} accent="orange" />
        <StatCard label="Pending Review"    value={stats.pending} accent="blue" />
        <StatCard label="Applied"           value={stats.applied} accent="emerald" />
      </div>

      {/* Filter Bar */}
      <div className="panel p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search Item</label>
            <div className="relative">
              <LuSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Garlic Prawns"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Action filter */}
          <div className="min-w-36">
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><LuFilter size={10} />Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilter('action', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Actions</option>
              <option value="remove">Remove</option>
              <option value="reprice">Reprice</option>
              <option value="promote">Promote</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="min-w-36">
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={filters.is_applied}
              onChange={(e) => setFilter('is_applied', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All</option>
              <option value="false">Pending</option>
              <option value="true">Applied</option>
            </select>
          </div>

          {/* Date range */}
          <div className="min-w-36">
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><LuCalendar size={10} />From</label>
            <input
              type="date" max={today}
              value={filters.from_date}
              onChange={(e) => setFilter('from_date', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="min-w-36">
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <input
              type="date" max={today}
              value={filters.to_date}
              onChange={(e) => setFilter('to_date', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Per page */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Per page</label>
            <select
              value={filters.per_page}
              onChange={(e) => setFilters(f => ({ ...f, per_page: Number(e.target.value), page: 1 }))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-orange-500 border border-orange-200 rounded-lg hover:bg-orange-50 font-medium transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Suggestion List */}
      <div className={`space-y-3 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : suggestions.length === 0 ? (
          <EmptyState hasFilters={!!hasFilters} onReset={resetFilters} />
        ) : (
          <AnimatePresence mode="popLayout">
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onApply={handleApply}
                onDismiss={handleDismiss}
                isApplying={loadingIds[s.id]?.applying}
                isDismissing={loadingIds[s.id]?.dismissing}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && meta.total_pages > 1 && (
        <div className="flex items-center justify-between panel px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing {((meta.page - 1) * meta.per_page) + 1}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              disabled={meta.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <LuChevronLeft size={15} />
            </button>
            <span className="text-sm font-medium text-ink px-2">
              {meta.page} / {meta.total_pages}
            </span>
            <button
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              disabled={meta.page >= meta.total_pages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <LuChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
