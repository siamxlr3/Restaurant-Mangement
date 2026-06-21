import { Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetMenuItemsQuery } from '../../store/api/menuApi'

const statusTone = { active: 'green', 'low-stock': 'amber', inactive: 'slate' }

export default function MenuItems() {
  const { data, isLoading } = useGetMenuItemsQuery()

  const columns = [
    {
      key: 'name',
      header: 'Item',
      render: (r) => (
        <span className="flex items-center gap-2.5">
          <span className="text-xl">{r.image}</span>
          <span className="font-medium">{r.name}</span>
        </span>
      ),
    },
    { key: 'category', header: 'Category', render: (r) => <Badge tone="slate">{r.category}</Badge> },
    { key: 'price', header: 'Price', render: (r) => <span className="stat-mono">৳{r.price}</span> },
    { key: 'cost', header: 'Cost', render: (r) => <span className="stat-mono text-slate-400">৳{r.cost}</span> },
    {
      key: 'margin',
      header: 'Margin',
      render: (r) => (
        <span className="stat-mono">{Math.round(((r.price - r.cost) / r.price) * 100)}%</span>
      ),
    },
    {
      key: 'popularity',
      header: 'Popularity',
      render: (r) => (
        <div className="flex items-center gap-2 w-28">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-ticket-orange rounded-full" style={{ width: `${r.popularity}%` }} />
          </div>
          <span className="stat-mono text-xs text-slate-500">{r.popularity}</span>
        </div>
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
        title="Menu items"
        description="Every dish on the menu, with live pricing and margin data."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            Add item
          </button>
        }
      />
      <div className="panel">
        {isLoading ? <Spinner label="Loading menu items…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
