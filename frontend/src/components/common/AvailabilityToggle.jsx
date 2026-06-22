import React, { useState } from 'react';
import { useUpdateAvailabilityMutation } from '../../store/api/itemsApi';
import { toast } from 'sonner';

const AvailabilityToggle = ({ id, isAvailable }) => {
  const [updateAvailability, { isLoading }] = useUpdateAvailabilityMutation();
  const [localChecked, setLocalChecked] = useState(isAvailable);

  const handleToggle = async (e) => {
    const newVal = e.target.checked;
    
    // Optimistic Update
    setLocalChecked(newVal);

    try {
      await updateAvailability({ id, is_available: newVal }).unwrap();
      toast.success(newVal ? 'Item is now available' : 'Item is now 86ed');
    } catch (error) {
      // Revert on error
      setLocalChecked(!newVal);
      toast.error('Failed to update availability');
    }
  };

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={localChecked}
        onChange={handleToggle}
        disabled={isLoading}
      />
      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
      <span className="ml-2 text-xs font-medium text-slate-500">
        {localChecked ? 'Available' : 'Unavailable'}
      </span>
    </label>
  );
};

export default AvailabilityToggle;
