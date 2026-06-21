import { Phone, Users, Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetReservationsQuery } from '../../store/api/operationsApi'

const statusTone = { confirmed: 'green', pending: 'amber' }

export default function Reservations() {
  const { data, isLoading } = useGetReservationsQuery()

  const columns = [
    { key: 'name', header: 'Guest', render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: 'guests',
      header: 'Party',
      render: (r) => (
        <span className="flex items-center gap-1.5 stat-mono">
          <Users size={13} className="text-slate-400" />
          {r.guests}
        </span>
      ),
    },
    { key: 'time', header: 'Time', render: (r) => <span className="stat-mono">{r.time}</span> },
    { key: 'table', header: 'Table' },
    {
      key: 'phone',
      header: 'Contact',
      render: (r) => (
        <span className="flex items-center gap-1.5 text-slate-500 stat-mono text-xs">
          <Phone size={12} />
          {r.phone}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Upcoming bookings for tonight's service."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            New reservation
          </button>
        }
      />
      <div className="panel">
        {isLoading ? <Spinner label="Loading reservations…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
