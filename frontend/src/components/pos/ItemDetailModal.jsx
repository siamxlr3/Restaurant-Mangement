import { useState, useEffect } from 'react'
import { RiCloseLine, RiAddLine, RiSubtractLine } from 'react-icons/ri'
import { AnimatePresence, motion } from 'framer-motion'
import UpsellSuggestions from './UpsellSuggestions'


/**
 * ItemDetailModal — bottom-sheet for variant/modifier/qty/notes selection.
 * Props:
 *   item     (object|null) — the menu_item selected (closes when null)
 *   onClose  (fn)
 *   onAdd    (fn) — called with { menu_item_id, variant_id, modifiers[], quantity, notes }
 */
export default function ItemDetailModal({ item, onClose, onAdd }) {
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedMods,    setSelectedMods]    = useState([])
  const [quantity,        setQuantity]        = useState(1)
  const [notes,           setNotes]           = useState('')

  // Reset state when item changes
  useEffect(() => {
    setSelectedVariant(null)
    setSelectedMods([])
    setQuantity(1)
    setNotes('')
  }, [item?.id])

  // Auto-select first variant
  useEffect(() => {
    if (item?.menu_variant?.length > 0) {
      setSelectedVariant(item.menu_variant[0].id)
    }
  }, [item])

  if (!item) return null

  const variants   = item.menu_variant   || []
  const modifiers  = item.menu_modifier  || []

  const variantPrice = variants.find((v) => v.id === selectedVariant)?.extra_price || 0
  const modPrice     = selectedMods.reduce((sum, mid) => {
    const mod = modifiers.find((m) => m.id === mid)
    return sum + (mod ? parseFloat(mod.extra_price) : 0)
  }, 0)
  const unitPrice  = parseFloat(item.base_price) + parseFloat(variantPrice) + modPrice
  const totalPrice = unitPrice * quantity

  const toggleMod = (modId) => {
    setSelectedMods((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    )
  }

  const handleAdd = () => {
    const requiredMods = modifiers.filter((m) => m.is_required)
    for (const rm of requiredMods) {
      if (!selectedMods.includes(rm.id)) {
        // Soft-enforce: just add required mods automatically if missing
        setSelectedMods((prev) => [...new Set([...prev, rm.id])])
        return
      }
    }
    onAdd({
      menu_item_id: item.id,
      variant_id:   selectedVariant || null,
      quantity,
      notes:        notes.trim() || null,
      modifiers:    selectedMods.map((mid) => {
        const mod = modifiers.find((m) => m.id === mid)
        return { modifier_id: mid, extra_price: mod?.extra_price || 0 }
      }),
    })
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-4 border-b border-slate-100">
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-semibold text-ink text-base leading-tight">{item.name}</h2>
              {item.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
              )}
            </div>
            <button onClick={onClose} className="ml-3 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-ink transition-colors shrink-0">
              <RiCloseLine size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Variants */}
            {variants.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Choose Variant</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedVariant === v.id
                          ? 'bg-ink text-paper border-ink'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {v.label}
                      {parseFloat(v.extra_price) > 0 && (
                        <span className="ml-1.5 text-xs opacity-60">+৳{parseFloat(v.extra_price)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers */}
            {modifiers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Add-ons</p>
                <div className="space-y-2">
                  {modifiers.map((mod) => {
                    const checked = selectedMods.includes(mod.id)
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          checked ? 'bg-orange-50 border-orange-200' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMod(mod.id)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <span className="text-sm text-ink">{mod.name}</span>
                          {mod.is_required && (
                            <span className="text-xs text-rose-500 font-medium">Required</span>
                          )}
                        </div>
                        {parseFloat(mod.extra_price) > 0 && (
                          <span className="text-sm text-slate-500 stat-mono">+৳{parseFloat(mod.extra_price)}</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Special Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. no onions, extra sauce…"
                rows={2}
                maxLength={500}
                className="input-field w-full resize-none text-sm"
              />
            </div>

            {/* AI Recommendations */}
            <UpsellSuggestions itemId={item.id} onAdd={onAdd} />
          </div>

          {/* Footer */}
          <div className="p-5 pt-0 border-t border-slate-100">
            <div className="flex items-center justify-between mt-4">
              {/* Quantity */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <RiSubtractLine size={14} />
                </button>
                <span className="stat-mono text-base font-semibold text-ink w-5 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <RiAddLine size={14} />
                </button>
              </div>

              {/* Add to order */}
              <button onClick={handleAdd} className="btn-accent gap-2">
                Add to Order
                <span className="stat-mono font-semibold">৳{totalPrice.toLocaleString('en-IN')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
