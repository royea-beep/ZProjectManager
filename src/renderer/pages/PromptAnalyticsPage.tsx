import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../services/api';
import type { PromptStat } from '../services/api';
import { ACTION_LABELS } from '../../shared/prompt-templates';
import type { PromptAction } from '../../shared/prompt-templates';
import { SkeletonTable } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';

function promptLabel(id: string): string {
  return ACTION_LABELS[id as PromptAction] || id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function rateColor(rate: number): string {
  if (rate >= 80) return 'text-accent-green';
  if (rate >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

export default function PromptAnalyticsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<PromptStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'action' | 'situational'>('all');

  useEffect(() => {
    api.getPromptStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return stats;
    return stats.filter(s => s.prompt_type === filter);
  }, [stats, filter]);

  // Summary stats
  const totalUses = stats.reduce((s, r) => s + r.total_uses, 0);
  const totalSuccesses = stats.reduce((s, r) => s + r.successes, 0);
  const avgSuccessRate = totalUses > 0 ? Math.round((totalSuccesses / totalUses) * 100) : 0;
  const mostUsed = stats[0];

  // Patterns derived from stats
  const patterns = useMemo(() => {
    const p: string[] = [];
    for (const s of stats) {
      if (s.total_uses >= 3 && s.success_rate >= 80) {
        p.push(`${promptLabel(s.prompt_id)} has ${s.success_rate}% success rate over ${s.total_uses} uses`);
      }
      if (s.total_uses >= 3 && s.success_rate < 50) {
        p.push(`${promptLabel(s.prompt_id)} struggles — only ${s.success_rate}% success (${s.failures} failures)`);
      }
    }
    return p.slice(0, 5);
  }, [stats]);

  const handleExportCSV = () => {
    const header = 'Prompt,Type,Uses,Successes,Failures,Success Rate\n';
    const rows = stats.map(s =>
      `"${promptLabel(s.prompt_id)}","${s.prompt_type}",${s.total_uses},${s.successes},${s.failures},${s.success_rate}%`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported', 'success');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">📊 Prompt Analytics</h1>
          <p className="text-xs text-dark-muted mt-0.5">Which prompts work best — rated outcomes build this data over time</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={stats.length === 0}
          className="text-xs px-3 py-1.5 rounded-lg border border-dark-border text-dark-muted hover:text-dark-text hover:border-accent-blue/40 transition-colors disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {/* Summary KPIs */}
      {!loading && stats.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-dark-text">{totalUses}</div>
            <div className="text-xs text-dark-muted mt-1">Total prompts used</div>
          </div>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${rateColor(avgSuccessRate)}`}>{avgSuccessRate}%</div>
            <div className="text-xs text-dark-muted mt-1">Avg success rate</div>
          </div>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-4 text-center">
            <div className="text-sm font-bold text-accent-blue truncate">{mostUsed ? promptLabel(mostUsed.prompt_id) : '—'}</div>
            <div className="text-xs text-dark-muted mt-1">Most used prompt</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {!loading && stats.length > 0 && (
        <div className="flex gap-1 mb-4">
          {(['all', 'action', 'situational'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/40' : 'border-dark-border text-dark-muted hover:text-dark-text'
              }`}
            >
              {f === 'all' ? 'All' : f === 'action' ? '🔨 Actions' : '🎯 Situational'}
            </button>
          ))}
        </div>
      )}

      {/* Stats table */}
      <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden mb-6">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="🤖"
              title="No rated prompts yet"
              description="Use the Prompt Engine to generate prompts, then rate outcomes with ✓ Worked / ~ Partial / ✗ Failed. Analytics build here over time."
              compact
            />
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-dark-border text-dark-muted">
                <th className="text-left px-4 py-2.5 font-medium">Prompt</th>
                <th className="text-right px-3 py-2.5 font-medium">Used</th>
                <th className="text-right px-3 py-2.5 font-medium text-accent-green">✓</th>
                <th className="text-right px-3 py-2.5 font-medium text-red-400">✗</th>
                <th className="text-right px-3 py-2.5 font-medium">Rate</th>
                <th className="px-4 py-2.5 font-medium w-32">Bar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.prompt_id} className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-dark-text">{promptLabel(s.prompt_id)}</div>
                    <div className="text-[10px] text-dark-muted/60">{s.prompt_type}</div>
                  </td>
                  <td className="text-right px-3 py-2.5 text-dark-muted">{s.total_uses}</td>
                  <td className="text-right px-3 py-2.5 text-accent-green">{s.successes}</td>
                  <td className="text-right px-3 py-2.5 text-red-400">{s.failures}</td>
                  <td className={`text-right px-3 py-2.5 font-medium ${rateColor(s.success_rate)}`}>
                    {s.success_rate}%
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="h-2 bg-dark-bg rounded-full overflow-hidden w-full">
                      <div
                        className={`h-full rounded-full transition-all ${
                          s.success_rate >= 80 ? 'bg-accent-green' : s.success_rate >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${s.success_rate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Patterns learned */}
      {patterns.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <p className="text-xs font-semibold text-dark-text mb-3">🧠 Patterns Learned</p>
          <div className="space-y-2">
            {patterns.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue shrink-0 mt-1.5" />
                <span className="text-dark-muted">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && stats.length === 0 && (
        <EmptyState
          icon="📊"
          title="No analytics yet"
          description="Start using the Prompt Engine and rate prompt outcomes. Each rating (✓/~/✗) teaches the system which prompts work best for which situations."
        />
      )}
    </div>
  );
}
