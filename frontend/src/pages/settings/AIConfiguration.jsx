import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Sparkles, Brain, Cpu } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import ApiKeyField from '../../components/settings/ApiKeyField'
import TestConnectionButton from '../../components/settings/TestConnectionButton'
import SettingsSaveButton from '../../components/settings/SettingsSaveButton'
import {
  useGetSettingsByGroupQuery,
  useUpsertSettingsGroupMutation,
} from '../../store/api/settingsApi'

const GROUP = 'ai'

const AI_PROVIDERS = [
  {
    id:    'openai',
    name:  'OpenAI',
    desc:  'GPT-4, embeddings, and function calling',
    icon:  Brain,
    color: 'text-emerald-500',
    bg:    'bg-emerald-50',
    field: { key: 'openai_api_key', label: 'API Key', desc: 'Starts with sk-…', is_encrypted: true },
  },
  {
    id:    'gemini',
    name:  'Google Gemini',
    desc:  'Gemini Pro for multimodal AI tasks',
    icon:  Sparkles,
    color: 'text-blue-500',
    bg:    'bg-blue-50',
    field: { key: 'gemini_api_key', label: 'API Key', desc: 'Google AI Studio key', is_encrypted: true },
  },
  {
    id:    'anthropic',
    name:  'Anthropic Claude',
    desc:  'Claude 3.5 Haiku for menu performance AI analysis',
    icon:  Cpu,
    color: 'text-violet-500',
    bg:    'bg-violet-50',
    field: { key: 'anthropic_api_key', label: 'API Key', desc: 'Starts with sk-ant-…', is_encrypted: true },
  },
]

const AI_FEATURES = [
  { key: 'feature_insight_cards',     label: 'Insight cards on dashboard',   desc: 'Surface opportunities, risks, and anomalies on the overview page' },
  { key: 'feature_reorder',           label: 'Reorder suggestions',           desc: 'Recommend purchase quantities based on stock and demand trend' },
  { key: 'feature_demand_forecast',   label: 'Demand forecasting',            desc: 'Predict covers and dish-level demand for upcoming days' },
  { key: 'feature_feedback_sentiment',label: 'Feedback sentiment scoring',    desc: 'Automatically score guest feedback as positive, negative, or mixed' },
  { key: 'feature_anomaly_detection', label: 'Anomaly detection',             desc: 'Flag unusual patterns in discounts, voids, and kitchen timing' },
  { key: 'feature_menu_suggestions',  label: 'Menu suggestions',              desc: 'Recommend pricing, promotion, and retirement changes' },
]

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-10 shrink-0 rounded-full relative transition-colors duration-200 ${enabled ? 'bg-[#f97316]' : 'bg-slate-200'}`}
      style={{ height: '22px', width: '40px' }}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
          enabled ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

export default function AIConfiguration() {
  const { data, isLoading } = useGetSettingsByGroupQuery(GROUP)
  const [upsert] = useUpsertSettingsGroupMutation()

  const [keys, setKeys]       = useState({ openai_api_key: '', gemini_api_key: '', anthropic_api_key: '' })
  const [saved, setSaved]     = useState({ openai_api_key: false, gemini_api_key: false, anthropic_api_key: false })
  const [masks, setMasks]     = useState({})
  const [features, setFeatures] = useState({})
  const [sensitivity, setSensitivity] = useState('2')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data?.data) {
      const map = data.data.reduce((a, s) => ({ ...a, [s.key]: s.value ?? '' }), {})
      const newSaved = {}; const newMasks = {}
      ;['openai_api_key', 'gemini_api_key', 'anthropic_api_key'].forEach((k) => {
        newSaved[k]  = !!map[k]
        newMasks[k]  = map[k] || ''
      })
      setSaved(newSaved)
      setMasks(newMasks)
      const featureVals = {}
      AI_FEATURES.forEach(({ key }) => { featureVals[key] = map[key] === 'true' })
      setFeatures(featureVals)
      setSensitivity(map.ai_sensitivity || '2')
    }
  }, [data])

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const settings = [
        ...AI_PROVIDERS.map((p) => ({
          key: p.field.key, value: keys[p.field.key] || '', label: p.field.label,
          is_encrypted: true, type: 'password',
        })).filter((s) => s.value),
        ...AI_FEATURES.map(({ key, label }) => ({
          key, value: String(features[key] ?? false), label, is_encrypted: false, type: 'boolean',
        })),
        { key: 'ai_sensitivity', value: sensitivity, label: 'AI Sensitivity', is_encrypted: false, type: 'number' },
      ]

      const res = await upsert({ group: GROUP, settings }).unwrap()
      const newMasks = {}; const newSaved = {}
      ;(res.data || []).forEach((s) => { newMasks[s.key] = s.value; newSaved[s.key] = true })
      setMasks((m) => ({ ...m, ...newMasks }))
      setSaved((s) => ({ ...s, ...newSaved }))
      setKeys((k) => ({ ...k, openai_api_key: '', gemini_api_key: '', anthropic_api_key: '' }))
      toast.success('AI configuration saved')
    } catch {
      toast.error('Failed to save AI configuration')
    } finally {
      setSubmitting(false)
    }
  }

  const sensitivityLabels = { '1': 'Conservative', '2': 'Balanced', '3': 'Aggressive' }

  return (
    <div>
      <PageHeader
        title="AI Configuration"
        description="Manage AI provider keys and control which AI features are active across the dashboard."
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 mb-6 rounded-xl border border-orange-200 bg-orange-50/60 max-w-2xl">
        <Cpu size={16} className="text-orange-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600">
          AI features use your sales, inventory, staff, and feedback data to generate recommendations.
          No data is shared outside your organization.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3 max-w-2xl">
          {[...Array(3)].map((_, i) => <div key={i} className="panel p-5 h-16 animate-pulse bg-slate-50" />)}
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {/* Provider key inputs */}
          <div className="panel p-5 space-y-5">
            <p className="text-sm font-semibold text-ink">API Keys</p>
            {AI_PROVIDERS.map((provider) => {
              const Icon = provider.icon
              return (
                <div key={provider.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${provider.bg} flex items-center justify-center`}>
                      <Icon size={14} className={provider.color} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{provider.name}</p>
                      <p className="text-xs text-slate-400">{provider.desc}</p>
                    </div>
                  </div>
                  <ApiKeyField
                    id={provider.field.key}
                    label={provider.field.label}
                    description={provider.field.desc}
                    value={keys[provider.field.key] || ''}
                    onChange={(e) => {
                      setKeys((k) => ({ ...k, [provider.field.key]: e.target.value }))
                      setSaved((s) => ({ ...s, [provider.field.key]: false }))
                    }}
                    isSaved={saved[provider.field.key]}
                    maskedValue={masks[provider.field.key] || ''}
                  />
                  <TestConnectionButton provider={provider.id} apiKey={keys[provider.field.key]} />
                </div>
              )
            })}
          </div>

          {/* Feature toggles */}
          <div className="panel divide-y divide-slate-50">
            <p className="text-sm font-semibold text-ink px-5 py-3">Feature Toggles</p>
            {AI_FEATURES.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <Toggle
                  enabled={features[key] ?? false}
                  onChange={() => setFeatures((f) => ({ ...f, [key]: !f[key] }))}
                />
              </div>
            ))}
          </div>

          {/* Sensitivity slider */}
          <div className="panel p-5">
            <label className="text-sm font-medium text-ink block mb-1">AI suggestion sensitivity</label>
            <p className="text-xs text-slate-400 mb-3">
              Higher sensitivity surfaces more suggestions, including lower-confidence ones.
            </p>
            <input
              type="range" min="1" max="3"
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Conservative</span>
              <span className="font-medium text-orange-500">{sensitivityLabels[sensitivity]}</span>
              <span>Aggressive</span>
            </div>
          </div>

          <SettingsSaveButton isLoading={submitting} onClick={handleSave} />
        </div>
      )}
    </div>
  )
}
