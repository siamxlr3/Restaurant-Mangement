import { useState, useMemo, useCallback } from 'react'
import { useGetPosMenuQuery } from '../../store/api/ordersApi'
import { RiSearchLine } from 'react-icons/ri'
import { useDebounce } from '../../hooks/useDebounce'

function MenuItemSkeleton() {
  return (
    <div className="panel p-3.5 animate-pulse">
      <div className="w-12 h-12 bg-slate-100 rounded-lg mb-3" />
      <div className="h-3.5 bg-slate-100 rounded w-4/5 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
  )
}

/**
 * MenuGrid — searchable category-filtered menu item grid.
 * Props:
 *   onSelectItem (fn) — called with menu item object when clicked
 */
export default function MenuGrid({ onSelectItem }) {
  const { data: items = [], isLoading } = useGetPosMenuQuery()
  const [query, setQuery]               = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const debouncedQuery = useDebounce(query, 300)

  const categories = useMemo(() => {
    const names = [...new Set(items.map((i) => i.menu_category?.name).filter(Boolean))]
    return ['All', ...names]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat  = activeCategory === 'All' || item.menu_category?.name === activeCategory
      const matchQ    = item.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      return matchCat && matchQ
    })
  }, [items, activeCategory, debouncedQuery])

  const handleSelect = useCallback((item) => onSelectItem(item), [onSelectItem])

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu items…"
          className="input-field pl-9 w-full"
        />
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-ink text-paper shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <MenuItemSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No menu items match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              disabled={!item.is_available}
              className={`panel p-3.5 text-left transition-all duration-200 group ${
                item.is_available
                  ? 'hover:border-ticket-orange hover:shadow-card cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                />
              ) : (
                <div className="w-full h-20 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg mb-2 flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}
              <p className="text-sm font-semibold text-ink leading-snug line-clamp-2">{item.name}</p>
              <p className="stat-mono text-sm text-ticket-orange font-semibold mt-1">
                ৳{parseFloat(item.base_price).toLocaleString('en-IN')}
              </p>
              {!item.is_available && (
                <span className="text-xs text-rose-500 font-medium">Unavailable</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
