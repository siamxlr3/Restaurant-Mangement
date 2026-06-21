import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetPaymentsQuery } from '../../store/api/billingApi'

const statusTone = { completed: 'green', refunded: 'rose', pending: 'amber' }

export default function Payments() {
  const { data, isLoading } = useGetPaymentsQuery()

  const columns = [
    { key: 'id', header: 'Payment', render: (r) => <span className="stat-mono font-medium">{r.id}</span> },
    { key: 'bill', header: 'Bill', render: (r) => <span className="stat-mono text-slate-500">{r.bill}</span> },
    { key: 'method', header: 'Method', render: (r) => <Badge tone="slate">{r.method}</Badge> },
    { key: 'amount', header: 'Amount', render: (r) => <span className="stat-mono font-semibold">৳{r.amount.toLocaleString('en-IN')}</span> },
    { key: 'time', header: 'Time', render: (r) => <span className="stat-mono text-slate-400">{r.time}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Payments" description="Transaction log across all payment methods." />
      <div className="panel">
        {isLoading ? <Spinner label="Loading payment log…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
