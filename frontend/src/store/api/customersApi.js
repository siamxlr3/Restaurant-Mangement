import { createApi } from '@reduxjs/toolkit/query/react'
import { fakeBaseQuery } from './fakeBaseQuery'
import { mockCustomers, mockLoyaltyTiers, mockFeedback } from '../mockData'

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fakeBaseQuery({
    '/customers/list': () => mockCustomers,
    '/customers/loyalty-tiers': () => mockLoyaltyTiers,
    '/customers/feedback': () => mockFeedback,
  }),
  endpoints: (builder) => ({
    getCustomers: builder.query({ query: () => ({ url: '/customers/list' }) }),
    getLoyaltyTiers: builder.query({ query: () => ({ url: '/customers/loyalty-tiers' }) }),
    getFeedback: builder.query({ query: () => ({ url: '/customers/feedback' }) }),
  }),
})

export const { useGetCustomersQuery, useGetLoyaltyTiersQuery, useGetFeedbackQuery } = customersApi
