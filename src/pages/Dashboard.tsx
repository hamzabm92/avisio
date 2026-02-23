import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import StatsGrid from '../components/dashboard/StatsGrid';
import CheckoutsList from '../components/dashboard/CheckoutsList';
import ReviewsFeed from '../components/dashboard/ReviewsFeed';
import { useHotel } from '../hooks/useHotel';
import { supabase } from '../lib/supabase';
import type { Guest, Feedback } from '../types';

export default function Dashboard() {
  const { hotel, loading: hotelLoading } = useHotel();
  const [todayGuests, setTodayGuests] = useState<Guest[]>([]);
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);
  const [smsSentMonth, setSmsSentMonth] = useState(0);
  const [feedbacksMonth, setFeedbacksMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotel) return;

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    async function fetchData() {
      setLoading(true);
      try {
        // Today's checkouts
        const { data: guests } = await supabase
          .from('guests')
          .select('*')
          .eq('hotel_id', hotel!.id)
          .eq('checkout_date', today)
          .order('created_at', { ascending: false })
          .limit(4);
        setTodayGuests((guests as Guest[]) || []);

        // SMS sent this month
        const { count: smsCount } = await supabase
          .from('guests')
          .select('id', { count: 'exact', head: true })
          .eq('hotel_id', hotel!.id)
          .in('sms_status', ['sent', 'delivered'])
          .gte('sms_sent_at', monthStartStr);
        setSmsSentMonth(smsCount || 0);

        // Recent feedbacks
        const { data: feedbacks } = await supabase
          .from('feedbacks')
          .select('*')
          .eq('hotel_id', hotel!.id)
          .order('created_at', { ascending: false })
          .limit(4);
        setRecentFeedbacks((feedbacks as Feedback[]) || []);

        // Feedbacks this month
        const { count: fbCount } = await supabase
          .from('feedbacks')
          .select('id', { count: 'exact', head: true })
          .eq('hotel_id', hotel!.id)
          .gte('created_at', monthStartStr);
        setFeedbacksMonth(fbCount || 0);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [hotel]);

  return (
    <Layout title="Tableau de bord">
      <div className="space-y-8">
        {/* Stats */}
        <StatsGrid
          googleRating={null}
          smsSentMonth={smsSentMonth}
          reviewsMonth={0}
          feedbacksMonth={feedbacksMonth}
          loading={loading || hotelLoading}
        />

        {/* Bottom grid */}
        <div className="grid grid-cols-2 gap-6">
          <CheckoutsList guests={todayGuests} loading={loading} />
          <ReviewsFeed feedbacks={recentFeedbacks} loading={loading} />
        </div>

        {/* Welcome banner for new users */}
        {!hotelLoading && !hotel && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: '#F5EDD8', border: '1px solid #EDE8E3' }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
            >
              Bienvenue sur Avisio
            </h2>
            <p className="mb-6" style={{ color: '#8A7F78' }}>
              Configurez votre hôtel pour commencer à automatiser vos avis Google.
            </p>
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: '#C9A96E' }}
            >
              Démarrer la configuration →
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}
