import { createApi } from '@reduxjs/toolkit/query/react'
import { fakeBaseQuery } from './fakeBaseQuery'
import {
  mockTables,
  mockKitchenTickets,
  mockReservations,
  mockWaitlist,
  mockMenuItems,
} from '../mockData'

export const operationsApi = createApi({
  reducerPath: 'operationsApi',
  baseQuery: fakeBaseQuery({
    '/operations/tables': () => mockTables,
    '/operations/kitchen-tickets': () => mockKitchenTickets,
    '/operations/reservations': () => mockReservations,
    '/operations/waitlist': () => mockWaitlist,
    '/operations/pos-menu': () => mockMenuItems,
  }),
  endpoints: (builder) => ({
    getTables: builder.query({ query: () => ({ url: '/operations/tables' }) }),
    getKitchenTickets: builder.query({ query: () => ({ url: '/operations/kitchen-tickets' }) }),
    getReservations: builder.query({ query: () => ({ url: '/operations/reservations' }) }),
    getWaitlist: builder.query({ query: () => ({ url: '/operations/waitlist' }) }),
    getPosMenu: builder.query({ query: () => ({ url: '/operations/pos-menu' }) }),
  }),
})

export const {
  useGetTablesQuery,
  useGetKitchenTicketsQuery,
  useGetReservationsQuery,
  useGetWaitlistQuery,
  useGetPosMenuQuery,
} = operationsApi
