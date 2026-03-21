import React from 'react';

interface Props {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center border border-dashed border-dark-border rounded-xl ${compact ? 'p-6' : 'p-12'}`}>
      <div className={`${compact ? 'text-3xl mb-2' : 'text-4xl mb-3'}`}>{icon}</div>
      <p className={`font-semibold text-dark-text mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>{title}</p>
      <p className={`text-dark-muted max-w-xs mb-4 ${compact ? 'text-[10px]' : 'text-xs'}`}>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs px-4 py-2 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
