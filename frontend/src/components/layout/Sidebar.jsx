import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChefHat, ChevronDown } from 'lucide-react'
import { navSections } from '../../routes/navConfig'

export default function Sidebar() {
  const location = useLocation()
  const [openSections, setOpenSections] = useState(() => {
    const active = navSections.find((s) => location.pathname.startsWith('/' + s.id))
    return active ? { [active.id]: true } : { operations: true }
  })

  useEffect(() => {
    const active = navSections.find((s) => location.pathname.startsWith('/' + s.id))
    if (active) {
      setOpenSections((prev) => ({ ...prev, [active.id]: true }))
    }
  }, [location.pathname])

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="w-64 shrink-0 bg-ink flex flex-col h-screen sticky top-0 border-r border-ink-border">
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-ink-border shrink-0">
        <div className="w-8 h-8 rounded-md bg-ticket-orange flex items-center justify-center shrink-0">
          <ChefHat size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-display font-semibold text-paper text-sm">Pass</p>
          <p className="text-[11px] text-slate-500">Banglawok Kitchen</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navSections.map((section) => {
          const Icon = section.icon
          const hasChildren = !!section.children
          const isSectionActive = location.pathname.startsWith('/' + section.id)
          const isOpen = openSections[section.id]

          if (!hasChildren) {
            return (
              <NavLink
                key={section.id}
                to={section.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} />
                {section.label}
              </NavLink>
            )
          }

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`nav-link w-full justify-between ${isSectionActive ? 'active' : ''}`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={17} />
                  {section.label}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="mt-0.5 ml-[1.65rem] pl-2.5 border-l border-ink-border space-y-0.5">
                  {section.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'text-paper bg-white/10'
                            : 'text-slate-400 hover:text-paper hover:bg-white/5'
                        }`
                      }
                    >
                      {child.label}
                      {child.badge && (
                        <span className="text-[9px] font-bold tracking-wide text-ticket-orange bg-ticket-orange/15 px-1.5 py-0.5 rounded">
                          {child.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-3 border-t border-ink-border shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-paper">
            MR
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-paper">Maliha Rahman</p>
            <p className="text-[11px] text-slate-500">General Manager</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
