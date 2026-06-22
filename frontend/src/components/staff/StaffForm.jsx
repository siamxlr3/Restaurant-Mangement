import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiX, FiCheck } from 'react-icons/fi';
import { Spinner } from '../ui/Common';
import { useCreateStaffMutation, useUpdateStaffMutation } from '../../store/api/staffApi';
import { toast } from 'react-hot-toast';

const staffSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
    role: z.enum(['admin', 'manager', 'staff']),
    pin: z.string().length(4, 'PIN must be 4 digits').regex(/^\d+$/, 'PIN must be numeric'),
    is_active: z.boolean().default(true),
});

const StaffForm = ({ staff, onSuccess, onCancel }) => {
    const isEdit = !!staff;

    const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
    const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(staffSchema),
        defaultValues: staff || {
            name: '',
            phone: '',
            role: 'staff',
            pin: '',
            is_active: true,
        },
    });

    const onSubmit = async (data) => {
        try {
            if (isEdit) {
                await updateStaff({ id: staff.id, ...data }).unwrap();
                toast.success('Staff updated successfully');
            } else {
                await createStaff(data).unwrap();
                toast.success('Staff created successfully');
            }
            onSuccess();
        } catch (err) {
            toast.error(err.data?.message || `Failed to ${isEdit ? 'update' : 'create'} staff`);
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-ink">Full Name</label>
                    <input
                        {...register('name')}
                        placeholder="John Doe"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
                    />
                    {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-ink">Phone Number</label>
                    <input
                        {...register('phone')}
                        placeholder="0123456789"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
                    />
                    {errors.phone && <p className="text-xs text-rose-500">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-ink">Role</label>
                    <select
                        {...register('role')}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.role ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
                    >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                    {errors.role && <p className="text-xs text-rose-500">{errors.role.message}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-ink">Login PIN (4 digits)</label>
                    <input
                        type="password"
                        maxLength={4}
                        {...register('pin')}
                        placeholder="****"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.pin ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-accent/20'}`}
                    />
                    {errors.pin && <p className="text-xs text-rose-500">{errors.pin.message}</p>}
                </div>
            </div>

            <div className="flex items-center gap-2 py-2">
                <input
                    type="checkbox"
                    id="is_active"
                    {...register('is_active')}
                    className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                />
                <label htmlFor="is_active" className="text-sm text-ink">Account is active</label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-accent px-8 py-2 min-w-[120px] flex items-center justify-center gap-2"
                >
                    {isLoading ? <Spinner size="sm" /> : isEdit ? <><FiCheck /> Update Staff</> : 'Create Staff'}
                </button>
            </div>
        </form>
    );
};

export default StaffForm;
