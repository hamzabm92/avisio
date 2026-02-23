
import type { SMSStatus } from '../../types';

interface BadgeProps {
  status: SMSStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'En attente', bg: '#F5EDD8', color: '#8A7F78' },
  scheduled: { label: 'Planifié', bg: '#EDE8E3', color: '#2C2420' },
  sent: { label: 'Envoyé', bg: '#E8F4F1', color: '#5B9B8B' },
  delivered: { label: 'Livré', bg: '#E8F4F1', color: '#7EB5A6' },
  failed: { label: 'Échec', bg: '#F9EDEC', color: '#C97A7A' },
  opted_out: { label: 'Opt-out', bg: '#F0EDE8', color: '#8A7F78' },
  active: { label: 'Actif', bg: '#E8F4F1', color: '#7EB5A6' },
  inactive: { label: 'Inactif', bg: '#F0EDE8', color: '#8A7F78' },
};

export default function Badge({ status, className = '' }: BadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#EDE8E3', color: '#8A7F78' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
