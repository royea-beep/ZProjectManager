import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import * as api from '../services/api';
import type { AuditEntry } from '../services/api';

const ACTIONS = ['all', 'create', 'update', 'delete'] as const;
const ENTITIES = ['all', 'project', 'task', 'session', 'decision', 'learning'] as const;

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function truncate(value: string | null, max = 40): string {
  if (!value) return '(empty)';
  return value.length > max ? value.slice(0, max) + '...' : value;
}

const actionColors: Record<string, { bg: string; text: string; icon: string }> = {
  create: { bg: 'bg-accent-green/20', text: 'text-accent-green', icon: '+' },
  update: { bg: 'bg-accent-blue/20', text: 'text-accent-blue', icon: '\u270E' },
  delete: { bg: 'bg-accent-red/20', text: 'text-accent-red', icon: '\u2212' },
};

export default function ActivityPage() {
  const navigate = useNavigate();
  const { data: entries, loading } = useData<AuditEntry>(() => api.getAuditLog(100));
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (entityFilter !== 'all' && e.entity_type !== entityFilter) return false;
      return true;
    });
  }, [entries, actionFilter, entityFilter]);

  const hasFilters = actionFilter !== 'all' || entityFilter !== 'all';

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-7 w-32 mb-2" />
        <div className="skeleton h-4 w-56 mb-6" />
        <div className="flex gap-4 mb-6">
          <div className="skeleton h-9 w-64 rounded-lg" />
          <div className="skeleton h-9 w-72 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">Activity</h1>
      <p className="text-sm text-dark-muted mb-6">Changes across all projects</p>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-1 bg-dark-surface border border-dark-border rounded-lg p-1 w-fit">
          {ACTIONS.map(a => (
            <button key={a} onClick={() => setActionFilter(a)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                actionFilter === a ? 'bg-accent-blue text-white' : 'text-dark-muted hover:text-dark-text'
              }`}>
              {a === 'all' ? 'All Actions' : a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-dark-surface border border-dark-border rounded-lg p-1 w-fit">
          {ENTITIES.map(e => (
            <button key={e} onClick={() => setEntityFilter(e)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                entityFilter === e ? 'bg-accent-blue text-white' : 'text-dark-muted hover:text-dark-text'
              }`}>
              {e === 'all' ? 'All Types' : e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-20">{hasFilters ? '~' : '\u25CE'}</div>
          <p className="text-dark-muted mb-1">
            {hasFilters ? 'No activity matches your filters' : 'No activity recorded yet'}
          </p>
          {hasFilters ? (
            <button
              onClick={() => { setActionFilter('all'); setEntityFilter('all'); }}
              className="text-sm text-accent-blue hover:underline mt-2"
            >
              Clear filters
            </button>
          ) : (
            <p className="text-sm text-dark-muted/60">Activity is logged automatically when you create, update, or delete items.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => {
            const colors = actionColors[entry.action] || actionColors.update;
            return (
              <div key={entry.id} className="bg-dark-surface border border-dark-border rounded-lg p-4 hover:border-dark-border/80 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} flex items-center gap-1`}>
                        <span className="text-[10px]">{colors.icon}</span>
                        {entry.action}
                      </span>
                      <span className="text-xs text-dark-muted bg-dark-bg px-1.5 py-0.5 rounded">
                        {entry.entity_type}
                      </span>
                      {entry.project_name && entry.project_id && (
                        <button
                          onClick={() => navigate(`/project/${entry.project_id}`)}
                          className="text-xs text-accent-blue/70 hover:text-accent-blue truncate"
                        >
                          {entry.project_name}
                        </button>
                      )}
                    </div>
                    {entry.action === 'update' && entry.field_changed && (
                      <p className="text-sm text-dark-text">
                        Changed <span className="font-medium">{entry.field_changed}</span>:{' '}
                        <span className="text-dark-muted line-through">{truncate(entry.old_value)}</span>
                        {' \u2192 '}
                        <span className="text-dark-text">{truncate(entry.new_value)}</span>
                      </p>
                    )}
                    {entry.action === 'create' && (
                      <p className="text-sm text-dark-muted">
                        Created {entry.entity_type} #{entry.entity_id}
                        {entry.new_value ? `: ${truncate(entry.new_value, 60)}` : ''}
                      </p>
                    )}
                    {entry.action === 'delete' && (
                      <p className="text-sm text-dark-muted">
                        Deleted {entry.entity_type} #{entry.entity_id}
                        {entry.old_value ? `: ${truncate(entry.old_value, 60)}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-dark-muted shrink-0">
                    {timeAgo(entry.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
