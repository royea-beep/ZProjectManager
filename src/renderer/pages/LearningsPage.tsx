import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import * as api from '../services/api';
import type { Learning } from '../../shared/types';

const CATEGORIES = ['all', 'technical', 'business', 'process', 'personal'];

const IMPACT_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: 'High Impact', color: 'text-accent-green' },
  medium: { label: 'Medium', color: 'text-accent-yellow' },
  low: { label: 'Low', color: 'text-dark-muted' },
};

function getImpactLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export default function LearningsPage() {
  const navigate = useNavigate();
  const { data: learnings, loading, refresh } = useData<Learning>(() => api.getAllLearnings());
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return learnings;
    return learnings.filter(l => l.category === filter);
  }, [learnings, filter]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-7 w-36 mb-2" />
        <div className="skeleton h-4 w-64 mb-6" />
        <div className="skeleton h-9 w-80 rounded-lg mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">Learnings</h1>
      <p className="text-sm text-dark-muted mb-6">Lessons learned across all projects</p>

      <div className="flex gap-1 bg-dark-surface border border-dark-border rounded-lg p-1 mb-6 w-fit">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === c ? 'bg-accent-blue text-white' : 'text-dark-muted hover:text-dark-text'
            }`}>
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-20">
            {filter !== 'all' ? '~' : '\u25C8'}
          </div>
          <p className="text-dark-muted mb-1">
            {filter !== 'all'
              ? `No ${filter} learnings yet`
              : 'No learnings recorded yet'}
          </p>
          <p className="text-sm text-dark-muted/60 max-w-sm mx-auto">
            {filter !== 'all' ? (
              <button onClick={() => setFilter('all')} className="text-accent-blue hover:underline">
                View all categories
              </button>
            ) : (
              'Learnings are recorded from individual project pages. Open a project and add lessons from the Learnings tab.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => {
            const level = getImpactLevel(l.impact_score);
            const impactInfo = IMPACT_LABELS[level];
            return (
              <div key={l.id} className="bg-dark-surface border border-dark-border rounded-lg p-4 hover:border-dark-border/80 transition-colors">
                <div className="flex items-start justify-between">
                  <p className="text-sm flex-1">{l.learning}</p>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="text-xs text-dark-muted bg-dark-bg px-2 py-0.5 rounded-full">{l.category}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-dark-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            level === 'high' ? 'bg-accent-green' : level === 'medium' ? 'bg-accent-yellow' : 'bg-dark-muted'
                          }`}
                          style={{ width: `${l.impact_score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${impactInfo.color}`}>
                        {l.impact_score}
                      </span>
                    </div>
                  </div>
                </div>
                {l.project_name && l.project_id && (
                  <button onClick={() => navigate(`/project/${l.project_id}`)}
                    className="text-xs text-accent-blue/70 hover:text-accent-blue mt-2 inline-block">
                    {l.project_name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
