import PageHeader from '../../components/ui/PageHeader'

export default function GeneralSettings() {
  return (
    <div>
      <PageHeader title="General" description="Basic information about your restaurant." />

      <div className="panel p-6 max-w-2xl space-y-5">
        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Restaurant name</label>
          <input type="text" defaultValue="Banglawok Kitchen" className="input-field" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Contact email</label>
          <input type="email" defaultValue="hello@banglawokkitchen.com" className="input-field" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Phone number</label>
          <input type="text" defaultValue="+880 2 9551234" className="input-field stat-mono" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink block mb-1.5">Currency</label>
            <select className="input-field">
              <option>BDT (৳)</option>
              <option>USD ($)</option>
              <option>INR (₹)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink block mb-1.5">Timezone</label>
            <select className="input-field">
              <option>Asia/Dhaka (GMT+6)</option>
              <option>Asia/Kolkata (GMT+5:30)</option>
            </select>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100">
          <button className="btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  )
}
