import PageHeader from '../../components/ui/PageHeader'

export default function TaxSettings() {
  return (
    <div>
      <PageHeader title="Tax settings" description="Configure how tax is calculated and displayed on bills." />

      <div className="panel p-6 max-w-2xl space-y-5">
        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Default VAT rate</label>
          <div className="relative max-w-xs">
            <input type="text" defaultValue="10" className="input-field pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Service charge</label>
          <div className="relative max-w-xs">
            <input type="text" defaultValue="5" className="input-field pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Tax registration number</label>
          <input type="text" defaultValue="BIN-7741-2209-AX" className="input-field max-w-xs stat-mono" />
        </div>

        <div className="flex items-center justify-between max-w-xs pt-2">
          <div>
            <p className="text-sm font-medium text-ink">Tax-inclusive pricing</p>
            <p className="text-xs text-slate-400 mt-0.5">Show menu prices with tax already included</p>
          </div>
          <button className="w-11 h-6 rounded-full bg-slate-200 relative shrink-0">
            <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-card" />
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button className="btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  )
}
