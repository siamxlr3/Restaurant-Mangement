import { useState } from 'react'
import { RiAlertLine } from 'react-icons/ri'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * VoidItemModal — confirm dialog for voiding an order item with required reason.
 * Props:
 *   isOpen    (bool)
 *   itemName  (string)
 *   onConfirm (fn) — called with reason string
 *   onClose   (fn)
 *   isLoading (bool)
 */
export default function VoidItemModal({ isOpen, itemName, onConfirm, onClose, isLoading }) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (reason.trim().length < 3) return
    onConfirm(reason.trim())
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <RiAlertLine size={18} className="text-rose-600" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-ink">Void Item</h3>
              <p className="text-xs text-slate-400 mt-0.5">You are removing: <strong>{itemName}</strong></p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer changed mind, wrong item ordered…"
              rows={3}
              maxLength={500}
              className="input-field w-full resize-none text-sm"
            />
            {reason.trim().length > 0 && reason.trim().length < 3 && (
              <p className="text-xs text-rose-500 mt-1">Reason must be at least 3 characters</p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={reason.trim().length < 3 || isLoading}
              className="flex-1 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              Void Item
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
