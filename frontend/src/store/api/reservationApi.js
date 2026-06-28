import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../config/supabase'

export const reservationApi = createApi({
  reducerPath: 'reservationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
    prepareHeaders: (headers) => {
      // In a real app, you'd get the token from the state
      // For now, mirroring existing API patterns if any
      return headers
    },
  }),
  tagTypes: ['Reservation'],
  endpoints: (builder) => ({
    // -- List Reservations (paginated + filtered) ----------------------
    getReservations: builder.query({
      query: (params) => ({ url: '/reservations', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Reservation', id })),
              { type: 'Reservation', id: 'LIST' },
            ]
          : [{ type: 'Reservation', id: 'LIST' }],
      // Supabase Realtime subscription
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let channel = null
        try {
          await cacheDataLoaded
          channel = supabase
            .channel('reservation_changes')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'reservations' },
              () => {
                dispatch(reservationApi.util.invalidateTags([{ type: 'Reservation', id: 'LIST' }]))
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

    // -- Get Reservation by ID -----------------------------------------
    getReservationById: builder.query({
      query: (id) => `/reservations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Reservation', id }],
    }),

    // -- Create Reservation -------------------------------------------
    createReservation: builder.mutation({
      query: (data) => ({
        url: '/reservations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Reservation', id: 'LIST' }],
    }),

    // -- Update Status ------------------------------------------------
    updateReservationStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/reservations/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reservation', id },
        { type: 'Reservation', id: 'LIST' },
      ],
      // Optimistic Update
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          reservationApi.util.updateQueryData('getReservations', undefined, (draft) => {
            const reservation = draft.data?.find((r) => r.id === id)
            if (reservation) {
              reservation.status = status
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

    // -- Delete Reservation -------------------------------------------
    deleteReservation: builder.mutation({
      query: (id) => ({
        url: `/reservations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Reservation', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetReservationsQuery,
  useGetReservationByIdQuery,
  useCreateReservationMutation,
  useUpdateReservationStatusMutation,
  useDeleteReservationMutation,
} = reservationApi
