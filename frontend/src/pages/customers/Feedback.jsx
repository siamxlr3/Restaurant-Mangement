import { Star, Sparkles } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Badge, Spinner } from '../../components/ui/Common'
import { useGetFeedbackQuery } from '../../store/api/customersApi'

const sentimentTone = { positive: 'green', negative: 'rose', mixed: 'amber' }

export default function Feedback() {
  const { data, isLoading } = useGetFeedbackQuery()

  return (
    <div>
      <PageHeader
        title="Feedback"
        description="Guest reviews with AI-scored sentiment, pulled from POS receipts and surveys."
      />

      {isLoading ? (
        <Spinner label="Scoring sentiment…" />
      ) : (
        <div className="space-y-3">
          {data.map((f) => (
            <div key={f.id} className="panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-semibold text-sm text-ink">{f.customer}</p>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < f.rating ? 'text-amber-signal fill-amber-signal' : 'text-slate-200 fill-slate-200'}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.comment}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge tone={sentimentTone[f.sentiment]}>{f.sentiment}</Badge>
                  <p className="text-xs text-slate-400 mt-1.5">{f.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                <Sparkles size={12} className="text-ticket-orange" />
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[140px]">
                  <div
                    className={`h-full rounded-full ${
                      f.sentiment === 'positive'
                        ? 'bg-pass-green'
                        : f.sentiment === 'negative'
                          ? 'bg-rose-signal'
                          : 'bg-amber-signal'
                    }`}
                    style={{ width: `${f.sentimentScore * 100}%` }}
                  />
                </div>
                <span className="stat-mono text-xs text-slate-400">
                  {Math.round(f.sentimentScore * 100)}% sentiment score
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
