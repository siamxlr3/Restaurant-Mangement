import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  RiAddLine, RiEditLine, RiDeleteBin6Line,
  RiArrowUpLine, RiArrowDownLine, RiAlertLine,
  RiCloseLine, RiCheckLine, RiFlaskLine,
} from 'react-icons/ri'
import PageHeader from '../../components/ui/PageHeader'
import EnhancedDataTable from '../../components/common/EnhancedDataTable'
import {
  useGetIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useAdjustIngredientStockMutation,
  useDeleteIngredientMutation,
} from '../../store/api/ingredientsApi'

// ── Zod Schemas ────────────────────────────────────────────────────────────
const ingredientSchema = z.object({
  name:                z.string().min(1, 'Name is required').max(150),
  unit:                z.string().min(1, 'Unit is required').max(50),
  stock_qty:           z.coerce.number().min(0, 'Must be >= 0'),
  low_stock_threshold: z.coerce.number().min(0),
  avg_daily_usage:     z.coerce.number().min(0),
  reorder_point:       z.coerce.number().min(0),
  reorder_qty:         z.coerce.number().min(0),
  cost_per_unit:       z.coerce.number().min(0),
  is_active:           z.boolean().optional(),
})

const stockAdjustSchema = z.object({
  mode:   z.enum(['add', 'remove']),
  amount: z.coerce.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required').max(500),
})

// ── Status badge ───────────────────────────────────────────────────────────
function StockBadge({ status }) {
  const map = {
    healthy:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    low:      'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.healthy}`}>
      {status === 'low' || status === 'critical' ? <RiAlertLine size={11} /> : <RiCheckLine size={11} />}
      {status}
    </span>
  )
}

function ActiveBadge({ active }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ── Stock bar ──────────────────────────────────────────────────────────────
function StockBar({ stockQty, threshold }) {
  const pct = threshold > 0 ? Math.min(100, Math.round((stockQty / threshold) * 100)) : 100
  const barColor = pct <= 0 ? 'bg-rose-500' : pct <= 100 ? 'bg-amber-500' : 'bg-emerald-500'
  const finalColor = stockQty >= threshold && threshold > 0 ? 'bg-emerald-500' : barColor
  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${finalColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 stat-mono w-10 text-right">{pct}%</span>
    </div>
  )
}

// ── Modal wrapper ──────────────────────────────────────────────────────────
function Modal({ title, children, onClose, icon }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="font-display font-semibold text-ink text-base">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <RiCloseLine size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Field helpers ──────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all ${className}`}
      {...props}
    />
  )
}

// ── Add / Edit Modal ────────────────────────────────────────────────────────
function IngredientModal({ ingredient, onClose }) {
  const isEdit = !!ingredient
  const [createIngredient, { isLoading: creating }] = useCreateIngredientMutation()
  const [updateIngredient, { isLoading: updating }] = useUpdateIngredientMutation()
  const isSubmitting = creating || updating

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ingredientSchema),
    defaultValues: ingredient
      ? {
          name:                ingredient.name,
          unit:                ingredient.unit,
          stock_qty:           ingredient.stock_qty,
          low_stock_threshold: ingredient.low_stock_threshold,
          avg_daily_usage:     ingredient.avg_daily_usage,
          reorder_point:       ingredient.reorder_point,
          reorder_qty:         ingredient.reorder_qty,
          cost_per_unit:       ingredient.cost_per_unit,
          is_active:           ingredient.is_active,
        }
      : {
          stock_qty: 0, low_stock_threshold: 0, avg_daily_usage: 0,
          reorder_point: 0, reorder_qty: 0, cost_per_unit: 0, is_active: true,
        },
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateIngredient({ id: ingredient.id, ...values }).unwrap()
        toast.success('Ingredient updated successfully')
      } else {
        await createIngredient(values).unwrap()
        toast.success('Ingredient created successfully')
      }
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong')
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Ingredient' : 'Add Ingredient'}
      onClose={onClose}
      icon={<RiFlaskLine size={18} className="text-accent" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g. Basmati Rice" />
          </Field>
          <Field label="Unit *" error={errors.unit?.message}>
            <Input {...register('unit')} placeholder="e.g. g, ml, pcs" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current Stock Qty" error={errors.stock_qty?.message}>
            <Input type="number" step="0.001" {...register('stock_qty')} />
          </Field>
          <Field label="Cost per Unit (৳)" error={errors.cost_per_unit?.message}>
            <Input type="number" step="0.0001" {...register('cost_per_unit')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Low Stock Threshold" error={errors.low_stock_threshold?.message}>
            <Input type="number" step="0.001" {...register('low_stock_threshold')} />
          </Field>
          <Field label="Avg Daily Usage" error={errors.avg_daily_usage?.message}>
            <Input type="number" step="0.001" {...register('avg_daily_usage')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Reorder Point" error={errors.reorder_point?.message}>
            <Input type="number" step="0.001" {...register('reorder_point')} />
          </Field>
          <Field label="Reorder Qty" error={errors.reorder_qty?.message}>
            <Input type="number" step="0.001" {...register('reorder_qty')} />
          </Field>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="is_active" {...register('is_active')} className="rounded" />
          <label htmlFor="is_active" className="text-sm text-slate-700">Active</label>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-accent disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Update Ingredient' : 'Add Ingredient'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Stock Adjust Modal ─────────────────────────────────────────────────────
function StockAdjustModal({ ingredient, onClose }) {
  const [adjustStock, { isLoading }] = useAdjustIngredientStockMutation()
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(stockAdjustSchema),
    defaultValues: { mode: 'add', amount: '', reason: '' },
  })
  const mode = watch('mode')

  const REASONS = [
    'restock', 'wastage', 'spoilage', 'correction', 'count_adjustment', 'other'
  ]

  const onSubmit = async ({ mode, amount, reason }) => {
    const delta = mode === 'remove' ? -Math.abs(amount) : Math.abs(amount)
    try {
      await adjustStock({ id: ingredient.id, delta, reason, adjusted_by: 'manager' }).unwrap()
      toast.success(`Stock ${mode === 'add' ? 'added' : 'removed'} successfully`)
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Adjustment failed')
    }
  }

  return (
    <Modal
      title={`Adjust Stock — ${ingredient.name}`}
      onClose={onClose}
      icon={mode === 'add' ? <RiArrowUpLine size={18} className="text-emerald-500" /> : <RiArrowDownLine size={18} className="text-rose-500" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">Current stock</span>
          <span className="font-semibold text-ink stat-mono">{ingredient.stock_qty} {ingredient.unit}</span>
        </div>

        <Field label="Adjustment type">
          <div className="flex gap-2">
            {['add', 'remove'].map((m) => (
              <label key={m} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${mode === m ? (m === 'add' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700') : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" value={m} {...register('mode')} className="sr-only" />
                {m === 'add' ? <RiArrowUpLine size={16} /> : <RiArrowDownLine size={16} />}
                <span className="text-sm font-medium capitalize">{m}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label={`Amount (${ingredient.unit})`} error={errors.amount?.message}>
          <Input type="number" step="0.001" min="0.001" {...register('amount')} placeholder="0.000" />
        </Field>

        <Field label="Reason *" error={errors.reason?.message}>
          <select {...register('reason')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20">
            <option value="">Select a reason…</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r.replace('_', ' ')}</option>
            ))}
          </select>
        </Field>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-60 ${mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
          >
            {isLoading ? 'Saving…' : `Confirm ${mode === 'add' ? 'Addition' : 'Removal'}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteConfirmModal({ ingredient, onClose }) {
  const [deleteIngredient, { isLoading }] = useDeleteIngredientMutation()
  const handleDelete = async () => {
    try {
      await deleteIngredient(ingredient.id).unwrap()
      toast.success('Ingredient deleted')
      onClose()
    } catch {
      toast.error('Failed to delete ingredient')
    }
  }

  return (
    <Modal title="Delete Ingredient" onClose={onClose} icon={<RiDeleteBin6Line size={18} className="text-rose-500" />}>
      <div className="space-y-4">
        <p className="text-slate-600 text-sm">
          Are you sure you want to delete <strong className="text-ink">{ingredient.name}</strong>?
          This action cannot be undone and will also remove any recipe associations.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Deleting…' : 'Delete Ingredient'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Ingredients() {
  const [filters, setFilters] = useState({ page: 1, per_page: 20, search: '', status: 'all', from_date: '', to_date: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [adjustItem, setAdjustItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  const { data: response, isLoading, isFetching } = useGetIngredientsQuery(filters)
  const ingredients = response?.data || []
  const meta = response?.meta || null

  const handleFilterChange = useCallback((newFilters) => setFilters(newFilters), [])

  const columns = [
    {
      key: 'name',
      header: 'Ingredient',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <RiFlaskLine size={14} className="text-indigo-500" />
          </div>
          <span className="font-medium text-ink">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (r) => <span className="text-slate-500 text-sm">{r.unit}</span>,
    },
    {
      key: 'stock_qty',
      header: 'On Hand',
      render: (r) => (
        <span className={`stat-mono font-semibold ${r.stock_status === 'critical' ? 'text-rose-600' : r.stock_status === 'low' ? 'text-amber-600' : 'text-ink'}`}>
          {r.stock_qty} {r.unit}
        </span>
      ),
    },
    {
      key: 'level',
      header: 'Stock Level',
      render: (r) => <StockBar stockQty={r.stock_qty} threshold={r.low_stock_threshold} />,
    },
    {
      key: 'low_stock_threshold',
      header: 'Par Level',
      render: (r) => <span className="stat-mono text-slate-400">{r.low_stock_threshold} {r.unit}</span>,
    },
    {
      key: 'reorder_point',
      header: 'Reorder At',
      render: (r) => <span className="stat-mono text-slate-400">{r.reorder_point} {r.unit}</span>,
    },
    {
      key: 'cost_per_unit',
      header: 'Cost/Unit',
      render: (r) => <span className="stat-mono">৳{r.cost_per_unit.toFixed(2)}</span>,
    },
    {
      key: 'stock_status',
      header: 'Stock Status',
      render: (r) => <StockBadge status={r.stock_status} />,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (r) => <ActiveBadge active={r.is_active} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAdjustItem(r)}
            title="Adjust Stock"
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <RiArrowUpLine size={15} />
          </button>
          <button
            onClick={() => setEditItem(r)}
            title="Edit"
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <RiEditLine size={15} />
          </button>
          <button
            onClick={() => setDeleteItem(r)}
            title="Delete"
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
        title="Ingredients"
        description="Track stock levels, set par thresholds, and manage kitchen inventory."
        actions={
          <button className="btn-accent" onClick={() => setShowAdd(true)}>
            <RiAddLine size={15} />
            Add Ingredient
          </button>
        }
      />

      <EnhancedDataTable
        columns={columns}
        data={ingredients}
        isLoading={isLoading || isFetching}
        meta={meta}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {showAdd && <IngredientModal onClose={() => setShowAdd(false)} />}
      {editItem && <IngredientModal ingredient={editItem} onClose={() => setEditItem(null)} />}
      {adjustItem && <StockAdjustModal ingredient={adjustItem} onClose={() => setAdjustItem(null)} />}
      {deleteItem && <DeleteConfirmModal ingredient={deleteItem} onClose={() => setDeleteItem(null)} />}
    </div>
  )
}
