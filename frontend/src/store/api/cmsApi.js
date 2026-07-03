import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const cmsApi = createApi({
  reducerPath: 'cmsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/v1/cms',
  }),
  tagTypes: [
    'SiteConfig',
    'TickerItems',
    'Hero',
    'Story',
    'FeaturedDishes',
    'Features',
    'GalleryItems',
    'Reviews',
    'OpeningHours',
    'Location',
    'FaqItems',
    'ReservationConfig',
  ],
  endpoints: (builder) => ({
    // 1. Site Config (Singleton get/update)
    getSiteConfig: builder.query({
      query: () => '/site-config',
      providesTags: ['SiteConfig'],
    }),
    updateSiteConfig: builder.mutation({
      query: (body) => ({
        url: '/site-config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['SiteConfig'],
    }),

    // 2. Ticker Items (List / CRUD / Reorder)
    getTickerItems: builder.query({
      query: (params) => ({ url: '/ticker-items', params }),
      providesTags: ['TickerItems'],
    }),
    getTickerItemById: builder.query({
      query: (id) => `/ticker-items/${id}`,
      providesTags: (result, error, id) => [{ type: 'TickerItems', id }],
    }),
    createTickerItem: builder.mutation({
      query: (body) => ({
        url: '/ticker-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TickerItems'],
    }),
    updateTickerItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ticker-items/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['TickerItems', { type: 'TickerItems', id }],
    }),
    deleteTickerItem: builder.mutation({
      query: (id) => ({
        url: `/ticker-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TickerItems'],
    }),
    reorderTickerItems: builder.mutation({
      query: (body) => ({
        url: '/ticker-items/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['TickerItems'],
    }),

    // 3. Hero Section (Singleton get/update)
    getHero: builder.query({
      query: () => '/hero',
      providesTags: ['Hero'],
    }),
    updateHero: builder.mutation({
      query: (body) => ({
        url: '/hero',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Hero'],
    }),

    // 4. Story Section (Singleton get/update)
    getStory: builder.query({
      query: () => '/story',
      providesTags: ['Story'],
    }),
    updateStory: builder.mutation({
      query: (body) => ({
        url: '/story',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Story'],
    }),

    // 5. Featured Dishes (List / CRUD / Reorder / optional Image file)
    getFeaturedDishes: builder.query({
      query: (params) => ({ url: '/featured-dishes', params }),
      providesTags: ['FeaturedDishes'],
    }),
    getFeaturedDishById: builder.query({
      query: (id) => `/featured-dishes/${id}`,
      providesTags: (result, error, id) => [{ type: 'FeaturedDishes', id }],
    }),
    createFeaturedDish: builder.mutation({
      query: (body) => ({
        url: '/featured-dishes',
        method: 'POST',
        body, // Form data containing image and fields
      }),
      invalidatesTags: ['FeaturedDishes'],
    }),
    updateFeaturedDish: builder.mutation({
      query: ({ id, body }) => ({
        url: `/featured-dishes/${id}`,
        method: 'PATCH',
        body, // Form data containing image and fields
      }),
      invalidatesTags: (result, error, { id }) => ['FeaturedDishes', { type: 'FeaturedDishes', id }],
    }),
    deleteFeaturedDish: builder.mutation({
      query: (id) => ({
        url: `/featured-dishes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeaturedDishes'],
    }),
    reorderFeaturedDishes: builder.mutation({
      query: (body) => ({
        url: '/featured-dishes/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FeaturedDishes'],
    }),

    // 6. Features (Why Choose Us)
    getFeatures: builder.query({
      query: (params) => ({ url: '/features', params }),
      providesTags: ['Features'],
    }),
    getFeatureById: builder.query({
      query: (id) => `/features/${id}`,
      providesTags: (result, error, id) => [{ type: 'Features', id }],
    }),
    createFeature: builder.mutation({
      query: (body) => ({
        url: '/features',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Features'],
    }),
    updateFeature: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/features/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['Features', { type: 'Features', id }],
    }),
    deleteFeature: builder.mutation({
      query: (id) => ({
        url: `/features/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Features'],
    }),
    reorderFeatures: builder.mutation({
      query: (body) => ({
        url: '/features/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Features'],
    }),

    // 7. Gallery Items (list / category / image upload / reorder)
    getGalleryItems: builder.query({
      query: (params) => ({ url: '/gallery-items', params }),
      providesTags: ['GalleryItems'],
    }),
    getGalleryItemById: builder.query({
      query: (id) => `/gallery-items/${id}`,
      providesTags: (result, error, id) => [{ type: 'GalleryItems', id }],
    }),
    createGalleryItem: builder.mutation({
      query: (body) => ({
        url: '/gallery-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GalleryItems'],
    }),
    updateGalleryItem: builder.mutation({
      query: ({ id, body }) => ({
        url: `/gallery-items/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['GalleryItems', { type: 'GalleryItems', id }],
    }),
    deleteGalleryItem: builder.mutation({
      query: (id) => ({
        url: `/gallery-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GalleryItems'],
    }),
    reorderGalleryItems: builder.mutation({
      query: (body) => ({
        url: '/gallery-items/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['GalleryItems'],
    }),

    // 8. Guest Reviews (orderable list)
    getReviews: builder.query({
      query: (params) => ({ url: '/reviews', params }),
      providesTags: ['Reviews'],
    }),
    getReviewById: builder.query({
      query: (id) => `/reviews/${id}`,
      providesTags: (result, error, id) => [{ type: 'Reviews', id }],
    }),
    createReview: builder.mutation({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reviews'],
    }),
    updateReview: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/reviews/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['Reviews', { type: 'Reviews', id }],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reviews'],
    }),
    reorderReviews: builder.mutation({
      query: (body) => ({
        url: '/reviews/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Reviews'],
    }),

    // 9. Opening Hours
    getOpeningHours: builder.query({
      query: (params) => ({ url: '/opening-hours', params }),
      providesTags: ['OpeningHours'],
    }),
    getOpeningHoursById: builder.query({
      query: (id) => `/opening-hours/${id}`,
      providesTags: (result, error, id) => [{ type: 'OpeningHours', id }],
    }),
    createOpeningHours: builder.mutation({
      query: (body) => ({
        url: '/opening-hours',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OpeningHours'],
    }),
    updateOpeningHours: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/opening-hours/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['OpeningHours', { type: 'OpeningHours', id }],
    }),
    deleteOpeningHours: builder.mutation({
      query: (id) => ({
        url: `/opening-hours/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OpeningHours'],
    }),

    // 10. Location Section (Singleton get/update)
    getLocation: builder.query({
      query: () => '/location',
      providesTags: ['Location'],
    }),
    updateLocation: builder.mutation({
      query: (body) => ({
        url: '/location',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Location'],
    }),

    // 11. FAQ Items (orderable list)
    getFaqItems: builder.query({
      query: (params) => ({ url: '/faq-items', params }),
      providesTags: ['FaqItems'],
    }),
    getFaqItemById: builder.query({
      query: (id) => `/faq-items/${id}`,
      providesTags: (result, error, id) => [{ type: 'FaqItems', id }],
    }),
    createFaqItem: builder.mutation({
      query: (body) => ({
        url: '/faq-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FaqItems'],
    }),
    updateFaqItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/faq-items/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['FaqItems', { type: 'FaqItems', id }],
    }),
    deleteFaqItem: builder.mutation({
      query: (id) => ({
        url: `/faq-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FaqItems'],
    }),
    reorderFaqItems: builder.mutation({
      query: (body) => ({
        url: '/faq-items/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FaqItems'],
    }),

    // 12. Reservation Config (Singleton get/update)
    getReservationConfig: builder.query({
      query: () => '/reservation-config',
      providesTags: ['ReservationConfig'],
    }),
    updateReservationConfig: builder.mutation({
      query: (body) => ({
        url: '/reservation-config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ReservationConfig'],
    }),
  }),
})

export const {
  useGetSiteConfigQuery,
  useUpdateSiteConfigMutation,
  useGetTickerItemsQuery,
  useGetTickerItemByIdQuery,
  useCreateTickerItemMutation,
  useUpdateTickerItemMutation,
  useDeleteTickerItemMutation,
  useReorderTickerItemsMutation,
  useGetHeroQuery,
  useUpdateHeroMutation,
  useGetStoryQuery,
  useUpdateStoryMutation,
  useGetFeaturedDishesQuery,
  useGetFeaturedDishByIdQuery,
  useCreateFeaturedDishMutation,
  useUpdateFeaturedDishMutation,
  useDeleteFeaturedDishMutation,
  useReorderFeaturedDishesMutation,
  useGetFeaturesQuery,
  useGetFeatureByIdQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
  useReorderFeaturesMutation,
  useGetGalleryItemsQuery,
  useGetGalleryItemByIdQuery,
  useCreateGalleryItemMutation,
  useUpdateGalleryItemMutation,
  useDeleteGalleryItemMutation,
  useReorderGalleryItemsMutation,
  useGetReviewsQuery,
  useGetReviewByIdQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useReorderReviewsMutation,
  useGetOpeningHoursQuery,
  useGetOpeningHoursByIdQuery,
  useCreateOpeningHoursMutation,
  useUpdateOpeningHoursMutation,
  useDeleteOpeningHoursMutation,
  useGetLocationQuery,
  useUpdateLocationMutation,
  useGetFaqItemsQuery,
  useGetFaqItemByIdQuery,
  useCreateFaqItemMutation,
  useUpdateFaqItemMutation,
  useDeleteFaqItemMutation,
  useReorderFaqItemsMutation,
  useGetReservationConfigQuery,
  useUpdateReservationConfigMutation,
} = cmsApi
