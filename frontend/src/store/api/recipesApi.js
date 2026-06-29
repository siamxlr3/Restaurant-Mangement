import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const recipesApi = createApi({
  reducerPath: 'recipesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Recipe'],
  endpoints: (builder) => ({
    // ── List all menu items with recipes ──────────────────────
    getRecipes: builder.query({
      query: (params) => ({ url: '/recipes', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ item_id }) => ({ type: 'Recipe', id: item_id })),
              { type: 'Recipe', id: 'LIST' },
            ]
          : [{ type: 'Recipe', id: 'LIST' }],
    }),

    // ── Recipe for a single menu item ─────────────────────────
    getRecipeByItemId: builder.query({
      query: (item_id) => `/recipes/${item_id}`,
      providesTags: (result, error, item_id) => [{ type: 'Recipe', id: item_id }],
    }),

    // ── Upsert recipe for a menu item ─────────────────────────
    upsertRecipe: builder.mutation({
      query: ({ item_id, ingredients }) => ({
        url: `/recipes/${item_id}`,
        method: 'POST',
        body: { ingredients },
      }),
      invalidatesTags: (result, error, { item_id }) => [
        { type: 'Recipe', id: item_id },
        { type: 'Recipe', id: 'LIST' },
      ],
    }),

    // ── Delete recipe for a menu item ─────────────────────────
    deleteRecipe: builder.mutation({
      query: (item_id) => ({
        url: `/recipes/${item_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, item_id) => [
        { type: 'Recipe', id: item_id },
        { type: 'Recipe', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetRecipesQuery,
  useGetRecipeByItemIdQuery,
  useUpsertRecipeMutation,
  useDeleteRecipeMutation,
} = recipesApi
