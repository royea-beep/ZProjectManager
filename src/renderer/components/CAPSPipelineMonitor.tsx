import React, { useState, useEffect, useCallback } from 'react';

const STATUS_COLORS: Record<string, string> = {
  bug_sent: '#F59E0B',
  crash_pending: '#F59E0B',
  bug_approved: '#3B82F6',
  crash_approved: '#3B82F6',
  bug_no_changes: '#6B7280',
  bug_dismissed: '#6B7280',
  crash_skipped: '#6B7280',
  timeout_expired: '#EF4444',
  sprint_added: '#8B5CF6',
  backlog: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  bug_sent: '⏳ Waiting for reply',
  crash_pending: '⏳ Waiting for reply',
  bug_approved: '🔧 Auto-fix approved',
  crash_approved: '🔧 Auto-fix approved',
  bug_no_changes: '🤷 No changes made',
  bug_dismissed: '🗑️ Dismissed',
  crash_skipped: '⏭️ Skipped',
  timeout_expired: '⏰ Expired',
  cancelled: '❌ Cancelled',
  approved: '✅ Approved',
};

interface FlowSession {
  id?: string | number;
  media_type?: string;
  preview?: string;
  minutes_ago?: number;
  github_run_id?: string | number;
  has_plan?: boolean;
  status: string;
}

interface PipelineHealth {
  stuck_sessions?: number;
  active_sessions?: number;
  processing?: number;
  completed_24h?: number;
  total_sessions?: number;
}

interface BugStats {
  open?: number;
  auto_fix_pending?: number;
  resolved_24h?: number;
}

interface CrashStats {
  real?: number;
  false_positive?: number;
  total?: number;
}

interface PipelineData {
  pipeline_health?: PipelineHealth;
  bugs?: BugStats;
  crashes?: CrashStats;
  recent_flow?: FlowSession[];
}

function TimeAgo({ minutes }: { minutes?: number }) {
  if (!minutes && minutes !== 0) return null;
  if (minutes < 60) return <span>{Math.round(minutes)}m ago</span>;
  if (minutes < 1440) return <span>{Math.round(minutes / 60)}h ago</span>;
  return <span>{Math.round(minutes / 1440)}d ago</span>;
}

function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#6B7280';
  const label = STATUS_LABELS[status] || status;
  return (
    <span style={{
      background: color + '22',
      color,
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function HealthCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 12,
      padding: '12px 16px',
      textAlign: 'center',
      minWidth: 0,
    }} className="bg-dark-bg border border-dark-border rounded-xl p-3 text-center">
      <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: 11, marginTop: 2 }} className="text-dark-muted">{label}</div>
      {sub && <div style={{ fontSize: 9, marginTop: 2 }} className="text-dark-muted/60">{sub}</div>}
    </div>
  );
}

export default function CAPSPipelineMonitor() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await window.api.invoke('caps:get-pipeline-monitor') as Record<string, unknown>;

      if (result?.error) {
        setError(result.error as string);
        return;
      }

      const content = result?.content as Array<{ type: string; content?: Array<{ text?: string }>; text?: string }> | undefined;

      const toolResults = content?.filter((b) => b.type === 'mcp_tool_result') || [];
      let parsed: PipelineData | null = null;

      for (const tr of toolResults) {
        const text = tr.content?.[0]?.text || '';
        try {
          const sqlResult = JSON.parse(text) as Record<string, unknown>;
          if (sqlResult?.result) {
            const rows = JSON.parse(sqlResult.result as string) as Array<{ get_pipeline_monitor?: PipelineData }>;
            if (rows?.[0]?.get_pipeline_monitor) {
              parsed = rows[0].get_pipeline_monitor;
            }
          } else if (Array.isArray(sqlResult) && (sqlResult as Array<{ get_pipeline_monitor?: PipelineData }>)[0]?.get_pipeline_monitor) {
            parsed = (sqlResult as Array<{ get_pipeline_monitor?: PipelineData }>)[0].get_pipeline_monitor ?? null;
          }
        } catch {
          try {
            const match = text.match(/\{[\s\S]*"timestamp"[\s\S]*\}/);
            if (match) parsed = JSON.parse(match[0]) as PipelineData;
          } catch { /* ignore */ }
        }
      }

      if (!parsed) {
        const textBlocks = content?.filter((b) => b.type === 'text').map((b) => b.text).join('\n') || '';
        try {
          const jsonMatch = textBlocks.match(/\{[\s\S]*"pipeline_health"[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]) as PipelineData;
        } catch { /* ignore */ }
      }

      if (parsed) {
        setData(parsed);
        setError(null);
        setLastRefresh(new Date());
      } else {
        setError('Could not parse pipeline data');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (!data && loading) {
    return (
      <div className="p-6 text-center text-dark-muted">
        <div className="text-lg mb-2">Loading pipeline data...</div>
        <div className="text-xs">Connecting to Supabase via MCP</div>
      </div>
    );
  }

  const ph = data?.pipeline_health || {};
  const bugs = data?.bugs || {};
  const crashes = data?.crashes || {};
  const flow = data?.recent_flow || [];

  return (
    <div style={{ padding: '8px 0', fontFamily: 'var(--font-sans)' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="text-[10px] text-dark-muted">
          {lastRefresh && `Updated ${lastRefresh.toLocaleTimeString()}`}
          {autoRefresh && ' · auto-refresh 30s'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-dark-text hover:border-accent-blue/40 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Refresh'}
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-3 py-1.5 rounded-lg border border-dark-border transition-colors ${
              autoRefresh
                ? 'bg-accent-green/10 text-accent-green border-accent-green/30'
                : 'bg-dark-surface text-dark-muted'
            }`}
          >
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Health cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        <HealthCard
          label="Stuck"
          value={ph.stuck_sessions || 0}
          color={(ph.stuck_sessions || 0) > 0 ? '#EF4444' : '#22c55e'}
          sub="> 30min no reply"
        />
        <HealthCard
          label="Waiting"
          value={ph.active_sessions || 0}
          color={(ph.active_sessions || 0) > 0 ? '#F59E0B' : '#6B7280'}
          sub="Bug/crash pending"
        />
        <HealthCard
          label="Processing"
          value={ph.processing || 0}
          color={(ph.processing || 0) > 0 ? '#3B82F6' : '#6B7280'}
          sub="Auto-fix running"
        />
        <HealthCard
          label="Done 24h"
          value={ph.completed_24h || 0}
          color="#22c55e"
          sub="Resolved/dismissed"
        />
      </div>

      {/* Bugs + Crashes row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div className="bg-dark-bg border border-dark-border rounded-xl p-3">
          <div className="text-xs font-medium text-dark-text mb-1.5">Bugs</div>
          <div className="flex gap-3 text-xs text-dark-muted">
            <span>Open: <b style={{ color: (bugs.open || 0) > 0 ? '#EF4444' : '#22c55e' }}>{bugs.open ?? 0}</b></span>
            <span>Fix pending: <b className="text-dark-text">{bugs.auto_fix_pending ?? 0}</b></span>
            <span>Resolved 24h: <b className="text-accent-green">{bugs.resolved_24h ?? 0}</b></span>
          </div>
        </div>
        <div className="bg-dark-bg border border-dark-border rounded-xl p-3">
          <div className="text-xs font-medium text-dark-text mb-1.5">Crashes</div>
          <div className="flex gap-3 text-xs text-dark-muted">
            <span>Real: <b style={{ color: (crashes.real || 0) > 0 ? '#EF4444' : '#22c55e' }}>{crashes.real ?? 0}</b></span>
            <span>False+: <b className="text-dark-text">{crashes.false_positive ?? 0}</b></span>
            <span>Total: <b className="text-dark-text">{crashes.total ?? 0}</b></span>
          </div>
        </div>
      </div>

      {/* Recent flow */}
      <div className="text-xs font-medium text-dark-text mb-1.5">Recent pipeline flow (48h)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {flow.map((s, i) => (
          <div
            key={s.id ?? i}
            style={{
              borderLeft: `3px solid ${STATUS_COLORS[s.status] || '#6B7280'}`,
            }}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 flex items-center gap-2 text-xs"
          >
            <span style={{ fontSize: 14 }}>{s.media_type === 'crash' ? '💥' : '🐛'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-dark-text truncate">
                {(s.preview || '').replace(/\*BUG REPORT\*\n/, '').replace(/💥 \*CRASH.*\n/, '').substring(0, 60)}
              </div>
              <div className="text-[10px] text-dark-muted mt-0.5">
                <TimeAgo minutes={s.minutes_ago} />
                {s.github_run_id && <span> · GH #{s.github_run_id}</span>}
                {s.has_plan && <span> · has fix plan</span>}
              </div>
            </div>
            <StatusPill status={s.status} />
          </div>
        ))}
        {flow.length === 0 && (
          <div className="text-center py-5 text-dark-muted text-xs border border-dashed border-dark-border rounded-xl">
            No sessions in the last 48 hours
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 text-[10px] text-dark-muted/60 text-center">
        CAPS Pipeline Monitor · {ph.total_sessions || 0} total sessions · Supabase gxrpunvhjcrzqnitbqah
      </div>
    </div>
  );
}
