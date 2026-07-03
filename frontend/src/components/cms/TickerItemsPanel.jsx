import React, { useState } from 'react';
import {
  useGetTickerItemsQuery,
  useCreateTickerItemMutation,
  useUpdateTickerItemMutation,
  useDeleteTickerItemMutation,
  useReorderTickerItemsMutation,
} from '../../store/api/cmsApi';
import CmsDataTable from './CmsDataTable';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Badge } from '../ui/Common';
import { FiPlus, FiEdit2, FiTrash2, FiMaximize2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

const TickerItemsPanel = () => {
  const [filters, setFilters] = useState({ page: 1, per_page: 10, search: '', status: 'all', from_date: '', to_date: '' });
  const { data: response, isLoading, isFetching } = useGetTickerItemsQuery(filters);

  const [createTickerItem, { isLoading: isCreating }] = useCreateTickerItemMutation();
  const [updateTickerItem, { isLoading: isUpdating }] = useUpdateTickerItemMutation();
  const [deleteTickerItem] = useDeleteTickerItemMutation();
  const [reorderTickerItems] = useReorderTickerItemsMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const openAddModal = () => {
    setEditingItem(null);
    reset({ text: '', dot_color: '#FF6B35', is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    reset({
      text: item.text,
      dot_color: item.dot_color,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const onSubmit = async (values) => {
    try {
      if (editingItem) {
        await updateTickerItem({ id: editingItem.id, ...values }).unwrap();
        toast.success('Ticker item updated successfully!');
      } else {
        await createTickerItem({ ...values, sort_order: (response?.data?.length || 0) }).unwrap();
        toast.success('Ticker item created successfully!');
      }
      handleCloseModal();
    } catch (e) {
      toast.error(e.data?.message || 'Failed to save ticker item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ticker item?')) {
      try {
        await deleteTickerItem(id).unwrap();
        toast.success('Ticker item deleted');
      } catch (e) {
        toast.error(e.data?.message || 'Failed to delete ticker item');
      }
    }
  };

  const handleMove = async (index, direction) => {
    const list = [...(response?.data || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    try {
      await reorderTickerItems({ ids: list.map((item) => item.id) }).unwrap();
      toast.success('Ticker items reordered');
    } catch (e) {
      toast.error('Failed to reorder ticker items');
    }
  };

  const columns = [
    {
      key: 'text',
      header: 'Ticker Text',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.dot_color }} />
          <span className="font-medium text-slate-800">{row.text}</span>
        </div>
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
        // Find index of row in original items list
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
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 hover:bg-slate-100 rounded text-accent"
              title="Edit"
            >
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
            <FiPlus /> Add Ticker Item
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
                  {editingItem ? 'Edit Ticker Item' : 'Add Ticker Item'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Ticker Content Text</label>
                  <input
                    type="text"
                    required
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="e.g. Free delivery on orders above $50"
                    {...register('text', { required: true })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Separator Dot Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-10 h-10 p-1 border border-slate-200 rounded-lg cursor-pointer bg-white"
                      {...register('dot_color')}
                    />
                    <span className="text-xs text-slate-500 font-mono">Pick branding color</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="checkbox-ticker-is-active"
                    className="w-4.5 h-4.5 border border-slate-200 rounded text-accent focus:ring-accent"
                    {...register('is_active')}
                  />
                  <label htmlFor="checkbox-ticker-is-active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Is Active & Visible
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
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
                    Save Item
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

export default TickerItemsPanel;
