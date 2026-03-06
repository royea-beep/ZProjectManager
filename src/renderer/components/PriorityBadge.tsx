import React from 'react';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../shared/constants';

export default function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || '#8892a8';
  return (
    <span
      aria-label={`Priority: ${PRIORITY_LABELS[priority] || priority}`}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '20', color }}
    >
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}
