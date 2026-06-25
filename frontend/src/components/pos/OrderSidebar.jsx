import { useState } from 'react'
import { RiAddLine, RiSubtractLine, RiDeleteBin6Line, RiSendPlaneLine, RiPauseLine, RiCloseLine } from 'react-icons/ri'
import OrderStatusBadge from './OrderStatusBadge'
import VoidItemModal from './VoidItemModal'
import HoldOrderModal from './HoldOrderModal'
import {
  useUpdateOrderStatusMutation,
  useVoidOrderItemMutation,
  useHoldOrderMutation,
} from '../../store/api/ordersApi'
import toast from 'react-hot-toast'

const NEXT_STATUS = {
  pending:   { label: 'Confirm Order',   next: 'confirmed', color: 'btn-accent' },
  confirmed: { label: 'Send to Kitchen', next: 'preparing', color: 'btn-accent' },
  preparing: { label: 'Mark Ready',      next: 'ready',     color: 'bg-emerald-500 text-white hover:bg-emerald-600 btn-base' },
  ready:     { label: 'Mark Served',     next: 'served',    color: 'bg-teal-500 text-white hover:bg-teal-600 btn-base' },
  served:    { label: 'Close Order',     next: 'closed',    color: 'btn-secondary' },
}

function OrderItem({ item, onVoid, onRemoveLocal, disabled }) {
  const isLocal = typeof item.id === 'string' && item.id.startsWith('local-')
  const lineTotal = (parseFloat(item.unit_price) + (item.modifiers?.reduce((s, m) => s + parseFloat(m.extra_price), 0) || 0)) * item.quantity

  return (
    <div className={`flex items-start gap-2 py-2.5 border-b border-slate-50 last:border-0 ${item.status === 'voided' ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-medium text-ink leading-snug truncate">{item.menu_item}</p>
          <span className="stat-mono text-sm text-ink shrink-0">৳{lineTotal.toLocaleString('en-IN')}</span>
        </div>
        {item.variant && <p className="text-xs text-slate-400">{item.variant}</p>}
        {item.modifiers?.length > 0 && (
          <p className="text-xs text-slate-400 truncate">{item.modifiers.map((m) => m.name).join(', ')}</p>
        )}
        {item.notes && <p className="text-xs text-slate-400 italic truncate">{item.notes}</p>}
        <p className="text-xs text-slate-400 mt-0.5">
          ৳{parseFloat(item.unit_price).toLocaleString('en-IN')} × {item.quantity}
          {item.status === 'voided' && <span className="ml-2 text-rose-400 font-medium">Voided</span>}
          {isLocal && <span className="ml-2 text-ticket-orange font-medium">Draft</span>}
        </p>
      </div>
      {!disabled && (
        <button
          onClick={() => isLocal ? onRemoveLocal(item.id) : onVoid(item)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0 mt-0.5"
          title={isLocal ? "Remove item" : "Void item"}
        >
          <RiDeleteBin6Line size={14} />
        </button>
      )}
    </div>
  )
}

/**
 * OrderSidebar — live order panel for an active order.
 * Props:
 *   order      (object|null) — full order from API
 *   tableLabel (string)
 *   orderType  (string)
 *   onNewOrder (fn)         — called to start a fresh order
 */
export default function OrderSidebar({
  order,
  localItems = [],
  tableLabel,
  orderType,
  onNewOrder,
  onConfirm,
  onRemoveLocal,
  confirming
}) {
  const [voidTarget,   setVoidTarget]   = useState(null) // order_item to void
  const [showHold,     setShowHold]     = useState(false)

  const [updateStatus, { isLoading: statusLoading }]    = useUpdateOrderStatusMutation()
  const [voidItem,     { isLoading: voidLoading }]      = useVoidOrderItemMutation()
  const [hold,         { isLoading: holdLoading }]      = useHoldOrderMutation()

  if (!order && localItems.length === 0) {
    return (
      <div className="panel p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <RiSendPlaneLine size={22} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">No items selected</p>
        <p className="text-xs text-slate-400 mt-1">Tap menu items to add them to your draft.</p>
      </div>
    )
  }

  const activeItems  = order
    ? order.items?.filter((i) => i.status !== 'voided') || []
    : localItems
  const allItems     = order ? (order.items || []) : localItems
  const subtotal     = activeItems.reduce((sum, i) => {
    const modExtra = i.modifiers?.reduce((s, m) => s + parseFloat(m.extra_price), 0) || 0
    return sum + (parseFloat(i.unit_price) + modExtra) * i.quantity
  }, 0)
  const tax    = Math.round(subtotal * 0.1)
  const total  = subtotal + tax

  const nextAction = order ? NEXT_STATUS[order.status] : null
  const isEditable = !order || ['pending', 'confirmed'].includes(order.status)
  const isClosed   = order?.status === 'closed'

  const handleStatusAdvance = async () => {
    if (!nextAction) return
    try {
      await updateStatus({ id: order.id, status: nextAction.next }).unwrap()
      toast.success(`Order ${nextAction.next}!`)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status')
    }
  }

  const handleVoidConfirm = async (reason) => {
    try {
      await voidItem({ orderId: order.id, itemId: voidTarget.id, reason }).unwrap()
      toast.success('Item voided')
      setVoidTarget(null)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to void item')
    }
  }

  const handleHold = async (reason) => {
    try {
      await hold({ id: order.id, reason }).unwrap()
      toast.success('Order placed on hold')
      setShowHold(false)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to hold order')
    }
  }

  return (
    <div className="panel p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-ink text-sm">
            {order ? 'Active Order' : 'Draft Order'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{tableLabel || orderType}</p>
        </div>
        <div className="flex items-center gap-2">
          {order && <OrderStatusBadge status={order.status} />}
          {!isClosed && (
            <button onClick={onNewOrder} className="p-1.5 rounded-lg text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors" title="Cancel/New order">
              <RiCloseLine size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-420px)] min-h-[200px] -mx-1 px-1">
        {allItems.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">Tap a menu item to add it.</p>
        ) : (
          allItems.map((item) => (
            <OrderItem
              key={item.id}
              item={item}
              onVoid={(i) => setVoidTarget(i)}
              onRemoveLocal={onRemoveLocal}
              disabled={!isEditable}
            />
          ))
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-slate-100 pt-3 space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Subtotal</span>
          <span className="stat-mono">৳{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Tax (10%)</span>
          <span className="stat-mono">৳{tax.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-ink pt-1 border-t border-slate-100">
          <span>Total</span>
          <span className="stat-mono text-ticket-orange">৳{total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Actions */}
      {!isClosed && (
        <div className="flex flex-col gap-2">
          {nextAction ? (
            <button
              onClick={handleStatusAdvance}
              disabled={statusLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${nextAction.color}`}
            >
              {statusLoading ? (
                <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              ) : (
                <RiSendPlaneLine size={15} />
              )}
              {nextAction.label}
            </button>
          ) : !order && localItems.length > 0 ? (
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all btn-accent"
            >
              {confirming ? (
                <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              ) : (
                <RiSendPlaneLine size={15} />
              )}
              Confirm Order
            </button>
          ) : null}
          {isEditable && (
            <button
              onClick={() => setShowHold(true)}
              disabled={holdLoading}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
            >
              <RiPauseLine size={15} />
              Hold Order
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <VoidItemModal
        isOpen={!!voidTarget}
        itemName={voidTarget?.menu_item}
        onConfirm={handleVoidConfirm}
        onClose={() => setVoidTarget(null)}
        isLoading={voidLoading}
      />
      <HoldOrderModal
        isOpen={showHold}
        onConfirm={handleHold}
        onClose={() => setShowHold(false)}
        isLoading={holdLoading}
      />
    </div>
  )
}
