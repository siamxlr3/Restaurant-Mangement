import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateWaitlistMutation, useGetWaitlistsQuery } from '../../../store/api/waitlistApi'
import { toast } from 'sonner'
import { Spinner } from '../../../components/ui/Common'

const schema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_phone: z.string().min(10, 'Valid phone number is required'),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  party_size: z.coerce.number().min(1, 'At least 1 person'),
  est_wait_mins: z.coerce.number().min(0, 'Wait time cannot be negative').optional(),
})

export default function WaitlistForm({ onSuccess, onCancel }) {
  const [createWaitlist, { isLoading: isCreating }] = useCreateWaitlistMutation()
  
  // Fetch active waitlist items to auto-calculate base wait time
  const { data: activeWaitlistData } = useGetWaitlistsQuery({ status: 'waiting' })
  const [autoWait, setAutoWait] = useState(15)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      party_size: 2,
      est_wait_mins: 15,
    },
  })

  // Watch party size and size of waiting list to auto-estimate wait time
  const watchedPartySize = watch('party_size')

  useEffect(() => {
    const waitingItems = activeWaitlistData?.data || []
    const activeWaitingCount = waitingItems.filter(item => item.status === 'waiting').length
    const calculatedWait = (activeWaitingCount + 1) * 15
    setAutoWait(calculatedWait)
    setValue('est_wait_mins', calculatedWait)
  }, [activeWaitlistData, watchedPartySize, setValue])

  const onSubmit = async (data) => {
    try {
      const payload = {
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        party_size: data.party_size,
        est_wait_mins: data.est_wait_mins,
      }
      await createWaitlist(payload).unwrap()
      toast.success('Guest added to waitlist')
      reset()
      onSuccess?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add guest to waitlist')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Guest Name</label>
        <input
          {...register('customer_name')}
          placeholder="e.g. Jane Doe"
          className={`input-field w-full ${errors.customer_name ? 'border-red-500' : ''}`}
        />
        {errors.customer_name && <p className="text-[11px] text-red-500">{errors.customer_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
          <input
            {...register('customer_phone')}
            placeholder="017XXXXXXXX"
            className={`input-field w-full ${errors.customer_phone ? 'border-red-500' : ''}`}
          />
          {errors.customer_phone && <p className="text-[11px] text-red-500">{errors.customer_phone.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email (Optional)</label>
          <input
            {...register('customer_email')}
            placeholder="jane@example.com"
            className={`input-field w-full ${errors.customer_email ? 'border-red-500' : ''}`}
          />
          {errors.customer_email && <p className="text-[11px] text-red-500">{errors.customer_email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Party Size</label>
          <input
            {...register('party_size')}
            type="number"
            className={`input-field w-full ${errors.party_size ? 'border-red-500' : ''}`}
          />
          {errors.party_size && <p className="text-[11px] text-red-500">{errors.party_size.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Wait (Mins)</label>
          <input
            {...register('est_wait_mins')}
            type="number"
            className={`input-field w-full ${errors.est_wait_mins ? 'border-red-500' : ''}`}
          />
          {errors.est_wait_mins && <p className="text-[11px] text-red-500">{errors.est_wait_mins.message}</p>}
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-1">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Automatic Estimation</span>
        <span className="text-sm font-semibold text-indigo-600 font-mono">{autoWait} mins estimated</span>
        <span className="text-[10px] text-slate-400">Based on {activeWaitlistData?.data?.length || 0} waiting parties.</span>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isCreating}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isCreating && <Spinner size="sm" className="!p-0" />}
          Add to Queue
        </button>
      </div>
    </form>
  )
}
