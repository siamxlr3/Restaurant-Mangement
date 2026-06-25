import { useState, useCallback } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import OrderTypeSelector from '../../components/pos/OrderTypeSelector'
import TablePicker from '../../components/pos/TablePicker'
import MenuGrid from '../../components/pos/MenuGrid'
import ItemDetailModal from '../../components/pos/ItemDetailModal'
import OrderSidebar from '../../components/pos/OrderSidebar'
import { RiArrowLeftLine, RiFileListLine } from 'react-icons/ri'
import {
  useCreateOrderMutation,
  useAddOrderItemMutation,
  useGetOrderByIdQuery,
} from '../../store/api/ordersApi'
import toast from 'react-hot-toast'

// ── Step constants ──────────────────────────────────────────
const STEP_SETUP = 'setup'
const STEP_ORDER = 'order'

export default function POS() {
  const [step,       setStep]       = useState(STEP_SETUP)
  const [orderType,  setOrderType]  = useState('dine-in')
  const [table,      setTable]      = useState(null)      // full table object
  const [orderId,    setOrderId]    = useState(null)      // active order UUID
  const [localItems, setLocalItems] = useState([])      // draft items before DB create
  const [modalItem,  setModalItem]  = useState(null)      // menu item for ItemDetailModal

  // ── RTK Query Mutations ─────────────────────────────────
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation()
  const [addItem,     { isLoading: addingItem }] = useAddOrderItemMutation()

  // ── Live order (Realtime subscription happens inside ordersApi) ──
  const { data: activeOrder } = useGetOrderByIdQuery(orderId, { skip: !orderId })

  // ── Step 1 → Step 2: move to build screen ───────────────
  const handleStartOrder = useCallback(() => {
    if (orderType === 'dine-in' && !table) {
      toast.error('Please select a table first')
      return
    }
    // We no longer create the order in DB here
    setStep(STEP_ORDER)
  }, [orderType, table])

  // ── Add item to order (Local or API) ────────────────────
  const handleAddItem = useCallback(async (itemPayload) => {
    if (!orderId) {
      // Draft mode: add to local state
      const newItem = {
        ...itemPayload,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        menu_item: modalItem?.name || 'Unknown Item',
        unit_price: modalItem?.base_price || 0,
        variant: modalItem?.menu_variant?.find(v => v.id === itemPayload.variant_id)?.label,
        modifiers: itemPayload.modifiers.map(m => ({
          ...m,
          name: modalItem?.menu_modifier?.find(mm => mm.id === m.modifier_id)?.name
        }))
      }
      setLocalItems(prev => [...prev, newItem])
      toast.success('Item added to draft')
      return
    }

    // Active order mode: call API
    try {
      await addItem({ orderId, ...itemPayload }).unwrap()
      toast.success('Item added to order!')
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add item')
    }
  }, [orderId, addItem, modalItem, setLocalItems])

  // ── Confirm order: Create in DB ─────────────────────────
  const handleConfirmOrder = useCallback(async () => {
    if (localItems.length === 0) return
    try {
      const payload = {
        type:     orderType,
        table_id: orderType === 'dine-in' ? table?.id : null,
        items:    localItems.map(({ id, menu_item, unit_price, variant, ...rest }) => rest),
      }
      const result = await createOrder(payload).unwrap()
      setOrderId(result.id)
      setLocalItems([])
      toast.success('Order confirmed & saved!')
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to confirm order')
    }
  }, [orderType, table, localItems, createOrder])

  // ── Remove item from draft ──────────────────────────────
  const handleRemoveLocalItem = useCallback((itemId) => {
    setLocalItems(prev => prev.filter(i => i.id !== itemId))
  }, [])

  // ── Reset: go back to setup for a new order ─────────────
  const handleNewOrder = useCallback(() => {
    setStep(STEP_SETUP)
    setOrderId(null)
    setLocalItems([])
    setTable(null)
    setOrderType('dine-in')
  }, [])

  // ── Derived UI labels ────────────────────────────────────
  const tableLabel = table
    ? `${table.name} — ${table.section || 'Main Hall'}`
    : orderType === 'takeaway'  ? 'Takeaway'
    : orderType === 'delivery'  ? 'Delivery'
    : null

  return (
    <div>
      <PageHeader
        title="Point of Sale"
        description="Select a table, build an order, and send it to the kitchen."
        actions={
          step === STEP_ORDER ? (
            <button onClick={handleNewOrder} className="btn-secondary gap-2">
              <RiArrowLeftLine size={14} />
              New Order
            </button>
          ) : (
            <button className="btn-secondary gap-2">
              <RiFileListLine size={14} />
              Order History
            </button>
          )
        }
      />

      {/* ── STEP 1: Order Setup ───────────────────────────── */}
      {step === STEP_SETUP && (
        <div className="space-y-6">
          {/* Order type selector */}
          <div className="panel p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Order Type</p>
            <OrderTypeSelector value={orderType} onChange={(t) => { setOrderType(t); setTable(null) }} />
          </div>

          {/* Table picker (dine-in only) */}
          {orderType === 'dine-in' && (
            <div className="panel p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Select Table
                {table && (
                  <span className="ml-2 normal-case font-normal text-ticket-orange">✓ {table.name}</span>
                )}
              </p>
              <TablePicker selectedTableId={table?.id} onSelect={setTable} />
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-end">
            <button
              onClick={handleStartOrder}
              disabled={creating || (orderType === 'dine-in' && !table)}
              className="btn-accent gap-2 px-8 py-3 text-base disabled:opacity-50"
            >
              {creating ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              {orderType === 'dine-in' && !table ? 'Select a Table First' : 'Start Order →'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Build Order ───────────────────────────── */}
      {step === STEP_ORDER && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left: Menu + search */}
          <div className="xl:col-span-2">
            <div className="panel p-5">
              <MenuGrid onSelectItem={setModalItem} />
            </div>
          </div>

          {/* Right: Order Sidebar */}
          <div className="sticky top-4 self-start">
            <OrderSidebar
              order={activeOrder}
              localItems={localItems}
              tableLabel={tableLabel}
              orderType={orderType}
              onNewOrder={handleNewOrder}
              onConfirm={handleConfirmOrder}
              onRemoveLocal={handleRemoveLocalItem}
              confirming={creating}
            />
          </div>
        </div>
      )}

      {/* Item Detail Modal (overlay) */}
      <ItemDetailModal
        item={modalItem}
        onClose={() => setModalItem(null)}
        onAdd={handleAddItem}
      />
    </div>
  )
}
