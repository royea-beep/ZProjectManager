import React from 'react';
import { useData } from '../hooks/useData';
import * as api from '../services/api';
import type { CrossProjectPattern } from '../../shared/types';

export default function PatternsPage() {
  const { data: patterns, loading } = useData<CrossProjectPattern>(() => api.getPatterns());

  if (loading) return <div className="flex items-center justify-center h-full text-dark-muted">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Cross-Project Patterns</h1>
      <p className="text-sm text-dark-muted mb-6">Detected patterns and recommendations</p>

      <div className="space-y-4">
        {patterns.map(p => {
          let projects: string[] = [];
          try { projects = p.supporting_projects ? JSON.parse(p.supporting_projects) : []; } catch { /* ignore */ }
          return (
            <div key={p.id} className="bg-dark-surface border border-dark-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium flex-1">{p.pattern}</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue ml-3 shrink-0">
                  {Math.round(p.confidence * 100)}% confidence
                </span>
              </div>
              {p.recommendation && (
                <p className="text-sm text-accent-green/80 mb-2">Recommendation: {p.recommendation}</p>
              )}
              {projects.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {projects.map((name: string) => (
                    <span key={name} className="text-xs bg-dark-bg px-2 py-0.5 rounded">{name}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
