import { createApi } from '@reduxjs/toolkit/query/react'
import { fakeBaseQuery } from './fakeBaseQuery'
import {
  mockIngredients,
  mockSuppliers,
  mockPurchaseOrders,
  mockReorderSuggestions,
} from '../mockData'

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: fakeBaseQuery({
    '/inventory/ingredients': () => mockIngredients,
    '/inventory/suppliers': () => mockSuppliers,
    '/inventory/purchase-orders': () => mockPurchaseOrders,
    '/inventory/reorder-suggestions': () => mockReorderSuggestions,
  }),
  endpoints: (builder) => ({
    getIngredients: builder.query({ query: () => ({ url: '/inventory/ingredients' }) }),
    getSuppliers: builder.query({ query: () => ({ url: '/inventory/suppliers' }) }),
    getPurchaseOrders: builder.query({ query: () => ({ url: '/inventory/purchase-orders' }) }),
    getReorderSuggestions: builder.query({
      query: () => ({ url: '/inventory/reorder-suggestions' }),
    }),
  }),
})

export const {
  useGetIngredientsQuery,
  useGetSuppliersQuery,
  useGetPurchaseOrdersQuery,
  useGetReorderSuggestionsQuery,
} = inventoryApi
