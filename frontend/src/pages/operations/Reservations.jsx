import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { 
  Users, 
  Calendar, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone,
  Trash2,
  Edit2,
  CheckCircle2,
  Table as TableIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, EmptyState } from '../../components/ui/Common'
import { 
  useGetReservationsQuery, 
  useUpdateReservationStatusMutation, 
  useDeleteReservationMutation,
  useCreateReservationMutation,
  useGetReservationByIdQuery,
} from '../../store/api/reservationApi'
import { useGetTablesQuery } from '../../store/api/tablesApi'
import { useDebounce } from '../../hooks/useDebounce'

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig = {
  confirmed: { tone: 'green', label: 'Confirmed' },
  seated: { tone: 'indigo', label: 'Seated' },
  completed: { tone: 'slate', label: 'Completed' },
  cancelled: { tone: 'red', label: 'Cancelled' },
}

// ─── BookingForm (inlined) ────────────────────────────────────────────────────
const bookingSchema = z.object({
  customer_name: z.string().min(2, 'Name is too short'),
  customer_phone: z.string().min(10, 'Invalid phone number'),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  table_id: z.string().uuid('Please select a table').optional().nullable(),
  reserved_at: z.string().min(1, 'Reservation time is required'),
  party_size: z.coerce.number().min(1, 'At least 1 person'),
  notes: z.string().max(500, 'Notes are too long').optional(),
})

function BookingForm({ reservationId, onSuccess, onCancel }) {
  const { data: reservation, isLoading: fetchingRes } = useGetReservationByIdQuery(reservationId, { skip: !reservationId })
  const { data: tablesData, isLoading: fetchingTables } = useGetTablesQuery({ per_page: 100 })
  const [createReservation, { isLoading: isCreating }] = useCreateReservationMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(bookingSchema),
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

// ─── Main Reservations page ───────────────────────────────────────────────────
export default function Reservations() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isFetching } = useGetReservationsQuery({
    page,
    per_page: perPage,
    search: debouncedSearch,
    status,
    from_date: fromDate,
    to_date: toDate,
  })

  const [updateStatus] = useUpdateReservationStatusMutation()
  const [deleteReservation] = useDeleteReservationMutation()

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap()
      toast.success(`Reservation ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) return
    try {
      await deleteReservation(id).unwrap()
      toast.success('Reservation deleted')
    } catch (err) {
      toast.error('Failed to delete reservation')
    }
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('all')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations"
        description="Manage guest bookings and floor availability."
        actions={
          <button 
            onClick={() => { setEditingId(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            New Booking
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="panel flex flex-wrap items-center gap-4 p-4 border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search guest or phone..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="input-field w-36"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="seated">Seated</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="flex items-center gap-2">
          <input 
            type="date" 
            className="input-field w-40" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="text-slate-400">→</span>
          <input 
            type="date" 
            className="input-field w-40" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <button 
          onClick={resetFilters}
          className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors px-2"
        >
          Reset
        </button>
      </div>



      {/* Table Section */}
      <div className="panel overflow-hidden relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Spinner />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Party</th>
                <th>Time</th>
                <th>Table</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data?.data?.length && !isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState 
                      title="No reservations found" 
                      description="Try adjusting your filters or add a new booking." 
                    />
                  </td>
                </tr>
              ) : (
                data?.data?.map((res) => (
                  <tr key={res.id} className="group hover:bg-slate-50/50">
                    <td>
                      <div>
                        <p className="font-semibold text-slate-900">{res.customer?.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Phone size={12} /> {res.customer?.phone}</span>
                          {res.customer?.email && <span className="flex items-center gap-1"><Mail size={12} /> {res.customer?.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Users size={14} className="text-slate-400" />
                        {res.party_size} pax
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-700">
                          {format(new Date(res.reserved_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-[11px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                          {format(new Date(res.reserved_at), 'h:mm aa')}
                        </p>
                      </div>
                    </td>
                    <td>
                      {res.table ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-sm text-slate-600 font-medium">{res.table.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={statusConfig[res.status]?.tone}>
                        {statusConfig[res.status]?.label}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {res.status === 'confirmed' && (
                          <button 
                            onClick={() => handleStatusChange(res.id, 'seated')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Mark as Seated"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => { setEditingId(res.id); setIsFormOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(res.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs text-slate-500">
            Showing <span className="font-medium text-slate-700">{(page-1)*perPage + 1}</span> to <span className="font-medium text-slate-700">{Math.min(page*perPage, data?.meta?.total || 0)}</span> of <span className="font-medium text-slate-700">{data?.meta?.total || 0}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-50 text-slate-600 enabled:hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-slate-600 px-2">Page {page} of {data?.meta?.total_pages || 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (data?.meta?.total_pages || 1)}
              className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-50 text-slate-600 enabled:hover:bg-slate-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal / Side Panel */}
      {ReactDOM.createPortal(
        <AnimatePresence>
          {isFormOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFormOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[70] p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display text-xl font-bold text-ink">
                    {editingId ? 'Edit Reservation' : 'New Reservation'}
                  </h2>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                </div>

                <BookingForm 
                  reservationId={editingId} 
                  onSuccess={() => setIsFormOpen(false)} 
                  onCancel={() => setIsFormOpen(false)} 
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
