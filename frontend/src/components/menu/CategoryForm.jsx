import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiCheck } from 'react-icons/fi';
import { Spinner } from '../ui/Common';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  sort_order: z.preprocess((val) => parseInt(val), z.number().int().min(0)).optional(),
  is_active: z.boolean().default(true),
});

const CategoryForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData || {
      name: '',
      sort_order: 0,
      is_active: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Category Name</label>
          <input
            {...register('name')}
            type="text"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
            placeholder="e.g. Appetizers"
          />
          {errors.name && (
            <p className="text-xs text-rose-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Sort Order</label>
          <input
            {...register('sort_order')}
            type="number"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.sort_order ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
          />
          {errors.sort_order && (
            <p className="text-xs text-rose-500">{errors.sort_order.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <input
          {...register('is_active')}
          type="checkbox"
          id="is_active"
          className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
        />
        <label htmlFor="is_active" className="text-sm text-ink">
          Set as active and visible on POS/Menu
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-accent px-8 py-2 min-w-[120px] flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : initialData ? (
            <>
              <FiCheck /> Update Category
            </>
          ) : (
            'Create Category'
          )}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
