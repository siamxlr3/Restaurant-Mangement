import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const upsellApi = createApi({
  reducerPath: 'upsellApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/api/v1' }),
  tagTypes: ['UpsellRecommendation'],
  endpoints: (builder) => ({
    getRecommendations: builder.query({
      query: (itemId) => `/upsell/recommendations/${itemId}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, itemId) => [{ type: 'UpsellRecommendation', id: itemId }],
    }),
  }),
})

export const { useGetRecommendationsQuery } = upsellApi
