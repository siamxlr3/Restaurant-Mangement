import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    // GET /settings — all groups
    getAllSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),

    // GET /settings/:group
    getSettingsByGroup: builder.query({
      query: (group) => `/settings/${group}`,
      providesTags: (result, error, group) => [{ type: 'Settings', id: group }],
    }),

    // POST /settings/:group — bulk upsert
    upsertSettingsGroup: builder.mutation({
      query: ({ group, settings }) => ({
        url: `/settings/${group}`,
        method: 'POST',
        body: { settings },
      }),
      invalidatesTags: (result, error, { group }) => [
        { type: 'Settings', id: group },
        'Settings',
      ],
    }),

    // POST /settings/test-connection
    testConnection: builder.mutation({
      query: ({ provider, key }) => ({
        url: '/settings/test-connection',
        method: 'POST',
        body: { provider, key },
      }),
    }),
  }),
})

export const {
  useGetAllSettingsQuery,
  useGetSettingsByGroupQuery,
  useUpsertSettingsGroupMutation,
  useTestConnectionMutation,
} = settingsApi
