import { Plus, Star } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetStaffQuery } from '../../store/api/staffApi'

const statusTone = { 'on-duty': 'green', 'on-break': 'amber', 'off-duty': 'slate' }

export default function StaffDirectory() {
  const { data, isLoading } = useGetStaffQuery()

  const columns = [
    {
      key: 'name',
      header: 'Staff',
      render: (r) => (
        <span className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
            {r.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </span>
          <span className="font-medium">{r.name}</span>
        </span>
      ),
    },
    { key: 'role', header: 'Role' },
    { key: 'shift', header: 'Shift' },
    {
      key: 'rating',
      header: 'Rating',
      render: (r) => (
        <span className="flex items-center gap-1 stat-mono">
          <Star size={12} className="text-amber-signal fill-amber-signal" />
          {r.rating}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone[r.status]}>{r.status.replace('-', ' ')}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Everyone on the team, their role, and current status."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            Add staff
          </button>
        }
      />
      <div className="panel">
        {isLoading ? <Spinner label="Loading staff directory…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
