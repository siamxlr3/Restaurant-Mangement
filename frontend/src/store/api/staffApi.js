import { createApi } from '@reduxjs/toolkit/query/react'
import { fakeBaseQuery } from './fakeBaseQuery'
import { mockStaff, mockShifts, mockAttendance } from '../mockData'

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery: fakeBaseQuery({
    '/staff/members': () => mockStaff,
    '/staff/shifts': () => mockShifts,
    '/staff/attendance': () => mockAttendance,
  }),
  endpoints: (builder) => ({
    getStaff: builder.query({ query: () => ({ url: '/staff/members' }) }),
    getShifts: builder.query({ query: () => ({ url: '/staff/shifts' }) }),
    getAttendance: builder.query({ query: () => ({ url: '/staff/attendance' }) }),
  }),
})

export const { useGetStaffQuery, useGetShiftsQuery, useGetAttendanceQuery } = staffApi
