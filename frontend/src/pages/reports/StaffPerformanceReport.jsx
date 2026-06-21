import { Star } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/Common'

const data = [
  { name: 'Tania Sultana', role: 'Senior Server', salesGenerated: 184200, ticketsServed: 312, rating: 4.9 },
  { name: 'Rana Ahmed', role: 'Server', salesGenerated: 142600, ticketsServed: 268, rating: 4.7 },
  { name: 'Hasan Mahmud', role: 'Server', salesGenerated: 118400, ticketsServed: 221, rating: 4.3 },
  { name: 'Kamal Hossain', role: 'Head Chef', salesGenerated: null, ticketsServed: 980, rating: 4.8 },
  { name: 'Mim Akter', role: 'Server', salesGenerated: 129800, ticketsServed: 240, rating: 4.5 },
]

export default function StaffPerformanceReport() {
  const columns = [
    { key: 'name', header: 'Staff', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'role', header: 'Role' },
    {
      key: 'salesGenerated',
      header: 'Sales generated',
      render: (r) => (
        <span className="stat-mono">{r.salesGenerated ? `৳${r.salesGenerated.toLocaleString('en-IN')}` : '—'}</span>
      ),
    },
    { key: 'ticketsServed', header: 'Tickets', render: (r) => <span className="stat-mono">{r.ticketsServed}</span> },
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
  ]

  return (
    <div>
      <PageHeader title="Staff performance" description="Sales and service metrics for the current month." />
      <div className="panel">
        <DataTable columns={columns} data={data} rowKey="name" />
      </div>
    </div>
  )
}
