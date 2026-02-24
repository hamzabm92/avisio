import { MessageSquare, Star, TrendingUp, MessageCircle } from 'lucide-react';
import Card from '../ui/Card';

interface StatsGridProps {
  googleRating: number | null;
  smsSentMonth: number;
  reviewsMonth: number;
  feedbacksMonth: number;
  loading?: boolean;
}

export default function StatsGrid({ googleRating, smsSentMonth, reviewsMonth, feedbacksMonth, loading = false }: StatsGridProps) {
  const stats = [
    {
      label: 'Note Google',
      sub: 'Note actuelle',
      value: googleRating ? googleRating.toFixed(1) : '—',
      icon: <Star size={18} />,
      iconBg: 'rgba(201,169,110,0.15)',
      iconColor: '#B8800E',
      accent: '#C9A96E',
    },
    {
      label: 'SMS envoyés',
      sub: 'Ce mois-ci',
      value: smsSentMonth,
      icon: <MessageSquare size={18} />,
      iconBg: 'rgba(126,181,166,0.15)',
      iconColor: '#3D9B85',
      accent: '#7EB5A6',
    },
    {
      label: 'Avis collectés',
      sub: 'Ce mois-ci',
      value: reviewsMonth,
      icon: <TrendingUp size={18} />,
      iconBg: 'rgba(201,169,110,0.15)',
      iconColor: '#B8800E',
      accent: '#C9A96E',
    },
    {
      label: 'Feedbacks privés',
      sub: 'Ce mois-ci',
      value: feedbacksMonth,
      icon: <MessageCircle size={18} />,
      iconBg: 'rgba(138,127,120,0.15)',
      iconColor: '#6A6058',
      accent: '#8A7F78',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} padding="sm">
            <div className="animate-pulse space-y-3">
              <div className="w-9 h-9 rounded-xl" style={{ backgroundColor: '#F5EDD8' }} />
              <div className="h-7 w-14 rounded-lg" style={{ backgroundColor: '#F5EDD8' }} />
              <div className="h-3 w-20 rounded" style={{ backgroundColor: '#F5EDD8' }} />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="bg-white rounded-2xl p-4 md:p-5"
          style={{
            border: '1px solid #EDE8E3',
            borderTop: `3px solid ${stat.accent}`,
            boxShadow: '0 1px 6px rgba(44,36,32,0.06)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}
          >
            {stat.icon}
          </div>
          <p
            className="text-2xl md:text-3xl font-bold mb-0.5"
            style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
          >
            {stat.value}
          </p>
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#2C2420' }}>
            {stat.label}
          </p>
          <p className="text-xs" style={{ color: '#8A7F78' }}>
            {stat.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
