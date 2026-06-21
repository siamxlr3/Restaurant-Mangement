import PageHeader from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/Common'

const data = [
  { name: 'Chicken Tikka Biryani', unitsSold: 1240, revenue: 520800, margin: 60 },
  { name: 'Mutton Rezala', unitsSold: 612, revenue: 354960, margin: 58 },
  { name: 'Garlic Naan', unitsSold: 2840, revenue: 170400, margin: 77 },
  { name: 'Mango Lassi', unitsSold: 980, revenue: 127400, margin: 73 },
  { name: 'Paneer Butter Masala', unitsSold: 540, revenue: 183600, margin: 65 },
]

export default function MenuPerformanceReport() {
  const columns = [
    { key: 'name', header: 'Item', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'unitsSold', header: 'Units sold', render: (r) => <span className="stat-mono">{r.unitsSold.toLocaleString('en-IN')}</span> },
    { key: 'revenue', header: 'Revenue', render: (r) => <span className="stat-mono font-semibold">৳{r.revenue.toLocaleString('en-IN')}</span> },
    {
      key: 'margin',
      header: 'Margin',
      render: (r) => (
        <div className="flex items-center gap-2 w-28">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-pass-green rounded-full" style={{ width: `${r.margin}%` }} />
          </div>
          <span className="stat-mono text-xs text-slate-500">{r.margin}%</span>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Menu performance" description="Top-selling dishes this month, ranked by revenue." />
      <div className="panel">
        <DataTable columns={columns} data={data} rowKey="name" />
      </div>
    </div>
  )
}
