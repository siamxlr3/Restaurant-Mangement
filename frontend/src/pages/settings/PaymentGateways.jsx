import { Badge } from '../../components/ui/Common'
import PageHeader from '../../components/ui/PageHeader'

const gateways = [
  { id: 'g1', name: 'bKash', description: 'Mobile financial service', connected: true },
  { id: 'g2', name: 'Nagad', description: 'Mobile financial service', connected: true },
  { id: 'g3', name: 'Visa / Mastercard', description: 'Card payments via SSLCOMMERZ', connected: true },
  { id: 'g4', name: 'Cash', description: 'Manual cash drawer reconciliation', connected: true },
  { id: 'g5', name: 'Rocket', description: 'Mobile financial service', connected: false },
]

export default function PaymentGateways() {
  return (
    <div>
      <PageHeader title="Payment gateways" description="Manage which payment methods are accepted at checkout." />

      <div className="panel divide-y divide-slate-50">
        {gateways.map((g) => (
          <div key={g.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
              {g.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{g.name}</p>
              <p className="text-xs text-slate-400">{g.description}</p>
            </div>
            <Badge tone={g.connected ? 'green' : 'slate'}>{g.connected ? 'Connected' : 'Not connected'}</Badge>
            <button className={g.connected ? 'btn-secondary' : 'btn-accent'}>
              {g.connected ? 'Configure' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
