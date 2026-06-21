import { Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetIngredientsQuery } from '../../store/api/inventoryApi'

const statusTone = { healthy: 'green', low: 'amber', critical: 'rose' }

export default function Ingredients() {
  const { data, isLoading } = useGetIngredientsQuery()

  const columns = [
    { key: 'name', header: 'Ingredient', render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: 'stock',
      header: 'On hand',
      render: (r) => (
        <span className="stat-mono">
          {r.stock} {r.unit}
        </span>
      ),
    },
    {
      key: 'parLevel',
      header: 'Par level',
      render: (r) => (
        <span className="stat-mono text-slate-400">
          {r.parLevel} {r.unit}
        </span>
      ),
    },
    {
      key: 'level',
      header: 'Stock level',
      render: (r) => {
        const pct = Math.min(100, Math.round((r.stock / r.parLevel) * 100))
        const barColor = r.status === 'critical' ? 'bg-rose-signal' : r.status === 'low' ? 'bg-amber-signal' : 'bg-pass-green'
        return (
          <div className="flex items-center gap-2 w-28">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
            <span className="stat-mono text-xs text-slate-500">{pct}%</span>
          </div>
        )
      },
    },
    { key: 'costPerUnit', header: 'Cost/unit', render: (r) => <span className="stat-mono">৳{r.costPerUnit}</span> },
    { key: 'supplier', header: 'Supplier' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Ingredients"
        description="Real-time stock levels across the kitchen."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            Add ingredient
          </button>
        }
      />
      <div className="panel">
        {isLoading ? <Spinner label="Checking stock levels…" /> : <DataTable columns={columns} data={data} />}
      </div>
    </div>
  )
}
