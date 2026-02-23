import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Guest, SMSStatus } from '../types';

interface GuestsFilter {
  hotelId: string | null;
  date?: string; // ISO date string YYYY-MM-DD
  status?: SMSStatus;
  limit?: number;
}

interface GuestsState {
  guests: Guest[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGuests(filter: GuestsFilter): GuestsState {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!filter.hotelId) {
      setGuests([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchGuests() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('guests')
          .select('*')
          .eq('hotel_id', filter.hotelId!)
          .order('checkout_date', { ascending: false });

        if (filter.date) {
          query = query.eq('checkout_date', filter.date);
        }
        if (filter.status) {
          query = query.eq('sms_status', filter.status);
        }
        if (filter.limit) {
          query = query.limit(filter.limit);
        }

        const { data, error: supaError } = await query;

        if (cancelled) return;
        if (supaError) throw supaError;
        setGuests((data as Guest[]) || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGuests();
    return () => { cancelled = true; };
  }, [filter.hotelId, filter.date, filter.status, filter.limit, trigger]);

  return {
    guests,
    loading,
    error,
    refetch: () => setTrigger(t => t + 1),
  };
}
