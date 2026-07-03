import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useGetReservationConfigQuery, useUpdateReservationConfigMutation } from '../../store/api/cmsApi';
import { FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';

const ReservationConfigPanel = () => {
  const { data: response, isLoading: isFetching } = useGetReservationConfigQuery();
  const [updateReservationConfig, { isLoading: isUpdating }] = useUpdateReservationConfigMutation();
  const [timeSlots, setTimeSlots] = useState([]);
  const [newSlot, setNewSlot] = useState('');

  const { register, handleSubmit, reset } = useForm();

  const config = response?.data;

  useEffect(() => {
    if (config) {
      reset({
        hold_duration_minutes: config.hold_duration_minutes || 15,
        max_party_size: config.max_party_size || 12,
        tables_available_count: config.tables_available_count || 20,
      });
      setTimeSlots(config.time_slots || []);
    }
  }, [config, reset]);

  const addSlot = () => {
    if (newSlot && !timeSlots.includes(newSlot)) {
      setTimeSlots((prev) => [...prev, newSlot].sort());
      setNewSlot('');
    }
  };

  const removeSlot = (slot) => {
    setTimeSlots((prev) => prev.filter((s) => s !== slot));
  };

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      hold_duration_minutes: parseInt(values.hold_duration_minutes),
      max_party_size: parseInt(values.max_party_size),
      tables_available_count: parseInt(values.tables_available_count),
      time_slots: timeSlots,
    };

    try {
      await updateReservationConfig(payload).unwrap();
      toast.success('Reservation config updated successfully!');
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update reservation config');
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-100 rounded-md" />
        <div className="h-44 w-full bg-slate-100 rounded-xl" />
        <div className="h-44 w-full bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 max-w-4xl">
      {/* General Config */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">General Config Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Reservation Hold Duration (mins)</label>
            <input
              type="number"
              min="5"
              max="120"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              {...register('hold_duration_minutes', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Max Party Size (persons)</label>
            <input
              type="number"
              min="1"
              max="50"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              {...register('max_party_size', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Tables Available Count</label>
            <input
              type="number"
              min="1"
              max="200"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              {...register('tables_available_count', { required: true })}
            />
          </div>
        </div>
      </div>

      {/* Time Slots Manager */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">Available Booking Time Slots</h3>

        <div className="flex items-center gap-3">
          <input
            type="time"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
          />
          <button
            type="button"
            onClick={addSlot}
            className="btn-accent flex items-center gap-2 py-2 text-sm"
          >
            <FiPlus size={16} /> Add Slot
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {timeSlots.length > 0 ? (
            timeSlots.map((slot) => (
              <div
                key={slot}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-mono font-semibold text-slate-700"
              >
                {slot}
                <button
                  type="button"
                  onClick={() => removeSlot(slot)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 italic">No time slots configured yet. Add your first slot above.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pr-2">
        <button
          type="submit"
          disabled={isUpdating}
          className="btn-accent flex items-center gap-2 px-6 py-3 font-semibold shadow-sm"
        >
          {isUpdating ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FiSave size={16} />}
          Save Reservation Config
        </button>
      </div>
    </form>
  );
};

export default ReservationConfigPanel;
