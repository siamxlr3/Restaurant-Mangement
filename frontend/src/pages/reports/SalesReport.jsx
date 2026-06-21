import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

const data = [
  { month: 'Jan', revenue: 3920000, cost: 1450000 },
  { month: 'Feb', revenue: 3650000, cost: 1380000 },
  { month: 'Mar', revenue: 4120000, cost: 1510000 },
  { month: 'Apr', revenue: 4380000, cost: 1590000 },
  { month: 'May', revenue: 4710000, cost: 1640000 },
  { month: 'Jun', revenue: 4990000, cost: 1710000 },
]

export default function SalesReport() {
  return (
    <div>
      <PageHeader title="Sales report" description="Revenue and cost of goods sold, last 6 months." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total revenue (6mo)" value={25770000} prefix="৳" delta={14.2} trend="up" />
        <StatCard label="Total COGS (6mo)" value={9280000} prefix="৳" delta={9.8} trend="up" />
        <StatCard label="Avg. gross margin" value={64} suffix="%" delta={1.4} trend="up" />
      </div>

      <div className="panel p-5">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEDE6" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#83858F' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#83858F' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000000}M`}
            />
            <Tooltip
              formatter={(v) => `৳${v.toLocaleString('en-IN')}`}
              contentStyle={{ fontSize: 12, borderRadius: 8, fontFamily: 'JetBrains Mono, monospace' }}
            />
            <Bar dataKey="revenue" name="Revenue" fill="#FF5A1F" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cost" name="COGS" fill="#D3D4D8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
