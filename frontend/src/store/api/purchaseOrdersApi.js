import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const purchaseOrdersApi = createApi({
  reducerPath: 'purchaseOrdersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['PurchaseOrder', 'Ingredient'],
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query({
      query: (params) => ({ url: '/purchase-orders', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'PurchaseOrder', id })),
              { type: 'PurchaseOrder', id: 'LIST' },
            ]
          : [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),
    getPurchaseOrderById: builder.query({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'PurchaseOrder', id }],
    }),
    createPurchaseOrder: builder.mutation({
      query: (data) => ({
        url: '/purchase-orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),
    updatePurchaseOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' },
        { type: 'Ingredient', id: 'LIST' }, // invalidate ingredient stock when PO transitions
      ],
    }),
    deletePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
} = purchaseOrdersApi
