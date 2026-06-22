import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Mail, MessageSquare, Bell, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../../components/ui/PageHeader'
import ApiKeyField from '../../components/settings/ApiKeyField'
import TestConnectionButton from '../../components/settings/TestConnectionButton'
import SettingsSaveButton from '../../components/settings/SettingsSaveButton'
import {
  useGetSettingsByGroupQuery,
  useUpsertSettingsGroupMutation,
} from '../../store/api/settingsApi'

const GROUP = 'notifications'

const CHANNELS = [
  {
    id:    'sendgrid',
    name:  'SendGrid Email',
    desc:  'Transactional email: order confirmations, receipts, alerts',
    icon:  Mail,
    color: 'text-blue-500',
    bg:    'bg-blue-50',
    fields: [
      { key: 'sendgrid_api_key',    label: 'API Key',        desc: 'Your SendGrid API key (SG.…)',    is_encrypted: true  },
      { key: 'sendgrid_from_email', label: 'From Email',     desc: 'Verified sender email address',   is_encrypted: false },
      { key: 'sendgrid_from_name',  label: 'From Name',      desc: 'Display name for sent emails',    is_encrypted: false },
    ],
    testKey: 'sendgrid_api_key',
    testProvider: 'sendgrid',
  },
  {
    id:    'smtp',
    name:  'Custom SMTP',
    desc:  'Use your own mail server for email delivery',
    icon:  Mail,
    color: 'text-violet-500',
    bg:    'bg-violet-50',
    fields: [
      { key: 'smtp_host',     label: 'SMTP Host',     desc: 'e.g. smtp.gmail.com',           is_encrypted: false },
      { key: 'smtp_port',     label: 'SMTP Port',     desc: 'Usually 587 (TLS) or 465 (SSL)', is_encrypted: false },
      { key: 'smtp_username', label: 'Username',      desc: 'SMTP authentication username',   is_encrypted: false },
      { key: 'smtp_password', label: 'Password',      desc: 'SMTP authentication password',   is_encrypted: true  },
    ],
    testKey: 'smtp_password',
    testProvider: null, // SMTP test not supported via API
  },
  {
    id:    'twilio',
    name:  'Twilio SMS',
    desc:  'SMS notifications for orders, reservations, and alerts',
    icon:  MessageSquare,
    color: 'text-red-500',
    bg:    'bg-red-50',
    fields: [
      { key: 'twilio_account_sid', label: 'Account SID', desc: 'Your Twilio Account SID (AC…)', is_encrypted: false },
      { key: 'twilio_auth_token',  label: 'Auth Token',  desc: 'Your Twilio Auth Token',         is_encrypted: true  },
      { key: 'twilio_from_number', label: 'From Number', desc: 'Your Twilio phone number (+…)',  is_encrypted: false },
    ],
    testKey: 'twilio_auth_token',
    testProvider: 'twilio',
  },
]

const NOTIFICATION_EVENTS = [
  { key: 'notify_new_order',       label: 'New order received',       desc: 'Trigger when a new order is placed' },
  { key: 'notify_low_stock',       label: 'Low stock alert',          desc: 'Trigger when inventory falls below reorder threshold' },
  { key: 'notify_reservation',     label: 'New reservation',          desc: 'Trigger when a table reservation is booked' },
  { key: 'notify_payment_failed',  label: 'Payment failure',          desc: 'Trigger when a payment transaction fails' },
  { key: 'notify_daily_report',    label: 'Daily summary report',     desc: 'Send a daily performance summary each morning' },
]

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{ height: '22px', width: '40px' }}
      className={`rounded-full relative shrink-0 transition-colors duration-200 ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

function ChannelCard({ channel, initialValues }) {
  const [upsert] = useUpsertSettingsGroupMutation()
  const [values, setValues]   = useState({})
  const [isSaved, setIsSaved] = useState({})
  const [masks, setMasks]     = useState({})
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen]       = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const Icon = channel.icon

  useEffect(() => {
    if (initialValues) {
      const vals = {}; const saved = {}; const msk = {}
      channel.fields.forEach(({ key }) => {
        vals[key]  = ''
        saved[key] = !!initialValues[key]
        msk[key]   = initialValues[key] || ''
      })
      setValues(vals)
      setIsSaved(saved)
      setMasks(msk)
      setEnabled(initialValues[`${channel.id}_enabled`] === 'true')
    }
  }, [initialValues])

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const settings = [
        { key: `${channel.id}_enabled`, value: String(enabled), label: `${channel.name} Enabled`, type: 'boolean', is_encrypted: false },
        ...channel.fields.map((f) => ({
          key: f.key, value: values[f.key] || '', label: f.label,
          is_encrypted: f.is_encrypted, type: f.is_encrypted ? 'password' : 'text',
        })).filter((s) => s.value),
      ]
      const res = await upsert({ group: GROUP, settings }).unwrap()
      const newMasks = {}; const newSaved = {}
      ;(res.data || []).forEach((s) => { newMasks[s.key] = s.value; newSaved[s.key] = true })
      setMasks((m) => ({ ...m, ...newMasks }))
      setIsSaved((s) => ({ ...s, ...newSaved }))
      const cleared = { ...values }
      channel.fields.forEach(({ key, is_encrypted }) => { if (is_encrypted) cleared[key] = '' })
      setValues(cleared)
      toast.success(`${channel.name} settings saved`)
    } catch {
      toast.error(`Failed to save ${channel.name} settings`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl ${channel.bg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={channel.color} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">{channel.name}</p>
          <p className="text-xs text-slate-400">{channel.desc}</p>
        </div>
        <div
          onClick={(e) => { e.stopPropagation(); setEnabled((v) => !v) }}
          style={{ height: '22px', width: '40px' }}
          className={`rounded-full relative shrink-0 cursor-pointer transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
        </div>
        <ChevronRight size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

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
              {channel.fields.map((field) => (
                <ApiKeyField
                  key={field.key}
                  id={field.key}
                  label={field.label}
                  description={field.desc}
                  value={values[field.key] || ''}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    setIsSaved((s) => ({ ...s, [field.key]: false }))
                  }}
                  isSaved={isSaved[field.key] || false}
                  maskedValue={masks[field.key] || ''}
                />
              ))}

              {channel.testProvider && (
                <TestConnectionButton
                  provider={channel.testProvider}
                  apiKey={values[channel.testKey]}
                />
              )}

              <div className="pt-3 border-t border-slate-100">
                <SettingsSaveButton isLoading={submitting} onClick={handleSave} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Notifications() {
  const { data, isLoading } = useGetSettingsByGroupQuery(GROUP)
  const [upsert] = useUpsertSettingsGroupMutation()
  const [events, setEvents]   = useState({})
  const [eventsSaving, setEventsSaving] = useState(false)

  const settingsMap = (data?.data || []).reduce(
    (acc, s) => ({ ...acc, [s.key]: s.value ?? '' }), {}
  )

  useEffect(() => {
    if (data?.data) {
      const evVals = {}
      NOTIFICATION_EVENTS.forEach(({ key }) => { evVals[key] = settingsMap[key] === 'true' })
      setEvents(evVals)
    }
  }, [data])

  const saveEvents = async () => {
    setEventsSaving(true)
    try {
      const settings = NOTIFICATION_EVENTS.map(({ key, label }) => ({
        key, value: String(events[key] ?? false), label, is_encrypted: false, type: 'boolean',
      }))
      await upsert({ group: GROUP, settings }).unwrap()
      toast.success('Notification events updated')
    } catch {
      toast.error('Failed to save notification events')
    } finally {
      setEventsSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Configure email and SMS delivery channels, and choose which events trigger notifications."
      />

      <div className="space-y-4 max-w-2xl">
        {/* Delivery channels */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
            Delivery Channels
          </p>
          <div className="space-y-3">
            {isLoading
              ? [...Array(3)].map((_, i) => <div key={i} className="panel p-5 h-16 animate-pulse bg-slate-50" />)
              : CHANNELS.map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} initialValues={settingsMap} />
                ))}
          </div>
        </div>

        {/* Event triggers */}
        {!isLoading && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
              Notification Events
            </p>
            <div className="panel divide-y divide-slate-50">
              <div className="flex items-center gap-2 px-5 py-3">
                <Bell size={14} className="text-slate-400" />
                <p className="text-sm font-semibold text-ink">Choose which events send notifications</p>
              </div>
              {NOTIFICATION_EVENTS.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    enabled={events[key] ?? false}
                    onChange={() => setEvents((e) => ({ ...e, [key]: !e[key] }))}
                  />
                </div>
              ))}
              <div className="px-5 py-4">
                <SettingsSaveButton isLoading={eventsSaving} onClick={saveEvents} label="Save events" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
