import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { Spinner } from '../ui/Common';

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(150, 'Name too long'),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
  base_price: z.preprocess((val) => parseFloat(val), z.number().min(0, 'Price must be positive')),
  food_cost: z.preprocess((val) => parseFloat(val), z.number().min(0, 'Cost must be positive')).optional().or(z.literal(0)),
  is_available: z.boolean().default(true),
});

const ItemForm = ({ initialData, categories = [], onSubmit, onCancel, isLoading }) => {
  const [preview, setPreview] = useState(initialData?.image_url || null);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: initialData || {
      name: '',
      category_id: '',
      description: '',
      base_price: 0,
      food_cost: 0,
      is_available: true,
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  const onFormSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Item Image</label>
          <div 
            className={`relative group border-2 border-dashed rounded-xl transition-all ${
              preview ? 'border-transparent' : 'border-slate-200 hover:border-accent/40 bg-slate-50/50'
            } aspect-square flex flex-col items-center justify-center overflow-hidden`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100 group-hover:text-accent transition-colors">
                  <FiUpload size={24} />
                </div>
                <p className="text-xs font-medium mt-2">Click to upload image</p>
                <p className="text-[10px]">JPG, PNG or WebP (max 5MB)</p>
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Basic Info */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">Item Name *</label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Classic Burger"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
            />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">Category *</label>
            <select
              {...register('category_id')}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.category_id ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-rose-500">{errors.category_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-ink">Base Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">৳</span>
                <input
                  {...register('base_price')}
                  type="number"
                  step="0.01"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.base_price ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
                />
              </div>
              {errors.base_price && <p className="text-xs text-rose-500">{errors.base_price.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-ink">Food Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">৳</span>
                <input
                  {...register('food_cost')}
                  type="number"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-ink">Description</label>
        <textarea
          {...register('description')}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all min-h-[100px]"
          placeholder="Describe your dish..."
        />
        {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
      </div>

      <div className="flex items-center gap-2 py-2">
        <input
          {...register('is_available')}
          type="checkbox"
          id="item_is_available"
          className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
        />
        <label htmlFor="item_is_available" className="text-sm text-ink font-medium">
          Set as available on POS and Online Menu
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
              <FiCheck /> Update Item
            </>
          ) : (
            'Create Item'
          )}
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
