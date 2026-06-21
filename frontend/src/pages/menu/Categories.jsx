import { Plus, GripVertical } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner } from '../../components/ui/Common'
import { useGetCategoriesQuery } from '../../store/api/menuApi'

export default function Categories() {
  const { data, isLoading } = useGetCategoriesQuery()

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize how dishes are grouped across the menu and POS."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            Add category
          </button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading categories…" />
      ) : (
        <div className="panel divide-y divide-slate-50">
          {data.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3.5">
              <GripVertical size={15} className="text-slate-300 cursor-grab shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm text-ink">{cat.name}</p>
                <p className="text-xs text-slate-400 stat-mono">{cat.items} items</p>
              </div>
              <Badge tone={cat.active ? 'green' : 'slate'}>{cat.active ? 'Active' : 'Hidden'}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
