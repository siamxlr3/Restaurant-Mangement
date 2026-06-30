import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['ReorderSuggestion', 'PurchaseOrder'],
  endpoints: (builder) => ({
    getReorderSuggestions: builder.query({
      query: (params) => ({ url: '/reorder-suggestions', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'ReorderSuggestion', id })),
              { type: 'ReorderSuggestion', id: 'LIST' },
            ]
          : [{ type: 'ReorderSuggestion', id: 'LIST' }],
    }),
    acceptReorderSuggestion: builder.mutation({
      query: (id) => ({
        url: `/reorder-suggestions/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ReorderSuggestion', id },
        { type: 'ReorderSuggestion', id: 'LIST' },
        { type: 'PurchaseOrder', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetReorderSuggestionsQuery,
  useAcceptReorderSuggestionMutation,
} = inventoryApi
