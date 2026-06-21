import { DollarSign, ShoppingBag, Receipt, RefreshCcw, Sparkles } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import AIInsightCard from '../../components/ui/AIInsightCard'
import { Spinner } from '../../components/ui/Common'
import {
  useGetKPIsQuery,
  useGetAIInsightsQuery,
  useGetRevenueTrendQuery,
  useGetOrderSourceSplitQuery,
} from '../../store/api/dashboardApi'

const kpiIcons = { revenue: DollarSign, orders: ShoppingBag, avgTicket: Receipt, tableTurns: RefreshCcw }
const sourceColors = ['#FF5A1F', '#1F8A5F', '#F5A623']

export default function DashboardOverview() {
  const { data: kpis, isLoading: kpisLoading } = useGetKPIsQuery()
  const { data: insights, isLoading: insightsLoading } = useGetAIInsightsQuery()
  const { data: trend, isLoading: trendLoading } = useGetRevenueTrendQuery()
  const { data: split, isLoading: splitLoading } = useGetOrderSourceSplitQuery()

  return (
    <div>
      <PageHeader
        title="Good evening, Maliha"
        description="Here's how Banglawok Kitchen is tracking right now."
        actions={
          <button className="btn-secondary">
            <RefreshCcw size={14} />
            Refresh
          </button>
        }
      />

      {kpisLoading ? (
        <Spinner label="Loading today's numbers…" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi) => (
            <StatCard key={kpi.id} {...kpi} icon={kpiIcons[kpi.id]} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="panel p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink">Revenue, last 7 days</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-ticket-orange inline-block" /> This week
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Last week
              </span>
            </div>
          </div>
          {trendLoading ? (
            <Spinner />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A1F" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEDE6" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#83858F' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#83858F' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  formatter={(v) => `৳${v.toLocaleString('en-IN')}`}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E9E9EB',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="lastWeek"
                  stroke="#D3D4D8"
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF5A1F"
                  strokeWidth={2.5}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="font-display font-semibold text-ink mb-4">Order source split</h2>
          {splitLoading ? (
            <Spinner />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={split}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {split.map((entry, i) => (
                      <Cell key={entry.name} fill={sourceColors[i % sourceColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {split.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: sourceColors[i % sourceColors.length] }}
                      />
                      {s.name}
                    </span>
                    <span className="stat-mono font-medium text-ink">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={17} className="text-ticket-orange" />
          <h2 className="font-display font-semibold text-ink">AI insight cards</h2>
          <span className="text-xs text-slate-400">Updated 4 minutes ago</span>
        </div>
        {insightsLoading ? (
          <Spinner label="Generating insights…" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {insights.map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
