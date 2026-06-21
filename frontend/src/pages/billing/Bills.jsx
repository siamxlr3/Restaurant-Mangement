import { Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetBillsQuery } from '../../store/api/billingApi'

const statusTone = { open: 'amber', paid: 'green' }

export default function Bills() {
  const { data, isLoading } = useGetBillsQuery()

  const columns = [
    { key: 'id', header: 'Bill', render: (r) => <span className="stat-mono font-medium">{r.id}</span> },
    { key: 'table', header: 'Table' },
    { key: 'server', header: 'Server' },
    { key: 'items', header: 'Items', render: (r) => <span className="stat-mono">{r.items}</span> },
    { key: 'subtotal', header: 'Subtotal', render: (r) => <span className="stat-mono">৳{r.subtotal.toLocaleString('en-IN')}</span> },
    {
      key: 'discount',
      header: 'Discount',
      render: (r) => (
        <span className="stat-mono text-pass-green">{r.discount ? `-৳${r.discount}` : '—'}</span>
      ),
    },
    { key: 'tax', header: 'Tax', render: (r) => <span className="stat-mono text-slate-400">৳{r.tax}</span> },
    { key: 'total', header: 'Total', render: (r) => <span className="stat-mono font-semibold">৳{r.total.toLocaleString('en-IN')}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Bills"
        description="Open and recently closed checks across the floor."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            New bill
          </button>
        }
      />
      <div className="panel">
        {isLoading ? <Spinner label="Loading bills…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
