
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { Guest } from '../../types';
import { formatPhoneDisplay } from '../../lib/phoneUtils';

interface CheckoutsListProps {
  guests: Guest[];
  loading?: boolean;
}

export default function CheckoutsList({ guests, loading = false }: CheckoutsListProps) {
  const navigate = useNavigate();

  return (
    <Card padding="none">
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#EDE8E3' }}>
        <h3
          className="font-semibold"
          style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
        >
          Départs du jour
        </h3>
        <button
          onClick={() => navigate('/checkouts')}
          className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#C9A96E' }}
        >
          Voir tous
          <ArrowRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: '#F5EDD8' }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded" style={{ backgroundColor: '#F5EDD8' }} />
                <div className="h-3 w-24 rounded" style={{ backgroundColor: '#F5EDD8' }} />
              </div>
            </div>
          ))}
        </div>
      ) : guests.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm" style={{ color: '#8A7F78' }}>Aucun départ aujourd'hui</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#EDE8E3' }}>
          {guests.slice(0, 4).map(guest => (
            <div key={guest.id} className="flex items-center gap-4 px-6 py-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
                style={{ backgroundColor: '#F5EDD8', color: '#C9A96E' }}
              >
                {guest.first_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#2C2420' }}>
                  {guest.first_name}
                  {guest.room_number && (
                    <span className="ml-1.5 text-xs" style={{ color: '#8A7F78' }}>
                      Ch. {guest.room_number}
                    </span>
                  )}
                </p>
                <p className="text-xs" style={{ color: '#8A7F78' }}>
                  {formatPhoneDisplay(guest.phone)}
                </p>
              </div>
              <Badge status={guest.sms_status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
