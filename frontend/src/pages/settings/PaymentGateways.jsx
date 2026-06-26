import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CreditCard, Landmark, Smartphone, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../../components/ui/PageHeader'
import ApiKeyField from '../../components/settings/ApiKeyField'
import TestConnectionButton from '../../components/settings/TestConnectionButton'
import SettingsSaveButton from '../../components/settings/SettingsSaveButton'
import {
  useGetSettingsByGroupQuery,
  useUpsertSettingsGroupMutation,
} from '../../store/api/settingsApi'

const GROUP = 'payments'

const GATEWAYS = [
  {
    id:       'stripe',
    name:     'Stripe',
    desc:     'Card payments, subscriptions, and invoicing',
    icon:     CreditCard,
    color:    'text-indigo-500',
    bg:       'bg-indigo-50',
    fields: [
      { key: 'stripe_publishable_key', label: 'Publishable Key', desc: 'Safe to expose in client-side code (pk_…)',          is_encrypted: false },
      { key: 'stripe_secret_key',      label: 'Secret Key',      desc: 'Never expose this publicly (sk_…)',                  is_encrypted: true  },
      { key: 'stripe_webhook_secret',  label: 'Webhook Secret',  desc: 'Used to verify webhook events from Stripe (whsec_…)', is_encrypted: true  },
    ],
  },
  {
    id:    'paypal',
    name:  'PayPal',
    desc:  'Checkout, invoices, and international payments',
    icon:  Landmark,
    color: 'text-blue-500',
    bg:    'bg-blue-50',
    fields: [
      { key: 'paypal_client_id',     label: 'Client ID',     desc: 'Your PayPal app client ID',           is_encrypted: false },
      { key: 'paypal_client_secret', label: 'Client Secret', desc: 'Your PayPal app client secret',       is_encrypted: true  },
    ],
  },
  {
    id:    'bkash',
    name:  'bKash',
    desc:  'Mobile financial services for Bangladesh',
    icon:  Smartphone,
    color: 'text-pink-500',
    bg:    'bg-pink-50',
    fields: [
      { key: 'bkash_app_key',    label: 'App Key',      desc: 'bKash merchant app key',    is_encrypted: true  },
      { key: 'bkash_app_secret', label: 'App Secret',   desc: 'bKash merchant app secret', is_encrypted: true  },
      { key: 'bkash_username',   label: 'API Username', desc: 'bKash API username',        is_encrypted: false },
      { key: 'bkash_password',   label: 'API Password', desc: 'bKash API password',        is_encrypted: true  },
    ],
  },
  {
    id:    'rocket',
    name:  'Rocket (DBBL)',
    desc:  'Dutch-Bangla Bank mobile banking payments',
    icon:  Smartphone,
    color: 'text-violet-500',
    bg:    'bg-violet-50',
    fields: [
      { key: 'rocket_api_key',     label: 'API Key',       desc: 'Rocket merchant API key (encrypted)',       is_encrypted: true  },
      { key: 'rocket_merchant_id', label: 'Merchant ID',   desc: 'Your Rocket / DBBL merchant ID',            is_encrypted: false },
    ],
  },
  {
    id:    'nagad',
    name:  'Nagad',
    desc:  'Bangladesh Post Office mobile financial service',
    icon:  Smartphone,
    color: 'text-orange-500',
    bg:    'bg-orange-50',
    fields: [
      { key: 'nagad_merchant_id',  label: 'Merchant ID',  desc: 'Nagad merchant identifier',                 is_encrypted: false },
      { key: 'nagad_merchant_key', label: 'Merchant Key', desc: 'Nagad merchant key for request signing',    is_encrypted: true  },
    ],
  },
]

function GatewayCard({ gateway, initialValues, savedMasks }) {
  const [upsert] = useUpsertSettingsGroupMutation()
  const [values, setValues]     = useState({})
  const [isSaved, setIsSaved]   = useState({})  // per-field saved state
  const [masks, setMasks]       = useState({})   // per-field masked value from API
  const [enabled, setEnabled]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen]         = useState(false)

  const Icon = gateway.icon

  useEffect(() => {
    if (initialValues) {
      const vals = {}; const saved = {}; const msk = {}
      gateway.fields.forEach(({ key }) => {
        vals[key]  = ''
        saved[key] = !!initialValues[key]
        msk[key]   = initialValues[key] || ''
      })
      setValues(vals)
      setIsSaved(saved)
      setMasks(msk)
      setEnabled(initialValues[`${gateway.id}_enabled`] === 'true')
    }
  }, [initialValues])

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const settings = [
        { key: `${gateway.id}_enabled`, value: String(enabled), label: `${gateway.name} Enabled`, type: 'boolean', is_encrypted: false },
        ...gateway.fields.map((f) => ({
          key:          f.key,
          value:        values[f.key] || '',
          label:        f.label,
          is_encrypted: f.is_encrypted,
          type:         f.is_encrypted ? 'password' : 'text',
        })).filter((s) => s.value), // only send filled fields
      ]

      const res = await upsert({ group: GROUP, settings }).unwrap()
      // Update masks from response
      const newMasks = {}; const newSaved = {}
      ;(res.data || []).forEach((s) => {
        newMasks[s.key]  = s.value
        newSaved[s.key]  = true
      })
      setMasks((m) => ({ ...m, ...newMasks }))
      setIsSaved((s) => ({ ...s, ...newSaved }))
      // Clear raw values for encrypted fields
      const clearedVals = { ...values }
      gateway.fields.forEach(({ key, is_encrypted }) => { if (is_encrypted) clearedVals[key] = '' })
      setValues(clearedVals)
      toast.success(`${gateway.name} settings saved`)
    } catch {
      toast.error(`Failed to save ${gateway.name} settings`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl ${gateway.bg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={gateway.color} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">{gateway.name}</p>
          <p className="text-xs text-slate-400">{gateway.desc}</p>
        </div>
        {/* Enable toggle */}
        <div
          onClick={(e) => { e.stopPropagation(); setEnabled((v) => !v) }}
          className={`w-10 h-5.5 rounded-full relative shrink-0 transition-colors cursor-pointer ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
          style={{ height: '22px', width: '40px' }}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
        </div>
        <ChevronRight size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      {/* Expandable fields */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
              {gateway.fields.map((field) => (
                <div key={field.key} className="space-y-3">
                  <ApiKeyField
                    id={field.key}
                    label={field.label}
                    description={field.desc}
                    value={values[field.key] || ''}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                      // Un-save state so user can re-enter
                      setIsSaved((s) => ({ ...s, [field.key]: false }))
                    }}
                    isSaved={isSaved[field.key] || false}
                    maskedValue={masks[field.key] || ''}
                  />
                  {/* Test Connection button — only for primary secret key */}
                  {field.is_encrypted && field.key.includes('secret') && (
                    <TestConnectionButton
                      provider={gateway.id}
                      apiKey={values[field.key]}
                    />
                  )}
                </div>
              ))}

              <div className="pt-3 border-t border-slate-100">
                <SettingsSaveButton isLoading={submitting} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PaymentGateways() {
  const { data, isLoading } = useGetSettingsByGroupQuery(GROUP)

  const settingsMap = (data?.data || []).reduce(
    (acc, s) => ({ ...acc, [s.key]: s.value ?? '' }), {}
  )

  return (
    <div>
      <PageHeader
        title="Payment Gateways"
        description="Configure your payment integrations. API keys are encrypted at rest and never exposed in responses."
      />

      <div className="space-y-3 max-w-2xl">
        {isLoading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="panel p-5 h-16 animate-pulse bg-slate-50" />
            ))
          : GATEWAYS.map((gw) => (
              <GatewayCard
                key={gw.id}
                gateway={gw}
                initialValues={settingsMap}
                savedMasks={settingsMap}
              />
            ))}
      </div>
    </div>
  )
}
