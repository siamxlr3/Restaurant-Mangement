import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetAttendanceQuery } from '../../store/api/staffApi'

const statusTone = { 'on-time': 'green', late: 'amber', absent: 'rose' }

export default function Attendance() {
  const { data, isLoading } = useGetAttendanceQuery()

  const columns = [
    { key: 'staff', header: 'Staff', render: (r) => <span className="font-medium">{r.staff}</span> },
    { key: 'clockIn', header: 'Clock in', render: (r) => <span className="stat-mono">{r.clockIn}</span> },
    { key: 'clockOut', header: 'Clock out', render: (r) => <span className="stat-mono text-slate-400">{r.clockOut}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status.replace('-', ' ')}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Attendance" description="Clock-in records for today's shift." />
      <div className="panel">
        {isLoading ? <Spinner label="Loading attendance log…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
