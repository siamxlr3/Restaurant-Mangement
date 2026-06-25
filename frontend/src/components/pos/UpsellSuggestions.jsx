import React from 'react'
import { useGetRecommendationsQuery } from '../../store/api/upsellApi'
import { RiMagicLine, RiAddLine } from 'react-icons/ri'

/**
 * Component to show "Customers also ordered" suggestions for a given item.
 */
export default function UpsellSuggestions({ itemId, onAdd }) {
  const { data: recommendations, isLoading } = useGetRecommendationsQuery(itemId, {
    skip: !itemId,
  })

  if (isLoading || !recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <div className="flex items-center gap-2 mb-3 text-slate-600">
        <RiMagicLine className="text-ticket-orange" size={18} />
        <span className="text-xs font-bold uppercase tracking-wider">Customers also ordered...</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recommendations.map((item) => (
          <div 
            key={item.itemId}
            className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-ticket-orange transition-colors group"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <RiMagicLine size={20} />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                <p className="text-xs text-slate-500">${item.base_price}</p>
              </div>
            </div>
            
            <button 
              onClick={() => onAdd({ 
                menu_item_id: item.id, 
                quantity: 1, 
                unit_price: item.base_price,
                modifiers: []
              })}
              className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:bg-ticket-orange hover:text-white transition-colors"
              title="Add to order"
            >
              <RiAddLine size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
