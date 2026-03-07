import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { WeeklyDigest as WeeklyDigestType } from '../services/api';

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (s.getMonth() === e.getMonth()) {
    return `${months[s.getMonth()]} ${s.getDate()}-${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()} - ${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

export default function WeeklyDigest({ data }: { data: WeeklyDigestType }) {
  const navigate = useNavigate();
  const hasActivity = data.total_sessions > 0 || data.total_tasks_completed > 0 || data.decisions_made > 0;

  if (!hasActivity && data.health_changes.length === 0 && data.top_blockers.length === 0) {
    return null;
  }

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-accent-blue">
          This Week &mdash; {formatDateRange(data.period.start, data.period.end)}
        </h3>
        {data.streak_days > 1 && (
          <span className="text-xs font-semibold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full">
            {data.streak_days}-day streak!
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-dark-text">{data.total_sessions}</div>
          <div className="text-xs text-dark-muted">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent-green">{data.total_tasks_completed}</div>
          <div className="text-xs text-dark-muted">Tasks Done</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent-purple">{data.decisions_made}</div>
          <div className="text-xs text-dark-muted">Decisions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent-blue">{data.learnings_added}</div>
          <div className="text-xs text-dark-muted">Learnings</div>
        </div>
      </div>

      {/* Projects Worked On */}
      {data.projects_worked.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-dark-muted mb-1.5">Projects worked on:</div>
          <div className="space-y-1">
            {data.projects_worked.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs cursor-pointer hover:bg-dark-hover rounded px-1.5 py-1 -mx-1.5 transition-colors"
                onClick={() => navigate(`/project/${p.id}`)}
              >
                <span className="text-dark-text font-medium">{p.name}</span>
                <div className="flex items-center gap-3 text-dark-muted">
                  <span>{p.sessions} session{p.sessions !== 1 ? 's' : ''}</span>
                  {p.tasks_completed > 0 && (
                    <span className="text-accent-green">{p.tasks_completed} done</span>
                  )}
                  {p.tasks_created > 0 && (
                    <span className="text-accent-blue">+{p.tasks_created} new</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Changes */}
      {data.health_changes.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-dark-muted mb-1.5">Health changes:</div>
          <div className="space-y-1">
            {data.health_changes.map(h => {
              const improved = h.new_score > h.old_score;
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-dark-hover rounded px-1.5 py-1 -mx-1.5 transition-colors"
                  onClick={() => navigate(`/project/${h.id}`)}
                >
                  <span className="text-dark-text">{h.name}</span>
                  <span className={improved ? 'text-accent-green' : 'text-accent-red'}>
                    {h.old_score} {improved ? '\u2191' : '\u2193'} {h.new_score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Blockers */}
      {data.top_blockers.length > 0 && (
        <div>
          <div className="text-xs text-dark-muted mb-1.5">Active blockers:</div>
          <div className="space-y-1">
            {data.top_blockers.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-red shrink-0 mt-1" />
                <span className="text-dark-muted">{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
