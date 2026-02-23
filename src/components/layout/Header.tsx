import { Menu, MessageSquare } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onMenuOpen: () => void;
}

export default function Header({ title, onMenuOpen }: HeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <header
      className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 border-b bg-white sticky top-0 z-20"
      style={{ borderColor: '#EDE8E3' }}
    >
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F5EDD8] transition-colors"
          style={{ color: '#2C2420' }}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo — mobile only (when no title) */}
        {!title && (
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2C2420' }}>
              <MessageSquare size={13} color="#C9A96E" />
            </div>
            <span style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420', fontWeight: 700, fontSize: 17 }}>
              Avisio
            </span>
          </div>
        )}

        {title && (
          <h1
            className="text-lg md:text-xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Right: date */}
      <span className="text-xs md:text-sm" style={{ color: '#8A7F78' }}>
        {formattedDate}
      </span>
    </header>
  );
}
