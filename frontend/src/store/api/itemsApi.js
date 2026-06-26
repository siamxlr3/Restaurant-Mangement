import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Item'],
  endpoints: (builder) => ({
    getItems: builder.query({
      query: (params) => ({
        url: '/items',
        params,
      }),
      providesTags: ['Item'],
      // Supabase Realtime — item availability sync
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let channel = null
        try {
          await cacheDataLoaded
          channel = supabase
            .channel('menu_availability')
            .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'menu_item',
              filter: 'is_available=is.not.null' 
            }, (payload) => {
              // Invalidate individual item and the list
              dispatch(itemsApi.util.invalidateTags([{ type: 'Item', id: payload.new.id }, 'Item']))
            })
            .subscribe()
        } catch {}
        await cacheEntryRemoved
        if (channel) supabase.removeChannel(channel)
      },
    }),
    getItemById: builder.query({
      query: (id) => `/items/${id}`,
      providesTags: (result, error, id) => [{ type: 'Item', id }],
    }),
    createItem: builder.mutation({
      query: (formData) => ({
        url: '/items',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Item'],
    }),
    updateItem: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/items/${id}`,
        method: 'PATCH',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => ['Item', { type: 'Item', id }],
    }),
    updateAvailability: builder.mutation({
      query: ({ id, is_available }) => ({
        url: `/items/${id}/availability`,
        method: 'PATCH',
        body: { is_available },
      }),
      async onQueryStarted({ id, is_available }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          itemsApi.util.updateQueryData('getItems', undefined, (draft) => {
            const item = draft.data?.find((i) => i.id === id)
            if (item) {
              item.is_available = is_available
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Item', id }],
    }),
    deleteItem: builder.mutation({
      query: (id) => ({
        url: `/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Item'],
    }),
  }),
})

export const {
  useGetItemsQuery,
  useGetItemByIdQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useUpdateAvailabilityMutation,
  useDeleteItemMutation,
} = itemsApi
