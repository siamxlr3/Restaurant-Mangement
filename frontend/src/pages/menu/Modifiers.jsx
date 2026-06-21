import { Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner } from '../../components/ui/Common'
import { useGetModifiersQuery } from '../../store/api/menuApi'

export default function Modifiers() {
  const { data, isLoading } = useGetModifiersQuery()

  return (
    <div>
      <PageHeader
        title="Variants & modifiers"
        description="Reusable option groups like spice level or portion size, applied across menu items."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            Add modifier group
          </button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading modifier groups…" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((mod) => (
            <div key={mod.id} className="panel p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-display font-semibold text-ink">{mod.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Applied to {mod.appliesTo} items · {mod.type === 'single-select' ? 'Pick one' : 'Pick multiple'}
                  </p>
                </div>
                <Badge tone="slate">{mod.type === 'single-select' ? 'Single' : 'Multi'}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mod.options.map((opt) => (
                  <span key={opt} className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
