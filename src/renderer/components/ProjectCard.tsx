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

function pushAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'pushed today';
  if (diff === 1) return 'pushed 1d ago';
  if (diff < 30) return `pushed ${diff}d ago`;
  if (diff < 365) return `pushed ${Math.floor(diff / 30)}mo ago`;
  return `pushed ${Math.floor(diff / 365)}y ago`;
}

interface ProjectCardProps {
  project: Project;
  cost?: number | null;
  gitClean?: boolean | null;
  taskProgress?: { done: number; total: number } | null;
}

export default function ProjectCard({ project, cost, gitClean, taskProgress }: ProjectCardProps) {
  const navigate = useNavigate();
  const stale = project.last_worked_at &&
    (Date.now() - new Date(project.last_worked_at).getTime()) > 14 * 86400000;

  const healthColor = project.health_score >= 70 ? 'bg-green-500' : project.health_score >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  const gitDotColor = gitClean === true ? 'bg-green-500' : gitClean === false ? 'bg-yellow-500' : 'bg-gray-500';
  const gitDotTitle = gitClean === true ? 'Git: clean' : gitClean === false ? 'Git: uncommitted changes' : 'No git';

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className={`bg-dark-surface border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-accent-blue/50 hover:bg-dark-hover hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 ${
        stale ? 'border-accent-yellow/40' : 'border-dark-border'
      }`}
    >
      {/* Mini health bar at top */}
      <div className="h-1 w-full">
        <div className={`h-full ${healthColor} transition-all`} style={{ width: `${project.health_score}%` }} />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Git status dot */}
            <span className={`w-2 h-2 rounded-full shrink-0 ${gitDotColor}`} title={gitDotTitle} />
            <h3 className="font-semibold text-sm truncate">{project.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Cost badge */}
            {cost != null && cost > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/20 text-accent-purple font-medium">
                ${cost.toFixed(2)}
              </span>
            )}
            <PriorityBadge priority={project.priority} />
          </div>
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

        {/* Task progress */}
        {taskProgress && taskProgress.total > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all"
                style={{ width: `${(taskProgress.done / taskProgress.total) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-dark-muted whitespace-nowrap">
              {taskProgress.done}/{taskProgress.total} tasks
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 text-xs text-dark-muted">
          <span>{daysAgo(project.last_worked_at)}</span>
          {stale && (
            <span className="text-accent-yellow flex items-center gap-1" title="No activity in 14+ days">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow inline-block" />
              Stale
            </span>
          )}
        </div>

        {/* Last action preview */}
        {project.next_action && (
          <p className="mt-2 text-[11px] text-dark-muted/70 truncate">
            {project.next_action}
          </p>
        )}

        {/* GitHub badges */}
        {project.github_repo && (
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {project.github_ci_status === 'passing' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-medium">CI ✓</span>
            )}
            {project.github_ci_status === 'failing' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">CI ✗</span>
            )}
            {project.github_ci_status === 'pending' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 font-medium">CI ⟳</span>
            )}
            {(project.github_open_prs ?? 0) > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/15 text-accent-purple font-medium">
                {project.github_open_prs} PR{(project.github_open_prs ?? 0) > 1 ? 's' : ''}
              </span>
            )}
            {(project.github_stars ?? 0) > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                ★ {project.github_stars}
              </span>
            )}
            {project.github_last_push && (
              <span className="text-[10px] text-dark-muted/60">
                {pushAgo(project.github_last_push)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
