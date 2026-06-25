import { useState } from 'react'
import { RiPauseLine } from 'react-icons/ri'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * HoldOrderModal — confirm dialog to save order as a draft (hold).
 * Props:
 *   isOpen    (bool)
 *   onConfirm (fn) — called with reason (string, optional)
 *   onClose   (fn)
 *   isLoading (bool)
 */
export default function HoldOrderModal({ isOpen, onConfirm, onClose, isLoading }) {
  const [reason, setReason] = useState('')

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
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <RiPauseLine size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-ink">Hold Order</h3>
              <p className="text-xs text-slate-400 mt-0.5">Save as draft — items won't go to kitchen.</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Reason <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer requesting later, waiting for full party…"
              rows={2}
              maxLength={500}
              className="input-field w-full resize-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason.trim() || null)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              Hold Order
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
