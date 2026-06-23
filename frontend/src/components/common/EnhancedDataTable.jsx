import React, { useState, useEffect } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiRotateCcw, FiCalendar } from 'react-icons/fi';
import { Spinner } from '../ui/Common';

const EnhancedDataTable = ({
  columns,
  data = [],
  isLoading,
  meta,
  onFilterChange,
  filters = {},
  title,
  actions,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ ...filters, search: searchTerm, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onFilterChange, filters]);

  const handlePageChange = (newPage) => {
    onFilterChange({ ...filters, page: newPage });
  };

  const handlePerPageChange = (e) => {
    onFilterChange({ ...filters, per_page: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    onFilterChange({ ...filters, status: e.target.value, page: 1 });
  };

  const handleDateChange = (type, value) => {
    onFilterChange({ ...filters, [type]: value, page: 1 });
  };

  const resetFilters = () => {
    setSearchTerm('');
    onFilterChange({
      page: 1,
      per_page: filters.per_page || 20,
      search: '',
      status: 'all',
      from_date: '',
      to_date: '',
      category_id: filters.category_id || '', // keep category if in category view
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header / Filters Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 py-2">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white text-sm"
            value={filters.status || 'all'}
            onChange={handleStatusChange}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {actions}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={filters.from_date || ''}
              onChange={(e) => handleDateChange('from_date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={filters.to_date || ''}
              onChange={(e) => handleDateChange('to_date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button
            onClick={resetFilters}
            className="p-2 text-slate-500 hover:text-ink transition-colors font-medium text-sm"
            title="Reset Filters"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="panel flex-1 min-h-[400px] overflow-hidden flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Spinner label="Updating records..." size="lg" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={col.className}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={data.length === 0 ? 'h-full' : ''}>
              {data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={col.className}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : !isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <FiSearch size={32} />
                      </div>
                      <p className="font-medium text-ink">No records found</p>
                      <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search term</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {meta && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 mt-auto">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Show</span>
              <select
                className="bg-transparent border border-slate-200 rounded px-1 py-0.5 outline-none"
                value={filters.per_page || 20}
                onChange={handlePerPageChange}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span>per page</span>
              <span className="mx-2 ml-4">
                Showing {((meta.page - 1) * meta.per_page) + 1} - {Math.min(meta.page * meta.per_page, meta.total)} of {meta.total}
              </span>
            </div>

            <div className="flex items-center gap-1">
                <button
                  disabled={meta.page === 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                  className="p-1.5 rounded border border-slate-200 enabled:hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <FiChevronLeft size={16} />
                </button>
              
              <div className="flex items-center gap-1 px-2">
                {[...Array(meta.total_pages)].map((_, i) => {
                  const p = i + 1;
                  // Basic pagination logic (show current and neighbors)
                  if (
                    p === 1 || 
                    p === meta.total_pages || 
                    (p >= meta.page - 1 && p <= meta.page + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                          meta.page === p 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === 2 || p === meta.total_pages - 1) {
                    return <span key={p} className="px-1 text-slate-300">...</span>;
                  }
                  return null;
                })}
              </div>

                <button
                  disabled={meta.page === meta.total_pages}
                  onClick={() => handlePageChange(meta.page + 1)}
                  className="p-1.5 rounded border border-slate-200 enabled:hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <FiChevronRight size={16} />
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDataTable;
