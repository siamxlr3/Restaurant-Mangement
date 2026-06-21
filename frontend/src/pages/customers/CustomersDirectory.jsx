import { Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetCustomersQuery } from '../../store/api/customersApi'

const tierTone = { Platinum: 'orange', Gold: 'amber', Silver: 'slate', Bronze: 'slate' }

export default function CustomersDirectory() {
  const { data, isLoading } = useGetCustomersQuery()

  const columns = [
    { key: 'name', header: 'Customer', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'visits', header: 'Visits', render: (r) => <span className="stat-mono">{r.visits}</span> },
    {
      key: 'lifetimeSpend',
      header: 'Lifetime spend',
      render: (r) => <span className="stat-mono font-semibold">৳{r.lifetimeSpend.toLocaleString('en-IN')}</span>,
    },
    { key: 'tier', header: 'Tier', render: (r) => <Badge tone={tierTone[r.tier]}>{r.tier}</Badge> },
    { key: 'lastVisit', header: 'Last visit', render: (r) => <span className="text-slate-500">{r.lastVisit}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Guest profiles, visit history, and spend."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            Add customer
          </button>
        }
      />
      <div className="panel">
        {isLoading ? <Spinner label="Loading customer records…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
