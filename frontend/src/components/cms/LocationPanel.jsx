import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useGetLocationQuery, useUpdateLocationMutation } from '../../store/api/cmsApi';
import { FiSave } from 'react-icons/fi';

const LocationPanel = () => {
  const { data: response, isLoading: isFetching } = useGetLocationQuery();
  const [updateLocation, { isLoading: isUpdating }] = useUpdateLocationMutation();

  const { register, handleSubmit, reset } = useForm();

  const location = response?.data;

  useEffect(() => {
    if (location) {
      reset({
        address: location.address || '',
        parking_info: location.parking_info || '',
        phone: location.phone || '',
        lat: location.lat || '',
        lng: location.lng || '',
        directions_url: location.directions_url || '',
        call_cta: location.call_cta || '',
      });
    }
  }, [location, reset]);

  const onSubmit = async (values) => {
    // Coerce coordinates to numbers (float)
    const payload = {
      ...values,
      lat: parseFloat(values.lat) || 0,
      lng: parseFloat(values.lng) || 0,
    };

    try {
      await updateLocation(payload).unwrap();
      toast.success('Location details updated successfully!');
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update location details');
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
      {/* Address Details */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">Contact & Address Details</h3>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600">Physical Address</label>
          <input
            type="text"
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="e.g. 123 Chef Street, Gulshan 2, Dhaka 1212"
            {...register('address', { required: true })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Phone Number</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. +880 1711-223344"
              {...register('phone', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Call CTA Label</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. Call for Private Events"
              {...register('call_cta')}
            />
          </div>
        </div>
      </div>

      {/* Map Directions */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">Map Embed & Coords</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Latitude coordinate</label>
            <input
              type="number"
              step="any"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="e.g. 23.7925"
              {...register('lat', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Longitude coordinate</label>
            <input
              type="number"
              step="any"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="e.g. 90.4078"
              {...register('lng', { required: true })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 font-sans">Google Maps Directions URL</label>
          <input
            type="text"
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="e.g. https://maps.google.com/?q=..."
            {...register('directions_url')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600">Parking & Arriving Advice</label>
          <textarea
            rows={2}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none text-sm"
            placeholder="e.g. Complimentary valet parking is available behind the restaurant courtyard lot..."
            {...register('parking_info')}
          />
        </div>
      </div>

      <div className="flex justify-end pr-2">
        <button
          type="submit"
          disabled={isUpdating}
          className="btn-accent flex items-center gap-2 px-6 py-3 font-semibold shadow-sm"
        >
          {isUpdating ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
          Save Location settings
        </button>
      </div>
    </form>
  );
};

export default LocationPanel;
