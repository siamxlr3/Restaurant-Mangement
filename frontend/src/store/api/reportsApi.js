import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['SalesReport', 'MenuPerformance', 'InventoryCost', 'AnomalyAlerts'],
  endpoints: (builder) => ({
    // ── Sales Report ──────────────────────────────────────────
    getSalesReport: builder.query({
      query: (params) => ({ url: '/reports/sales', params }),
      providesTags: ['SalesReport'],
    }),

    // ── Menu Performance ──────────────────────────────────────
    getMenuPerformance: builder.query({
      query: (params) => ({ url: '/reports/menu-performance', params }),
      providesTags: ['MenuPerformance'],
    }),

    // ── Inventory Cost ────────────────────────────────────────
    getInventoryCost: builder.query({
      query: (params) => ({ url: '/reports/inventory-cost', params }),
      providesTags: ['InventoryCost'],
    }),

    // ── Anomaly Alerts ────────────────────────────────────────
    getAnomalyAlerts: builder.query({
      query: (params) => ({ url: '/reports/anomalies', params }),
      providesTags: ['AnomalyAlerts'],
    }),

    // ── Update Anomaly Alert (mark read / dismiss) ────────────
    updateAnomalyAlert: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/reports/anomalies/${id}`,
        method: 'PATCH',
        body,
      }),
      // Optimistic update
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          reportsApi.util.updateQueryData('getAnomalyAlerts', undefined, (draft) => {
            const alert = draft.data?.find((a) => a.id === id)
            if (alert) {
              Object.assign(alert, patch)
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: ['AnomalyAlerts'],
    }),
  }),
})

export const {
  useGetSalesReportQuery,
  useGetMenuPerformanceQuery,
  useGetInventoryCostQuery,
  useGetAnomalyAlertsQuery,
  useUpdateAnomalyAlertMutation,
} = reportsApi
