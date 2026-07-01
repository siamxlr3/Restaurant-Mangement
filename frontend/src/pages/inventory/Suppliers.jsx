import { useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  RiTruckLine, RiAddLine, RiEditLine, RiDeleteBin6Line,
  RiCloseLine, RiFileTextLine,
  RiTimeLine, RiEyeLine, RiAlertLine
} from 'react-icons/ri'
import { ListPlus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import EnhancedDataTable from '../../components/common/EnhancedDataTable'
import { Badge, Spinner } from '../../components/ui/Common'
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '../../store/api/suppliersApi'
import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
} from '../../store/api/purchaseOrdersApi'
import { useGetIngredientsQuery } from '../../store/api/ingredientsApi'

// ── Zod Validation Schemas ───────────────────────────────────────────────────
const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  contact: z.string().max(500, 'Contact is too long').optional().or(z.literal('')),
  lead_time_days: z.coerce.number().int().min(0, 'Lead time must be >= 0'),
  is_active: z.boolean().optional(),
})

const poItemSchema = z.object({
  ingredient_id: z.string().uuid('Invalid ingredient selection'),
  qty: z.coerce.number().positive('Quantity must be greater than 0'),
  unit_cost: z.coerce.number().min(0, 'Unit cost must be >= 0'),
})

const poSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier selection'),
  staff_id: z.string().uuid('Invalid staff ID').nullable().optional(),
  ai_suggested: z.boolean().optional(),
  status: z.enum(['draft', 'ordered', 'received']).optional(),
  items: z.array(poItemSchema).min(1, 'Add at least one line item'),
})

// ── Modal helper ─────────────────────────────────────────────────────────────
function Modal({ title, children, onClose, icon }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
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
      className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all ${className}`}
      {...props}
    />
  )
}

// ── SUPPLIER DIALOG ──────────────────────────────────────────────────────────
function SupplierModal({ supplier, onClose }) {
  const isEdit = !!supplier
  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation()
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation()
  const isSubmitting = creating || updating

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          name: supplier.name,
          contact: supplier.contact || '',
          lead_time_days: supplier.lead_time_days,
          is_active: supplier.is_active,
        }
      : { lead_time_days: 3, is_active: true },
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateSupplier({ id: supplier.id, ...values }).unwrap()
        toast.success('Supplier updated successfully')
      } else {
        await createSupplier(values).unwrap()
        toast.success('Supplier created successfully')
      }
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong')
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
      onClose={onClose}
      icon={<RiTruckLine size={18} className="text-accent" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Name *" error={errors.name?.message}>
          <Input {...register('name')} placeholder="e.g. Acme Food Supplies" />
        </Field>
        
        <Field label="Contact Info" error={errors.contact?.message}>
          <textarea
            {...register('contact')}
            placeholder="e.g. Phone: +1234567, Email: sales@acme.com, Address: Dhaka"
            rows="3"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </Field>

        <Field label="Lead Time (Days) *" error={errors.lead_time_days?.message}>
          <Input type="number" {...register('lead_time_days')} />
        </Field>

        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="is_active" {...register('is_active')} className="rounded border-slate-350" />
          <label htmlFor="is_active" className="text-sm text-slate-700">Active / Available</label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-accent disabled:opacity-60">
            {isSubmitting ? 'Saving…' : isEdit ? 'Update Supplier' : 'Add Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── PURCHASE ORDER FORM MODAL ─────────────────────────────────────────────────
function PurchaseOrderModal({ onClose }) {
  const [createPO, { isLoading: submitting }] = useCreatePurchaseOrderMutation()
  const { data: supsResponse } = useGetSuppliersQuery({ per_page: 100, status: 'active' })
  const { data: ingsResponse } = useGetIngredientsQuery({ per_page: 100, status: 'active' })
  
  const suppliers = supsResponse?.data || []
  const ingredients = ingsResponse?.data || []

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(poSchema),
    defaultValues: {
      supplier_id: '',
      ai_suggested: false,
      status: 'draft',
      items: [{ ingredient_id: '', qty: 1, unit_cost: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const totalCost = watchedItems.reduce((acc, curr) => {
    const qty = parseFloat(curr?.qty) || 0
    const price = parseFloat(curr?.unit_cost) || 0
    return acc + (qty * price)
  }, 0)

  const onSubmit = async (values) => {
    try {
      await createPO(values).unwrap()
      toast.success('Purchase order created successfully')
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create purchase order')
    }
  }

  return (
    <Modal title="Create Purchase Order" onClose={onClose} icon={<RiFileTextLine size={18} className="text-accent" />}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Supplier *" error={errors.supplier_id?.message}>
          <select {...register('supplier_id')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 bg-white">
            <option value="">Select a supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} (Lead time: {s.lead_time_days} days)</option>
            ))}
          </select>
        </Field>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ai_suggested" {...register('ai_suggested')} className="rounded border-slate-350" />
          <label htmlFor="ai_suggested" className="text-sm text-slate-700">AI Suggested Order</label>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <ListPlus size={16} /> Order Items
            </h3>
            <button
              type="button"
              onClick={() => append({ ingredient_id: '', qty: 1, unit_cost: 0 })}
              className="text-xs text-accent hover:text-accent-hover font-semibold flex items-center gap-0.5"
            >
              + Add Ingredient
            </button>
          </div>
          {errors.items?.message && <p className="text-xs text-rose-500 mb-2">{errors.items?.message}</p>}

          <div className="space-y-3.5 max-h-[30vh] overflow-y-auto pr-1">
            {fields.map((field, index) => {
              const selectedIng = ingredients.find(i => i.id === watchedItems[index]?.ingredient_id)
              return (
                <div key={field.id} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-100 relative">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">Ingredient</label>
                    <select
                      {...register(`items.${index}.ingredient_id`)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="">Select...</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">
                      Qty {selectedIng && `(${selectedIng.unit})`}
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      {...register(`items.${index}.qty`)}
                      className="px-2 py-1 bg-white text-xs"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] text-slate-400 font-semibold mb-0.5 block">Unit Cost (৳)</label>
                    <Input
                      type="number"
                      step="0.0001"
                      {...register(`items.${index}.unit_cost`)}
                      className="px-2 py-1 bg-white text-xs"
                    />
                  </div>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-slate-400 hover:text-rose-600 self-end mb-1 p-1"
                    >
                      <RiDeleteBin6Line size={15} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-slate-55 rounded-xl p-4 flex items-center justify-between text-ink border border-slate-100">
          <span className="text-sm font-semibold">Total PO Valuation:</span>
          <span className="font-bold text-base stat-mono">৳{totalCost.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-accent disabled:opacity-60">
            {submitting ? 'Creating…' : 'Generate PO (Draft)'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── PURCHASE ORDER DETAILS & STATUS WORKFLOW MODAL ────────────────────────────
function PurchaseOrderDetailModal({ poId, onClose }) {
  const { data: poResponse, isLoading } = useGetPurchaseOrderByIdQuery(poId)
  const po = poResponse?.data ?? poResponse
  const [updatePO, { isLoading: updating }] = useUpdatePurchaseOrderMutation()
  const [deletePO, { isLoading: deleting }] = useDeletePurchaseOrderMutation()
  
  if (isLoading) return <Modal title="Purchase Order Details" onClose={onClose}><Spinner label="Loading order details…" /></Modal>
  if (!po) return <Modal title="Error" onClose={onClose}><div className="text-rose-500 text-sm py-4">Purchase order not found.</div></Modal>

  const items = po.items || []
  const poTotal = items.reduce((acc, curr) => acc + (curr.qty * curr.unit_cost), 0)

  const handleStatusChange = async (newStatus) => {
    try {
      await updatePO({ id: po.id, status: newStatus }).unwrap()
      toast.success(`Purchase order status updated to ${newStatus}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update purchase order status')
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deletePO(po.id).unwrap()
        toast.success('Purchase order deleted successfully')
        onClose()
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete order')
      }
    }
  }

  const statusTones = { draft: 'slate', ordered: 'amber', received: 'green' }

  return (
    <Modal title={`PO Detail — ${po.id.slice(0, 8)}`} onClose={onClose} icon={<RiFileTextLine size={18} className="text-accent" />}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold mb-0.5">Supplier</p>
            <p className="font-semibold text-ink">{po.supplier?.name}</p>
            {po.supplier?.contact && <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{po.supplier.contact}</p>}
          </div>

          <div>
            <p className="text-xs text-slate-400 font-semibold mb-0.5">Status</p>
            <div className="mt-1"><Badge tone={statusTones[po.status]}>{po.status}</Badge></div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Created: {new Date(po.created_at).toLocaleDateString()}</p>
            {po.ordered_at && <p className="text-xs text-slate-500 font-medium">Ordered: {new Date(po.ordered_at).toLocaleDateString()}</p>}
          </div>
        </div>

        <div>
          <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Line Items</h4>
          <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Unit Cost</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-ink">{it.ingredient?.name}</td>
                    <td className="p-3 text-right stat-mono">{it.qty} {it.ingredient?.unit}</td>
                    <td className="p-3 text-right stat-mono">৳{it.unit_cost.toFixed(2)}</td>
                    <td className="p-3 text-right stat-mono font-semibold">৳{(it.qty * it.unit_cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500">Order Value:</span>
          <span className="font-bold text-sm text-ink stat-mono">৳{poTotal.toFixed(2)}</span>
        </div>

        {po.ai_suggested && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <RiAlertLine size={14} className="mt-0.5 text-amber-500 shrink-0" />
            <span>This purchase order was recommended by the AI stock depletion models.</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div>
            {po.status !== 'received' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || updating}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold p-1"
              >
                Delete order
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              Close
            </button>
            
            {po.status === 'draft' && (
              <button
                type="button"
                onClick={() => handleStatusChange('ordered')}
                disabled={updating}
                className="btn-accent"
              >
                Mark as Ordered
              </button>
            )}

            {po.status === 'ordered' && (
              <button
                type="button"
                onClick={() => handleStatusChange('received')}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Receive Order (Restock)
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── DELETE SUPPLIER CONFIRMATION ─────────────────────────────────────────────
function DeleteSupplierModal({ supplier, onClose }) {
  const [deleteSupplier, { isLoading }] = useDeleteSupplierMutation()
  
  const handleDelete = async () => {
    try {
      await deleteSupplier(supplier.id).unwrap()
      toast.success('Supplier deleted successfully')
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete supplier')
    }
  }

  return (
    <Modal title="Delete Supplier" onClose={onClose} icon={<RiDeleteBin6Line size={18} className="text-rose-500" />}>
      <div className="space-y-4">
        <p className="text-slate-600 text-sm">
          Are you sure you want to delete <strong className="text-ink">{supplier.name}</strong>?
          This action will mark the supplier as deleted (soft delete). Active purchase orders referencing this supplier cannot be deleted.
        </p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors">
            {isLoading ? 'Deleting…' : 'Delete Supplier'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export default function Suppliers() {
  const [activeTab, setActiveTab] = useState('suppliers')
  
  // Suppliers Filters & Hooks
  const [supFilters, setSupFilters] = useState({ page: 1, per_page: 20, search: '', status: 'all', from_date: '', to_date: '' })
  const { data: supsData, isLoading: supsLoading, isFetching: supsFetching } = useGetSuppliersQuery(supFilters)
  const suppliers = supsData?.data || []
  const supsMeta = supsData?.meta || null

  const handleSupFilterChange = useCallback((filters) => setSupFilters(filters), [])

  // Purchase Orders Filters & Hooks
  const [poFilters, setPoFilters] = useState({ page: 1, per_page: 20, status: 'all', from_date: '', to_date: '' })
  const { data: posData, isLoading: posLoading, isFetching: posFetching } = useGetPurchaseOrdersQuery(poFilters)
  const purchaseOrders = posData?.data || []
  const posMeta = posData?.meta || null

  const handlePoFilterChange = useCallback((filters) => setPoFilters(filters), [])

  // Modal Triggers
  const [showAddSup, setShowAddSup] = useState(false)
  const [editSup, setEditSup] = useState(null)
  const [deleteSup, setDeleteSup] = useState(null)

  const [showAddPO, setShowAddPO] = useState(false)
  const [viewPoId, setViewPoId] = useState(null)

  // Columns Definitions
  const supplierColumns = [
    {
      key: 'name',
      header: 'Supplier',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <RiTruckLine size={15} className="text-emerald-600" />
          </div>
          <div>
            <span className="font-semibold text-ink text-sm block">{r.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact details',
      render: (r) => (
        <span className="text-xs text-slate-500 whitespace-pre-line max-w-[200px] block truncate" title={r.contact}>
          {r.contact || '—'}
        </span>
      ),
    },
    {
      key: 'lead_time_days',
      header: 'Lead Time',
      render: (r) => (
        <div className="flex items-center gap-1 text-slate-600 text-xs">
          <RiTimeLine size={13} className="text-slate-400" />
          <span className="stat-mono font-medium">{r.lead_time_days} days</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (r) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${r.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {r.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditSup(r)}
            title="Edit Supplier"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <RiEditLine size={15} />
          </button>
          <button
            onClick={() => setDeleteSup(r)}
            title="Delete Supplier"
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
          >
            <RiDeleteBin6Line size={15} />
          </button>
        </div>
      ),
    },
  ]

  const poStatusTone = { draft: 'slate', ordered: 'amber', received: 'green' }

  const poColumns = [
    {
      key: 'id',
      header: 'Purchase Order',
      render: (r) => <span className="stat-mono font-medium text-ink bg-slate-100 px-2 py-0.5 rounded text-xs">#{r.id.slice(0, 8)}</span>
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (r) => <span className="font-semibold text-sm text-ink">{r.supplier?.name}</span>
    },
    {
      key: 'items',
      header: 'Line items',
      render: (r) => <span className="stat-mono text-slate-500 font-medium text-xs">{r.items?.length || 0} items</span>
    },
    {
      key: 'total',
      header: 'Order total',
      render: (r) => {
        const total = r.items?.reduce((sum, item) => sum + (item.qty * item.unit_cost), 0) || 0
        return <span className="stat-mono font-semibold text-ink">৳{total.toFixed(2)}</span>
      }
    },
    {
      key: 'ai_suggested',
      header: 'Method',
      render: (r) => (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${r.ai_suggested ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
          {r.ai_suggested ? 'AI Suggested' : 'Manual'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={poStatusTone[r.status]}>{r.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <button
          onClick={() => setViewPoId(r.id)}
          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-accent font-semibold text-xs flex items-center gap-1 transition-colors"
        >
          <RiEyeLine size={14} /> View / Manage
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Suppliers & purchase orders"
        description="Vendor relationships, ingredient list restocking constraints and open orders purchase workflow."
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowAddSup(true)}>
              <RiAddLine size={15} />
              Add supplier
            </button>
            <button className="btn-accent" onClick={() => setShowAddPO(true)}>
              <RiAddLine size={15} />
              New purchase order
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 mb-6">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-all ${activeTab === 'suppliers' ? 'border-accent text-accent' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Suppliers
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-all ${activeTab === 'pos' ? 'border-accent text-accent' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Purchase Orders
        </button>
      </div>

      <div className="transition-opacity duration-200">
        {activeTab === 'suppliers' ? (
          <EnhancedDataTable
            columns={supplierColumns}
            data={suppliers}
            isLoading={supsLoading || supsFetching}
            meta={supsMeta}
            filters={supFilters}
            onFilterChange={handleSupFilterChange}
          />
        ) : (
          <EnhancedDataTable
            columns={poColumns}
            data={purchaseOrders}
            isLoading={posLoading || posFetching}
            meta={posMeta}
            filters={poFilters}
            onFilterChange={handlePoFilterChange}
          />
        )}
      </div>

      {/* Modals */}
      {showAddSup && <SupplierModal onClose={() => setShowAddSup(false)} />}
      {editSup && <SupplierModal supplier={editSup} onClose={() => setEditSup(null)} />}
      {deleteSup && <DeleteSupplierModal supplier={deleteSup} onClose={() => setDeleteSup(null)} />}

      {showAddPO && <PurchaseOrderModal onClose={() => setShowAddPO(false)} />}
      {viewPoId && <PurchaseOrderDetailModal poId={viewPoId} onClose={() => setViewPoId(null)} />}
    </div>
  )
}
