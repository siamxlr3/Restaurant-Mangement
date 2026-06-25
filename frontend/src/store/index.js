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
      upsellApi.middleware

    ),
})
