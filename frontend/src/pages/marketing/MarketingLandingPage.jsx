import { ExternalLink, Eye } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'

export default function MarketingLandingPage() {
  return (
    <div>
      <PageHeader
        title="Landing page"
        description="The public page guests see when they search or scan your QR code."
        actions={
          <button className="btn-secondary">
            <ExternalLink size={14} />
            View live page
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 panel p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink block mb-1.5">Hero headline</label>
            <input type="text" defaultValue="Banglawok Kitchen" className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink block mb-1.5">Tagline</label>
            <input type="text" defaultValue="Home-style Bangladeshi cooking, since 2014" className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink block mb-1.5">Address</label>
            <input type="text" defaultValue="House 12, Road 7, Dhanmondi, Dhaka" className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink block mb-1.5">Hours</label>
            <input type="text" defaultValue="12:00 PM – 11:00 PM, daily" className="input-field" />
          </div>
          <button className="btn-primary w-full">Save changes</button>
        </div>

        <div className="lg:col-span-2 panel p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <Eye size={13} className="text-slate-400" />
            <span className="text-xs text-slate-500">Live preview</span>
          </div>
          <div className="bg-ink p-10 flex flex-col items-center text-center">
            <p className="text-xs tracking-widest text-ticket-orange uppercase mb-3">Now open</p>
            <h2 className="font-display text-3xl font-bold text-paper mb-2">Banglawok Kitchen</h2>
            <p className="text-slate-400 text-sm mb-6">Home-style Bangladeshi cooking, since 2014</p>
            <button className="btn-accent">Reserve a table</button>
            <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-xs text-center">
              <div>
                <p className="stat-mono text-paper font-semibold">4.7</p>
                <p className="text-[11px] text-slate-500">Rating</p>
              </div>
              <div>
                <p className="stat-mono text-paper font-semibold">1.2k+</p>
                <p className="text-[11px] text-slate-500">Reviews</p>
              </div>
              <div>
                <p className="stat-mono text-paper font-semibold">12yr</p>
                <p className="text-[11px] text-slate-500">Serving Dhaka</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
