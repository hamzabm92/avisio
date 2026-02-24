
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Stars from '../ui/Stars';
import type { Feedback } from '../../types';
import { formatDateShort } from '../../lib/dateUtils';

interface ReviewsFeedProps {
  feedbacks: Feedback[];
  loading?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  'propreté': 'Propreté',
  'service': 'Service',
  'literie': 'Literie',
  'bruit': 'Bruit',
  'technique': 'Technique',
  'autre': 'Autre',
};

export default function ReviewsFeed({ feedbacks, loading = false }: ReviewsFeedProps) {
  const navigate = useNavigate();

  return (
    <Card padding="none">
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#EDE8E3' }}>
        <h3
          className="font-semibold"
          style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
        >
          Feedbacks récents
        </h3>
        <button
          onClick={() => navigate('/reviews')}
          className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#C9A96E' }}
        >
          Voir tous
          <ArrowRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 w-32 rounded" style={{ backgroundColor: '#F5EDD8' }} />
              <div className="h-3 w-full rounded" style={{ backgroundColor: '#F5EDD8' }} />
            </div>
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm" style={{ color: '#8A7F78' }}>Aucun feedback reçu</p>
        </div>
      ) : (
        <div>
          {feedbacks.slice(0, 4).map((fb, i) => (
            <div
              key={fb.id}
              className="p-5 transition-colors"
              style={{ borderTop: i > 0 ? '1px solid #EDE8E3' : undefined }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFA'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {!fb.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#C9A96E' }} />
                  )}
                  {fb.category && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#B8800E' }}
                    >
                      {CATEGORY_LABELS[fb.category] || fb.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {fb.rating && <Stars value={fb.rating} readonly size="sm" />}
                  <span className="text-xs whitespace-nowrap" style={{ color: '#8A7F78' }}>
                    {formatDateShort(fb.created_at)}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#2C2420' }}>
                {fb.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
