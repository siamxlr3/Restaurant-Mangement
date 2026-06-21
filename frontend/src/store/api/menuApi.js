import { createApi } from '@reduxjs/toolkit/query/react'
import { fakeBaseQuery } from './fakeBaseQuery'
import { mockMenuItems, mockCategories, mockModifiers } from '../mockData'

export const menuApi = createApi({
  reducerPath: 'menuApi',
  baseQuery: fakeBaseQuery({
    '/menu/items': () => mockMenuItems,
    '/menu/categories': () => mockCategories,
    '/menu/modifiers': () => mockModifiers,
  }),
  endpoints: (builder) => ({
    getMenuItems: builder.query({ query: () => ({ url: '/menu/items' }) }),
    getCategories: builder.query({ query: () => ({ url: '/menu/categories' }) }),
    getModifiers: builder.query({ query: () => ({ url: '/menu/modifiers' }) }),
  }),
})

export const { useGetMenuItemsQuery, useGetCategoriesQuery, useGetModifiersQuery } = menuApi
