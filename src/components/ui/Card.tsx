import React, { useState } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
};

export default function Card({ children, className = '', padding = 'md', onClick, hoverable = false }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={hoverable ? () => setHovered(true) : undefined}
      onMouseLeave={hoverable ? () => setHovered(false) : undefined}
      className={`bg-white rounded-2xl ${PADDING[padding]} ${hoverable ? 'cursor-pointer' : ''} ${className}`}
      style={{
        border: `1px solid ${hoverable && hovered ? '#D4B87A' : '#EDE8E3'}`,
        boxShadow: hoverable && hovered
          ? '0 8px 24px rgba(44,36,32,0.12)'
          : '0 1px 6px rgba(44,36,32,0.06)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      {children}
    </div>
  );
}
