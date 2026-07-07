import {
  LayoutGrid,
  UtensilsCrossed,
  ClipboardList,
  Receipt,
  Boxes,
  Users,
  Sparkles,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react'

export const navSections = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    path: '/dashboard',
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: ClipboardList,
    path: '/operations/pos',
    children: [
      { label: 'POS', path: '/operations/pos' },
      { label: 'Kitchen display', path: '/operations/kitchen' },
      { label: 'Floor map', path: '/operations/floor' },
      { label: 'Reservations', path: '/operations/reservations' },
      { label: 'Waitlist', path: '/operations/waitlist' },
    ],
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: UtensilsCrossed,
    path: '/menu/items',
    children: [
      { label: 'Menu items', path: '/menu/items' },
      { label: 'Categories', path: '/menu/categories' },
      { label: 'Variants & modifiers', path: '/menu/modifiers' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: Receipt,
    path: '/billing/bills',
    children: [
      { label: 'Bills', path: '/billing/bills' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    path: '/inventory/ingredients',
    children: [
      { label: 'Ingredients', path: '/inventory/ingredients' },
      { label: 'Recipes', path: '/inventory/recipes' },
      { label: 'Suppliers & POs', path: '/inventory/suppliers' },
      { label: 'Reorder suggestions', path: '/inventory/reorder', badge: 'AI' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: Users,
    path: '/staff/directory',
    children: [
      { label: 'Staff', path: '/staff/directory' },
      { label: 'Shifts', path: '/staff/shifts' },
      { label: 'Attendance', path: '/staff/attendance' },
    ],
  },

  {
    id: 'ai-insights',
    label: 'AI insights',
    icon: Sparkles,
    path: '/ai-insights/assistant',
    children: [
      { label: 'AI assistant', path: '/ai-insights/assistant' },
      { label: 'Menu suggestions', path: '/ai-insights/menu-suggestions' },
      { label: 'Demand forecast', path: '/ai-insights/demand-forecast' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    path: '/reports/sales',
    children: [
      { label: 'Sales', path: '/reports/sales' },
      { label: 'Menu performance', path: '/reports/menu-performance' },
      { label: 'Inventory cost', path: '/reports/inventory-cost' },
      { label: 'Anomaly alerts', path: '/reports/anomaly-alerts' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: BarChart3,
    path: '/marketing/landing-page',
    children: [
      { label: 'Landing page', path: '/marketing/landing-page' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    path: '/settings/general',
    children: [
      { label: 'General', path: '/settings/general' },
      { label: 'Payment gateways', path: '/settings/payment-gateways' },
      { label: 'AI configuration', path: '/settings/ai-configuration' },
      { label: 'Notifications', path: '/settings/notifications' },
    ],
  },
]
