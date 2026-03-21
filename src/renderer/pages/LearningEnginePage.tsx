import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectQualityReport, CodeQualityIssue } from '../../main/learning-engine';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Critical' },
  high:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'High' },
  medium:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Medium' },
  low:      { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', label: 'Low' },
} as const;

const TYPE_EMOJI: Record<string, string> = {
  duplicate: '♻️',
  outdated: '📦',
  missing: '❓',
  improvement: '⬆️',
  security: '🔒',
};

interface SharedUtilRec {
  project: string;
  util: string;
  savesLines: number;
  effort: string;
  priority: number;
}

export default function LearningEnginePage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ProjectQualityReport[]>([]);
  const [recs, setRecs] = useState<SharedUtilRec[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'duplicate' | 'security'>('all');
  const [activeTab, setActiveTab] = useState<'scores' | 'issues' | 'shared-utils'>('scores');

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const [r, rec] = await Promise.all([
        window.api.invoke('learning:analyze-all') as Promise<ProjectQualityReport[]>,
        window.api.invoke('learning:get-shared-utils-recs') as Promise<SharedUtilRec[]>,
      ]);
      setReports(r || []);
      setRecs(rec || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { run(); }, [run]);

  const allIssues = reports
    .flatMap(r => r.issues.map((i: CodeQualityIssue) => ({ ...i, project: r.projectName })))
    .filter(i => {
      if (filter === 'all') return true;
      if (filter === 'critical') return i.severity === 'critical';
      if (filter === 'high') return i.severity === 'high' || i.severity === 'critical';
      return i.type === filter;
    })
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    });

  const avgScore = reports.length
    ? Math.round(reports.reduce((s, r) => s + r.overallScore, 0) / reports.length)
    : 0;

  const criticalCount = reports.flatMap(r => r.issues).filter(i => i.severity === 'critical').length;
  const totalSavings = recs.reduce((s, r) => s + r.savesLines, 0);

  return (
    <div className="flex gap-0 h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-dark-text">Learning Engine</h2>
            <p className="text-xs text-dark-muted mt-0.5">
              Code quality · Shared utils · Continuous improvement
              {criticalCount > 0 && <span className="text-red-400 ml-2">· {criticalCount} critical</span>}
              {totalSavings > 0 && <span className="text-green-400 ml-2">· {totalSavings} lines to save</span>}
            </p>
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-50"
          >
            {loading ? '⏳ Scanning...' : '🔍 Scan All Projects'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-dark-border pb-3">
          {(['scores', 'issues', 'shared-utils'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === tab ? 'bg-blue-500/15 text-blue-400' : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              {tab === 'scores' ? `Quality Scores (${reports.length})`
               : tab === 'issues' ? `Issues (${allIssues.length})`
               : `Shared Utils Recs (${recs.length})`}
            </button>
          ))}
        </div>

        {/* Scores tab */}
        {activeTab === 'scores' && (
          <div className="space-y-2">
            {/* Avg score bar */}
            <div className="flex items-center gap-4 p-3 bg-dark-surface border border-dark-border rounded-xl mb-4">
              <div className="text-center shrink-0">
                <p className="text-3xl font-black" style={{
                  color: avgScore >= 80 ? '#22c55e' : avgScore >= 60 ? '#f59e0b' : '#ef4444'
                }}>{avgScore}</p>
                <p className="text-[10px] text-dark-muted">avg score</p>
              </div>
              <div className="flex-1">
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${avgScore}%`,
                    background: avgScore >= 80 ? '#22c55e' : avgScore >= 60 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
                <p className="text-[10px] text-dark-muted mt-1">
                  {reports.filter(r => r.overallScore >= 80).length} projects healthy ·{' '}
                  {reports.filter(r => r.overallScore < 60).length} need attention
                </p>
              </div>
            </div>

            {reports.length === 0 && !loading && (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-sm text-dark-muted">Click "Scan All Projects" to run quality analysis</p>
              </div>
            )}

            {reports.map(report => {
              const scoreColor = report.overallScore >= 80 ? '#22c55e' : report.overallScore >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div
                  key={report.projectName}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedProject === report.projectName
                      ? 'border-blue-500/40 bg-blue-500/5'
                      : 'border-dark-border hover:border-dark-border/60'
                  }`}
                  onClick={() => setSelectedProject(selectedProject === report.projectName ? null : report.projectName)}
                >
                  <div className="text-center shrink-0 w-10">
                    <p className="text-lg font-black" style={{ color: scoreColor }}>{report.overallScore}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-dark-text">{report.projectName}</p>
                      {report.usesSharedUtils && (
                        <span className="text-[9px] px-1 rounded bg-green-400/10 text-green-400">shared-utils ✓</span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {report.issues.filter(i => i.severity === 'critical').length > 0 && (
                        <span className="text-[9px] px-1 rounded bg-red-400/10 text-red-400">
                          {report.issues.filter(i => i.severity === 'critical').length} critical
                        </span>
                      )}
                      {report.issues.filter(i => i.severity === 'high').length > 0 && (
                        <span className="text-[9px] px-1 rounded bg-yellow-400/10 text-yellow-400">
                          {report.issues.filter(i => i.severity === 'high').length} high
                        </span>
                      )}
                      {report.missingSharedUtils.length > 0 && (
                        <span className="text-[9px] px-1 rounded bg-blue-400/10 text-blue-400">
                          {report.missingSharedUtils.length} missing utils
                        </span>
                      )}
                      {report.bestPracticesApplied.length > 0 && (
                        <span className="text-[9px] px-1 rounded bg-green-400/10 text-green-400">
                          {report.bestPracticesApplied.length} best practices
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1 w-20 bg-dark-bg rounded-full overflow-hidden shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${report.overallScore}%`, background: scoreColor }} />
                  </div>
                </div>
              );
            })}

            {/* Expanded project detail */}
            {selectedProject && (() => {
              const report = reports.find(r => r.projectName === selectedProject);
              if (!report) return null;
              return (
                <div className="mt-3 p-4 bg-dark-surface border border-dark-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-dark-text">{report.projectName}</h4>
                    <button
                      onClick={() => {
                        const proj = reports.find(r => r.projectName === selectedProject);
                        if (proj?.repoPath) navigate('/');
                      }}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Open Project →
                    </button>
                  </div>
                  {report.bestPracticesApplied.length > 0 && (
                    <div>
                      <p className="text-[10px] text-green-400 font-medium mb-1">Best practices applied:</p>
                      {report.bestPracticesApplied.map((bp, i) => (
                        <p key={i} className="text-xs text-dark-muted">✓ {bp}</p>
                      ))}
                    </div>
                  )}
                  {report.recommendations.length > 0 && (
                    <div>
                      <p className="text-[10px] text-blue-400 font-medium mb-1">Recommendations:</p>
                      {report.recommendations.map((rec, i) => (
                        <p key={i} className="text-xs text-dark-muted">→ {rec}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Issues tab */}
        {activeTab === 'issues' && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['all', 'critical', 'high', 'duplicate', 'security'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    filter === f
                      ? 'bg-dark-surface border-blue-500 text-blue-400'
                      : 'border-dark-border text-dark-muted hover:text-dark-text'
                  }`}
                >
                  {f} ({
                    f === 'all' ? allIssues.length
                    : f === 'critical' ? allIssues.filter(i => i.severity === 'critical').length
                    : f === 'high' ? allIssues.filter(i => i.severity === 'high' || i.severity === 'critical').length
                    : allIssues.filter(i => i.type === f).length
                  })
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {allIssues.map((issue, idx) => {
                const sev = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.low;
                return (
                  <div key={idx} className="p-3 rounded-xl border" style={{ borderColor: sev.bg, background: sev.bg }}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-sm">{TYPE_EMOJI[issue.type] ?? '•'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-dark-muted">{issue.project}</span>
                          <span className="text-[9px] px-1 rounded" style={{ background: sev.bg, color: sev.color }}>
                            {sev.label}
                          </span>
                          {issue.file && (
                            <span className="text-[9px] text-dark-muted font-mono">{issue.file.slice(0, 40)}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-dark-text">{issue.title}</p>
                        <p className="text-[10px] text-dark-muted mt-0.5">{issue.description}</p>
                      </div>
                    </div>
                    <div className="pl-6">
                      <p className="text-[10px] font-mono text-dark-text/70 bg-dark-bg px-2 py-1 rounded">
                        {issue.suggestedFix}
                      </p>
                      {issue.sharedUtilAvailable && (
                        <p className="text-[10px] text-green-400 mt-1">
                          ✓ Available: {issue.sharedUtilAvailable}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {allIssues.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-sm text-dark-text">No issues for this filter</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Shared utils recommendations tab */}
        {activeTab === 'shared-utils' && (
          <div className="space-y-3">
            {totalSavings > 0 && (
              <div className="p-3 bg-green-400/5 border border-green-400/20 rounded-xl mb-4">
                <p className="text-xs font-semibold text-green-400">
                  Total potential savings: {totalSavings} lines across {recs.length} recommendations
                </p>
                <p className="text-[10px] text-dark-muted mt-1">Ranked by ROI (lines saved ÷ effort)</p>
              </div>
            )}

            {recs.map((rec, i) => (
              <div key={i} className="p-3 rounded-xl border border-dark-border bg-dark-surface">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-dark-muted">#{i + 1}</span>
                  <p className="text-xs font-medium text-dark-text">{rec.project}</p>
                  <span className="ml-auto text-xs text-blue-400 font-mono">{rec.util}</span>
                </div>
                <div className="flex gap-3 text-[10px] text-dark-muted">
                  <span>Saves ~{rec.savesLines} lines</span>
                  <span>·</span>
                  <span>Effort: {rec.effort}</span>
                  <span>·</span>
                  <span>ROI: {Math.round(rec.priority)}</span>
                </div>
              </div>
            ))}

            {recs.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-2">🌟</div>
                <p className="text-sm text-dark-text">All projects optimally use shared-utils</p>
                <p className="text-xs text-dark-muted mt-1">Run a scan to check</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
