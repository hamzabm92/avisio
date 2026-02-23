import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Star,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Hotel } from '../../types';

interface SidebarProps {
  hotel: Hotel | null;
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/checkouts', icon: Users, label: 'Départs du jour' },
  { to: '/reviews', icon: Star, label: 'Avis reçus' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

function SidebarContent({ hotel, onClose, onLogout }: { hotel: Hotel | null; onClose: () => void; onLogout: () => void }) {
  return (
    <div className="w-64 h-full flex flex-col" style={{ backgroundColor: '#2C2420' }}>
      {/* Logo */}
      <div className="px-6 py-7 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#C9A96E' }}
          >
            <MessageSquare size={16} color="white" />
          </div>
          <span
            className="text-xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#F5EDD8' }}
          >
            Avisio
          </span>
        </div>
        {/* Close — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <X size={20} />
        </button>
      </div>

      {hotel && (
        <div className="px-6 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-xs truncate" style={{ color: '#8A7F78' }}>{hotel.name}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${isActive ? '' : 'hover:bg-white/5'}`
            }
            style={({ isActive }) => isActive
              ? { backgroundColor: '#C9A96E', color: 'white' }
              : { color: 'rgba(255,255,255,0.6)' }
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {hotel && (
          <div className="mb-4 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}>
            <p className="text-xs" style={{ color: '#8A7F78' }}>Plan actuel</p>
            <p className="text-sm font-semibold capitalize" style={{ color: '#C9A96E' }}>{hotel.plan}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ hotel, open, onClose }: SidebarProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen z-30">
        <SidebarContent hotel={hotel} onClose={() => {}} onLogout={handleLogout} />
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(44,36,32,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}
          />
          <div className="relative z-10 h-full shadow-2xl">
            <SidebarContent hotel={hotel} onClose={onClose} onLogout={handleLogout} />
          </div>
        </div>
      )}
    </>
  );
}
