import React from 'react'
import { format, addHours, startOfDay, parseISO, getHours, getMinutes } from 'date-fns'
import { useGetReservationsQuery } from '../../../store/api/reservationApi'
import { Spinner, Badge } from '../../../components/ui/Common'
import { Users, Clock, Plus, CalendarDays } from 'lucide-react'

export default function ReservationTimeline({ fromDate, toDate, onNewBooking }) {
  const today = new Date().toISOString().split('T')[0]

  // Fall back to today when no filter is selected
  const effectiveFrom = fromDate || today
  const effectiveTo   = toDate   || today

  const { data, isLoading } = useGetReservationsQuery({
    from_date: effectiveFrom,
    to_date:   effectiveTo,
    per_page: 100,
  })

  const hours = Array.from({ length: 15 }, (_, i) =>
    addHours(startOfDay(new Date(new Date().setHours(10, 0, 0, 0))), i)
  )

  // Build header label
  const isToday = effectiveFrom === today && effectiveTo === today
  const isSameDate = effectiveFrom === effectiveTo

  const dateLabel = isToday
    ? format(new Date(), 'EEEE, MMMM do')
    : isSameDate
      ? format(parseISO(effectiveFrom), 'EEEE, MMMM do, yyyy')
      : `${format(parseISO(effectiveFrom), 'MMM d')} – ${format(parseISO(effectiveTo), 'MMM d, yyyy')}`

  const headerTitle = isToday ? "Today's Timeline" : 'Reservation Timeline'

  if (isLoading) return <Spinner label={`Loading timeline…`} />

  const reservations = data?.data ?? []

  return (
    <div className="panel p-6 overflow-x-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="text-indigo-600" size={20} />
          <h2 className="font-display text-lg font-bold text-ink">{headerTitle}</h2>
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-2">
            <CalendarDays size={12} />
            {dateLabel}
          </span>
        </div>
        {onNewBooking && (
          <button
            onClick={onNewBooking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={14} />
            New Booking
          </button>
        )}
      </div>

      {/* Badge showing active range when not today */}
      {!isToday && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
            {reservations.length} reservation{reservations.length !== 1 ? 's' : ''} in selected range
          </span>
          {(fromDate || toDate) && (
            <span className="text-[11px] text-slate-400 italic">
              Filtered by date range from parent filters
            </span>
          )}
        </div>
      )}

      <div className="min-w-[800px]">
        {/* Time Headers */}
        <div className="flex border-b border-slate-100 pb-2 mb-4">
          <div className="w-24 shrink-0" />
          {hours.map((hour) => (
            <div
              key={hour.toString()}
              className="flex-1 text-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter"
            >
              {format(hour, 'HH:mm')}
            </div>
          ))}
        </div>

        {/* Timeline Grid — one lane per reservation so cards never overlap */}
        {reservations.length === 0 ? (
          <div className="flex items-center justify-center h-20 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
            <p className="text-xs text-slate-400 italic">No reservations in this range</p>
          </div>
        ) : (
          <div className="relative rounded-xl border border-slate-100 border-dashed overflow-visible"
               style={{ height: `${Math.max(reservations.length * 60, 80)}px` }}>
            {/* Column guides */}
            <div className="absolute inset-0 flex rounded-xl overflow-hidden">
              <div className="w-24 shrink-0 border-r border-slate-200/50 bg-slate-50/70" />
              {hours.map((hour) => (
                <div key={hour.toString()} className="flex-1 border-r border-slate-200/30 last:border-0 bg-slate-50/30" />
              ))}
            </div>

            {/* Lane stripes */}
            {reservations.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0"
                style={{
                  top: `${i * 60}px`,
                  height: '60px',
                  background: i % 2 === 0 ? 'rgba(248,250,252,0.6)' : 'transparent',
                }}
              />
            ))}

            {/* Booking cards */}
            {reservations.map((res, i) => {
              const rawAt = res.reserved_at
              const isoAt = rawAt && !rawAt.endsWith('Z') && !rawAt.includes('+') ? rawAt + 'Z' : rawAt
              const resTime = parseISO(isoAt)

              const TIMELINE_START_HOUR = 10
              const TIMELINE_SPAN_HOURS = 15
              const hourDiff = (getHours(resTime) + getMinutes(resTime) / 60) - TIMELINE_START_HOUR
              const leftPercent = Math.min(Math.max((hourDiff / TIMELINE_SPAN_HOURS) * 100, 0), 88)

              const statusTone = res.status === 'confirmed' ? 'green'
                : res.status === 'seated' ? 'indigo'
                : res.status === 'completed' ? 'slate'
                : 'red'
              const statusShort = res.status === 'confirmed' ? 'Conf'
                : res.status === 'seated' ? 'Seat'
                : res.status === 'completed' ? 'Done'
                : 'Canc'

              return (
                <div
                  key={res.id}
                  title={`${res.customer?.name} — ${format(resTime, 'HH:mm')} · ${res.party_size} pax`}
                  className="absolute bg-white border border-indigo-200 shadow-md rounded-lg px-3 py-2 flex flex-col justify-center min-w-[140px] max-w-[200px] hover:scale-105 hover:shadow-lg hover:border-indigo-400 transition-all cursor-pointer z-10"
                  style={{
                    left: `calc(96px + ${leftPercent}% * ((100% - 96px) / 100%))`,
                    top: `${i * 60 + 8}px`,
                    height: '44px',
                  }}
                >
                  <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{res.customer?.name ?? '—'}</p>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium shrink-0">
                      <Users size={10} /> {res.party_size} pax
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-indigo-500 font-mono shrink-0">
                      {format(resTime, 'HH:mm')}
                    </span>
                    <Badge tone={statusTone}>{statusShort}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-[10px] text-slate-400 mt-4 italic text-center">
          * Timeline shows bookings from 10:00 AM to 01:00 AM.
        </p>
      </div>
    </div>
  )
}
