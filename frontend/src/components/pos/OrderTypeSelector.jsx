import { RiStore2Line, RiEBike2Line, RiRestaurantLine } from 'react-icons/ri'

const TYPES = [
  { value: 'dine-in',   label: 'Dine-in',   icon: RiRestaurantLine },
  { value: 'takeaway',  label: 'Takeaway',   icon: RiStore2Line },
  { value: 'delivery',  label: 'Delivery',   icon: RiEBike2Line },
]

/**
 * OrderTypeSelector — pill toggle for dine-in / takeaway / delivery.
 * Props:
 *   value    (string) — current type
 *   onChange (fn)     — callback with new type string
 */
export default function OrderTypeSelector({ value, onChange }) {
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1">
      {TYPES.map(({ value: type, label, icon: Icon }) => {
        const active = value === type
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              active
                ? 'bg-white text-ink shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon size={15} className={active ? 'text-ticket-orange' : ''} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
