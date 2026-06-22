import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Mail, Phone, DollarSign, Clock, MapPin, Percent } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import SettingsSaveButton from '../../components/settings/SettingsSaveButton'
import {
  useGetSettingsByGroupQuery,
  useUpsertSettingsGroupMutation,
} from '../../store/api/settingsApi'

const schema = z.object({
  restaurant_name: z.string().min(2, 'Name must be at least 2 characters'),
  contact_email:   z.string().email('Invalid email address'),
  phone_number:    z.string().min(5, 'Invalid phone number'),
  currency:        z.string().min(1, 'Required'),
  timezone:        z.string().min(1, 'Required'),
  address:         z.string().optional(),
  tax_rate:        z.string().optional(),
})

const GROUP = 'general'

// Helper: turn array of setting rows into a flat { key: value } object
function settingsToFormValues(settings = []) {
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value ?? '' }), {})
}

// Helper: turn form values into the settings[] array for the API
function formValuesToSettings(values, existingSettings = []) {
  const fieldMeta = {
    restaurant_name: { label: 'Restaurant Name',   type: 'text',   is_encrypted: false },
    contact_email:   { label: 'Contact Email',      type: 'text',   is_encrypted: false },
    phone_number:    { label: 'Phone Number',        type: 'text',   is_encrypted: false },
    currency:        { label: 'Currency',            type: 'text',   is_encrypted: false },
    timezone:        { label: 'Timezone',            type: 'text',   is_encrypted: false },
    address:         { label: 'Address',             type: 'text',   is_encrypted: false },
    tax_rate:        { label: 'Tax Rate (%)',         type: 'number', is_encrypted: false },
  }
  return Object.entries(values).map(([key, value]) => ({
    key,
    value: value ?? '',
    ...fieldMeta[key],
  }))
}

function FieldWrapper({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-ink mb-1.5">
        {Icon && <Icon size={13} className="text-slate-400" />}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function GeneralSettings() {
  const { data, isLoading } = useGetSettingsByGroupQuery(GROUP)
  const [upsert] = useUpsertSettingsGroupMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      restaurant_name: '',
      contact_email:   '',
      phone_number:    '',
      currency:        'BDT',
      timezone:        'Asia/Dhaka',
      address:         '',
      tax_rate:        '',
    },
  })

  // Populate form once settings are loaded
  useEffect(() => {
    if (data?.data) {
      const vals = settingsToFormValues(data.data)
      reset({
        restaurant_name: vals.restaurant_name || '',
        contact_email:   vals.contact_email   || '',
        phone_number:    vals.phone_number     || '',
        currency:        vals.currency         || 'BDT',
        timezone:        vals.timezone         || 'Asia/Dhaka',
        address:         vals.address          || '',
        tax_rate:        vals.tax_rate          || '',
      })
    }
  }, [data, reset])

  const onSubmit = async (values) => {
    try {
      await upsert({ group: GROUP, settings: formValuesToSettings(values) }).unwrap()
      toast.success('General settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div>
      <PageHeader
        title="General Settings"
        description="Basic information about your restaurant — name, contact, and regional preferences."
      />

      {isLoading ? (
        <div className="panel p-6 max-w-2xl space-y-5 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="panel p-6 max-w-2xl space-y-5">

            <FieldWrapper label="Restaurant name" icon={Building2} error={errors.restaurant_name?.message}>
              <input {...register('restaurant_name')} type="text" className="input-field" placeholder="Banglawok Kitchen" />
            </FieldWrapper>

            <FieldWrapper label="Contact email" icon={Mail} error={errors.contact_email?.message}>
              <input {...register('contact_email')} type="email" className="input-field" placeholder="hello@example.com" />
            </FieldWrapper>

            <FieldWrapper label="Phone number" icon={Phone} error={errors.phone_number?.message}>
              <input {...register('phone_number')} type="text" className="input-field stat-mono" placeholder="+880 2 9551234" />
            </FieldWrapper>

            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Currency" icon={DollarSign} error={errors.currency?.message}>
                <select {...register('currency')} className="input-field">
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </FieldWrapper>

              <FieldWrapper label="Timezone" icon={Clock} error={errors.timezone?.message}>
                <select {...register('timezone')} className="input-field">
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="America/New_York">America/New York (GMT-5)</option>
                </select>
              </FieldWrapper>
            </div>

            <FieldWrapper label="Restaurant address" icon={MapPin} error={errors.address?.message}>
              <input {...register('address')} type="text" className="input-field" placeholder="123 Main St, Dhaka, Bangladesh" />
            </FieldWrapper>

            <FieldWrapper label="Default tax rate (%)" icon={Percent} error={errors.tax_rate?.message}>
              <input {...register('tax_rate')} type="number" step="0.01" min="0" max="100" className="input-field" placeholder="7.5" />
            </FieldWrapper>

            <div className="pt-4 border-t border-slate-100">
              <SettingsSaveButton isLoading={isSubmitting} />
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
