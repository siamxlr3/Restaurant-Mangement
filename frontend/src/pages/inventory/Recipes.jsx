import { useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  RiAddLine, RiDeleteBin6Line, RiEditLine,
  RiCloseLine, RiBookOpenLine, RiSubtractLine,
  RiFlaskLine, RiCheckLine,
} from 'react-icons/ri'
import PageHeader from '../../components/ui/PageHeader'
import EnhancedDataTable from '../../components/common/EnhancedDataTable'
import {
  useGetRecipesQuery,
  useUpsertRecipeMutation,
  useDeleteRecipeMutation,
} from '../../store/api/recipesApi'
import { useGetIngredientsQuery } from '../../store/api/ingredientsApi'

// ── Zod Schema ───────────────────────────────────────────────────────────
const recipeSchema = z.object({
  item_id: z.string().uuid('Please select a menu item'),
  ingredients: z.array(
    z.object({
      ingredient_id: z.string().uuid('Select an ingredient'),
      qty_used: z.coerce.number().positive('Must be > 0'),
    })
  ).min(1, 'Add at least one ingredient'),
})

// ── Modal wrapper ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children, icon, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="font-display font-semibold text-ink text-base">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <RiCloseLine size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Recipe Builder Modal ──────────────────────────────────────────────────
function RecipeBuilderModal({ existingRecipe, menuItems, onClose }) {
  const isEdit = !!existingRecipe
  const [upsertRecipe, { isLoading }] = useUpsertRecipeMutation()

  // Load all active ingredients for the dropdowns
  const { data: ingResponse } = useGetIngredientsQuery({ per_page: 100, status: 'active' })
  const allIngredients = ingResponse?.data || []

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(recipeSchema),
    defaultValues: isEdit
      ? {
          item_id: existingRecipe.item_id,
          ingredients: existingRecipe.ingredients.map((i) => ({
            ingredient_id: i.ingredient_id,
            qty_used: i.qty_used,
          })),
        }
      : {
          item_id: '',
          ingredients: [{ ingredient_id: '', qty_used: '' }],
        },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })
  const watchIngredients = watch('ingredients')

  // Compute total ingredient cost
  const totalCost = (watchIngredients || []).reduce((sum, row) => {
    const ing = allIngredients.find((i) => i.id === row.ingredient_id)
    return sum + (ing ? parseFloat(ing.cost_per_unit || 0) * parseFloat(row.qty_used || 0) : 0)
  }, 0)

  const onSubmit = async ({ item_id, ingredients }) => {
    try {
      await upsertRecipe({ item_id, ingredients }).unwrap()
      toast.success(isEdit ? 'Recipe updated' : 'Recipe saved')
      onClose()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save recipe')
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit Recipe — ${existingRecipe.item_name}` : 'New Recipe'}
      onClose={onClose}
      icon={<RiBookOpenLine size={18} className="text-accent" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Menu Item selector (only show on create) */}
        {!isEdit && (
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Menu Item *</label>
            <select
              {...register('item_id')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Select a menu item…</option>
              {menuItems.map((item) => (
                <option key={item.item_id} value={item.item_id}>{item.item_name}</option>
              ))}
            </select>
            {errors.item_id && <p className="text-xs text-rose-500 mt-1">{errors.item_id.message}</p>}
          </div>
        )}

        {/* Ingredients List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">Ingredients *</label>
            <button
              type="button"
              onClick={() => append({ ingredient_id: '', qty_used: '' })}
              className="text-xs text-accent font-medium flex items-center gap-1 hover:underline"
            >
              <RiAddLine size={14} />
              Add Row
            </button>
          </div>

          {errors.ingredients?.root && (
            <p className="text-xs text-rose-500 mb-2">{errors.ingredients.root.message}</p>
          )}
          {typeof errors.ingredients?.message === 'string' && (
            <p className="text-xs text-rose-500 mb-2">{errors.ingredients.message}</p>
          )}

          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_24px] gap-2 px-1">
              <span className="text-xs text-slate-400 font-medium">Ingredient</span>
              <span className="text-xs text-slate-400 font-medium">Qty / Portion</span>
              <span />
            </div>
            {fields.map((field, index) => {
              const selectedIng = allIngredients.find((i) => i.id === watchIngredients?.[index]?.ingredient_id)
              return (
                <div key={field.id} className="grid grid-cols-[1fr_120px_24px] gap-2 items-start">
                  <div>
                    <select
                      {...register(`ingredients.${index}.ingredient_id`)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="">Select ingredient…</option>
                      {allIngredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                    {errors.ingredients?.[index]?.ingredient_id && (
                      <p className="text-xs text-rose-500 mt-0.5">{errors.ingredients[index].ingredient_id.message}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        {...register(`ingredients.${index}.qty_used`)}
                        className="flex-1 px-3 py-2 text-sm focus:outline-none"
                        placeholder="0"
                      />
                      {selectedIng && (
                        <span className="px-2 text-xs text-slate-400 bg-slate-50 border-l border-slate-200 h-full flex items-center">
                          {selectedIng.unit}
                        </span>
                      )}
                    </div>
                    {errors.ingredients?.[index]?.qty_used && (
                      <p className="text-xs text-rose-500 mt-0.5">{errors.ingredients[index].qty_used.message}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="mt-1.5 p-1 rounded text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                  >
                    <RiSubtractLine size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cost Preview */}
        {totalCost > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-indigo-700 font-medium">Est. ingredient cost per portion</span>
            <span className="stat-mono font-semibold text-indigo-700">৳{totalCost.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-accent disabled:opacity-60">
            {isLoading ? 'Saving…' : isEdit ? 'Update Recipe' : 'Save Recipe'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Delete Confirm ─────────────────────────────────────────────────────────
function DeleteRecipeModal({ recipe, onClose }) {
  const [deleteRecipe, { isLoading }] = useDeleteRecipeMutation()
  const handleDelete = async () => {
    try {
      await deleteRecipe(recipe.item_id).unwrap()
      toast.success('Recipe deleted')
      onClose()
    } catch {
      toast.error('Failed to delete recipe')
    }
  }

  return (
    <Modal title="Delete Recipe" onClose={onClose} icon={<RiDeleteBin6Line size={18} className="text-rose-500" />} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Remove the entire recipe for <strong className="text-ink">{recipe.item_name}</strong>?
          This won't delete the menu item itself.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60 transition-colors">
            {isLoading ? 'Deleting…' : 'Delete Recipe'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Recipes() {
  const [filters, setFilters] = useState({ page: 1, per_page: 20, search: '' })
  const [showBuilder, setShowBuilder] = useState(false)
  const [editRecipe, setEditRecipe] = useState(null)
  const [deleteRecipe, setDeleteRecipe] = useState(null)

  const { data: response, isLoading, isFetching } = useGetRecipesQuery(filters)
  const recipes = response?.data || []
  const meta = response?.meta || null

  const handleFilterChange = useCallback((f) => setFilters(f), [])

  const columns = [
    {
      key: 'item_name',
      header: 'Menu Item',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <RiBookOpenLine size={14} className="text-orange-500" />
          </div>
          <span className="font-medium text-ink">{r.item_name}</span>
        </div>
      ),
    },
    {
      key: 'ingredients',
      header: 'Ingredients',
      render: (r) =>
        r.ingredients.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No recipe linked</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.ingredients.map((ing) => (
              <span key={ing.ingredient_id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                <RiFlaskLine size={10} />
                {ing.ingredient_name}
              </span>
            ))}
          </div>
        ),
    },
    {
      key: 'count',
      header: 'Step Count',
      render: (r) => (
        <span className="stat-mono text-slate-500">{r.ingredients.length} ingredient{r.ingredients.length !== 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'cost',
      header: 'Est. Cost / Portion',
      render: (r) => {
        const total = r.ingredients.reduce(
          (sum, i) => sum + parseFloat(i.cost_per_unit || 0) * parseFloat(i.qty_used || 0),
          0
        )
        return (
          <span className={`stat-mono font-medium ${total > 0 ? 'text-ink' : 'text-slate-400'}`}>
            {total > 0 ? `৳${total.toFixed(2)}` : '—'}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        r.ingredients.length > 0
          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><RiCheckLine size={11} />Linked</span>
          : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Not linked</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditRecipe(r)}
            title={r.ingredients.length ? 'Edit Recipe' : 'Add Recipe'}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {r.ingredients.length ? <RiEditLine size={15} /> : <RiAddLine size={15} />}
          </button>
          {r.ingredients.length > 0 && (
            <button
              onClick={() => setDeleteRecipe(r)}
              title="Delete Recipe"
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <RiDeleteBin6Line size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  // Hide status filter for recipes (not applicable)
  const recipeFilters = { ...filters, status: undefined }

  return (
    <div>
      <PageHeader
        title="Recipes"
        description="Map menu items to their ingredients. Stock auto-decrements when orders are prepared."
        actions={
          <button className="btn-accent" onClick={() => setShowBuilder(true)}>
            <RiAddLine size={15} />
            New Recipe
          </button>
        }
      />

      <EnhancedDataTable
        columns={columns}
        data={recipes}
        isLoading={isLoading || isFetching}
        meta={meta}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {showBuilder && (
        <RecipeBuilderModal
          menuItems={recipes}
          onClose={() => setShowBuilder(false)}
        />
      )}
      {editRecipe && (
        <RecipeBuilderModal
          existingRecipe={editRecipe}
          menuItems={recipes}
          onClose={() => setEditRecipe(null)}
        />
      )}
      {deleteRecipe && (
        <DeleteRecipeModal
          recipe={deleteRecipe}
          onClose={() => setDeleteRecipe(null)}
        />
      )}
    </div>
  )
}
