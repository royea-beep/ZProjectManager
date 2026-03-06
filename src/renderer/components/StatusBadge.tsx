import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../shared/constants';

const STATUS_ICONS: Record<string, string> = {
  idea: '○',
  planning: '◐',
  building: '●',
  testing: '◑',
  launched: '★',
  paused: '❚❚',
  archived: '▣',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#8892a8';
  return (
    <span
      role="status"
      aria-label={`Status: ${STATUS_LABELS[status] || status}`}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '20', color }}
    >
      {STATUS_ICONS[status] || '·'} {STATUS_LABELS[status] || status}
    </span>
  );
}
