import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useHotel } from '../../hooks/useHotel';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { hotel } = useHotel();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F4' }}>
      <Sidebar hotel={hotel} />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header hotel={hotel} title={title} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
