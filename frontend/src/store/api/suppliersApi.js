import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const suppliersApi = createApi({
  reducerPath: 'suppliersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Supplier'],
  endpoints: (builder) => ({
    getSuppliers: builder.query({
      query: (params) => ({ url: '/suppliers', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Supplier', id })),
              { type: 'Supplier', id: 'LIST' },
            ]
          : [{ type: 'Supplier', id: 'LIST' }],
    }),
    getSupplierById: builder.query({
      query: (id) => `/suppliers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Supplier', id }],
    }),
    createSupplier: builder.mutation({
      query: (data) => ({
        url: '/suppliers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Supplier', id: 'LIST' }],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/suppliers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Supplier', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = suppliersApi
