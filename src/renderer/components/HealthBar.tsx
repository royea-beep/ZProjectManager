import React from 'react';

export default function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Health score: ${score} out of 100`}
    >
      <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-dark-muted w-7 text-right">{score}</span>
    </div>
  );
}
