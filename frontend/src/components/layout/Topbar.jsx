import { Search, Bell, Plus } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { navSections } from '../../routes/navConfig'

function getBreadcrumb(pathname) {
  for (const section of navSections) {
    if (section.children) {
      const child = section.children.find((c) => c.path === pathname)
      if (child) return { section: section.label, page: child.label }
    } else if (section.path === pathname) {
      return { section: section.label, page: null }
    }
  }
  return { section: 'Pass', page: null }
}

export default function Topbar() {
  const location = useLocation()
  const { section, page } = getBreadcrumb(location.pathname)

  return (
    <header className="h-16 shrink-0 border-b border-slate-100 bg-paper-card/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-6 gap-4">
      <div className="text-sm">
        <span className="text-slate-400">{section}</span>
        {page && (
          <>
            <span className="text-slate-300 mx-1.5">/</span>
            <span className="text-ink font-medium">{page}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders, items, staff…"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 bg-slate-50/60 text-sm placeholder:text-slate-400 focus:bg-white focus:border-ticket-orange transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button className="btn-secondary !px-3">
          <Bell size={16} />
        </button>
        <button className="btn-accent">
          <Plus size={16} />
          New order
        </button>
      </div>
    </header>
  )
}
