import React, { useState, useEffect } from 'react';
import {
  useGetFeaturedDishesQuery,
  useCreateFeaturedDishMutation,
  useUpdateFeaturedDishMutation,
  useDeleteFeaturedDishMutation,
  useReorderFeaturedDishesMutation,
} from '../../store/api/cmsApi';
import { useGetItemsQuery } from '../../store/api/itemsApi';
import CmsDataTable from './CmsDataTable';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Badge } from '../ui/Common';
import { FiPlus, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiImage } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

const FeaturedDishesPanel = () => {
  const [filters, setFilters] = useState({ page: 1, per_page: 10, search: '', status: 'all', from_date: '', to_date: '' });
  const { data: response, isLoading, isFetching } = useGetFeaturedDishesQuery(filters);
  const { data: itemsResponse } = useGetItemsQuery({ per_page: 100 });

  const [createFeaturedDish, { isLoading: isCreating }] = useCreateFeaturedDishMutation();
  const [updateFeaturedDish, { isLoading: isUpdating }] = useUpdateFeaturedDishMutation();
  const [deleteFeaturedDish] = useDeleteFeaturedDishMutation();
  const [reorderFeaturedDishes] = useReorderFeaturedDishesMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const menuItems = itemsResponse?.data || [];

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const selectedMenuItemId = watch('menu_item_id');

  // Prepopulate if menu item selected
  useEffect(() => {
    if (selectedMenuItemId && !editingDish) {
      const selected = menuItems.find((item) => item.id === selectedMenuItemId);
      if (selected) {
        setValue('name', selected.name);
        setValue('price', selected.base_price ? `$${selected.base_price}` : '');
        setValue('description', selected.description || '');
        if (selected.image_url) {
          setImagePreview(selected.image_url);
        }
      }
    }
  }, [selectedMenuItemId, menuItems, setValue, editingDish]);

  const openAddModal = () => {
    setEditingDish(null);
    setImagePreview(null);
    reset({
      menu_item_id: '',
      name: '',
      price: '',
      description: '',
      rating: 5.0,
      badge: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (dish) => {
    setEditingDish(dish);
    setImagePreview(dish.image_url || dish.menu_item?.image_url || null);
    reset({
      menu_item_id: dish.menu_item_id || '',
      name: dish.name || '',
      price: dish.price || '',
      description: dish.description || '',
      rating: dish.rating || 5.0,
      badge: dish.badge || '',
      is_active: dish.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDish(null);
    setImagePreview(null);
  };

  const onSubmit = async (values) => {
    const formData = new FormData();
    if (values.menu_item_id) formData.append('menu_item_id', values.menu_item_id);
    formData.append('name', values.name);
    formData.append('price', values.price);
    formData.append('description', values.description);
    formData.append('rating', values.rating);
    formData.append('is_active', values.is_active);
    if (values.badge) formData.append('badge', values.badge);

    if (values.image && values.image[0]) {
      formData.append('image', values.image[0]);
    }

    try {
      if (editingDish) {
        await updateFeaturedDish({ id: editingDish.id, body: formData }).unwrap();
        toast.success('Featured dish updated successfully!');
      } else {
        formData.append('sort_order', response?.data?.length || 0);
        await createFeaturedDish(formData).unwrap();
        toast.success('Featured dish added successfully!');
      }
      handleCloseModal();
    } catch (e) {
      toast.error(e.data?.message || 'Failed to save featured dish');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this featured dish?')) {
      try {
        await deleteFeaturedDish(id).unwrap();
        toast.success('Featured dish removed');
      } catch (e) {
        toast.error(e.data?.message || 'Failed to remove featured dish');
      }
    }
  };

  const handleMove = async (index, direction) => {
    const list = [...(response?.data || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    try {
      await reorderFeaturedDishes({ ids: list.map((item) => item.id) }).unwrap();
      toast.success('Dishes reordered');
    } catch (e) {
      toast.error('Failed to reorder featured dishes');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const columns = [
    {
      key: 'image_url',
      header: 'Dish Image',
      render: (row) => {
        const displayImage = row.image_url || row.menu_item?.image_url || null;
        return (
          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
            {displayImage ? (
              <img src={displayImage} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <FiImage size={18} className="text-slate-400" />
            )}
          </div>
        );
      },
    },
    {
      key: 'name',
      header: 'Dish Details',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800 flex items-center gap-2">
            {row.name}
            {row.badge && (
              <span className="text-3xs uppercase font-extrabold px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                {row.badge}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 max-w-sm cut-text">{row.description}</div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (row) => <span className="font-semibold text-slate-900">{row.price}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => (
        <span className="text-amber-500 font-bold flex items-center gap-1">★ {parseFloat(row.rating).toFixed(1)}</span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.is_active ? 'green' : 'rose'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row, index) => {
        const items = response?.data || [];
        const originalIndex = items.findIndex((item) => item.id === row.id);

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleMove(originalIndex, -1)}
              disabled={originalIndex === 0}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
              title="Move Up"
            >
              <FiArrowUp size={16} />
            </button>
            <button
              onClick={() => handleMove(originalIndex, 1)}
              disabled={originalIndex === items.length - 1}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
              title="Move Down"
            >
              <FiArrowDown size={16} />
            </button>
            <button onClick={() => openEditModal(row)} className="p-1.5 hover:bg-slate-100 rounded text-accent" title="Edit">
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 hover:bg-slate-100 rounded text-rose-500"
              title="Delete"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <CmsDataTable
        columns={columns}
        data={response?.data || []}
        isLoading={isLoading}
        isFetching={isFetching}
        meta={response?.meta}
        filters={filters}
        onFilterChange={setFilters}
        actions={
          <button onClick={openAddModal} className="btn-accent flex items-center gap-2 text-sm ml-auto">
            <FiPlus /> Add Featured Dish
          </button>
        }
      />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">
                  {editingDish ? 'Edit Featured Dish' : 'Add Featured Dish'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Select Live Menu Item */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Link Live Menu Item (Optional)</label>
                    <select
                      className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm"
                      {...register('menu_item_id')}
                    >
                      <option value="">-- Standalone Item --</option>
                      {menuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.price ? `$${item.price}` : 'No Price'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rating */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Rating Rating Score</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      required
                      className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                      {...register('rating', { required: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Dish Display Name</label>
                    <input
                      type="text"
                      required
                      className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="e.g. Signature Smoked Illish"
                      {...register('name', { required: true })}
                    />
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Display Price</label>
                    <input
                      type="text"
                      required
                      className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="e.g. $18.50"
                      {...register('price', { required: true })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Short Description</label>
                  <textarea
                    rows={2}
                    required
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                    placeholder="Brief description of the signature featured item..."
                    {...register('description', { required: true })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Badge */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Display Badge (Optional)</label>
                    <select
                      className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm"
                      {...register('badge')}
                    >
                      <option value="">No Badge</option>
                      <option value="BESTSELLER">Bestseller</option>
                      <option value="CHEF'S SIGNATURE">Chef's Signature</option>
                      <option value="NEW">New Dish</option>
                      <option value="SEASONAL">Seasonal</option>
                    </select>
                  </div>

                  {/* Image Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Custom Display Image</label>
                    <div className="flex items-center gap-4">
                      {imagePreview && (
                        <div className="w-12 h-12 rounded overflow-hidden border">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent file:cursor-pointer"
                        {...register('image')}
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="checkbox-dish-is-active"
                    className="w-4.5 h-4.5 border border-slate-200 rounded text-accent focus:ring-accent"
                    {...register('is_active')}
                  />
                  <label htmlFor="checkbox-dish-is-active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Is Active & Visible
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="btn-accent px-5 py-2 font-semibold flex items-center gap-2"
                  >
                    {isCreating || isUpdating ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : null}
                    Save Dish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeaturedDishesPanel;
