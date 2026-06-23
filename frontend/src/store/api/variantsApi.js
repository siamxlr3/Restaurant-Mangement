import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const variantsApi = createApi({
  reducerPath: 'variantsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Variant'],
  endpoints: (builder) => ({
    getVariants: builder.query({
      query: (params) => ({
        url: '/variants',
        params,
      }),
      providesTags: (result) => 
        result?.data 
          ? [...result.data.map(({ id }) => ({ type: 'Variant', id })), { type: 'Variant', id: 'LIST' }]
          : [{ type: 'Variant', id: 'LIST' }],
    }),
    getVariantsByItem: builder.query({
      query: (itemId) => `/variants/item/${itemId}`,
      providesTags: (result, error, itemId) => 
        result 
          ? [...result.map(({ id }) => ({ type: 'Variant', id })), { type: 'Variant', id: 'LIST' }]
          : [{ type: 'Variant', id: 'LIST' }],
    }),
    createVariant: builder.mutation({
      query: (data) => ({
        url: '/variants',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Variant', id: 'LIST' }],
    }),
    updateVariant: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/variants/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Variant', id }, { type: 'Variant', id: 'LIST' }],
    }),
    deleteVariant: builder.mutation({
      query: (id) => ({
        url: `/variants/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Variant', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetVariantsQuery,
  useGetVariantsByItemQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} = variantsApi
