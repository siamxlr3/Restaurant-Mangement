import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const ingredientsApi = createApi({
  reducerPath: 'ingredientsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Ingredient'],
  endpoints: (builder) => ({
    // ── List (paginated + filtered) ──────────────────────────
    getIngredients: builder.query({
      query: (params) => ({ url: '/ingredients', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Ingredient', id })),
              { type: 'Ingredient', id: 'LIST' },
            ]
          : [{ type: 'Ingredient', id: 'LIST' }],
    }),

    // ── Low-stock alert list ──────────────────────────────────
    getLowStockIngredients: builder.query({
      query: () => '/ingredients/low-stock',
      providesTags: [{ type: 'Ingredient', id: 'LOW_STOCK' }],
    }),

    // ── Single ingredient ─────────────────────────────────────
    getIngredientById: builder.query({
      query: (id) => `/ingredients/${id}`,
      providesTags: (result, error, id) => [{ type: 'Ingredient', id }],
    }),

    // ── Create ────────────────────────────────────────────────
    createIngredient: builder.mutation({
      query: (data) => ({
        url: '/ingredients',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Ingredient', id: 'LIST' }, { type: 'Ingredient', id: 'LOW_STOCK' }],
    }),

    // ── Update ────────────────────────────────────────────────
    updateIngredient: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/ingredients/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Ingredient', id },
        { type: 'Ingredient', id: 'LIST' },
        { type: 'Ingredient', id: 'LOW_STOCK' },
      ],
    }),

    // ── Adjust Stock ──────────────────────────────────────────
    adjustIngredientStock: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ingredients/${id}/adjust-stock`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Ingredient', id },
        { type: 'Ingredient', id: 'LIST' },
        { type: 'Ingredient', id: 'LOW_STOCK' },
      ],
    }),

    // ── Delete ────────────────────────────────────────────────
    deleteIngredient: builder.mutation({
      query: (id) => ({
        url: `/ingredients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Ingredient', id: 'LIST' }, { type: 'Ingredient', id: 'LOW_STOCK' }],
    }),
  }),
})

export const {
  useGetIngredientsQuery,
  useGetLowStockIngredientsQuery,
  useGetIngredientByIdQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useAdjustIngredientStockMutation,
  useDeleteIngredientMutation,
} = ingredientsApi
