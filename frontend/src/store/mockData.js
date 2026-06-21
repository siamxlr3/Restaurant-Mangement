// Centralized mock data. In production, each api/*.js slice would point
// baseQuery at a real REST/GraphQL backend instead of these fixtures.

export const mockKPIs = [
  { id: 'revenue', label: "Today's revenue", value: 184250, prefix: '৳', delta: 12.4, trend: 'up' },
  { id: 'orders', label: 'Orders served', value: 312, delta: 8.1, trend: 'up' },
  { id: 'avgTicket', label: 'Avg. ticket size', value: 591, prefix: '৳', delta: -2.3, trend: 'down' },
  { id: 'tableTurns', label: 'Table turns', value: 4.2, suffix: 'x', delta: 5.6, trend: 'up' },
]

export const mockAIInsights = [
  {
    id: 1,
    type: 'opportunity',
    title: 'Push Chicken Tikka Biryani tonight',
    body: 'Friday dinner demand for biryani historically runs 34% above weekday average, and your prep stock can cover 60 extra covers.',
    confidence: 92,
    action: 'Add to tonight\'s specials board',
  },
  {
    id: 2,
    type: 'risk',
    title: 'Prawns running below par stock',
    body: 'Current prawn inventory covers ~1.5 services. Garlic Butter Prawns and Prawn Malai Curry will be at risk by tomorrow lunch.',
    confidence: 88,
    action: 'Raise PO to Bay Seafood Co.',
  },
  {
    id: 3,
    type: 'anomaly',
    title: 'Unusual void rate on Table 12 (Floor 2)',
    body: 'Void rate on this terminal is 4x the 30-day average for the dinner shift. Worth a quick check with the floor supervisor.',
    confidence: 76,
    action: 'Review void log',
  },
  {
    id: 4,
    type: 'opportunity',
    title: 'Bundle Lassi with weekend brunch',
    body: 'Tables ordering brunch mains without a beverage add-on dropped average ticket by ৳85. A bundled prompt could recover this.',
    confidence: 81,
    action: 'Enable POS upsell prompt',
  },
]

export const mockRevenueTrend = [
  { day: 'Mon', revenue: 142000, lastWeek: 131000 },
  { day: 'Tue', revenue: 138500, lastWeek: 129000 },
  { day: 'Wed', revenue: 151200, lastWeek: 140500 },
  { day: 'Thu', revenue: 163800, lastWeek: 148200 },
  { day: 'Fri', revenue: 198400, lastWeek: 176300 },
  { day: 'Sat', revenue: 224100, lastWeek: 205700 },
  { day: 'Sun', revenue: 184250, lastWeek: 172900 },
]

export const mockOrderSourceSplit = [
  { name: 'Dine-in', value: 58 },
  { name: 'Takeaway', value: 24 },
  { name: 'Delivery app', value: 18 },
]

export const mockTables = [
  { id: 'T1', floor: 1, seats: 2, status: 'occupied', server: 'Rana', startedAt: '7:42 PM', orderTotal: 1240 },
  { id: 'T2', floor: 1, seats: 4, status: 'occupied', server: 'Mim', startedAt: '8:05 PM', orderTotal: 2860 },
  { id: 'T3', floor: 1, seats: 2, status: 'available', server: null, startedAt: null, orderTotal: 0 },
  { id: 'T4', floor: 1, seats: 6, status: 'reserved', server: null, startedAt: '9:00 PM', orderTotal: 0 },
  { id: 'T5', floor: 1, seats: 4, status: 'occupied', server: 'Rana', startedAt: '7:55 PM', orderTotal: 1980 },
  { id: 'T6', floor: 1, seats: 2, status: 'needs-cleaning', server: null, startedAt: null, orderTotal: 0 },
  { id: 'T7', floor: 2, seats: 4, status: 'occupied', server: 'Tania', startedAt: '8:20 PM', orderTotal: 3120 },
  { id: 'T8', floor: 2, seats: 8, status: 'occupied', server: 'Tania', startedAt: '7:30 PM', orderTotal: 5640 },
  { id: 'T9', floor: 2, seats: 2, status: 'available', server: null, startedAt: null, orderTotal: 0 },
  { id: 'T10', floor: 2, seats: 4, status: 'reserved', server: null, startedAt: '8:45 PM', orderTotal: 0 },
  { id: 'T11', floor: 2, seats: 4, status: 'available', server: null, startedAt: null, orderTotal: 0 },
  { id: 'T12', floor: 2, seats: 6, status: 'occupied', server: 'Hasan', startedAt: '8:10 PM', orderTotal: 4100 },
]

export const mockKitchenTickets = [
  {
    id: 'K-2031',
    table: 'T7',
    course: 'Mains',
    elapsedMin: 14,
    priority: 'rush',
    items: [
      { name: 'Beef Tehari', qty: 2, notes: 'Less spicy' },
      { name: 'Garlic Naan', qty: 3 },
    ],
  },
  {
    id: 'K-2032',
    table: 'T2',
    course: 'Starters',
    elapsedMin: 6,
    priority: 'normal',
    items: [
      { name: 'Chicken Seekh Kebab', qty: 1 },
      { name: 'Veg Spring Rolls', qty: 2 },
    ],
  },
  {
    id: 'K-2033',
    table: 'T12',
    course: 'Mains',
    elapsedMin: 21,
    priority: 'rush',
    items: [
      { name: 'Prawn Malai Curry', qty: 1 },
      { name: 'Chicken Biryani', qty: 3, notes: 'Extra raita' },
    ],
  },
  {
    id: 'K-2034',
    table: 'T5',
    course: 'Desserts',
    elapsedMin: 3,
    priority: 'normal',
    items: [{ name: 'Mishti Doi', qty: 2 }],
  },
  {
    id: 'K-2035',
    table: 'T8',
    course: 'Mains',
    elapsedMin: 9,
    priority: 'normal',
    items: [
      { name: 'Mutton Rezala', qty: 2 },
      { name: 'Plain Rice', qty: 4 },
    ],
  },
]

export const mockReservations = [
  { id: 'R-501', name: 'Imran Chowdhury', guests: 4, time: '8:45 PM', table: 'T10', phone: '+880 1711 222333', status: 'confirmed' },
  { id: 'R-502', name: 'Nusrat Jahan', guests: 6, time: '9:00 PM', table: 'T4', phone: '+880 1819 445566', status: 'confirmed' },
  { id: 'R-503', name: 'Fahim Rahman', guests: 2, time: '9:30 PM', table: '—', phone: '+880 1922 778899', status: 'pending' },
]

export const mockWaitlist = [
  { id: 'W-21', name: 'Sadia Islam', guests: 3, waitingSince: '8:32 PM', quotedWait: 20, status: 'waiting' },
  { id: 'W-22', name: 'Tanvir Ahmed', guests: 5, waitingSince: '8:40 PM', quotedWait: 30, status: 'waiting' },
  { id: 'W-23', name: 'Mehjabin Karim', guests: 2, waitingSince: '8:51 PM', quotedWait: 15, status: 'notified' },
]

export const mockCategories = [
  { id: 'c1', name: 'Starters', items: 14, active: true },
  { id: 'c2', name: 'Biryani & Rice', items: 9, active: true },
  { id: 'c3', name: 'Curries', items: 22, active: true },
  { id: 'c4', name: 'Breads', items: 8, active: true },
  { id: 'c5', name: 'Desserts', items: 11, active: true },
  { id: 'c6', name: 'Beverages', items: 17, active: true },
  { id: 'c7', name: 'Seasonal Specials', items: 5, active: false },
]

export const mockMenuItems = [
  { id: 'm1', name: 'Chicken Tikka Biryani', category: 'Biryani & Rice', price: 420, cost: 168, status: 'active', popularity: 96, image: '🍛' },
  { id: 'm2', name: 'Mutton Rezala', category: 'Curries', price: 580, cost: 245, status: 'active', popularity: 81, image: '🍲' },
  { id: 'm3', name: 'Garlic Butter Prawns', category: 'Starters', price: 510, cost: 220, status: 'low-stock', popularity: 74, image: '🍤' },
  { id: 'm4', name: 'Beef Tehari', category: 'Biryani & Rice', price: 390, cost: 152, status: 'active', popularity: 88, image: '🍚' },
  { id: 'm5', name: 'Paneer Butter Masala', category: 'Curries', price: 340, cost: 118, status: 'active', popularity: 69, image: '🧈' },
  { id: 'm6', name: 'Garlic Naan', category: 'Breads', price: 60, cost: 14, status: 'active', popularity: 91, image: '🫓' },
  { id: 'm7', name: 'Mishti Doi', category: 'Desserts', price: 90, cost: 22, status: 'active', popularity: 64, image: '🍮' },
  { id: 'm8', name: 'Mango Lassi', category: 'Beverages', price: 130, cost: 35, status: 'active', popularity: 78, image: '🥤' },
]

export const mockModifiers = [
  { id: 'mod1', name: 'Spice level', type: 'single-select', options: ['Mild', 'Medium', 'Hot', 'Extra hot'], appliesTo: 34 },
  { id: 'mod2', name: 'Protein add-on', type: 'multi-select', options: ['Extra chicken (+৳80)', 'Extra paneer (+৳60)'], appliesTo: 18 },
  { id: 'mod3', name: 'Portion size', type: 'single-select', options: ['Regular', 'Large (+৳70)', 'Family (+৳180)'], appliesTo: 26 },
]

export const mockIngredients = [
  { id: 'i1', name: 'Basmati Rice', unit: 'kg', stock: 142, parLevel: 80, costPerUnit: 145, supplier: 'Green Valley Foods', status: 'healthy' },
  { id: 'i2', name: 'Chicken (whole)', unit: 'kg', stock: 38, parLevel: 60, costPerUnit: 240, supplier: 'Farm Fresh Poultry', status: 'low' },
  { id: 'i3', name: 'Prawns (medium)', unit: 'kg', stock: 6, parLevel: 25, costPerUnit: 680, supplier: 'Bay Seafood Co.', status: 'critical' },
  { id: 'i4', name: 'Paneer', unit: 'kg', stock: 22, parLevel: 15, costPerUnit: 320, supplier: 'Green Valley Foods', status: 'healthy' },
  { id: 'i5', name: 'Tomato', unit: 'kg', stock: 31, parLevel: 30, costPerUnit: 60, supplier: 'Daily Harvest', status: 'healthy' },
  { id: 'i6', name: 'Ghee', unit: 'l', stock: 9, parLevel: 12, costPerUnit: 780, supplier: 'Green Valley Foods', status: 'low' },
  { id: 'i7', name: 'Yogurt', unit: 'kg', stock: 18, parLevel: 14, costPerUnit: 110, supplier: 'Daily Harvest', status: 'healthy' },
]

export const mockSuppliers = [
  { id: 's1', name: 'Green Valley Foods', category: 'Dry goods & dairy', reliability: 96, leadTimeDays: 2, openPOs: 1 },
  { id: 's2', name: 'Farm Fresh Poultry', category: 'Poultry', reliability: 89, leadTimeDays: 1, openPOs: 1 },
  { id: 's3', name: 'Bay Seafood Co.', category: 'Seafood', reliability: 91, leadTimeDays: 1, openPOs: 0 },
  { id: 's4', name: 'Daily Harvest', category: 'Produce', reliability: 94, leadTimeDays: 1, openPOs: 0 },
]

export const mockPurchaseOrders = [
  { id: 'PO-1042', supplier: 'Farm Fresh Poultry', items: 3, total: 28800, status: 'pending', eta: 'Tomorrow, 8:00 AM' },
  { id: 'PO-1041', supplier: 'Green Valley Foods', items: 5, total: 41200, status: 'in-transit', eta: 'Today, 6:00 PM' },
  { id: 'PO-1040', supplier: 'Daily Harvest', items: 4, total: 9600, status: 'delivered', eta: 'Delivered 9:10 AM' },
]

export const mockReorderSuggestions = [
  { id: 'rs1', ingredient: 'Prawns (medium)', reason: 'Critical stock + Friday demand spike forecast', suggestedQty: 30, unit: 'kg', urgency: 'high' },
  { id: 'rs2', ingredient: 'Chicken (whole)', reason: 'Below par level, steady weekday usage', suggestedQty: 45, unit: 'kg', urgency: 'medium' },
  { id: 'rs3', ingredient: 'Ghee', reason: 'Trending below par, 4-day lead time buffer', suggestedQty: 10, unit: 'l', urgency: 'medium' },
]

export const mockStaff = [
  { id: 'st1', name: 'Rana Ahmed', role: 'Server', shift: 'Evening', status: 'on-duty', rating: 4.7 },
  { id: 'st2', name: 'Mim Akter', role: 'Server', shift: 'Evening', status: 'on-duty', rating: 4.5 },
  { id: 'st3', name: 'Tania Sultana', role: 'Senior Server', shift: 'Evening', status: 'on-duty', rating: 4.9 },
  { id: 'st4', name: 'Hasan Mahmud', role: 'Server', shift: 'Evening', status: 'on-duty', rating: 4.3 },
  { id: 'st5', name: 'Kamal Hossain', role: 'Head Chef', shift: 'Evening', status: 'on-duty', rating: 4.8 },
  { id: 'st6', name: 'Joya Rahman', role: 'Line Cook', shift: 'Evening', status: 'on-duty', rating: 4.4 },
  { id: 'st7', name: 'Abdul Karim', role: 'Cashier', shift: 'Evening', status: 'on-break', rating: 4.6 },
  { id: 'st8', name: 'Nasrin Begum', role: 'Host', shift: 'Morning', status: 'off-duty', rating: 4.5 },
]

export const mockShifts = [
  { id: 'sh1', staff: 'Rana Ahmed', date: 'Today', start: '4:00 PM', end: '12:00 AM', role: 'Server' },
  { id: 'sh2', staff: 'Tania Sultana', date: 'Today', start: '4:00 PM', end: '12:00 AM', role: 'Senior Server' },
  { id: 'sh3', staff: 'Kamal Hossain', date: 'Today', start: '2:00 PM', end: '11:00 PM', role: 'Head Chef' },
  { id: 'sh4', staff: 'Nasrin Begum', date: 'Tomorrow', start: '8:00 AM', end: '4:00 PM', role: 'Host' },
]

export const mockAttendance = [
  { id: 'at1', staff: 'Rana Ahmed', clockIn: '3:58 PM', clockOut: '—', status: 'on-time' },
  { id: 'at2', staff: 'Mim Akter', clockIn: '4:12 PM', clockOut: '—', status: 'late' },
  { id: 'at3', staff: 'Kamal Hossain', clockIn: '1:55 PM', clockOut: '—', status: 'on-time' },
  { id: 'at4', staff: 'Abdul Karim', clockIn: '3:50 PM', clockOut: '—', status: 'on-time' },
]

export const mockCustomers = [
  { id: 'cu1', name: 'Imran Chowdhury', visits: 28, lifetimeSpend: 64200, tier: 'Gold', lastVisit: '2 days ago' },
  { id: 'cu2', name: 'Nusrat Jahan', visits: 14, lifetimeSpend: 31800, tier: 'Silver', lastVisit: '5 days ago' },
  { id: 'cu3', name: 'Fahim Rahman', visits: 6, lifetimeSpend: 9400, tier: 'Bronze', lastVisit: '1 week ago' },
  { id: 'cu4', name: 'Sadia Islam', visits: 41, lifetimeSpend: 98600, tier: 'Platinum', lastVisit: 'Today' },
  { id: 'cu5', name: 'Tanvir Ahmed', visits: 3, lifetimeSpend: 4100, tier: 'Bronze', lastVisit: '2 weeks ago' },
]

export const mockFeedback = [
  { id: 'f1', customer: 'Imran Chowdhury', rating: 5, comment: 'The biryani was outstanding tonight, and Tania took great care of us.', sentiment: 'positive', sentimentScore: 0.94, date: 'Today' },
  { id: 'f2', customer: 'Anonymous guest', rating: 2, comment: 'Waited almost 40 minutes for our mains, kitchen seemed overwhelmed.', sentiment: 'negative', sentimentScore: 0.18, date: 'Yesterday' },
  { id: 'f3', customer: 'Sadia Islam', rating: 4, comment: 'Lovely ambience, prawns were a touch salty this time.', sentiment: 'mixed', sentimentScore: 0.58, date: '2 days ago' },
  { id: 'f4', customer: 'Fahim Rahman', rating: 5, comment: 'Best mutton rezala in the city, hands down.', sentiment: 'positive', sentimentScore: 0.97, date: '3 days ago' },
]

export const mockLoyaltyTiers = [
  { tier: 'Bronze', threshold: 0, members: 412, perk: '5% birthday discount' },
  { tier: 'Silver', threshold: 15000, members: 186, perk: '10% off + free dessert' },
  { tier: 'Gold', threshold: 50000, members: 64, perk: 'Priority seating + 15% off' },
  { tier: 'Platinum', threshold: 90000, members: 21, perk: 'Chef\'s table access + 20% off' },
]

export const mockBills = [
  { id: 'B-3301', table: 'T8', items: 6, subtotal: 5640, tax: 564, discount: 0, total: 6204, status: 'open', server: 'Tania' },
  { id: 'B-3300', table: 'T2', items: 4, subtotal: 2860, tax: 286, discount: 143, total: 3003, status: 'open', server: 'Mim' },
  { id: 'B-3299', table: 'T9', items: 3, subtotal: 1450, tax: 145, discount: 0, total: 1595, status: 'paid', server: 'Hasan' },
  { id: 'B-3298', table: 'Takeaway', items: 2, subtotal: 780, tax: 78, discount: 0, total: 858, status: 'paid', server: 'Abdul' },
]

export const mockPayments = [
  { id: 'P-9001', bill: 'B-3299', method: 'Card', amount: 1595, status: 'completed', time: '8:42 PM' },
  { id: 'P-9000', bill: 'B-3298', method: 'bKash', amount: 858, status: 'completed', time: '8:20 PM' },
  { id: 'P-8999', bill: 'B-3290', method: 'Cash', amount: 2240, status: 'completed', time: '7:55 PM' },
  { id: 'P-8998', bill: 'B-3287', method: 'Card', amount: 4980, status: 'refunded', time: '7:10 PM' },
]

export const mockDiscounts = [
  { id: 'd1', name: 'Weekday Lunch 15%', type: 'percentage', value: 15, active: true, usedCount: 412 },
  { id: 'd2', name: 'Gold Member Discount', type: 'percentage', value: 15, active: true, usedCount: 64 },
  { id: 'd3', name: '৳200 Off First Order', type: 'flat', value: 200, active: true, usedCount: 89 },
  { id: 'd4', name: 'New Year Promo', type: 'percentage', value: 20, active: false, usedCount: 1204 },
]

export const mockSalesReport = [
  { month: 'Jan', revenue: 3920000, cost: 1450000 },
  { month: 'Feb', revenue: 3650000, cost: 1380000 },
  { month: 'Mar', revenue: 4120000, cost: 1510000 },
  { month: 'Apr', revenue: 4380000, cost: 1590000 },
  { month: 'May', revenue: 4710000, cost: 1640000 },
  { month: 'Jun', revenue: 4990000, cost: 1710000 },
]

export const mockMenuPerformance = [
  { name: 'Chicken Tikka Biryani', unitsSold: 1240, revenue: 520800, margin: 60 },
  { name: 'Mutton Rezala', unitsSold: 612, revenue: 354960, margin: 58 },
  { name: 'Garlic Naan', unitsSold: 2840, revenue: 170400, margin: 77 },
  { name: 'Mango Lassi', unitsSold: 980, revenue: 127400, margin: 73 },
  { name: 'Paneer Butter Masala', unitsSold: 540, revenue: 183600, margin: 65 },
]

export const mockAnomalyAlerts = [
  { id: 'an1', title: 'Discount usage spike at Counter 2', detail: 'Manual discounts applied 3.2x more than 30-day average during the 7–9 PM window.', severity: 'high', time: '34 min ago' },
  { id: 'an2', title: 'Inventory variance: Basmati Rice', detail: 'Recipe-implied usage and actual depletion differ by 11kg this week.', severity: 'medium', time: '2 hrs ago' },
  { id: 'an3', title: 'Slow ticket times, Kitchen Line B', detail: 'Average fire-to-pass time up 6 minutes versus the weekly baseline.', severity: 'medium', time: '3 hrs ago' },
]

export const mockPromotions = [
  { id: 'pr1', name: 'Friday Biryani Night', channel: 'In-app + SMS', status: 'live', reach: 4200, redemptions: 318 },
  { id: 'pr2', name: 'Bring-a-Friend Weekend', channel: 'Social', status: 'live', reach: 8600, redemptions: 540 },
  { id: 'pr3', name: 'Eid Pre-booking Offer', channel: 'Email', status: 'scheduled', reach: 0, redemptions: 0 },
]
