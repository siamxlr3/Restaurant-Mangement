import { Users, Bell, Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetWaitlistQuery } from '../../store/api/operationsApi'

const statusTone = { waiting: 'slate', notified: 'orange' }

export default function Waitlist() {
  const { data, isLoading } = useGetWaitlistQuery()

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
    { key: 'waitingSince', header: 'Since', render: (r) => <span className="stat-mono">{r.waitingSince}</span> },
    {
      key: 'quotedWait',
      header: 'Quoted wait',
      render: (r) => <span className="stat-mono">{r.quotedWait} min</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <button className="flex items-center gap-1.5 text-xs font-semibold text-ticket-orange">
          <Bell size={13} />
          Notify
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Waitlist"
        description="Guests currently waiting for a table."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            Add to waitlist
          </button>
        }
      />
      <div className="panel">
        {isLoading ? <Spinner label="Checking the door list…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
