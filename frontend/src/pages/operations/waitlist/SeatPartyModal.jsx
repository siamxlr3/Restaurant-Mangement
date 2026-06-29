import React, { useState } from 'react'
import { useGetTablesQuery } from '../../../store/api/tablesApi'
import { useUpdateWaitlistStatusMutation } from '../../../store/api/waitlistApi'
import { toast } from 'sonner'
import { Spinner } from '../../../components/ui/Common'
import { Table as TableIcon } from 'lucide-react'

export default function SeatPartyModal({ item, onSuccess, onCancel }) {
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
