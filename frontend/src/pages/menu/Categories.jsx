import React, { useState } from 'react';
import { FiPlus, FiGrid, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';
import { Badge, Spinner } from '../../components/ui/Common';
import { 
  useGetCategoriesQuery, 
  useCreateCategoryMutation, 
  useUpdateCategoryMutation, 
  useDeleteCategoryMutation,
  useUpdateCategoryOrderMutation
} from '../../store/api/categoriesApi';
import CategoryForm from '../../components/menu/CategoryForm';
import { toast } from 'sonner';
import { Reorder, motion, AnimatePresence } from 'framer-motion';

const CategoryManagement = () => {
  const [filters, setFilters] = useState({ 
    page: 1, 
    per_page: 50, 
    search: '', 
    status: 'all',
    from_date: '',
    to_date: ''
  });
  const { data, isLoading, isFetching } = useGetCategoriesQuery(filters);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updateOrder] = useUpdateCategoryOrderMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleCreate = async (values) => {
    try {
      await createCategory(values).unwrap();
      toast.success('Category created successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.data?.message || 'Failed to create category');
    }
  };

  const handleUpdate = async (values) => {
    try {
      await updateCategory({ id: editingCategory.id, ...values }).unwrap();
      toast.success('Category updated successfully');
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? All items will become uncategorized.')) {
      try {
        await deleteCategory(id).unwrap();
        toast.success('Category deleted');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleReorder = async (newOrder) => {
    // Only update if order actually changed
    const itemsToUpdate = newOrder.map((cat, index) => ({
      id: cat.id,
      sort_order: index,
    }));
    
    try {
      await updateOrder(itemsToUpdate).unwrap();
    } catch (error) {
      toast.error('Failed to update sort order');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Categories"
        description="Manage your menu groupings and their display order."
        actions={
          <button 
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }} 
            className="btn-accent flex items-center gap-2"
          >
            <FiPlus />
            New Category
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white text-sm"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Hidden Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            value={filters.from_date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            value={filters.to_date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
          />
          <button 
            className="p-2 text-slate-400 hover:text-ink transition-colors text-sm font-medium"
            onClick={() => setFilters({ 
              page: 1, 
              per_page: 50, 
              search: '', 
              status: 'all',
              from_date: '',
              to_date: ''
            })}
          >
            Reset
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading categories..." py={10} />
      ) : (
        <div className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10" />
          )}
          
          <Reorder.Group 
            axis="y" 
            values={data?.data || []} 
            onReorder={handleReorder}
            className="space-y-2"
          >
            {data?.data?.map((cat) => (
              <Reorder.Item 
                key={cat.id} 
                value={cat}
                className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
              >
                <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 transition-colors">
                  <FiGrid size={20} />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-ink">{cat.name}</h3>
                </div>

                <div className="flex items-center gap-4">
                  <Badge tone={cat.is_active ? 'green' : 'slate'}>
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-ink hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {data?.data?.length === 0 && (
            <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
              No categories found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* Modal for Category Form */}
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-ink">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <FiX className="text-slate-400" />
                </button>
              </div>
              <div className="p-8">
                <CategoryForm
                  initialData={editingCategory}
                  onSubmit={editingCategory ? handleUpdate : handleCreate}
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

export default CategoryManagement;
