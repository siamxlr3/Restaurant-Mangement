import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiGrid, FiList, FiX } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';
import { Badge, Spinner } from '../../components/ui/Common';
import EnhancedDataTable from '../../components/common/EnhancedDataTable';
import AvailabilityToggle from '../../components/common/AvailabilityToggle';
import ItemForm from '../../components/menu/ItemForm';
import { 
  useGetItemsQuery, 
  useCreateItemMutation, 
  useUpdateItemMutation, 
  useDeleteItemMutation 
} from '../../store/api/itemsApi';
import { useGetCategoriesQuery } from '../../store/api/categoriesApi';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MenuItems = () => {
  const [filters, setFilters] = useState({ 
    page: 1, 
    per_page: 20, 
    search: '', 
    status: 'all',
    category_id: '',
    from_date: '',
    to_date: ''
  });

  const { data, isLoading, isFetching } = useGetItemsQuery(filters);
  const { data: categoriesData } = useGetCategoriesQuery({ per_page: 100 });
  
  const [createItem, { isLoading: isCreating }] = useCreateItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation();
  const [deleteItem] = useDeleteItemMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleCreate = async (formData) => {
    try {
      await createItem(formData).unwrap();
      toast.success('Item created successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.data?.message || 'Failed to create item');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateItem({ id: editingItem.id, formData }).unwrap();
      toast.success('Item updated successfully');
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item? This cannot be undone.')) {
      try {
        await deleteItem(id).unwrap();
        toast.success('Item deleted');
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Item',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
            {row.image_url ? (
              <img src={row.image_url} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <FiGrid size={20} />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-ink line-clamp-1">{row.name}</p>
            <p className="text-[10px] text-slate-400 stat-mono uppercase tracking-tighter">ID: {row.id.split('-')[0]}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <Badge tone="slate">{row.category_name || 'Uncategorized'}</Badge>
      ),
    },
    {
      key: 'price',
      header: 'Price / Cost',
      render: (row) => (
        <div className="flex flex-col">
          <span className="stat-mono text-sm font-semibold">৳{row.base_price.toFixed(2)}</span>
          <span className="stat-mono text-[10px] text-slate-400">Cost: ৳{row.food_cost.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      render: (row) => {
        const margin = row.base_price > 0 
          ? Math.round(((row.base_price - row.food_cost) / row.base_price) * 100) 
          : 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`stat-mono text-xs font-medium ${margin < 20 ? 'text-red-500' : 'text-green-500'}`}>
              {margin}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (row) => (
        <AvailabilityToggle id={row.id} isAvailable={row.is_available} />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditingItem(row);
              setIsModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-ink hover:bg-slate-100 rounded-md transition-all"
            title="Edit Item"
          >
            <FiEdit2 size={15} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
            title="Delete Item"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Items"
        description="Manage your products, pricing, and availability."
        actions={
          <button 
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }} 
            className="btn-accent flex items-center gap-2"
          >
            <FiPlus />
            Add New Item
          </button>
        }
      />

      <EnhancedDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        isFetching={isFetching}
        meta={data?.meta}
        filters={filters}
        onFilterChange={handleFilterChange}
        actions={
          <select
            className="input-base w-48"
            value={filters.category_id}
            onChange={(e) => handleFilterChange({ ...filters, category_id: e.target.value, page: 1 })}
          >
            <option value="">All Categories</option>
            {categoriesData?.data?.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        }
      />

      {/* Modal for Item Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-ink">
                  {editingItem ? `Edit: ${editingItem.name}` : 'Add New Menu Item'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <FiX className="text-slate-400" />
                </button>
              </div>
              <div className="p-8 max-h-[80vh] overflow-y-auto">
                <ItemForm
                  initialData={editingItem}
                  categories={categoriesData?.data || []}
                  onSubmit={editingItem ? handleUpdate : handleCreate}
                  onCancel={() => setIsModalOpen(false)}
                  isLoading={isCreating || isUpdating}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuItems;
