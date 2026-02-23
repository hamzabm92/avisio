import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { useHotel } from '../../hooks/useHotel';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { hotel } = useHotel();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F4' }}>
      <Sidebar
        hotel={hotel}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — offset by sidebar on desktop */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        <Header title={title} onMenuOpen={() => setSidebarOpen(true)} />

        {/* Extra bottom padding on mobile for the bottom nav */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
