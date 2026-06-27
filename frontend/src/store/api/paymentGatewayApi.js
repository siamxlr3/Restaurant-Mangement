import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const paymentGatewayApi = createApi({
  reducerPath: 'paymentGatewayApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['GatewayStatus', 'GatewayPayment'],
  endpoints: (builder) => ({
    // GET /payment-gateways/status — returns { bkash, rocket, nagad } booleans
    getGatewayStatus: builder.query({
      query: () => '/payment-gateways/status',
      transformResponse: (response) => response.data,
      providesTags: ['GatewayStatus'],
    }),

    // POST /payment-gateways/initiate — starts payment with provider
    initiatePayment: builder.mutation({
      query: (body) => ({
        url: '/payment-gateways/initiate',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['GatewayPayment'],
    }),

    // POST /payment-gateways/execute — confirms pending payment
    executePayment: builder.mutation({
      query: (body) => ({
        url: '/payment-gateways/execute',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['GatewayPayment'],
    }),
  }),
})

export const {
  useGetGatewayStatusQuery,
  useInitiatePaymentMutation,
  useExecutePaymentMutation,
} = paymentGatewayApi
