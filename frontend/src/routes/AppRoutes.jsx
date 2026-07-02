import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'

import DashboardOverview from '../pages/dashboard/DashboardOverview'

import POS from '../pages/operations/POS'
import KitchenDisplay from '../pages/operations/KitchenDisplay'
import FloorMap from '../pages/operations/FloorMap'
import Reservations from '../pages/operations/Reservations'
import Waitlist from '../pages/operations/Waitlist'

import MenuItems from '../pages/menu/MenuItems'
import Categories from '../pages/menu/Categories'
import Modifiers from '../pages/menu/Modifiers'

import Bills from '../pages/billing/Bills'
import Discounts from '../pages/billing/Discounts'
import TaxSettings from '../pages/billing/TaxSettings'
import PaymentGatewayManagement from '../pages/payment-gateways/PaymentGatewayManagement'

import Ingredients from '../pages/inventory/Ingredients'
import Recipes from '../pages/inventory/Recipes'
import Suppliers from '../pages/inventory/Suppliers'
import ReorderSuggestions from '../pages/inventory/ReorderSuggestions'

import StaffManagement from '../pages/staff/StaffManagement'

import CustomersDirectory from '../pages/customers/CustomersDirectory'
import Loyalty from '../pages/customers/Loyalty'
import Feedback from '../pages/customers/Feedback'

import AIAssistant from '../pages/ai-insights/AIAssistant'
import MenuSuggestions from '../pages/ai-insights/MenuSuggestions'
import DemandForecast from '../pages/ai-insights/DemandForecast'

import SalesReport from '../pages/reports/SalesReport'
import MenuPerformanceReport from '../pages/reports/MenuPerformanceReport'
import StaffPerformanceReport from '../pages/reports/StaffPerformanceReport'
import InventoryCostReport from '../pages/reports/InventoryCostReport'
import AnomalyAlerts from '../pages/reports/AnomalyAlerts'

import MarketingLandingPage from '../pages/marketing/MarketingLandingPage'
import Promotions from '../pages/marketing/Promotions'

import GeneralSettings from '../pages/settings/GeneralSettings'
import PaymentGateways from '../pages/settings/PaymentGateways'
import AIConfiguration from '../pages/settings/AIConfiguration'
import Notifications from '../pages/settings/Notifications'
import RolesPermissions from '../pages/settings/RolesPermissions'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardOverview />} />

        <Route path="/operations/pos" element={<POS />} />
        <Route path="/operations/kitchen" element={<KitchenDisplay />} />
        <Route path="/operations/floor" element={<FloorMap />} />
        <Route path="/operations/reservations" element={<Reservations />} />
        <Route path="/operations/waitlist" element={<Waitlist />} />

        <Route path="/menu/items" element={<MenuItems />} />
        <Route path="/menu/categories" element={<Categories />} />
        <Route path="/menu/modifiers" element={<Modifiers />} />

        <Route path="/billing/bills" element={<Bills />} />
        <Route path="/billing/discounts" element={<Discounts />} />
        <Route path="/billing/tax-settings" element={<TaxSettings />} />
        <Route path="/billing/payment-gateways" element={<PaymentGatewayManagement />} />

        <Route path="/inventory/ingredients" element={<Ingredients />} />
        <Route path="/inventory/recipes" element={<Recipes />} />
        <Route path="/inventory/suppliers" element={<Suppliers />} />
        <Route path="/inventory/reorder" element={<ReorderSuggestions />} />

        <Route path="/staff/management" element={<StaffManagement />} />
        <Route path="/staff/directory" element={<Navigate to="/staff/management" replace />} />
        <Route path="/staff/shifts" element={<Navigate to="/staff/management" replace />} />
        <Route path="/staff/attendance" element={<Navigate to="/staff/management" replace />} />

        <Route path="/customers/directory" element={<CustomersDirectory />} />
        <Route path="/customers/loyalty" element={<Loyalty />} />
        <Route path="/customers/feedback" element={<Feedback />} />

        <Route path="/ai-insights/assistant" element={<AIAssistant />} />
        <Route path="/ai-insights/menu-suggestions" element={<MenuSuggestions />} />
        <Route path="/ai-insights/demand-forecast" element={<DemandForecast />} />

        <Route path="/reports/sales" element={<SalesReport />} />
        <Route path="/reports/menu-performance" element={<MenuPerformanceReport />} />
        <Route path="/reports/staff-performance" element={<StaffPerformanceReport />} />
        <Route path="/reports/inventory-cost" element={<InventoryCostReport />} />
        <Route path="/reports/anomaly-alerts" element={<AnomalyAlerts />} />

        <Route path="/marketing/landing-page" element={<MarketingLandingPage />} />
        <Route path="/marketing/promotions" element={<Promotions />} />

        <Route path="/settings/general" element={<GeneralSettings />} />
        <Route path="/settings/payment-gateways" element={<PaymentGateways />} />
        <Route path="/settings/ai-configuration" element={<AIConfiguration />} />
        <Route path="/settings/notifications" element={<Notifications />} />
        <Route path="/settings/roles-permissions" element={<RolesPermissions />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
