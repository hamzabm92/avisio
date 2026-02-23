import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Hotel } from '../types';

interface HotelState {
  hotel: Hotel | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHotel(): HotelState {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchHotel() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: supaError } = await supabase
          .from('hotels')
          .select('*')
          .limit(1)
          .single();

        if (cancelled) return;

        if (supaError) {
          if (supaError.code === 'PGRST116') {
            // No hotel found — new user
            setHotel(null);
          } else {
            setError(supaError.message);
          }
        } else {
          setHotel(data as Hotel);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHotel();
    return () => { cancelled = true; };
  }, [trigger]);

  return {
    hotel,
    loading,
    error,
    refetch: () => setTrigger(t => t + 1),
  };
}
