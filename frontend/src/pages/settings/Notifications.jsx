import PageHeader from '../../components/ui/PageHeader'

function Toggle({ defaultOn = false }) {
  return (
    <button className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${defaultOn ? 'bg-ticket-orange' : 'bg-slate-200'}`}>
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-card transition-all ${defaultOn ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  )
}

const groups = [
  {
    title: 'Operations',
    items: [
      { name: 'New reservation', on: true },
      { name: 'Waitlist guest notified', on: true },
      { name: 'Kitchen ticket overdue (15+ min)', on: true },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { name: 'Stock below par level', on: true },
      { name: 'Purchase order delivered', on: false },
      { name: 'AI reorder suggestion ready', on: true },
    ],
  },
  {
    title: 'Reports & alerts',
    items: [
      { name: 'Daily sales summary', on: true },
      { name: 'Anomaly alert raised', on: true },
      { name: 'Weekly performance digest', on: false },
    ],
  },
]

export default function Notifications() {
  return (
    <div>
      <PageHeader title="Notifications" description="Choose what triggers an alert, and where it's sent." />

      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.title}>
            <h2 className="font-display font-semibold text-ink mb-2 text-sm">{g.title}</h2>
            <div className="panel divide-y divide-slate-50">
              {g.items.map((item) => (
                <div key={item.name} className="flex items-center gap-4 px-5 py-3.5">
                  <p className="text-sm text-ink flex-1">{item.name}</p>
                  <Toggle defaultOn={item.on} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
