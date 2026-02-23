import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SMSStats } from '../types';

interface SMSStatsState {
  stats: SMSStats;
  loading: boolean;
  error: string | null;
}

export function useSMSStats(hotelId: string | null, period?: { start: string; end: string }): SMSStatsState {
  const [stats, setStats] = useState<SMSStats>({
    totalSent: 0,
    totalDelivered: 0,
    totalClicked: 0,
    totalFeedback: 0,
    deliveryRate: 0,
    clickRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      setLoading(true);
      try {
        let query = supabase
          .from('guests')
          .select('sms_status, clicked_at, feedback_submitted')
          .eq('hotel_id', hotelId!);

        if (period) {
          query = query
            .gte('checkout_date', period.start)
            .lte('checkout_date', period.end);
        }

        const { data, error: supaError } = await query;
        if (cancelled) return;
        if (supaError) throw supaError;

        const guests = data || [];
        const totalSent = guests.filter(g => ['sent', 'delivered', 'failed'].includes(g.sms_status)).length;
        const totalDelivered = guests.filter(g => g.sms_status === 'delivered').length;
        const totalClicked = guests.filter(g => g.clicked_at).length;
        const totalFeedback = guests.filter(g => g.feedback_submitted).length;

        setStats({
          totalSent,
          totalDelivered,
          totalClicked,
          totalFeedback,
          deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
          clickRate: totalDelivered > 0 ? Math.round((totalClicked / totalDelivered) * 100) : 0,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [hotelId, period?.start, period?.end]);

  return { stats, loading, error };
}
