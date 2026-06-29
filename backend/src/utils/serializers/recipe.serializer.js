/**
 * Serialize a recipe (item + its ingredients list)
 */
const serializeRecipeIngredient = (row) => ({
    id:              row.id,
    ingredient_id:   row.ingredient_id,
    ingredient_name: row.ingredient?.name || null,
    unit:            row.ingredient?.unit || null,
    qty_used:        parseFloat(row.qty_used) || 0,
    cost_per_unit:   parseFloat(row.ingredient?.cost_per_unit) || 0,
});

const serializeRecipe = (itemRow) => {
    if (!itemRow) return null;
    return {
        item_id:      itemRow.item_id  || itemRow.id,
        item_name:    itemRow.item_name || itemRow.name || null,
        ingredients:  Array.isArray(itemRow.recipe)
            ? itemRow.recipe.map(serializeRecipeIngredient)
            : [],
    };
};

const serializeRecipeList = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(serializeRecipe);
};

module.exports = {
    serializeRecipe,
    serializeRecipeList,
    serializeRecipeIngredient,
};
