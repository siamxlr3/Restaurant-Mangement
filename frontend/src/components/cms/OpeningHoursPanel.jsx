import React, { useState } from 'react';
import {
  useGetOpeningHoursQuery,
  useCreateOpeningHoursMutation,
  useUpdateOpeningHoursMutation,
  useDeleteOpeningHoursMutation,
} from '../../store/api/cmsApi';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Badge, Spinner } from '../ui/Common';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

const DAY_OPTIONS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

const OpeningHoursPanel = () => {
  const { data: response, isLoading } = useGetOpeningHoursQuery();
  const [createOpeningHours, { isLoading: isCreating }] = useCreateOpeningHoursMutation();
  const [updateOpeningHours, { isLoading: isUpdating }] = useUpdateOpeningHoursMutation();
  const [deleteOpeningHours] = useDeleteOpeningHoursMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState(null); // null means "add" mode

  const { register, handleSubmit, reset, watch } = useForm();

  const isClosed = watch('is_closed');

  const openAddModal = () => {
    setEditingDay(null);
    reset({
      day_label: '',
      open_time: '09:00',
      close_time: '22:00',
      is_today: false,
      is_closed: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (day) => {
    setEditingDay(day);
    reset({
      day_label: day.day_label || '',
      open_time: day.open_time || '09:00',
      close_time: day.close_time || '22:00',
      is_today: day.is_today || false,
      is_closed: day.is_closed || false,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDay(null);
  };

  const onSubmit = async (values) => {
    try {
      if (editingDay) {
        await updateOpeningHours({
          id: editingDay.id,
          day_label: values.day_label,
          open_time: values.is_closed ? (editingDay.open_time || '09:00') : values.open_time,
          close_time: values.is_closed ? (editingDay.close_time || '22:00') : values.close_time,
          is_today: values.is_today,
          is_closed: values.is_closed,
        }).unwrap();
        toast.success(`${values.day_label} hours updated successfully!`);
      } else {
        await createOpeningHours({
          day_label: values.day_label,
          open_time: values.is_closed ? '09:00' : values.open_time,
          close_time: values.is_closed ? '22:00' : values.close_time,
          is_today: values.is_today,
          is_closed: values.is_closed,
        }).unwrap();
        toast.success(`${values.day_label} hour entry created!`);
      }
      handleCloseModal();
    } catch (e) {
      toast.error(e.data?.message || 'Failed to save hours');
    }
  };

  const handleDelete = async (day) => {
    if (window.confirm(`Delete hours entry for "${day.day_label}"?`)) {
      try {
        await deleteOpeningHours(day.id).unwrap();
        toast.success(`${day.day_label} entry deleted`);
      } catch (e) {
        toast.error(e.data?.message || 'Failed to delete entry');
      }
    }
  };

  if (isLoading) {
    return <Spinner label="Loading opening hours..." size="lg" />;
  }

  const days = response?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="panel overflow-hidden">
        {/* Panel Header with Add Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-ink">Opening Hours</h3>
            <p className="text-xs text-slate-400 mt-0.5">{days.length} day{days.length !== 1 ? 's' : ''} configured</p>
          </div>
          <button onClick={openAddModal} className="btn-accent flex items-center gap-2 text-sm">
            <FiPlus /> Add Hour Entry
          </button>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Day</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timing</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {days.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                  No hour entries yet. Click <strong>Add Hour Entry</strong> to get started.
                </td>
              </tr>
            )}
            {days.map((day) => (
              <tr key={day.id} className="hover:bg-slate-50/35 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    {day.day_label}
                    {day.is_today && (
                      <span className="text-3xs uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Today
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {day.is_closed ? (
                    <span className="text-slate-400 font-semibold italic text-sm">Closed</span>
                  ) : (
                    <span className="text-slate-800 text-sm font-semibold font-mono">
                      {day.open_time} - {day.close_time}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Badge tone={day.is_closed ? 'rose' : 'green'}>
                    {day.is_closed ? 'Inactive' : 'Open'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(day)}
                      className="p-1.5 hover:bg-slate-100 rounded text-accent"
                      title="Edit Hours"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(day)}
                      className="p-1.5 hover:bg-slate-100 rounded text-rose-500"
                      title="Delete Entry"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  {editingDay ? `Edit Hours: ${editingDay.day_label}` : 'Add Hour Entry'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
                {/* Day Label */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Day</label>
                  <select
                    required
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 bg-white"
                    {...register('day_label', { required: true })}
                  >
                    <option value="">Select a day…</option>
                    {DAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Is Closed */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="checkbox-is-closed"
                    className="w-4.5 h-4.5 border border-slate-200 rounded text-accent focus:ring-accent"
                    {...register('is_closed')}
                  />
                  <label htmlFor="checkbox-is-closed" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Mark as Closed for this day
                  </label>
                </div>

                {!isClosed && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-600">Open Time (24h)</label>
                      <input
                        type="time"
                        required
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                        {...register('open_time', { required: !isClosed })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-600">Close Time (24h)</label>
                      <input
                        type="time"
                        required
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                        {...register('close_time', { required: !isClosed })}
                      />
                    </div>
                  </div>
                )}

                {/* Is Today */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="checkbox-is-today"
                    className="w-4.5 h-4.5 border border-slate-200 rounded text-accent focus:ring-accent"
                    {...register('is_today')}
                  />
                  <label htmlFor="checkbox-is-today" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Flag as Today's Highlight Day
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
                    {(isCreating || isUpdating) ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : null}
                    {editingDay ? 'Save Hours' : 'Add Entry'}
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

export default OpeningHoursPanel;
