import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import * as api from '../services/api';
import type { Learning } from '../../shared/types';

const CATEGORIES = ['all', 'technical', 'business', 'process', 'personal'];

export default function LearningsPage() {
  const navigate = useNavigate();
  const { data: learnings, loading, refresh } = useData<Learning>(() => api.getAllLearnings());
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return learnings;
    return learnings.filter(l => l.category === filter);
  }, [learnings, filter]);

  if (loading) return <div className="flex items-center justify-center h-full text-dark-muted">Loading...</div>;

  return (
    <div className="p-6">
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

      <div className="space-y-3">
        {filtered.map(l => (
          <div key={l.id} className="bg-dark-surface border border-dark-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm flex-1">{l.learning}</p>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <span className="text-xs text-dark-muted">{l.category}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple">
                  Impact: {l.impact_score}
                </span>
              </div>
            </div>
            {l.project_name && l.project_id && (
              <button onClick={() => navigate(`/project/${l.project_id}`)}
                className="text-xs text-accent-blue/70 hover:text-accent-blue mt-2 inline-block">
                Project: {l.project_name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
