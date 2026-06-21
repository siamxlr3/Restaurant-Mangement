import { createApi } from '@reduxjs/toolkit/query/react'
import { fakeBaseQuery } from './fakeBaseQuery'
import { mockKPIs, mockAIInsights, mockRevenueTrend, mockOrderSourceSplit } from '../mockData'

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fakeBaseQuery({
    '/dashboard/kpis': () => mockKPIs,
    '/dashboard/ai-insights': () => mockAIInsights,
    '/dashboard/revenue-trend': () => mockRevenueTrend,
    '/dashboard/order-source-split': () => mockOrderSourceSplit,
  }),
  endpoints: (builder) => ({
    getKPIs: builder.query({ query: () => ({ url: '/dashboard/kpis' }) }),
    getAIInsights: builder.query({ query: () => ({ url: '/dashboard/ai-insights' }) }),
    getRevenueTrend: builder.query({ query: () => ({ url: '/dashboard/revenue-trend' }) }),
    getOrderSourceSplit: builder.query({ query: () => ({ url: '/dashboard/order-source-split' }) }),
  }),
})

export const {
  useGetKPIsQuery,
  useGetAIInsightsQuery,
  useGetRevenueTrendQuery,
  useGetOrderSourceSplitQuery,
} = dashboardApi
