import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import PageHeader from '../../components/ui/PageHeader';
import { Badge, Spinner } from '../../components/ui/Common';
import { 
  useGetVariantsQuery, 
  useCreateVariantMutation, 
  useUpdateVariantMutation, 
  useDeleteVariantMutation 
} from '../../store/api/variantsApi';
import { 
  useGetModifiersQuery, 
  useCreateModifierMutation, 
  useUpdateModifierMutation, 
  useDeleteModifierMutation 
} from '../../store/api/modifiersApi';
import VariantForm from '../../components/menu/VariantForm';
import ModifierForm from '../../components/menu/ModifierForm';

export default function Modifiers() {
  const [activeTab, setActiveTab] = useState('variants');
  const [filters, setFilters] = useState({ 
    page: 1, 
    per_page: 20, 
    search: '', 
    from_date: '', 
    to_date: '' 
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  const { data: variantsData, isLoading: variantsLoading, isFetching: variantsFetching } = 
    useGetVariantsQuery(filters, { skip: activeTab !== 'variants' });
    
  const { data: modifiersData, isLoading: modifiersLoading, isFetching: modifiersFetching } = 
    useGetModifiersQuery(filters, { skip: activeTab !== 'modifiers' });

  const [createVariant, { isLoading: isCreatingVariant }] = useCreateVariantMutation();
  const [updateVariant, { isLoading: isUpdatingVariant }] = useUpdateVariantMutation();
  const [deleteVariant] = useDeleteVariantMutation();

  const [createModifier, { isLoading: isCreatingModifier }] = useCreateModifierMutation();
  const [updateModifier, { isLoading: isUpdatingModifier }] = useUpdateModifierMutation();
  const [deleteModifier] = useDeleteModifierMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleCreate = async (values) => {
    try {
      if (activeTab === 'variants') {
        await createVariant(values).unwrap();
        toast.success('Variant created');
      } else {
        await createModifier(values).unwrap();
        toast.success('Modifier created');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.data?.message || 'Failed to create');
    }
  };

  const handleUpdate = async (values) => {
    try {
      if (activeTab === 'variants') {
        await updateVariant({ id: editingItem.id, ...values }).unwrap();
        toast.success('Variant updated');
      } else {
        await updateModifier({ id: editingItem.id, ...values }).unwrap();
        toast.success('Modifier updated');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      try {
        if (activeTab === 'variants') {
          await deleteVariant(id).unwrap();
        } else {
          await deleteModifier(id).unwrap();
        }
        toast.success('Deleted successfully');
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const isLoading = activeTab === 'variants' ? variantsLoading : modifiersLoading;
  const isFetching = activeTab === 'variants' ? variantsFetching : modifiersFetching;
  const currentData = activeTab === 'variants' ? variantsData : modifiersData;

  const resetFilters = () => {
    setFilters({ page: 1, per_page: 20, search: '', from_date: '', to_date: '' });
    setDebouncedSearch('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Variants & Modifiers"
        description="Manage item-specific options like sizes and extra toppings."
        actions={
          <button 
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }} 
            className="btn-accent flex items-center gap-2"
          >
            <Plus size={18} />
            New {activeTab === 'variants' ? 'Variant' : 'Modifier'}
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => { setActiveTab('variants'); resetFilters(); }}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'variants' ? 'border-ticket-orange text-ticket-orange' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Variants
        </button>
        <button
          onClick={() => { setActiveTab('modifiers'); resetFilters(); }}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'modifiers' ? 'border-ticket-orange text-ticket-orange' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Modifiers
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="input-base pl-10"
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-slate-400" />
          <input
            type="date"
            className="input-base text-sm py-1.5"
            value={filters.from_date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value, page: 1 }))}
          />
          <span className="text-slate-300">→</span>
          <input
            type="date"
            className="input-base text-sm py-1.5"
            value={filters.to_date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFilters(prev => ({ ...prev, to_date: e.target.value, page: 1 }))}
          />
        </div>

        <select
          className="input-base w-32 py-1.5 text-sm"
          value={filters.per_page}
          onChange={(e) => setFilters(prev => ({ ...prev, per_page: e.target.value, page: 1 }))}
        >
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
        </select>

        <button 
          onClick={resetFilters}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          title="Reset Filters"
        >
          <X size={18} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px] relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Spinner label="Updating list..." />
          </div>
        )}

        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {activeTab === 'variants' ? 'Label' : 'Name'}
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Extra Price</th>
              {activeTab === 'modifiers' && (
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Required</th>
              )}
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData?.data?.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-ink">{item.menu_item?.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-600">{activeTab === 'variants' ? item.label : item.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="stat-mono text-slate-900 font-medium">৳{item.extra_price.toFixed(2)}</span>
                </td>
                {activeTab === 'modifiers' && (
                  <td className="px-6 py-4">
                    <Badge tone={item.is_required ? 'amber' : 'slate'}>
                      {item.is_required ? 'Required' : 'Optional'}
                    </Badge>
                  </td>
                )}
                <td className="px-6 py-4 text-sm text-slate-400">
                  {format(new Date(item.created_at), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-ink hover:bg-white rounded-lg border border-transparent hover:border-slate-100 shadow-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {currentData?.data?.length === 0 && !isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search size={32} strokeWidth={1.5} />
            </div>
            <p>No {activeTab} found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {currentData?.meta && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-ink">{(filters.page - 1) * filters.per_page + 1}</span> to{' '}
            <span className="font-medium text-ink">
              {Math.min(filters.page * filters.per_page, currentData.meta.total)}
            </span>{' '}
            of <span className="font-medium text-ink">{currentData.meta.total}</span> entries
          </p>
          <div className="flex gap-2">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all font-medium flex items-center"
            >
              <ChevronLeft size={18} />
              <span className="mr-1">Prev</span>
            </button>
            <button
              disabled={filters.page === currentData.meta.total_pages}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all font-medium flex items-center"
            >
              <span className="ml-1">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
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
                  {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-8">
                {activeTab === 'variants' ? (
                  <VariantForm
                    initialData={editingItem}
                    onSubmit={editingItem ? handleUpdate : handleCreate}
                    onCancel={() => setIsModalOpen(false)}
                    isLoading={isCreatingVariant || isUpdatingVariant}
                  />
                ) : (
                  <ModifierForm
                    initialData={editingItem}
                    onSubmit={editingItem ? handleUpdate : handleCreate}
                    onCancel={() => setIsModalOpen(false)}
                    isLoading={isCreatingModifier || isUpdatingModifier}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
