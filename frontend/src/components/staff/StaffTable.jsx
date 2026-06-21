import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiFilter, FiChevronLeft, FiChevronRight, 
  FiMoreVertical, FiEye, FiEdit2, FiTrash2, FiUserCheck, FiUserX 
} from 'react-icons/fi';
import { Badge, Spinner } from '../../components/ui/Common';
import { useGetStaffQuery, useDeleteStaffMutation, useUpdateStaffMutation } from '../../store/api/staffApi';
import { toast } from 'react-hot-toast';

const StaffTable = ({ onEdit }) => {
    // State for filters and pagination
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    // API hooks
    const { data, isLoading, isFetching } = useGetStaffQuery({
        page,
        per_page: perPage,
        search: debouncedSearch,
        status: status !== 'all' ? status : undefined,
        from_date: dateRange.from || undefined,
        to_date: dateRange.to || undefined,
    });

    const [deleteStaff] = useDeleteStaffMutation();
    const [updateStaff] = useUpdateStaffMutation();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await deleteStaff(id).unwrap();
                toast.success('Staff deleted successfully');
            } catch (err) {
                toast.error(err.data?.message || 'Failed to delete staff');
            }
        }
    };

    const handleToggleStatus = async (staff) => {
        try {
            await updateStaff({ id: staff.id, is_active: !staff.is_active }).unwrap();
            toast.success(`Staff ${staff.is_active ? 'deactivated' : 'activated'} successfully`);
        } catch (err) {
            toast.error(err.data?.message || 'Failed to update status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 w-full bg-slate-50 animate-pulse rounded-md" />
                ))}
            </div>
        );
    }

    const staffList = data?.data || [];
    const meta = data?.meta || { total: 0, total_pages: 0 };

    return (
        <div className="flex flex-col gap-4">
            {/* Filters Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white"
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        value={dateRange.from}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); setPage(1); }}
                    />
                    <span className="text-slate-400">to</span>
                    <input
                        type="date"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        value={dateRange.to}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); setPage(1); }}
                    />
                    <button 
                        className="p-2 text-slate-400 hover:text-ink transition-colors"
                        onClick={() => { setSearch(''); setStatus('all'); setDateRange({ from: '', to: '' }); }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className={`panel overflow-hidden transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staffList.length > 0 ? (
                            staffList.map((staff) => (
                                <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                                                {staff.image_url ? (
                                                    <img src={staff.image_url} alt={staff.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-slate-400 font-bold">{staff.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-ink">{staff.name}</div>
                                                <div className="text-xs text-slate-400">{staff.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize text-sm">{staff.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge tone={staff.is_active ? 'green' : 'rose'}>
                                            {staff.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleToggleStatus(staff)}
                                                className={`p-2 rounded-lg transition-colors ${staff.is_active ? 'text-slate-400 hover:text-rose-500' : 'text-slate-400 hover:text-emerald-500'}`}
                                                title={staff.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {staff.is_active ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                                            </button>
                                            <button 
                                                onClick={() => onEdit(staff)}
                                                className="p-2 text-slate-400 hover:text-accent transition-colors" 
                                                title="Edit"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(staff.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors" 
                                                title="Delete"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                            <FiSearch size={32} />
                                        </div>
                                        <div className="text-ink font-medium">No staff found</div>
                                        <div className="text-sm text-slate-400">Try adjusting your filters or search terms.</div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {meta.total_pages > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-medium">{(page - 1) * perPage + 1}</span> to <span className="font-medium">{Math.min(page * perPage, meta.total)}</span> of <span className="font-medium">{meta.total}</span> staff
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="mr-4 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white"
                            value={perPage}
                            onChange={(e) => { setPerPage(parseInt(e.target.value)); setPage(1); }}
                        >
                            <option value="10">10 / page</option>
                            <option value="20">20 / page</option>
                            <option value="50">50 / page</option>
                        </select>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-medium px-2">{page} / {meta.total_pages}</span>
                        <button
                            disabled={page === meta.total_pages}
                            onClick={() => setPage(p => p + 1)}
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

export default StaffTable;
