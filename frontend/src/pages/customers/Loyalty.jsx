import { Award } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Common'
import { useGetLoyaltyTiersQuery } from '../../store/api/customersApi'

const tierColors = {
  Bronze: 'border-amber-800/30 bg-amber-50',
  Silver: 'border-slate-300 bg-slate-50',
  Gold: 'border-amber-signal/40 bg-amber-signal/10',
  Platinum: 'border-ticket-orange/40 bg-ticket-orangeDim',
}

export default function Loyalty() {
  const { data, isLoading } = useGetLoyaltyTiersQuery()

  return (
    <div>
      <PageHeader title="Loyalty" description="Membership tiers and the perks tied to each one." />

      {isLoading ? (
        <Spinner label="Loading loyalty program…" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.map((t) => (
            <div key={t.tier} className={`rounded-lg border-2 p-5 ${tierColors[t.tier]}`}>
              <Award size={20} className="text-ink/70 mb-3" />
              <p className="font-display font-bold text-lg text-ink">{t.tier}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.threshold === 0 ? 'Entry tier' : `From ৳${t.threshold.toLocaleString('en-IN')} lifetime spend`}
              </p>
              <p className="stat-mono text-2xl font-semibold text-ink mt-4">{t.members}</p>
              <p className="text-xs text-slate-400">members</p>
              <p className="text-sm text-ink mt-3 pt-3 border-t border-ink/10">{t.perk}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
