
import { Bell } from 'lucide-react';
import type { Hotel } from '../../types';

interface HeaderProps {
  hotel: Hotel | null;
  title?: string;
}

export default function Header({ hotel: _hotel, title }: HeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  // Capitalize first letter
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <header
      className="h-16 flex items-center justify-between px-8 border-b bg-white"
      style={{ borderColor: '#EDE8E3' }}
    >
      <div>
        {title && (
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
          >
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm" style={{ color: '#8A7F78' }}>
          {formattedDate}
        </span>
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F5EDD8] transition-colors relative"
          style={{ color: '#8A7F78' }}
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
