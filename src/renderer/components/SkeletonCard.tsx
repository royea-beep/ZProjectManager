import React from 'react';

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface p-4 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 bg-dark-bg rounded mb-2 ${
            i === 0 ? 'w-1/2' : i === lines - 1 ? 'w-1/4' : 'w-3/4'
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border border-dark-border rounded-lg animate-pulse">
      <div className="w-8 h-8 rounded-full bg-dark-bg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-dark-bg rounded w-1/3" />
        <div className="h-2.5 bg-dark-bg rounded w-1/2" />
      </div>
      <div className="h-5 bg-dark-bg rounded w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      <div className="flex gap-4 pb-2 border-b border-dark-border">
        {[40, 16, 12, 12, 20].map((w, i) => (
          <div key={i} className="h-3 bg-dark-bg rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-1.5">
          {[40, 16, 12, 12, 20].map((w, j) => (
            <div key={j} className="h-3 bg-dark-surface rounded" style={{ width: `${w}%`, opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
