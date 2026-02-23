
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Hotel } from '../../types';

interface SidebarProps {
  hotel: Hotel | null;
}

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/checkouts', icon: Users, label: 'Départs du jour' },
  { to: '/reviews', icon: Star, label: 'Avis reçus' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar({ hotel }: SidebarProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col"
      style={{ backgroundColor: '#2C2420' }}
    >
      {/* Logo */}
      <div className="px-6 py-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
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
        {hotel && (
          <p className="text-xs mt-2 truncate" style={{ color: '#8A7F78' }}>
            {hotel.name}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
              ${isActive
                ? 'text-white'
                : 'hover:bg-white/5'
              }
            `}
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
        {/* Plan badge */}
        {hotel && (
          <div className="mb-4 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}>
            <p className="text-xs" style={{ color: '#8A7F78' }}>Plan actuel</p>
            <p className="text-sm font-semibold capitalize" style={{ color: '#C9A96E' }}>
              {hotel.plan}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
