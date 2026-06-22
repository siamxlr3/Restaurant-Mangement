import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiCheck } from 'react-icons/fi';
import { Spinner } from '../ui/Common';
import { useGetItemsQuery } from '../../store/api/itemsApi';

const modifierSchema = z.object({
  item_id: z.string().uuid('Please select an item'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  extra_price: z.preprocess((val) => parseFloat(val), z.number().min(0, 'Min price is 0')),
  is_required: z.boolean().default(false),
});

const ModifierForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const { data: items } = useGetItemsQuery({ per_page: 100 });
  const isEdit = !!initialData;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(modifierSchema),
    defaultValues: initialData || {
      item_id: '',
      name: '',
      extra_price: 0,
      is_required: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Menu Item</label>
          <select 
            {...register('item_id')} 
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.item_id ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
          >
            <option value="">Select an item...</option>
            {items?.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {errors.item_id && <p className="text-xs text-rose-500">{errors.item_id.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Modifier Name</label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. Extra Cheese"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
          />
          {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Extra Price (৳)</label>
          <input
            type="number"
            step="0.01"
            {...register('extra_price')}
            placeholder="0.00"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.extra_price ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
          />
          {errors.extra_price && <p className="text-xs text-rose-500">{errors.extra_price.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <input
          type="checkbox"
          id="is_required"
          {...register('is_required')}
          className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
        />
        <label htmlFor="is_required" className="text-sm text-ink">
          Required for selection
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-6 py-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="btn-accent px-8 py-2 min-w-[150px] flex items-center justify-center gap-2"
        >
          {isLoading ? <Spinner size="sm" /> : isEdit ? <><FiCheck /> Update Modifier</> : 'Create Modifier'}
        </button>
      </div>
    </form>
  );
};

export default ModifierForm;

