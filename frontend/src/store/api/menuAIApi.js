import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const menuAIApi = createApi({
  reducerPath: 'menuAIApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['MenuSuggestion', 'AIInsight'],
  endpoints: (builder) => ({

    // ── Suggestions ─────────────────────────────────────────────────────────

    getMenuSuggestions: builder.query({
      query: (params) => ({ url: '/ai/menu-suggestions', params }),
      providesTags: ['MenuSuggestion'],
    }),

    getMenuSuggestionStats: builder.query({
      query: () => '/ai/menu-suggestions/stats',
      providesTags: ['MenuSuggestion'],
    }),

    triggerMenuAIJob: builder.mutation({
      query: () => ({ url: '/ai/menu-suggestions/trigger', method: 'POST' }),
      invalidatesTags: ['MenuSuggestion'],
    }),

    applySuggestion: builder.mutation({
      query: (id) => ({ url: `/ai/menu-suggestions/${id}/apply`, method: 'PATCH' }),
      // Optimistic update: mark is_applied immediately
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const patchResults = []
        // Patch all active getMenuSuggestions queries
        for (const { endpointName, originalArgs } of menuAIApi.util.selectInvalidatedBy(getState(), ['MenuSuggestion'])) {
          if (endpointName !== 'getMenuSuggestions') continue
          patchResults.push(
            dispatch(
              menuAIApi.util.updateQueryData('getMenuSuggestions', originalArgs, (draft) => {
                const item = (draft.data || []).find((s) => s.id === id)
                if (item) item.is_applied = true
              })
            )
          )
        }
        try {
          await queryFulfilled
        } catch {
          patchResults.forEach((p) => p.undo())
        }
      },
      invalidatesTags: ['MenuSuggestion'],
    }),

    dismissSuggestion: builder.mutation({
      query: (id) => ({ url: `/ai/menu-suggestions/${id}/dismiss`, method: 'PATCH' }),
      // Optimistic update: remove card from list immediately
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const patchResults = []
        for (const { endpointName, originalArgs } of menuAIApi.util.selectInvalidatedBy(getState(), ['MenuSuggestion'])) {
          if (endpointName !== 'getMenuSuggestions') continue
          patchResults.push(
            dispatch(
              menuAIApi.util.updateQueryData('getMenuSuggestions', originalArgs, (draft) => {
                if (draft.data) draft.data = draft.data.filter((s) => s.id !== id)
              })
            )
          )
        }
        try {
          await queryFulfilled
        } catch {
          patchResults.forEach((p) => p.undo())
        }
      },
      invalidatesTags: ['MenuSuggestion'],
    }),

    // ── Insights ─────────────────────────────────────────────────────────────

    getInsights: builder.query({
      query: (params) => ({ url: '/ai/insights', params }),
      providesTags: ['AIInsight'],
    }),

    markInsightRead: builder.mutation({
      query: (id) => ({ url: `/ai/insights/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['AIInsight'],
    }),

    dismissInsight: builder.mutation({
      query: (id) => ({ url: `/ai/insights/${id}/dismiss`, method: 'PATCH' }),
      invalidatesTags: ['AIInsight'],
    }),
  }),
})

export const {
  useGetMenuSuggestionsQuery,
  useGetMenuSuggestionStatsQuery,
  useTriggerMenuAIJobMutation,
  useApplySuggestionMutation,
  useDismissSuggestionMutation,
  useGetInsightsQuery,
  useMarkInsightReadMutation,
  useDismissInsightMutation,
} = menuAIApi
