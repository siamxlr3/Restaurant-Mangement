import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../config/supabase'

export const tablesApi = createApi({
  reducerPath: 'tablesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Table', 'TableSection'],
  endpoints: (builder) => ({
    // ── List all tables (paginated + filtered) ──────────────────────────
    getTables: builder.query({
      query: (params) => ({ url: '/tables', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Table', id })),
              { type: 'Table', id: 'LIST' },
            ]
          : [{ type: 'Table', id: 'LIST' }],
      // Supabase Realtime subscription
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let channel = null
        try {
          await cacheDataLoaded
          channel = supabase
            .channel('restaurant_table_changes')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'restaurant_table' },
              () => {
                // Invalidate and refetch when any change detected
                dispatch(tablesApi.util.invalidateTags([{ type: 'Table', id: 'LIST' }]))
              }
            )
            .subscribe()
        } catch {
          // cacheEntryRemoved will fire before cacheDataLoaded if component unmounts immediately
        }
        await cacheEntryRemoved
        if (channel) supabase.removeChannel(channel)
      },
    }),

    // ── Get table by ID ─────────────────────────────────────────────────
    getTableById: builder.query({
      query: (id) => `/tables/${id}`,
      providesTags: (result, error, id) => [{ type: 'Table', id }],
    }),

    // ── Get all unique sections ─────────────────────────────────────────
    getSections: builder.query({
      query: () => '/tables/sections',
      providesTags: ['TableSection'],
    }),

    // ── Create table ────────────────────────────────────────────────────
    createTable: builder.mutation({
      query: (data) => ({
        url: '/tables',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Table', id: 'LIST' }, 'TableSection'],
    }),

    // ── Update table ────────────────────────────────────────────────────
    updateTable: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tables/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
        'TableSection',
      ],
    }),

    // ── Delete table ────────────────────────────────────────────────────
    deleteTable: builder.mutation({
      query: (id) => ({
        url: `/tables/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Table', id: 'LIST' }, 'TableSection'],
    }),

    // ── Transition status ───────────────────────────────────────────────
    transitionStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tables/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // ── Assign waiter ───────────────────────────────────────────────────
    assignWaiter: builder.mutation({
      query: ({ id, waiter_id }) => ({
        url: `/tables/${id}/waiter`,
        method: 'PATCH',
        body: { waiter_id },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetTablesQuery,
  useGetTableByIdQuery,
  useGetSectionsQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useTransitionStatusMutation,
  useAssignWaiterMutation,
} = tablesApi
