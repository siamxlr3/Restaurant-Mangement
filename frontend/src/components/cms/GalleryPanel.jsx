import React, { useState } from 'react';
import {
  useGetGalleryItemsQuery,
  useCreateGalleryItemMutation,
  useUpdateGalleryItemMutation,
  useDeleteGalleryItemMutation,
  useReorderGalleryItemsMutation,
} from '../../store/api/cmsApi';
import CmsDataTable from './CmsDataTable';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Badge } from '../ui/Common';
import { FiPlus, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiImage } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

const GalleryPanel = () => {
  const [filters, setFilters] = useState({ page: 1, per_page: 10, search: '', status: 'all', from_date: '', to_date: '' });
  const { data: response, isLoading, isFetching } = useGetGalleryItemsQuery(filters);

  const [createGalleryItem, { isLoading: isCreating }] = useCreateGalleryItemMutation();
  const [updateGalleryItem, { isLoading: isUpdating }] = useUpdateGalleryItemMutation();
  const [deleteGalleryItem] = useDeleteGalleryItemMutation();
  const [reorderGalleryItems] = useReorderGalleryItemsMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const openAddModal = () => {
    setEditingItem(null);
    setImagePreview(null);
    reset({ category: 'Kitchen', caption: '', is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setImagePreview(item.image_url);
    reset({
      category: item.category || 'Kitchen',
      caption: item.caption || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setImagePreview(null);
  };

  const onSubmit = async (values) => {
    const formData = new FormData();
    formData.append('category', values.category);
    formData.append('caption', values.caption);
    formData.append('is_active', values.is_active);

    if (values.image && values.image[0]) {
      formData.append('image', values.image[0]);
    }

    try {
      if (editingItem) {
        await updateGalleryItem({ id: editingItem.id, body: formData }).unwrap();
        toast.success('Gallery item updated successfully!');
      } else {
        formData.append('sort_order', response?.data?.length || 0);
        await createGalleryItem(formData).unwrap();
        toast.success('Gallery item added successfully!');
      }
      handleCloseModal();
    } catch (e) {
      toast.error(e.data?.message || 'Failed to save gallery item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this gallery item?')) {
      try {
        await deleteGalleryItem(id).unwrap();
        toast.success('Gallery item deleted');
      } catch (e) {
        toast.error(e.data?.message || 'Failed to delete gallery item');
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
      await reorderGalleryItems({ ids: list.map((item) => item.id) }).unwrap();
      toast.success('Gallery items reordered');
    } catch (e) {
      toast.error('Failed to reorder gallery items');
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
      header: 'Photo',
      render: (row) => (
        <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
          {row.image_url ? (
            <img src={row.image_url} alt={row.category} className="w-full h-full object-cover" />
          ) : (
            <FiImage size={18} className="text-slate-400" />
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 uppercase">
          {row.category}
        </span>
      ),
    },
    {
      key: 'caption',
      header: 'Caption',
      render: (row) => <span className="text-slate-700">{row.caption || 'No caption'}</span>,
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
            <FiPlus /> Add Gallery Photo
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
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">
                  {editingItem ? 'Edit Gallery Photo' : 'Add Gallery Photo'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Category */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Category</label>
                    <select
                      className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm"
                      {...register('category')}
                    >
                      <option value="Kitchen">Kitchen & Cooking</option>
                      <option value="Plates">Plates & Signature Dishes</option>
                      <option value="Dining Room">Dining Room & Ambience</option>
                      <option value="Events">Events & Special Occasions</option>
                    </select>
                  </div>

                  {/* Image Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Photo Image</label>
                    <div className="flex items-center gap-3">
                      {imagePreview && (
                        <div className="w-12 h-12 rounded overflow-hidden border">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        required={!editingItem}
                        className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent file:cursor-pointer"
                        {...register('image')}
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Caption / Description</label>
                  <input
                    type="text"
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="e.g. Traditional clay-oven baking process"
                    {...register('caption')}
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="checkbox-gallery-is-active"
                    className="w-4.5 h-4.5 border border-slate-200 rounded text-accent focus:ring-accent"
                    {...register('is_active')}
                  />
                  <label htmlFor="checkbox-gallery-is-active" className="text-sm font-semibold text-slate-700 cursor-pointer">
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
                    Save Photo
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

export default GalleryPanel;
