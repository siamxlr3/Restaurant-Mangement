import { createApi } from '@reduxjs/toolkit/query/react'
import { fakeBaseQuery } from './fakeBaseQuery'
import { mockBills, mockPayments, mockDiscounts } from '../mockData'

export const billingApi = createApi({
  reducerPath: 'billingApi',
  baseQuery: fakeBaseQuery({
    '/billing/bills': () => mockBills,
    '/billing/payments': () => mockPayments,
    '/billing/discounts': () => mockDiscounts,
  }),
  endpoints: (builder) => ({
    getBills: builder.query({ query: () => ({ url: '/billing/bills' }) }),
    getPayments: builder.query({ query: () => ({ url: '/billing/payments' }) }),
    getDiscounts: builder.query({ query: () => ({ url: '/billing/discounts' }) }),
  }),
})

export const { useGetBillsQuery, useGetPaymentsQuery, useGetDiscountsQuery } = billingApi
