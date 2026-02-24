
import type { SMSStatus } from '../../types';

interface BadgeProps {
  status: SMSStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot?: string }> = {
  pending:   { label: 'En attente', bg: '#FEF3E2', color: '#B8800E', dot: '#C9A96E' },
  scheduled: { label: 'Planifié',   bg: '#EDF2FB', color: '#4A7AB5' },
  sent:      { label: 'Envoyé',     bg: '#E8F4F1', color: '#3D9B85' },
  delivered: { label: 'Livré',      bg: '#D6EFE9', color: '#2E7D62' },
  failed:    { label: 'Échec',      bg: '#FDECEC', color: '#B85252' },
  opted_out: { label: 'Opt-out',    bg: '#F0EDE8', color: '#7A716A' },
  active:    { label: 'Actif',      bg: '#E8F4F1', color: '#3D9B85' },
  inactive:  { label: 'Inactif',    bg: '#F0EDE8', color: '#7A716A' },
};

export default function Badge({ status, className = '' }: BadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#EDE8E3', color: '#8A7F78' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.dot && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: config.dot }} />
      )}
      {config.label}
    </span>
  );
}
