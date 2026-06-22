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
      settingsApi.middleware
    ),
})
