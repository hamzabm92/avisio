import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Star, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/checkouts', icon: Users, label: 'Départs' },
  { to: '/reviews', icon: Star, label: 'Avis' },
  { to: '/settings', icon: Settings, label: 'Réglages' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-stretch"
      style={{
        backgroundColor: '#2C2420',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors"
          style={({ isActive }) => ({
            color: isActive ? '#C9A96E' : 'rgba(255,255,255,0.45)',
          })}
        >
          {({ isActive }) => (
            <>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
              <span style={{ fontSize: 10 }}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
