const { z } = require('zod');

const recipeIngredientSchema = z.object({
    ingredient_id: z.string().uuid('Invalid ingredient ID'),
    qty_used: z.preprocess((v) => parseFloat(v), z.number().positive('qty_used must be positive')),
});

const upsertRecipeSchema = z.object({
    ingredients: z
        .array(recipeIngredientSchema)
        .min(1, 'Recipe must have at least one ingredient'),
});

module.exports = {
    upsertRecipeSchema,
};
