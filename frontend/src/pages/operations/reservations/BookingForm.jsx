import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateReservationMutation, useGetReservationByIdQuery } from '../../../store/api/reservationApi'
import { useGetTablesQuery } from '../../../store/api/tablesApi'
import { toast } from 'sonner'
import { Spinner } from '../../../components/ui/Common'

const schema = z.object({
  customer_name: z.string().min(2, 'Name is too short'),
  customer_phone: z.string().min(10, 'Invalid phone number'),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  table_id: z.string().uuid('Please select a table').optional().nullable(),
  reserved_at: z.string().min(1, 'Reservation time is required'),
  party_size: z.coerce.number().min(1, 'At least 1 person'),
  notes: z.string().max(500, 'Notes are too long').optional(),
})

export default function BookingForm({ reservationId, onSuccess, onCancel }) {
  const { data: reservation, isLoading: fetchingRes } = useGetReservationByIdQuery(reservationId, { skip: !reservationId })
  const { data: tablesData, isLoading: fetchingTables } = useGetTablesQuery({ per_page: 100 })
  const [createReservation, { isLoading: isCreating }] = useCreateReservationMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: reservation || {
      party_size: 2,
      reserved_at: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    },
  })

  React.useEffect(() => {
    if (reservation) reset(reservation)
  }, [reservation, reset])

  const onSubmit = async (data) => {
    try {
      // Convert the local datetime-local string to a proper UTC ISO string.
      // Without this, Supabase treats the naive string as UTC, causing a timezone shift.
      const payload = {
        ...data,
        reserved_at: new Date(data.reserved_at).toISOString(),
      }
      await createReservation(payload).unwrap()
      toast.success('Reservation saved successfully')
      reset()
      onSuccess?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save reservation')
    }
  }

  if (fetchingRes || fetchingTables) return <Spinner label="Loading form data..." />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Guest Name</label>
          <input
            {...register('customer_name')}
            placeholder="e.g. John Doe"
            className={`input-field ${errors.customer_name ? 'border-red-500' : ''}`}
          />
          {errors.customer_name && <p className="text-[10px] text-red-500">{errors.customer_name.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone Number</label>
          <input
            {...register('customer_phone')}
            placeholder="017XXXXXXXX"
            className={`input-field ${errors.customer_phone ? 'border-red-500' : ''}`}
          />
          {errors.customer_phone && <p className="text-[10px] text-red-500">{errors.customer_phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email (Optional)</label>
        <input
          {...register('customer_email')}
          placeholder="john@example.com"
          className={`input-field ${errors.customer_email ? 'border-red-500' : ''}`}
        />
        {errors.customer_email && <p className="text-[10px] text-red-500">{errors.customer_email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</label>
        <input
          {...register('reserved_at')}
          type="datetime-local"
          className={`input-field w-full ${errors.reserved_at ? 'border-red-500' : ''}`}
        />
        {errors.reserved_at && <p className="text-[10px] text-red-500">{errors.reserved_at.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Party Size</label>
        <input
          {...register('party_size')}
          type="number"
          className={`input-field ${errors.party_size ? 'border-red-500' : ''}`}
        />
        {errors.party_size && <p className="text-[10px] text-red-500">{errors.party_size.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Table (Optional)</label>
        <select
          {...register('table_id')}
          className={`input-field ${errors.table_id ? 'border-red-500' : ''}`}
        >
          <option value="">No table assigned yet</option>
          {tablesData?.data?.map((table) => (
            <option key={table.id} value={table.id}>
              {table.name} ({table.capacity} pax) - {table.section}
            </option>
          ))}
        </select>
        {errors.table_id && <p className="text-[10px] text-red-500">{errors.table_id.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Allergies, special occasions, etc."
          className={`input-field ${errors.notes ? 'border-red-500' : ''}`}
        />
        {errors.notes && <p className="text-[10px] text-red-500">{errors.notes.message}</p>}
      </div>

      <div className="flex gap-3 pt-4">
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
          {reservationId ? 'Update Booking' : 'Confirm Booking'}
        </button>
      </div>
    </form>
  )
}
