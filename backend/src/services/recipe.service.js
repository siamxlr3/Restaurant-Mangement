const { supabase } = require('../config/supabase');

// Columns to select for recipe rows (join ingredient)
const RECIPE_SELECT = `
    id, item_id, ingredient_id, qty_used, created_at, updated_at,
    ingredient(id, name, unit, cost_per_unit)
`;

// Columns to select for menu_item (join recipes)
const ITEM_WITH_RECIPE_SELECT = `
    id, name,
    recipe(id, ingredient_id, qty_used, ingredient(id, name, unit, cost_per_unit))
`;

class RecipeService {
    /**
     * GET /recipes — paginated list of menu items with their recipe
     */
    async getAllRecipes({ page = 1, per_page = 20, search = '' } = {}) {
        let query = supabase
            .from('menu_item')
            .select(ITEM_WITH_RECIPE_SELECT, { count: 'exact' })
            .is('deleted_at', null);

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const limit = Math.min(parseInt(per_page) || 20, 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

        query = query.range(offset, offset + limit - 1).order('name', { ascending: true });

        const { data, error, count } = await query;
        if (error) throw error;

        // Normalise shape for serializer: add item_name alias
        const normalised = (data || []).map((row) => ({
            item_id:    row.id,
            item_name:  row.name,
            recipe:     row.recipe || [],
        }));

        return {
            data: normalised,
            meta: {
                page: parseInt(page) || 1,
                per_page: limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        };
    }

    /**
     * GET /recipes/:item_id — ingredients for a single menu item
     */
    async getRecipeByItemId(item_id) {
        const { data, error } = await supabase
            .from('menu_item')
            .select(ITEM_WITH_RECIPE_SELECT)
            .eq('id', item_id)
            .is('deleted_at', null)
            .single();

        if (error) return null;

        return {
            item_id:   data.id,
            item_name: data.name,
            recipe:    data.recipe || [],
        };
    }

    /**
     * POST /recipes/:item_id — upsert (replace) recipe for a menu item
     * Deletes existing rows then inserts the new list atomically
     */
    async upsertRecipe(item_id, ingredients) {
        // Verify item exists
        const { data: item, error: itemErr } = await supabase
            .from('menu_item')
            .select('id, name')
            .eq('id', item_id)
            .is('deleted_at', null)
            .single();

        if (itemErr || !item) {
            const err = new Error('Menu item not found');
            err.statusCode = 404;
            throw err;
        }

        // Delete existing recipe rows
        const { error: deleteErr } = await supabase
            .from('recipe')
            .delete()
            .eq('item_id', item_id);

        if (deleteErr) throw deleteErr;

        // Bulk insert new rows
        const rows = ingredients.map((ing) => ({
            item_id,
            ingredient_id: ing.ingredient_id,
            qty_used:      parseFloat(ing.qty_used),
        }));

        const { error: insertErr } = await supabase
            .from('recipe')
            .insert(rows);

        if (insertErr) {
            if (insertErr.code === '23503') {
                const err = new Error('One or more ingredient IDs are invalid');
                err.statusCode = 422;
                throw err;
            }
            throw insertErr;
        }

        return this.getRecipeByItemId(item_id);
    }

    /**
     * DELETE /recipes/:item_id — remove all recipe lines for an item
     */
    async deleteRecipeByItemId(item_id) {
        const { error } = await supabase
            .from('recipe')
            .delete()
            .eq('item_id', item_id);

        if (error) throw error;
        return true;
    }
}

module.exports = new RecipeService();
