import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './uiSlice'
import { dashboardApi } from './api/dashboardApi'
import { menuApi } from './api/menuApi'
import { inventoryApi } from './api/inventoryApi'
import { staffApi } from './api/staffApi'
import { customersApi } from './api/customersApi'
import { billingApi } from './api/billingApi'
import { operationsApi } from './api/operationsApi'
import { settingsApi } from './api/settingsApi'
import { categoriesApi } from './api/categoriesApi'
import { itemsApi } from './api/itemsApi'
import { variantsApi } from './api/variantsApi'
import { modifiersApi } from './api/modifiersApi'
import { tablesApi } from './api/tablesApi'
import { ordersApi } from './api/ordersApi'
import { kitchenApi } from './api/kitchenApi'
import { upsellApi } from './api/upsellApi'
import { paymentGatewayApi } from './api/paymentGatewayApi'
import { reservationApi } from './api/reservationApi'
import { waitlistApi } from './api/waitlistApi'
import { ingredientsApi } from './api/ingredientsApi'
import { recipesApi } from './api/recipesApi'
import { suppliersApi } from './api/suppliersApi'
import { purchaseOrdersApi } from './api/purchaseOrdersApi'
import { cmsApi } from './api/cmsApi'
import { reportsApi } from './api/reportsApi'
import { demandForecastApi } from './api/demandForecastApi'
import { menuAIApi } from './api/menuAIApi'
import { aiChatApi } from './api/aiChatApi'


export const store = configureStore({
  reducer: {
    ui: uiReducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [menuApi.reducerPath]: menuApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [staffApi.reducerPath]: staffApi.reducer,
    [customersApi.reducerPath]: customersApi.reducer,
    [billingApi.reducerPath]: billingApi.reducer,
    [operationsApi.reducerPath]: operationsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [itemsApi.reducerPath]: itemsApi.reducer,
    [variantsApi.reducerPath]: variantsApi.reducer,
    [modifiersApi.reducerPath]: modifiersApi.reducer,
    [tablesApi.reducerPath]: tablesApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [kitchenApi.reducerPath]: kitchenApi.reducer,
    [upsellApi.reducerPath]: upsellApi.reducer,
    [paymentGatewayApi.reducerPath]: paymentGatewayApi.reducer,
    [reservationApi.reducerPath]: reservationApi.reducer,
    [waitlistApi.reducerPath]: waitlistApi.reducer,
    [ingredientsApi.reducerPath]: ingredientsApi.reducer,
    [recipesApi.reducerPath]: recipesApi.reducer,
    [suppliersApi.reducerPath]: suppliersApi.reducer,
    [purchaseOrdersApi.reducerPath]: purchaseOrdersApi.reducer,
    [cmsApi.reducerPath]: cmsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [demandForecastApi.reducerPath]: demandForecastApi.reducer,
    [menuAIApi.reducerPath]: menuAIApi.reducer,
    [aiChatApi.reducerPath]: aiChatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      dashboardApi.middleware,
      menuApi.middleware,
      inventoryApi.middleware,
      staffApi.middleware,
      customersApi.middleware,
      billingApi.middleware,
      operationsApi.middleware,
      settingsApi.middleware,
      categoriesApi.middleware,
      itemsApi.middleware,
      variantsApi.middleware,
      modifiersApi.middleware,
      tablesApi.middleware,
      ordersApi.middleware,
      kitchenApi.middleware,
      upsellApi.middleware,
      paymentGatewayApi.middleware,
      reservationApi.middleware,
      waitlistApi.middleware,
      ingredientsApi.middleware,
      recipesApi.middleware,
      suppliersApi.middleware,
      purchaseOrdersApi.middleware,
      cmsApi.middleware,
      reportsApi.middleware,
      demandForecastApi.middleware,
      menuAIApi.middleware,
      aiChatApi.middleware,
    ),
})
