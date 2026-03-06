import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../shared/types';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import HealthBar from './HealthBar';

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff < 0) return 'Today';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const stale = project.last_worked_at &&
    (Date.now() - new Date(project.last_worked_at).getTime()) > 14 * 86400000;

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className={`bg-dark-surface border rounded-lg p-4 cursor-pointer transition-all hover:border-accent-blue/50 hover:bg-dark-hover hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 ${
        stale ? 'border-accent-yellow/40' : 'border-dark-border'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm truncate">{project.name}</h3>
        <PriorityBadge priority={project.priority} />
      </div>

      <p className="text-xs text-dark-muted mb-3 line-clamp-2">
        {project.description || 'No description'}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <StatusBadge status={project.status} />
        {project.type && (
          <span className="text-xs text-dark-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: ({
              'web-app': '#3b82f6',
              'mobile-app': '#22c55e',
              'desktop-app': '#a855f7',
              'trading-bot': '#eab308',
              'cli-tool': '#8892a8',
              'saas': '#f97316',
              'platform': '#ec4899',
            } as Record<string, string>)[project.type] || '#6b7280' }} />
            {project.type}
          </span>
        )}
      </div>

      <HealthBar score={project.health_score} />

      <div className="flex items-center justify-between mt-3 text-xs text-dark-muted">
        <span>{daysAgo(project.last_worked_at)}</span>
        {stale && <span className="text-accent-yellow">Stale</span>}
      </div>

      {project.next_action && (
        <p className="mt-2 text-xs text-accent-blue/80 truncate">
          Next: {project.next_action}
        </p>
      )}
    </div>
  );
}
