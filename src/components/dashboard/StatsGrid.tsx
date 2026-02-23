import React from 'react';
import { MessageSquare, Star, TrendingUp, MessageCircle } from 'lucide-react';
import Card from '../ui/Card';

interface Stat {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
  color: string;
}

interface StatsGridProps {
  googleRating: number | null;
  smsSentMonth: number;
  reviewsMonth: number;
  feedbacksMonth: number;
  loading?: boolean;
}

export default function StatsGrid({
  googleRating,
  smsSentMonth,
  reviewsMonth,
  feedbacksMonth,
  loading = false
}: StatsGridProps) {
  const stats: Stat[] = [
    {
      label: 'Note Google actuelle',
      value: googleRating ? googleRating.toFixed(1) : '—',
      icon: <Star size={20} />,
      color: '#C9A96E',
    },
    {
      label: 'SMS envoyés ce mois',
      value: smsSentMonth,
      icon: <MessageSquare size={20} />,
      color: '#7EB5A6',
    },
    {
      label: 'Avis collectés ce mois',
      value: reviewsMonth,
      icon: <TrendingUp size={20} />,
      color: '#C9A96E',
    },
    {
      label: 'Feedbacks privés',
      value: feedbacksMonth,
      icon: <MessageCircle size={20} />,
      color: '#8A7F78',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {stats.map(stat => (
        <Card key={stat.label} padding="sm">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: '#F5EDD8', color: stat.color }}
          >
            {stat.icon}
          </div>
          <p
            className="text-2xl md:text-3xl font-bold mb-0.5"
            style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
          >
            {stat.value}
          </p>
          <p className="text-xs md:text-sm leading-tight" style={{ color: '#8A7F78' }}>
            {stat.label}
          </p>
        </Card>
      ))}
    </div>
  );
}
