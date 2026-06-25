import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../config/supabase'

export const kitchenApi = createApi({
  reducerPath: 'kitchenApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/api/v1' }),
  tagTypes: ['KitchenTicket'],
  endpoints: (builder) => ({
    getTickets: builder.query({
      query: (params) => ({ url: '/kitchen/tickets', params }),
      transformResponse: (response) => ({
        items: response.data,
        meta: response.meta,
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'KitchenTicket', id })),
              { type: 'KitchenTicket', id: 'LIST' },
            ]
          : [{ type: 'KitchenTicket', id: 'LIST' }],
      // Supabase Realtime broadcast or postgres_changes
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let channel = null
        try {
          await cacheDataLoaded
          // Listen to the 'kitchen' channel for broadcasts from the server
          channel = supabase
            .channel('kitchen')
            .on('broadcast', { event: 'TicketCreated' }, () => {
              dispatch(kitchenApi.util.invalidateTags([{ type: 'KitchenTicket', id: 'LIST' }]))
            })
            .on('broadcast', { event: 'TicketUpdated' }, () => {
              dispatch(kitchenApi.util.invalidateTags([{ type: 'KitchenTicket', id: 'LIST' }]))
            })
            // Also listen to raw postgres changes as a fallback or for direct DB edits
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_ticket' }, () => {
                dispatch(kitchenApi.util.invalidateTags([{ type: 'KitchenTicket', id: 'LIST' }]))
            })
            .subscribe()
        } catch {}
        await cacheEntryRemoved
        if (channel) supabase.removeChannel(channel)
      },
    }),

    updateTicketStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/kitchen/tickets/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'KitchenTicket', id },
        { type: 'KitchenTicket', id: 'LIST' },
      ],
      // Optimistic update
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          kitchenApi.util.updateQueryData('getTickets', undefined, (draft) => {
            const ticket = draft.items.find((t) => t.id === id)
            if (ticket) {
              ticket.status = status
              if (status === 'bumped') {
                ticket.bumped_at = new Date().toISOString()
              }
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
  }),
})

export const {
  useGetTicketsQuery,
  useUpdateTicketStatusMutation,
} = kitchenApi
