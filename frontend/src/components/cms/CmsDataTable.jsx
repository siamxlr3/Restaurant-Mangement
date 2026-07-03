import React, { useState, useEffect } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiRotateCcw } from 'react-icons/fi';
import { Badge, Spinner } from '../ui/Common';

/**
 * Reusable DataTable for CMS list entities
 * Handles: server-side pagination, search, status filter, date range, skeleton loaders, and empty states.
 */
const CmsDataTable = ({
  columns,
  data = [],
  isLoading = false,
  isFetching = false,
  meta = { total: 0, total_pages: 0 },
  filters = { page: 1, per_page: 10, search: '', status: 'all', from_date: '', to_date: '' },
  onFilterChange,
  actions = null,
}) => {
  const [searchVal, setSearchVal] = useState(filters.search || '');

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if ((searchVal || '') !== (filters.search || '')) {
        onFilterChange({ ...filters, search: searchVal, page: 1 });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal, filters, onFilterChange]);

  const handlePageChange = (newPage) => {
    onFilterChange({ ...filters, page: newPage });
  };

  const handlePerPageChange = (e) => {
    onFilterChange({ ...filters, per_page: parseInt(e.target.value), page: 1 });
  };

  const handleStatusChange = (e) => {
    onFilterChange({ ...filters, status: e.target.value, page: 1 });
  };

  const handleDateChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value, page: 1 });
  };

  const handleReset = () => {
    setSearchVal('');
    onFilterChange({
      page: 1,
      per_page: filters.per_page || 10,
      search: '',
      status: 'all',
      from_date: '',
      to_date: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-10 w-full bg-slate-100/50 animate-pulse rounded-md" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 w-full bg-slate-50 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Container */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        {/* Search & Status Filter */}
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
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

        {/* Date Filters & Reset */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            value={filters.from_date || ''}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleDateChange('from_date', e.target.value)}
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            value={filters.to_date || ''}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleDateChange('to_date', e.target.value)}
          />
          <button
            className="p-2 text-slate-400 hover:text-ink transition-colors text-sm flex items-center gap-1 font-medium"
            onClick={handleReset}
          >
            <FiRotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Styled Grid / Table Panel */}
      <div className={`panel overflow-hidden transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-6 py-4 text-sm text-ink ${col.className || ''}`}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <FiSearch size={32} />
                      </div>
                      <div className="text-ink font-semibold">No records found</div>
                      <div className="text-sm text-slate-400">Try adjusting your filters or search terms.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {meta && meta.total_pages > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold">{Math.max(1, (filters.page - 1) * filters.per_page + 1)}</span> to{' '}
            <span className="font-semibold">{Math.min(filters.page * filters.per_page, meta.total)}</span> of{' '}
            <span className="font-semibold">{meta.total}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <select
              className="mr-4 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white text-slate-600 focus:outline-none"
              value={filters.per_page}
              onChange={handlePerPageChange}
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
            <button
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold px-2">
              {filters.page} / {meta.total_pages}
            </span>
            <button
              disabled={filters.page === meta.total_pages}
              onClick={() => handlePageChange(filters.page + 1)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsDataTable;
