import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const demandForecastApi = createApi({
  reducerPath: 'demandForecastApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['DemandForecast', 'JobLog'],
  endpoints: (builder) => ({
    getDemandForecasts: builder.query({
      query: (params) => ({
        url: '/demand-forecasts',
        params,
      }),
      providesTags: ['DemandForecast'],
    }),
    getJobLogs: builder.query({
      query: () => '/demand-forecasts/logs',
      providesTags: ['JobLog'],
    }),
    updateActualQty: builder.mutation({
      query: ({ id, actual_qty }) => ({
        url: `/demand-forecasts/${id}/actual`,
        method: 'PATCH',
        body: { actual_qty },
      }),
      invalidatesTags: ['DemandForecast'],
    }),
    deleteDemandForecast: builder.mutation({
      query: (id) => ({
        url: `/demand-forecasts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DemandForecast'],
    }),
    triggerJob: builder.mutation({
      query: () => ({
        url: '/demand-forecasts/trigger-job',
        method: 'POST',
      }),
      invalidatesTags: ['DemandForecast', 'JobLog'],
    }),
  }),
})

export const {
  useGetDemandForecastsQuery,
  useGetJobLogsQuery,
  useUpdateActualQtyMutation,
  useDeleteDemandForecastMutation,
  useTriggerJobMutation,
} = demandForecastApi
