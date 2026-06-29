import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../config/supabase'

export const waitlistApi = createApi({
  reducerPath: 'waitlistApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
    prepareHeaders: (headers) => {
      // Add authentication headers if needed or mirror existing API patterns
      return headers
    },
  }),
  tagTypes: ['Waitlist'],
  endpoints: (builder) => ({
    // -- List Waitlist Items (paginated + filtered) ---------------------
    getWaitlists: builder.query({
      query: (params) => ({ url: '/waitlist', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Waitlist', id })),
              { type: 'Waitlist', id: 'LIST' },
            ]
          : [{ type: 'Waitlist', id: 'LIST' }],
      // Supabase Realtime subscription
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let channel = null
        try {
          await cacheDataLoaded
          channel = supabase
            .channel('waitlist_changes')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'waitlist' },
              () => {
                dispatch(waitlistApi.util.invalidateTags([{ type: 'Waitlist', id: 'LIST' }]))
              }
            )
            .subscribe()
        } catch {
          // unmount
        }
        await cacheEntryRemoved
        if (channel) supabase.removeChannel(channel)
      },
    }),

    // -- Get Waitlist item by ID ----------------------------------------
    getWaitlistById: builder.query({
      query: (id) => `/waitlist/${id}`,
      providesTags: (result, error, id) => [{ type: 'Waitlist', id }],
    }),

    // -- Create Waitlist entry ------------------------------------------
    createWaitlist: builder.mutation({
      query: (data) => ({
        url: '/waitlist',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Waitlist', id: 'LIST' }],
    }),

    // -- Update Waitlist status -----------------------------------------
    updateWaitlistStatus: builder.mutation({
      query: ({ id, status, table_id }) => ({
        url: `/waitlist/${id}/status`,
        method: 'PATCH',
        body: { status, table_id },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Waitlist', id },
        { type: 'Waitlist', id: 'LIST' },
      ],
      // Optimistic update
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          waitlistApi.util.updateQueryData('getWaitlists', undefined, (draft) => {
            const item = draft.data?.find((r) => r.id === id)
            if (item) {
              item.status = status
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),

    // -- Delete Waitlist entry (soft delete) ----------------------------
    deleteWaitlist: builder.mutation({
      query: (id) => ({
        url: `/waitlist/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Waitlist', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetWaitlistsQuery,
  useGetWaitlistByIdQuery,
  useCreateWaitlistMutation,
  useUpdateWaitlistStatusMutation,
  useDeleteWaitlistMutation,
} = waitlistApi
