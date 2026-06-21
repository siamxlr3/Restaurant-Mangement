import { Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner } from '../../components/ui/Common'
import { useGetDiscountsQuery } from '../../store/api/billingApi'

export default function Discounts() {
  const { data, isLoading } = useGetDiscountsQuery()

  return (
    <div>
      <PageHeader
        title="Discounts"
        description="Promotional and membership discounts available at checkout."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            New discount
          </button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading discounts…" />
      ) : (
        <div className="panel divide-y divide-slate-50">
          {data.map((d) => (
            <div key={d.id} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1">
                <p className="font-medium text-sm text-ink">{d.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 stat-mono">
                  {d.type === 'percentage' ? `${d.value}% off` : `৳${d.value} flat off`} · used {d.usedCount}× this month
                </p>
              </div>
              <Badge tone={d.active ? 'green' : 'slate'}>{d.active ? 'Active' : 'Inactive'}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
