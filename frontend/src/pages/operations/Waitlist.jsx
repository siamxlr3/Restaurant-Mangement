import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { 
  Users, 
  Search, 
  Plus, 
  Trash2,
  Bell,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  XCircle,
  Clock,
  Table as TableIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, EmptyState } from '../../components/ui/Common'
import { 
  useGetWaitlistsQuery, 
  useUpdateWaitlistStatusMutation, 
  useDeleteWaitlistMutation,
  useCreateWaitlistMutation
} from '../../store/api/waitlistApi'
import { useGetTablesQuery } from '../../store/api/tablesApi'
import { useDebounce } from '../../hooks/useDebounce'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusConfig = {
  waiting: { tone: 'orange', label: 'Waiting' },
  notified: { tone: 'amber', label: 'Notified' },
  seated: { tone: 'green', label: 'Seated' },
  cancelled: { tone: 'red', label: 'Cancelled' },
  no_show: { tone: 'slate', label: 'No Show' },
}

export default function Waitlist() {
  // Filters and Pagination states
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Modals / Panels
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [seatingItem, setSeatingItem] = useState(null)

  const debouncedSearch = useDebounce(search, 300)

  // API query with 15s auto-polling to ensure queue lists are fresh
  const { data, isLoading, isFetching } = useGetWaitlistsQuery({
    page,
    per_page: perPage,
    search: debouncedSearch,
    status,
    from_date: fromDate,
    to_date: toDate,
  }, { pollingInterval: 15000 })

  const [updateStatus, { isLoading: isStatusUpdating }] = useUpdateWaitlistStatusMutation()
  const [deleteWaitlist] = useDeleteWaitlistMutation()

  // Handlers
  const handleNotify = async (entry) => {
    try {
      await updateStatus({ id: entry.id, status: 'notified' }).unwrap()
      toast.success(`Guest ${entry.customer?.name} notified via SMS gateway`)
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send notification')
    }
  }

  const handleCancelParty = async (id) => {
    try {
      await updateStatus({ id, status: 'cancelled' }).unwrap()
      toast.success('Waitlist entry marked as Cancelled')
    } catch (err) {
      toast.error('Failed to cancel waitlist entry')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this waitlist entry?')) return
    try {
      await deleteWaitlist(id).unwrap()
      toast.success('Waitlist entry deleted')
    } catch (err) {
      toast.error('Failed to delete waitlist entry')
    }
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('all')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  // Helper to disable future dates in date selectors
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist"
        description="Manage guest queues, estimated wait periods, SMS alerts, and walk-in seatings."
        actions={
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={18} />
            Add to Queue
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="panel flex flex-wrap items-center gap-4 p-4 border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search guest name or phone..."
            className="input-field pl-10 w-full"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <select 
          className="input-field w-36"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Queue Status</option>
          <option value="waiting">Waiting</option>
          <option value="notified">Notified</option>
          <option value="seated">Seated</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>

        <div className="flex items-center gap-2">
          <input 
            type="date" 
            className="input-field w-40" 
            value={fromDate}
            max={getTodayString()}
            onChange={(e) => {
              setFromDate(e.target.value)
              setPage(1)
            }}
          />
          <span className="text-slate-400">→</span>
          <input 
            type="date" 
            className="input-field w-40" 
            value={toDate}
            max={getTodayString()}
            onChange={(e) => {
              setToDate(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <button 
          onClick={resetFilters}
          className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors px-2 cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Table Section */}
      <div className="panel overflow-hidden relative border border-slate-200 rounded-xl shadow-sm bg-white">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1.5px] z-10 flex items-center justify-center">
            <Spinner />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Guest Details</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Party Size</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Checked In</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Wait Time</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data?.data?.length && !isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState 
                      title="No waitlist record found" 
                      description="The queue is currently empty. Try checking other date filters or add a walk-in." 
                    />
                  </td>
                </tr>
              ) : (
                data?.data?.map((entry) => (
                  <tr key={entry.id} className="group border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-900">{entry.customer?.name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 py-0.5"><Phone size={12} /> {entry.customer?.phone}</span>
                          {entry.customer?.email && (
                            <span className="flex items-center gap-1 py-0.5"><Mail size={12} /> {entry.customer?.email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Users size={14} className="text-slate-400" />
                        {entry.party_size} pax
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-700">
                          {format(new Date(entry.joined_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500">
                          {format(new Date(entry.joined_at), 'h:mm aa')}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {entry.status === 'seated' ? (
                        <span className="text-xs text-slate-400 italic">Seated</span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 font-mono">
                          <Clock size={13} className="text-indigo-400" />
                          {entry.est_wait_mins} min
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={statusConfig[entry.status]?.tone}>
                        {statusConfig[entry.status]?.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {entry.status === 'waiting' && (
                          <button
                            onClick={() => handleNotify(entry)}
                            className="p-1 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Send SMS notification alert"
                          >
                            <Bell size={13} />
                            Alert
                          </button>
                        )}
                        {(entry.status === 'waiting' || entry.status === 'notified') && (
                          <>
                            <button 
                              onClick={() => setSeatingItem(entry)}
                              className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Seat at table"
                            >
                              <CheckCircle2 size={13} />
                              Seat
                            </button>
                            <button
                              onClick={() => handleCancelParty(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                              title="Mark as Cancelled"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & entries count selector */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              Showing <span className="font-medium text-slate-700">{(page-1)*perPage + 1}</span> to <span className="font-medium text-slate-700">{Math.min(page*perPage, data?.meta?.total || 0)}</span> of <span className="font-medium text-slate-700">{data?.meta?.total || 0}</span> results
            </p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Show</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value))
                  setPage(1)
                }}
                className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white font-medium text-slate-700 cursor-pointer"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-50 text-slate-600 enabled:hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-600 px-2 font-mono">Page {page} of {data?.meta?.total_pages || 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (data?.meta?.total_pages || 1)}
              className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-50 text-slate-600 enabled:hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Slideout forms & Seating overlays */}
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-ink">
                    Add Walk-in to Queue
                  </h2>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                </div>

                <WaitlistForm 
                  onSuccess={() => setIsFormOpen(false)} 
                  onCancel={() => setIsFormOpen(false)} 
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {ReactDOM.createPortal(
        <AnimatePresence>
          {seatingItem && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSeatingItem(null)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-xl shadow-2xl z-[70] p-6"
              >
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h2 className="font-display text-lg font-bold text-slate-800">
                    Seat Party
                  </h2>
                  <button 
                    onClick={() => setSeatingItem(null)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <ChevronRight size={18} className="rotate-180 text-slate-400" />
                  </button>
                </div>

                <SeatPartyModal
                  item={seatingItem}
                  onSuccess={() => setSeatingItem(null)}
                  onCancel={() => setSeatingItem(null)}
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

// ==========================================
// Sub-Components
// ==========================================

const schema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_phone: z.string().min(10, 'Valid phone number is required'),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  party_size: z.coerce.number().min(1, 'At least 1 person'),
  est_wait_mins: z.coerce.number().min(0, 'Wait time cannot be negative').optional(),
})

function WaitlistForm({ onSuccess, onCancel }) {
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

function SeatPartyModal({ item, onSuccess, onCancel }) {
  const { data: tablesData, isLoading: fetchingTables } = useGetTablesQuery({ per_page: 100 })
  const [updateStatus, { isLoading: isUpdating }] = useUpdateWaitlistStatusMutation()
  const [selectedTableId, setSelectedTableId] = useState('')

  // Filter tables to show only open / available tables
  const availableTables = (tablesData?.data || []).filter(t => t.status === 'open')

  const handleSeat = async (e) => {
    e.preventDefault()
    if (!selectedTableId) {
      toast.error('Please select a table to seat the guest.')
      return
    }

    try {
      await updateStatus({
        id: item.id,
        status: 'seated',
        table_id: selectedTableId
      }).unwrap()
      toast.success(`${item.customer?.name || 'Guest'} has been seated!`)
      onSuccess?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to seat party.')
    }
  }

  if (fetchingTables) return <Spinner label="Loading available tables..." />

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Seating Details</p>
        <p className="text-sm font-semibold text-slate-800">{item.customer?.name} (Party: {item.party_size} pax)</p>
      </div>

      <form onSubmit={handleSeat} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TableIcon size={12} className="text-slate-400" /> Choose Available Table
          </label>
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="input-field w-full"
          >
            <option value="">-- Select an open table --</option>
            {availableTables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name} (Cap: {table.capacity} pax) - {table.section}
              </option>
            ))}
          </select>
          {availableTables.length === 0 && (
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Warning: No available open tables. Update table status on Floor map first.
            </p>
          )}
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
            disabled={isUpdating || !selectedTableId}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating && <Spinner size="sm" className="!p-0" />}
            Confirm Seat
          </button>
        </div>
      </form>
    </div>
  )
}

