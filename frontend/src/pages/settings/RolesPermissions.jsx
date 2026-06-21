import { Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Common'

const roles = [
  { name: 'General Manager', members: 1, permissions: ['Full access'] },
  { name: 'Floor Manager', members: 2, permissions: ['Operations', 'Billing', 'Staff (view)'] },
  { name: 'Head Chef', members: 1, permissions: ['Kitchen display', 'Inventory', 'Recipes'] },
  { name: 'Server', members: 6, permissions: ['POS', 'Floor map', 'Reservations'] },
  { name: 'Cashier', members: 2, permissions: ['Billing', 'Payments'] },
]

export default function RolesPermissions() {
  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="Control what each role can see and do across the dashboard."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            New role
          </button>
        }
      />

      <div className="panel divide-y divide-slate-50">
        {roles.map((r) => (
          <div key={r.name} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{r.name}</p>
              <p className="text-xs text-slate-400 mt-0.5 stat-mono">{r.members} member{r.members !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 max-w-xs justify-end">
              {r.permissions.map((p) => (
                <Badge key={p} tone="slate">{p}</Badge>
              ))}
            </div>
            <button className="btn-secondary shrink-0">Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}
