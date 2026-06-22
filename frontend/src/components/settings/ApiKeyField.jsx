import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

/**
 * ApiKeyField — password-style input for sensitive API keys.
 *
 * Props:
 *   id          - unique field id
 *   label       - field label text
 *   description - helper text below the label
 *   value       - controlled string value
 *   onChange    - change handler (e) => void
 *   isSaved     - when true, renders the masked display instead of the live input
 *   maskedValue - the "sk-•••••••" string returned from the API
 *   placeholder - optional placeholder
 *   disabled    - optional
 *   error       - validation error string
 */
export default function ApiKeyField({
  id,
  label,
  description,
  value,
  onChange,
  isSaved = false,
  maskedValue = '',
  placeholder = 'Paste your key here',
  disabled = false,
  error,
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Lock size={13} className="text-slate-400" />
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-400 pl-5">{description}</p>
      )}

      {/* Input row */}
      <div className="relative">
        {isSaved ? (
          /* Masked display after save */
          <div className="input-field flex items-center gap-2 bg-slate-50 cursor-default font-mono text-sm text-slate-500">
            <span className="flex-1">{maskedValue || '••••••••••••'}</span>
            <span className="text-xs text-emerald-500 font-sans font-medium shrink-0">Saved ✓</span>
          </div>
        ) : (
          <>
            <input
              id={id}
              type={show ? 'text' : 'password'}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
              className={`input-field pr-11 font-mono text-sm ${error ? 'border-red-400 focus:ring-red-400/20' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
              aria-label={show ? 'Hide key' : 'Show key'}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </>
        )}
      </div>

      {/* Validation error */}
      {error && (
        <p className="text-xs text-red-500 pl-1">{error}</p>
      )}
    </div>
  )
}
