import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'

const forecastData = [
  { day: 'Mon', actual: 198, forecast: 205 },
  { day: 'Tue', actual: 184, forecast: 190 },
  { day: 'Wed', actual: 212, forecast: 208 },
  { day: 'Thu', actual: 231, forecast: 225 },
  { day: 'Fri', actual: null, forecast: 312 },
  { day: 'Sat', actual: null, forecast: 348 },
  { day: 'Sun', actual: null, forecast: 286 },
]

const itemForecast = [
  { item: 'Chicken Tikka Biryani', expected: 142, vsAvg: 18 },
  { item: 'Beef Tehari', expected: 96, vsAvg: 6 },
  { item: 'Garlic Butter Prawns', expected: 58, vsAvg: -9 },
  { item: 'Mutton Rezala', expected: 71, vsAvg: 4 },
]

export default function DemandForecast() {
  return (
    <div>
      <PageHeader
        title="Demand forecast"
        description="Projected covers and dish-level demand for the week ahead, based on historical patterns, weather, and local events."
      />

      <div className="panel p-5 mb-6">
        <h2 className="font-display font-semibold text-ink mb-4">Covers: actual vs. forecast</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={forecastData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEDE6" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#83858F' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#83858F' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, fontFamily: 'JetBrains Mono, monospace' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="actual" name="Actual" fill="#15171C" radius={[3, 3, 0, 0]} />
            <Bar dataKey="forecast" name="Forecast" fill="#FF5A1F" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel p-5">
        <h2 className="font-display font-semibold text-ink mb-1">This Friday — dish-level forecast</h2>
        <p className="text-xs text-slate-400 mb-4">Expected units vs. this dish's typical Friday average</p>
        <div className="space-y-3">
          {itemForecast.map((f) => (
            <div key={f.item} className="flex items-center gap-4">
              <p className="text-sm text-ink w-48 shrink-0">{f.item}</p>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ticket-orange rounded-full"
                  style={{ width: `${Math.min(100, (f.expected / 160) * 100)}%` }}
                />
              </div>
              <span className="stat-mono text-sm font-semibold text-ink w-10 text-right">{f.expected}</span>
              <span className={`stat-mono text-xs w-14 text-right ${f.vsAvg >= 0 ? 'text-pass-green' : 'text-rose-signal'}`}>
                {f.vsAvg >= 0 ? '+' : ''}
                {f.vsAvg}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
