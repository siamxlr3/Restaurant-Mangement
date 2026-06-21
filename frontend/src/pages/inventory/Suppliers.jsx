import { Plus, Truck } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner, DataTable } from '../../components/ui/Common'
import { useGetSuppliersQuery, useGetPurchaseOrdersQuery } from '../../store/api/inventoryApi'

const poStatusTone = { pending: 'amber', 'in-transit': 'orange', delivered: 'green' }

export default function Suppliers() {
  const { data: suppliers, isLoading: suppliersLoading } = useGetSuppliersQuery()
  const { data: pos, isLoading: posLoading } = useGetPurchaseOrdersQuery()

  const poColumns = [
    { key: 'id', header: 'PO', render: (r) => <span className="stat-mono font-medium">{r.id}</span> },
    { key: 'supplier', header: 'Supplier' },
    { key: 'items', header: 'Line items', render: (r) => <span className="stat-mono">{r.items}</span> },
    { key: 'total', header: 'Total', render: (r) => <span className="stat-mono font-semibold">৳{r.total.toLocaleString('en-IN')}</span> },
    { key: 'eta', header: 'ETA', render: (r) => <span className="text-slate-500">{r.eta}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={poStatusTone[r.status]}>{r.status.replace('-', ' ')}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Suppliers & purchase orders"
        description="Vendor relationships and open orders."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            New purchase order
          </button>
        }
      />

      <h2 className="font-display font-semibold text-ink mb-3">Suppliers</h2>
      {suppliersLoading ? (
        <Spinner label="Loading suppliers…" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {suppliers.map((s) => (
            <div key={s.id} className="ticket-card p-4 pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={15} className="text-slate-400" />
                <p className="font-semibold text-sm text-ink">{s.name}</p>
              </div>
              <p className="text-xs text-slate-400 mb-3">{s.category}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Reliability</span>
                <span className="stat-mono font-medium text-pass-green">{s.reliability}%</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Lead time</span>
                <span className="stat-mono">{s.leadTimeDays}d</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Open POs</span>
                <span className="stat-mono">{s.openPOs}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display font-semibold text-ink mb-3">Purchase orders</h2>
      <div className="panel">
        {posLoading ? <Spinner label="Loading purchase orders…" /> : <DataTable columns={poColumns} data={pos} />}
      </div>
    </div>
  )
}
