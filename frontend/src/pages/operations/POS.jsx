import { useState, useMemo } from 'react'
import { Search, Trash2, Minus, Plus, CreditCard } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Common'
import { useGetPosMenuQuery } from '../../store/api/operationsApi'
import { useGetCategoriesQuery } from '../../store/api/menuApi'

export default function POS() {
  const { data: items, isLoading } = useGetPosMenuQuery()
  const { data: categories } = useGetCategoriesQuery()
  const [activeCategory, setActiveCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [query, setQuery] = useState('')

  const filteredItems = useMemo(() => {
    if (!items) return []
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase())
      return matchesCategory && matchesQuery
    })
  }, [items, activeCategory, query])

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    )
  }

  const removeItem = (id) => setCart((prev) => prev.filter((c) => c.id !== id))

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + tax

  return (
    <div>
      <PageHeader title="Point of Sale" description="Build an order and send it straight to the kitchen line." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu items…"
                className="input-field pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {['All', ...(categories?.map((c) => c.name) || [])].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-ink text-paper'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <Spinner label="Loading menu…" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="panel p-3.5 text-left hover:border-ticket-orange hover:shadow-card transition-all"
                >
                  <div className="text-2xl mb-2">{item.image}</div>
                  <p className="text-sm font-semibold text-ink leading-snug">{item.name}</p>
                  <p className="stat-mono text-sm text-ticket-orange font-semibold mt-1">৳{item.price}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5 flex flex-col h-fit lg:sticky lg:top-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink">Current order</h2>
            <span className="badge badge-slate">Table T2</span>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Tap a menu item to add it to the order.</p>
          ) : (
            <div className="space-y-3 mb-4 max-h-[360px] overflow-y-auto pr-1">
              {cart.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                    <p className="stat-mono text-xs text-slate-400">৳{c.price} each</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQty(c.id, -1)}
                      className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="stat-mono text-sm w-5 text-center">{c.qty}</span>
                    <button
                      onClick={() => updateQty(c.id, 1)}
                      className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(c.id)}
                    className="text-slate-300 hover:text-rose-signal shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span className="stat-mono">৳{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax (10%)</span>
              <span className="stat-mono">৳{tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink pt-1">
              <span>Total</span>
              <span className="stat-mono">৳{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className="btn-secondary">Send to kitchen</button>
            <button className="btn-accent">
              <CreditCard size={15} />
              Charge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
