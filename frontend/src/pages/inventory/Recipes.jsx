import { Plus, ChefHat } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Common'
import { useGetMenuItemsQuery } from '../../store/api/menuApi'

const sampleRecipeYield = {
  'Chicken Tikka Biryani': [
    { name: 'Basmati Rice', qty: '180g' },
    { name: 'Chicken (whole)', qty: '220g' },
    { name: 'Yogurt', qty: '40g' },
    { name: 'Ghee', qty: '15ml' },
  ],
  'Mutton Rezala': [
    { name: 'Mutton', qty: '260g' },
    { name: 'Yogurt', qty: '60g' },
    { name: 'Ghee', qty: '20ml' },
  ],
  'Garlic Butter Prawns': [
    { name: 'Prawns (medium)', qty: '200g' },
    { name: 'Ghee', qty: '10ml' },
  ],
}

export default function Recipes() {
  const { data, isLoading } = useGetMenuItemsQuery()

  return (
    <div>
      <PageHeader
        title="Recipes"
        description="Ingredient breakdown per dish, used to calculate cost and auto-deplete stock."
        actions={
          <button className="btn-accent">
            <Plus size={15} />
            New recipe
          </button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading recipes…" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.slice(0, 6).map((item) => {
            const recipe = sampleRecipeYield[item.name]
            return (
              <div key={item.id} className="panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{item.image}</span>
                    <div>
                      <p className="font-display font-semibold text-ink text-sm">{item.name}</p>
                      <p className="text-xs text-slate-400">Yields 1 serving</p>
                    </div>
                  </div>
                  <span className="stat-mono text-xs text-slate-400">Cost ৳{item.cost}</span>
                </div>
                {recipe ? (
                  <ul className="space-y-1.5">
                    {recipe.map((ing) => (
                      <li key={ing.name} className="flex justify-between text-sm">
                        <span className="text-slate-600">{ing.name}</span>
                        <span className="stat-mono text-slate-400">{ing.qty}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <ChefHat size={13} />
                    No recipe linked yet
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
