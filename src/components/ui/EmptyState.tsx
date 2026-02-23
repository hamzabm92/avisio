import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 p-4 rounded-2xl" style={{ backgroundColor: '#F5EDD8' }}>
          <span style={{ color: '#C9A96E' }}>{icon}</span>
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-6 max-w-sm" style={{ color: '#8A7F78' }}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
