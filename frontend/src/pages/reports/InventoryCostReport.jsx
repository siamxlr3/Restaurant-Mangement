import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

const data = [
  { name: 'Meat & seafood', value: 42 },
  { name: 'Dairy & ghee', value: 18 },
  { name: 'Produce', value: 16 },
  { name: 'Grains & rice', value: 14 },
  { name: 'Spices & other', value: 10 },
]

const colors = ['#FF5A1F', '#F5A623', '#1F8A5F', '#3F4147', '#A9ABB3']

export default function InventoryCostReport() {
  return (
    <div>
      <PageHeader title="Inventory cost" description="Where food cost is going this month." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total COGS this month" value={1710000} prefix="৳" delta={4.3} trend="up" />
        <StatCard label="Food cost %" value={32.1} suffix="%" delta={-1.2} trend="down" />
        <StatCard label="Waste/spoilage" value={38400} prefix="৳" delta={6.7} trend="up" />
      </div>

      <div className="panel p-5">
        <h2 className="font-display font-semibold text-ink mb-4">Cost by category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
