import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const modifiersApi = createApi({
  reducerPath: 'modifiersApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Modifier'],
  endpoints: (builder) => ({
    getModifiers: builder.query({
      query: (params) => ({
        url: '/modifiers',
        params,
      }),
      providesTags: (result) => 
        result?.data 
          ? [...result.data.map(({ id }) => ({ type: 'Modifier', id })), { type: 'Modifier', id: 'LIST' }]
          : [{ type: 'Modifier', id: 'LIST' }],
    }),
    getModifiersByItem: builder.query({
      query: (itemId) => `/modifiers/item/${itemId}`,
      providesTags: (result, error, itemId) => 
        result 
          ? [...result.map(({ id }) => ({ type: 'Modifier', id })), { type: 'Modifier', id: 'LIST' }]
          : [{ type: 'Modifier', id: 'LIST' }],
    }),
    createModifier: builder.mutation({
      query: (data) => ({
        url: '/modifiers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Modifier', id: 'LIST' }],
    }),
    updateModifier: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/modifiers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Modifier', id }, { type: 'Modifier', id: 'LIST' }],
    }),
    deleteModifier: builder.mutation({
      query: (id) => ({
        url: `/modifiers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Modifier', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetModifiersQuery,
  useGetModifiersByItemQuery,
  useCreateModifierMutation,
  useUpdateModifierMutation,
  useDeleteModifierMutation,
} = modifiersApi
