import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  RiBrainLine,
  RiCheckLine,
  RiDeleteBin6Line,
  RiCloseLine,
  RiRefreshLine,
  RiAlertLine,
  RiFlaskLine,
  RiEditLine,
  RiTimeLine,
  RiShoppingCartLine,
} from 'react-icons/ri'
import PageHeader from '../../components/ui/PageHeader'
import EnhancedDataTable from '../../components/common/EnhancedDataTable'
import {
  useGetReorderSuggestionsQuery,
  useAcceptReorderSuggestionMutation,
} from '../../store/api/inventoryApi'

// ── local RTK mutations via inventoryApi (delete + update) ─────────────────
// These extend inventoryApi via injectEndpoints used within the component
import { inventoryApi } from '../../store/api/inventoryApi'

const extendedApi = inventoryApi.injectEndpoints({
  endpoints: (builder) => ({
    dismissReorderSuggestion: builder.mutation({
      query: (id) => ({ url: `/reorder-suggestions/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'ReorderSuggestion', id: 'LIST' }],
    }),
    updateReorderSuggestion: builder.mutation({
      query: ({ id, suggested_qty }) => ({
        url: `/reorder-suggestions/${id}`,
        method: 'PATCH',
        body: { suggested_qty },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ReorderSuggestion', id },
        { type: 'ReorderSuggestion', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

const { useDismissReorderSuggestionMutation, useUpdateReorderSuggestionMutation } = extendedApi

// ── helpers ────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

const fmtNum = (n, decimals = 2) => (n !== null && n !== undefined ? Number(n).toFixed(decimals) : '—')

// ── Badges ─────────────────────────────────────────────────────────────────
function StatusBadge({ isAccepted }) {
  if (isAccepted)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
        <RiCheckLine size={11} /> Accepted
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
      <RiAlertLine size={11} /> Pending
    </span>
  )
}

// ── Accept Confirmation Modal ───────────────────────────────────────────────
function AcceptModal({ suggestion, onClose }) {
  const [acceptSuggestion, { isLoading }] = useAcceptReorderSuggestionMutation()

  const handleAccept = async () => {
    try {
      await acceptSuggestion(suggestion.id).unwrap()
      toast.success(`Purchase order drafted for ${suggestion.ingredient?.name}`)
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to accept suggestion')
    }
  }

  const estimatedCost =
    (suggestion.ingredient?.cost_per_unit || 0) * (suggestion.suggested_qty || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <RiShoppingCartLine size={18} className="text-accent" />
            <h2 className="font-display font-semibold text-ink text-base">Accept AI Suggestion</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <RiCloseLine size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            This will create a draft purchase order for{' '}
            <strong className="text-ink">{suggestion.ingredient?.name}</strong>.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Ingredient</span>
              <span className="font-semibold text-ink">{suggestion.ingredient?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Suggest Qty</span>
              <span className="stat-mono font-semibold text-ink">
                {fmtNum(suggestion.suggested_qty, 3)} {suggestion.ingredient?.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Est. Cost</span>
              <span className="stat-mono font-semibold text-ink">৳{fmtNum(estimatedCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reason</span>
              <span className="text-ink text-right max-w-[180px]">{suggestion.reason}</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2 text-xs text-indigo-800">
            <RiBrainLine size={14} className="mt-0.5 text-indigo-500 shrink-0" />
            <span>
              AI calculated based on <strong>{fmtNum(suggestion.avg_daily_usage, 3)}</strong>{' '}
              {suggestion.ingredient?.unit}/day average usage.{' '}
              {suggestion.days_remaining !== null
                ? `~${fmtNum(suggestion.days_remaining, 1)} days of stock remaining.`
                : ''}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="btn-accent disabled:opacity-60"
            >
              {isLoading ? 'Creating PO…' : 'Accept & Draft PO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Edit Qty Modal ─────────────────────────────────────────────────────────
function EditQtyModal({ suggestion, onClose }) {
  const [updateSuggestion, { isLoading }] = useUpdateReorderSuggestionMutation()
  const [value, setValue] = useState(suggestion.suggested_qty)

  const handleSave = async () => {
    const qty = parseFloat(value)
    if (!qty || qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    try {
      await updateSuggestion({ id: suggestion.id, suggested_qty: qty }).unwrap()
      toast.success('Suggested quantity updated')
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update suggestion')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <RiEditLine size={18} className="text-accent" />
            <h2 className="font-display font-semibold text-ink text-base">Edit Suggested Qty</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <RiCloseLine size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Adjust the suggested reorder quantity for{' '}
            <strong className="text-ink">{suggestion.ingredient?.name}</strong>.
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Quantity ({suggestion.ingredient?.unit})
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isLoading} className="btn-accent disabled:opacity-60">
              {isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dismiss Confirmation Modal ─────────────────────────────────────────────
function DismissModal({ suggestion, onClose }) {
  const [dismiss, { isLoading }] = useDismissReorderSuggestionMutation()

  const handleDismiss = async () => {
    try {
      await dismiss(suggestion.id).unwrap()
      toast.success(`Suggestion for ${suggestion.ingredient?.name} dismissed`)
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to dismiss suggestion')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <RiDeleteBin6Line size={18} className="text-rose-500" />
            <h2 className="font-display font-semibold text-ink text-base">Dismiss Suggestion</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <RiCloseLine size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to dismiss the AI suggestion for{' '}
            <strong className="text-ink">{suggestion.ingredient?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Dismissing…' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Trigger Job Button ─────────────────────────────────────────────────────
function TriggerJobButton() {
  const [isTriggering, setIsTriggering] = useState(false)

  const handleTrigger = async () => {
    setIsTriggering(true)
    try {
      const res = await fetch('http://localhost:5000/api/v1/reorder-suggestions/trigger', {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('AI prediction job triggered. Refreshing data…')
        // Small delay, then reload suggestions by invalidating existing cache via dispatch
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(json.message || 'Trigger failed')
      }
    } catch {
      toast.error('Could not reach the server')
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <button onClick={handleTrigger} disabled={isTriggering} className="btn-secondary disabled:opacity-60 flex items-center gap-1.5">
      <RiRefreshLine size={15} className={isTriggering ? 'animate-spin' : ''} />
      {isTriggering ? 'Running…' : 'Run AI Now'}
    </button>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ReorderSuggestions() {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 20,
    search: '',
    status: 'all',
    from_date: '',
    to_date: '',
  })

  const [acceptItem, setAcceptItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [dismissItem, setDismissItem] = useState(null)

  const { data: response, isLoading, isFetching } = useGetReorderSuggestionsQuery(filters)
  const suggestions = response?.data || []
  const meta = response?.meta || null

  const handleFilterChange = useCallback((f) => setFilters(f), [])

  const columns = [
    {
      key: 'ingredient',
      header: 'Ingredient',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <RiFlaskLine size={14} className="text-indigo-500" />
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{r.ingredient?.name}</p>
            <p className="text-xs text-slate-400">{r.ingredient?.unit}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'stock_qty',
      header: 'Current Stock',
      render: (r) => (
        <span className="stat-mono text-slate-600">
          {fmtNum(r.ingredient?.stock_qty, 3)} {r.ingredient?.unit}
        </span>
      ),
    },
    {
      key: 'avg_daily_usage',
      header: 'Avg Daily Usage',
      render: (r) => (
        <span className="stat-mono text-slate-600">
          {fmtNum(r.avg_daily_usage, 3)} {r.ingredient?.unit}/day
        </span>
      ),
    },
    {
      key: 'days_remaining',
      header: 'Days Remaining',
      render: (r) => {
        const d = r.days_remaining !== null ? parseFloat(r.days_remaining) : null
        const color =
          d === null ? 'text-slate-400'
          : d <= 2 ? 'text-rose-600 font-bold'
          : d <= 5 ? 'text-amber-600 font-semibold'
          : 'text-emerald-600'
        return (
          <div className={`flex items-center gap-1 ${color}`}>
            <RiTimeLine size={13} />
            <span className="stat-mono">{d !== null ? `~${fmtNum(d, 1)} days` : '∞'}</span>
          </div>
        )
      },
    },
    {
      key: 'suggested_qty',
      header: 'Suggested Reorder',
      render: (r) => (
        <span className="stat-mono font-semibold text-ink">
          {fmtNum(r.suggested_qty, 3)} {r.ingredient?.unit}
        </span>
      ),
    },
    {
      key: 'est_cost',
      header: 'Est. Cost',
      render: (r) => {
        const cost = (r.ingredient?.cost_per_unit || 0) * (r.suggested_qty || 0)
        return <span className="stat-mono text-slate-700">৳{fmtNum(cost)}</span>
      },
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => (
        <span className="text-xs text-slate-500 max-w-[180px] block truncate" title={r.reason}>
          {r.reason}
        </span>
      ),
    },
    {
      key: 'is_accepted',
      header: 'Status',
      render: (r) => <StatusBadge isAccepted={r.is_accepted} />,
    },
    {
      key: 'generated_at',
      header: 'Generated',
      render: (r) => <span className="text-xs text-slate-400">{fmtDate(r.generated_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          {!r.is_accepted && (
            <button
              onClick={() => setAcceptItem(r)}
              title="Accept Suggestion"
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <RiCheckLine size={15} />
            </button>
          )}
          {!r.is_accepted && (
            <button
              onClick={() => setEditItem(r)}
              title="Edit Quantity"
              className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <RiEditLine size={15} />
            </button>
          )}
          <button
            onClick={() => setDismissItem(r)}
            title="Dismiss"
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
          >
            <RiDeleteBin6Line size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="AI Reorder Suggestions"
        description="AI-powered ingredient restock predictions based on daily usage patterns and supplier lead times."
        actions={
          <div className="flex items-center gap-2">
            <TriggerJobButton />
          </div>
        }
      />

      {/* AI Notice Banner */}
      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <RiBrainLine size={16} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-800">Smart Inventory AI</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Suggestions are recalculated nightly at 3:00 AM based on the last 30 days of order activity. 
            Accepting a suggestion will automatically draft a purchase order in the Suppliers module.
          </p>
        </div>
      </div>

      <EnhancedDataTable
        columns={columns}
        data={suggestions}
        isLoading={isLoading || isFetching}
        meta={meta}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {acceptItem && <AcceptModal suggestion={acceptItem} onClose={() => setAcceptItem(null)} />}
      {editItem && <EditQtyModal suggestion={editItem} onClose={() => setEditItem(null)} />}
      {dismissItem && <DismissModal suggestion={dismissItem} onClose={() => setDismissItem(null)} />}
    </div>
  )
}
