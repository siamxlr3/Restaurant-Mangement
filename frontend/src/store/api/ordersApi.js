import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../config/supabase'

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/api/v1' }),
  tagTypes: ['Order', 'PosMenu'],
  endpoints: (builder) => ({

    // ── POS Menu ──────────────────────────────────────────────
    getPosMenu: builder.query({
      query: () => '/orders/pos-menu',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'PosMenu', id: 'LIST' }],
    }),

    // ── List Orders ───────────────────────────────────────────
    getOrders: builder.query({
      query: (params) => ({ url: '/orders', params }),
      transformResponse: (response) => ({
        items: response.data,
        meta: response.meta,
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Order', id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
      // Supabase Realtime — orders channel
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let channel = null
        try {
          await cacheDataLoaded
          channel = supabase
            .channel('orders_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
              dispatch(ordersApi.util.invalidateTags([{ type: 'Order', id: 'LIST' }]))
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
              dispatch(ordersApi.util.invalidateTags([{ type: 'Order', id: 'LIST' }]))
            })
            .subscribe()
        } catch {
          // cacheEntryRemoved fires before cacheDataLoaded if component unmounts early
        }
        await cacheEntryRemoved
        if (channel) supabase.removeChannel(channel)
      },
    }),

    // ── Get Order by ID ───────────────────────────────────────
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
      // Per-order Realtime subscription
      async onCacheEntryAdded(id, { cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let channel = null
        try {
          await cacheDataLoaded
          channel = supabase
            .channel(`order_${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, () => {
              dispatch(ordersApi.util.invalidateTags([{ type: 'Order', id }]))
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `order_id=eq.${id}` }, () => {
              dispatch(ordersApi.util.invalidateTags([{ type: 'Order', id }]))
            })
            .subscribe()
        } catch {}
        await cacheEntryRemoved
        if (channel) supabase.removeChannel(channel)
      },
    }),

    // ── Create Order ──────────────────────────────────────────
    createOrder: builder.mutation({
      query: (data) => ({ url: '/orders', method: 'POST', body: data }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    // ── Add Item to Order ─────────────────────────────────────
    addOrderItem: builder.mutation({
      query: ({ orderId, ...item }) => ({
        url: `/orders/${orderId}/items`,
        method: 'POST',
        body: item,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // ── Void Order Item ───────────────────────────────────────
    voidOrderItem: builder.mutation({
      query: ({ orderId, itemId, reason }) => ({
        url: `/orders/${orderId}/items/${itemId}`,
        method: 'DELETE',
        body: { reason },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // ── Transition Order Status ───────────────────────────────
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // ── Hold Order ────────────────────────────────────────────
    holdOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/hold`,
        method: 'PATCH',
        body: { reason },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // ── Delete Order ──────────────────────────────────────────
    deleteOrder: builder.mutation({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetPosMenuQuery,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useAddOrderItemMutation,
  useVoidOrderItemMutation,
  useUpdateOrderStatusMutation,
  useHoldOrderMutation,
  useDeleteOrderMutation,
} = ordersApi
