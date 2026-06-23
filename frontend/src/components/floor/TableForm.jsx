import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiX, FiLoader } from 'react-icons/fi'
import { useGetStaffQuery } from '../../store/api/staffApi'

const tableSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(50, 'Too long'),
  capacity: z.coerce.number().int().min(1, 'At least 1').max(50, 'Max 50'),
  section: z.string().min(1, 'Section is required'),
  waiter_id: z.string().optional().nullable(),
})

export default function TableForm({ initialData, onSubmit, onClose, isLoading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      name: '',
      capacity: 4,
      section: 'Main Hall',
      waiter_id: null,
    },
  })

  const { data: staffRes } = useGetStaffQuery({ per_page: 100, status: 'active' })
  const staffList = staffRes?.data ?? []

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name ?? '',
        capacity: initialData.capacity ?? 4,
        section: initialData.section ?? 'Main Hall',
        waiter_id: initialData.waiter_id ?? null,
      })
    } else {
      reset({ name: '', capacity: 4, section: 'Main Hall', waiter_id: null })
    }
  }, [initialData, reset])

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      waiter_id: data.waiter_id || null,
    }
    onSubmit(payload)
  }

  const isEdit = Boolean(initialData)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-ink text-lg">
            {isEdit ? 'Edit Table' : 'Add New Table'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
          {/* Table Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Table Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. T-01, Window-3"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ticket-orange/40 focus:border-ticket-orange transition-colors"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Capacity (seats) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('capacity')}
              type="number"
              min={1}
              max={50}
              placeholder="4"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ticket-orange/40 focus:border-ticket-orange transition-colors"
            />
            {errors.capacity && (
              <p className="mt-1 text-xs text-red-500">{errors.capacity.message}</p>
            )}
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Section <span className="text-red-500">*</span>
            </label>
            <input
              {...register('section')}
              type="text"
              placeholder="e.g. Main Hall, Rooftop, Private"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ticket-orange/40 focus:border-ticket-orange transition-colors"
            />
            {errors.section && (
              <p className="mt-1 text-xs text-red-500">{errors.section.message}</p>
            )}
          </div>

          {/* Waiter Assignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Assign Waiter <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </label>
            <select
              {...register('waiter_id')}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-ticket-orange/40 focus:border-ticket-orange transition-colors bg-white"
            >
              <option value="">— No waiter assigned —</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ticket-orange text-white text-sm font-medium hover:bg-ticket-orange/90 disabled:opacity-60 transition-colors"
            >
              {isLoading && <FiLoader size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
