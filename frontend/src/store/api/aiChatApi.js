import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const aiChatApi = createApi({
  reducerPath: 'aiChatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['AiChatSession'],
  endpoints: (builder) => ({
    getSessions: builder.query({
      query: (params) => ({ url: '/ai/chat/sessions', params }),
      providesTags: ['AiChatSession'],
    }),

    getSession: builder.query({
      query: (id) => `/ai/chat/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'AiChatSession', id }],
    }),

    getOrCreateLatestSession: builder.query({
      query: (staffId) => `/ai/chat/sessions/latest?staff_id=${staffId || ''}`,
      providesTags: ['AiChatSession'],
    }),

    createSession: builder.mutation({
      query: (body) => ({
        url: '/ai/chat/sessions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AiChatSession'],
    }),

    deleteSession: builder.mutation({
      query: (id) => ({
        url: `/ai/chat/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AiChatSession'],
    }),
  }),
})

export const {
  useGetSessionsQuery,
  useGetSessionQuery,
  useGetOrCreateLatestSessionQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
} = aiChatApi
