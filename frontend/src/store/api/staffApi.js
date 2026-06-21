import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5000/api/v1',
  }),
  tagTypes: ['Staff'],
  endpoints: (builder) => ({
    getStaff: builder.query({
      query: (params) => ({
        url: '/staff',
        params,
      }),
      providesTags: ['Staff'],
    }),
    getStaffById: builder.query({
      query: (id) => `/staff/${id}`,
      providesTags: (result, error, id) => [{ type: 'Staff', id }],
    }),
    createStaff: builder.mutation({
      query: (body) => ({
        url: '/staff',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/staff/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['Staff', { type: 'Staff', id }],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `/staff/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),
    // Keep mocks for Shifts and Attendance as they are not implemented in backend yet
    getShifts: builder.query({ query: () => '/mock/shifts' }),
    getAttendance: builder.query({ query: () => '/mock/attendance' }),
  }),
})

export const {
  useGetStaffQuery,
  useGetStaffByIdQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetShiftsQuery,
  useGetAttendanceQuery,
} = staffApi
