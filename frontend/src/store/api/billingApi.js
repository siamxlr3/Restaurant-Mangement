import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../config/supabase'
import { mockPayments, mockDiscounts } from '../mockData'

export const billingApi = createApi({
  reducerPath: 'billingApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/api/v1' }),
  tagTypes: ['Bill', 'Payment'],
  endpoints: (builder) => ({
    // ── Get All Bills ─────────────────────────────────────────
    getBills: builder.query({
      query: (params) => ({ url: '/bills', params }),
      transformResponse: (response) => ({
        items: response.data?.items || [],
        meta: response.meta,
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Bill', id })),
              { type: 'Bill', id: 'LIST' },
            ]
          : [{ type: 'Bill', id: 'LIST' }],
      // Realtime subscription for list
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let channel = null
        try {
          await cacheDataLoaded
          channel = supabase
            .channel('bills_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => {
              dispatch(billingApi.util.invalidateTags([{ type: 'Bill', id: 'LIST' }]))
            })
            .subscribe()
        } catch {}
        await cacheEntryRemoved
        if (channel) supabase.removeChannel(channel)
      },
    }),

    // ── Get Bill by ID ───────────────────────────────────────
    getBillById: builder.query({
      query: (id) => `/bills/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Bill', id }],
    }),

    // ── Generate Bill ─────────────────────────────────────────
    generateBill: builder.mutation({
      query: (orderId) => ({
        url: '/bills/generate',
        method: 'POST',
        body: { order_id: orderId },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Bill', id: 'LIST' }],
    }),

    // ── Update Bill Status ────────────────────────────────────
    updateBillStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/bills/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Bill', id },
        { type: 'Bill', id: 'LIST' },
      ],
    }),

    // ── Delete Bill ──────────────────────────────────────────
    deleteBill: builder.mutation({
      query: (id) => ({ url: `/bills/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Bill', id: 'LIST' }],
    }),

    // ── Payments ─────────────────────────────────────────────
    getPayments: builder.query({
      query: (params) => ({ url: '/payments', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Payment', id })),
              { type: 'Payment', id: 'LIST' },
            ]
          : [{ type: 'Payment', id: 'LIST' }],
    }),

    getPaymentById: builder.query({
      query: (id) => `/payments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Payment', id }],
    }),

    createPayment: builder.mutation({
      query: (body) => ({
        url: '/payments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Payment', id: 'LIST' }, { type: 'Bill', id: 'LIST' }],
    }),

    refundPayment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payments/${id}/refund`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Payment', id },
        { type: 'Payment', id: 'LIST' },
        { type: 'Bill', id: 'LIST' },
      ],
    }),

    // ── Get Discounts (Mocked for now) ──────────────────────────
    getDiscounts: builder.query({
      queryFn: () => ({ data: mockDiscounts }),
    }),
  }),
})

export const {
  useGetBillsQuery,
  useGetBillByIdQuery,
  useGenerateBillMutation,
  useUpdateBillStatusMutation,
  useDeleteBillMutation,
  useGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useCreatePaymentMutation,
  useRefundPaymentMutation,
  useGetDiscountsQuery,
} = billingApi
