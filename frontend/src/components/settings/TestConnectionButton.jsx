import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle, Wifi } from 'lucide-react'
import { useTestConnectionMutation } from '../../store/api/settingsApi'

/**
 * TestConnectionButton — fires a test-connection API call for a given provider.
 *
 * Props:
 *   provider    - e.g. 'stripe' | 'openai' | 'sendgrid' etc.
 *   apiKey      - the RAW key to test (never sent after masking)
 *   label       - optional button label (default: "Test Connection")
 */
export default function TestConnectionButton({ provider, apiKey, label = 'Test Connection' }) {
  const [testConnection, { isLoading }] = useTestConnectionMutation()
  const [result, setResult] = useState(null) // { success, message }

  const handleTest = async () => {
    if (!apiKey?.trim()) {
      setResult({ success: false, message: 'Please enter an API key first' })
      return
    }
    setResult(null)
    try {
      const res = await testConnection({ provider, key: apiKey }).unwrap()
      setResult({ success: res.success, message: res.message })
    } catch (err) {
      setResult({ success: false, message: err.data?.message || 'Connection test failed' })
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleTest}
        disabled={isLoading || !apiKey?.trim()}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Wifi size={13} />
        )}
        {isLoading ? 'Testing…' : label}
      </button>

      {result && (
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            result.success
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          {result.success ? (
            <CheckCircle2 size={13} />
          ) : (
            <XCircle size={13} />
          )}
          {result.message}
        </div>
      )}
    </div>
  )
}
