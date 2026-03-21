import React, { useState, useEffect } from 'react';
import type { Project } from '../../shared/types';
import type { ExpertPanelResult, ExpertOpinion } from '../../main/expert-panel-engine';

interface Props {
  project: Project;
}

interface PanelSummary {
  id: string;
  action: string;
  task_description: string;
  consensus_score: number;
  expert_count: number;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  'add-feature': 'Add Feature',
  'fix-bugs': 'Fix Bugs',
  'audit-codebase': 'Audit Codebase',
  'audit-full': 'Full Audit',
  'add-database': 'Add Database',
  'deploy-vercel': 'Deploy Vercel',
  'add-payments': 'Add Payments',
  'optimize-performance': 'Optimize Performance',
  'add-mobile': 'Add Mobile',
  'add-auth': 'Add Auth',
  'add-ai': 'Add AI',
  'add-gamification': 'Add Gamification',
  'add-social': 'Add Social',
  'add-analytics': 'Add Analytics',
  'onboarding': 'Onboarding',
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'text-green-400 bg-green-400/10 border-green-400/30'
    : score >= 6 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    : 'text-red-400 bg-red-400/10 border-red-400/30';
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

function ExpertCard({ opinion }: { opinion: ExpertOpinion }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-dark-text">{opinion.expertName}</span>
            <span className="text-xs text-dark-muted">{opinion.company}</span>
            <ScoreBadge score={opinion.score} />
          </div>
          <p className="text-xs text-dark-muted mt-0.5 italic">"{opinion.quote}"</p>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-dark-muted hover:text-dark-text text-xs flex-shrink-0"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-dark-border pt-2">
          <div>
            <span className="text-xs font-medium text-blue-400">Top recommendation</span>
            <p className="text-xs text-dark-text mt-0.5">{opinion.topRecommendation}</p>
          </div>
          {opinion.criticalIssue && (
            <div>
              <span className="text-xs font-medium text-red-400">⚠ Critical issue</span>
              <p className="text-xs text-dark-text mt-0.5">{opinion.criticalIssue}</p>
            </div>
          )}
          {opinion.wouldRemove && (
            <div>
              <span className="text-xs font-medium text-orange-400">🗑 Would remove</span>
              <p className="text-xs text-dark-text mt-0.5">{opinion.wouldRemove}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExpertPanelTab({ project }: Props) {
  const [panels, setPanels] = useState<PanelSummary[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<(ExpertPanelResult & { _fromCache?: boolean; _cachedAt?: string }) | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  // Run panel form state
  const [action, setAction] = useState('add-feature');
  const [taskDesc, setTaskDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'run' | 'history'>('run');

  useEffect(() => {
    loadPanels();
  }, [project.id]);

  async function loadPanels() {
    setLoading(true);
    try {
      const result = await window.api.invoke('prompts:get-expert-panels', project.id) as PanelSummary[];
      setPanels(result || []);
      if (result?.length > 0 && !selectedId) {
        loadPanel(result[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadPanel(id: string) {
    setSelectedId(id);
    const panel = await window.api.invoke('prompts:get-expert-panel', id) as ExpertPanelResult;
    setSelectedPanel(panel);
    setActiveTab('history');
  }

  async function handleRunPanel(forceRefresh = false) {
    if (!taskDesc.trim()) { setError('Enter a task description'); return; }
    setError('');
    setRunning(true);
    try {
      const panel = await window.api.invoke('prompts:run-expert-panel', {
        projectId: project.id,
        action,
        taskDescription: taskDesc.trim(),
        forceRefresh,
      }) as ExpertPanelResult & { _fromCache?: boolean; _cachedAt?: string };
      await loadPanels();
      setSelectedPanel(panel);
      setActiveTab('history');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Expert panel failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-dark-text">Expert Panel</h3>
          <p className="text-xs text-dark-muted mt-0.5">
            25 domain experts simulate feedback on your task before you build it
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('run')}
            className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'run' ? 'bg-blue-600 text-white' : 'bg-dark-bg text-dark-muted border border-dark-border hover:text-dark-text'}`}
          >
            Run Panel
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-dark-bg text-dark-muted border border-dark-border hover:text-dark-text'}`}
          >
            History {panels.length > 0 && `(${panels.length})`}
          </button>
        </div>
      </div>

      {/* Run Panel Tab */}
      {activeTab === 'run' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-dark-muted block mb-1">Action type</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm text-dark-text focus:outline-none focus:border-blue-500"
            >
              {Object.entries(ACTION_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-dark-muted block mb-1">Task description</label>
            <textarea
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              placeholder={`Describe what you're about to build for ${project.name}...`}
              rows={4}
              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm text-dark-text focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={() => handleRunPanel(false)}
            disabled={running}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {running ? (
              <>
                <span className="animate-spin">⟳</span>
                Consulting experts...
              </>
            ) : (
              '▶ Run Expert Panel'
            )}
          </button>

          {running && (
            <div className="bg-dark-bg border border-dark-border rounded p-3">
              <p className="text-xs text-dark-muted">Calling 5 domain experts in parallel via Claude Haiku...</p>
              <div className="mt-2 flex gap-1 flex-wrap">
                {['UX', 'Product', 'Engineering', 'Security', 'Scale'].map(d => (
                  <span key={d} className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded animate-pulse">{d}</span>
                ))}
              </div>
            </div>
          )}

          {panels.length === 0 && !running && (
            <div className="bg-dark-bg border border-dark-border rounded p-4 text-center">
              <p className="text-2xl mb-2">👥</p>
              <p className="text-sm text-dark-muted">No panels run yet.</p>
              <p className="text-xs text-dark-muted mt-1">Describe your task above and run your first expert panel.</p>
              <p className="text-xs text-dark-muted mt-1">Make sure your Anthropic API key is set in Settings.</p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading && <p className="text-xs text-dark-muted">Loading panels...</p>}

          {panels.length === 0 && !loading && (
            <p className="text-sm text-dark-muted text-center py-4">No panels yet — run your first panel above.</p>
          )}

          {/* Panel list */}
          {panels.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {panels.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadPanel(p.id)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${selectedId === p.id ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-dark-bg border-dark-border text-dark-muted hover:text-dark-text'}`}
                >
                  <span className="font-medium">{ACTION_LABELS[p.action] || p.action}</span>
                  <span className="ml-1.5 opacity-70">{p.consensus_score.toFixed(1)}/10</span>
                  <span className="ml-1.5 opacity-50">{new Date(p.created_at).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected panel result */}
          {selectedPanel && (
            <div className="space-y-4">
              {/* Cache indicator */}
              {selectedPanel._fromCache && (
                <div className="flex items-center gap-2 text-[10px] text-dark-muted">
                  <span>⚡ From cache ({selectedPanel._cachedAt ? new Date(selectedPanel._cachedAt).toLocaleTimeString('he-IL') : ''})</span>
                  <button onClick={() => handleRunPanel(true)} className="text-accent-blue hover:underline">Refresh</button>
                </div>
              )}
              {/* Summary header */}
              <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-dark-text">
                      {selectedPanel.experts.length} experts reviewed
                    </p>
                    <p className="text-xs text-dark-muted mt-0.5 line-clamp-2">"{selectedPanel.task}"</p>
                  </div>
                  <div className="text-center flex-shrink-0 ml-3">
                    <div className="text-2xl font-bold text-dark-text">{selectedPanel.consensusScore.toFixed(1)}</div>
                    <div className="text-xs text-dark-muted">avg score</div>
                  </div>
                </div>
                <p className="text-xs text-dark-muted">{selectedPanel.panelSummary}</p>
              </div>

              {/* Top recommendations */}
              {selectedPanel.topRecommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">Top Recommendations</h4>
                  <div className="space-y-2">
                    {selectedPanel.topRecommendations.slice(0, 7).map((rec, i) => (
                      <div key={i} className="bg-dark-bg border border-dark-border rounded p-2.5 flex gap-2">
                        <span className="text-dark-muted text-xs font-mono flex-shrink-0 w-4">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs">{rec.type === 'remove' ? '🗑️' : rec.type === 'risk' ? '⚠️' : '✅'}</span>
                            <ScoreBadge score={rec.score} />
                            <span className="text-sm text-dark-text">{rec.title}</span>
                          </div>
                          <p className="text-xs text-dark-muted mt-0.5 italic line-clamp-1">
                            {rec.experts.join(', ')}: "{rec.quote.slice(0, 90)}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critical risks */}
              {selectedPanel.criticalRisks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Critical Risks</h4>
                  <div className="space-y-1">
                    {selectedPanel.criticalRisks.map((r, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="text-red-400 flex-shrink-0">⚠</span>
                        <span className="text-dark-text">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Things to remove */}
              {selectedPanel.removals.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-2">Consider Removing</h4>
                  <div className="space-y-1">
                    {selectedPanel.removals.map((r, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="text-orange-400 flex-shrink-0">🗑</span>
                        <span className="text-dark-text">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expert cards */}
              <div>
                <h4 className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                  Expert Opinions ({selectedPanel.opinions.length})
                </h4>
                <div className="space-y-2">
                  {selectedPanel.opinions.map(o => (
                    <ExpertCard key={o.expertId} opinion={o} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
