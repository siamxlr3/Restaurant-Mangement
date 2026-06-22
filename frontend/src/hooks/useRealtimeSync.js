import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../config/supabase';
import { itemsApi } from '../store/api/itemsApi';
import { toast } from 'sonner';

/**
 * Hook to subscribe to real-time availability updates
 */
export const useRealtimeSync = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const channel = supabase
      .channel('menu:availability')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'menu_item',
        },
        (payload) => {
          // If is_available changed, invalidate or update the cache
          if (payload.new.is_available !== payload.old.is_available) {
            dispatch(itemsApi.util.invalidateTags(['Item']));
            toast.info(`Availability updated: ${payload.new.name} is now ${payload.new.is_available ? 'Available' : '86ed'}`, {
              icon: '🔔',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]);
};
