import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import * as api from '../services/api';
import type { RecommendedActions } from '../services/api';
import { ACTION_LABELS } from '../../shared/prompt-templates';
import type { PromptAction } from '../../shared/prompt-templates';
import type { Project } from '../../shared/types';
import HealthRing from '../components/HealthRing';
import NextStepsWidget from '../components/NextStepsWidget';
import { useToast } from '../components/Toast';
import { STAGE_LABELS } from '../../shared/constants';

const URGENCY_COLORS: Record<string, string> = {
  critical: 'text-red-400 border-red-400/30 bg-red-400/10',
  high:     'text-orange-400 border-orange-400/30 bg-orange-400/10',
  medium:   'text-accent-blue border-accent-blue/30 bg-accent-blue/10',
  low:      'text-dark-muted border-dark-border bg-dark-bg',
};

const STAGE_ORDER = [
  'concept', 'research', 'architecture', 'setup', 'development',
  'building', 'alpha', 'content_assets', 'launch_prep', 'testflight',
  'pre-launch', 'live', 'live_optimization', 'scaling',
  'maintenance', 'paused', 'pivot', 'scaffold',
];

function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function ciColor(status: string | null): string {
  if (status === 'passing') return 'text-accent-green';
  if (status === 'failing') return 'text-red-400';
  if (status === 'pending') return 'text-yellow-400';
  return 'text-dark-muted/40';
}

interface ProjectRowProps {
  project: Project;
  onNavigate: (id: number) => void;
}

function ProjectRow({ project, onNavigate }: ProjectRowProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [rec, setRec] = useState<RecommendedActions | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUsageId] = useState<string>(() => Math.random().toString(36).slice(2));
  const [outcome, setOutcome] = useState<string | null>(null);

  const loadRec = useCallback(async () => {
    if (rec) return;
    try {
      const r = await api.getRecommendedActions({
        stage: project.stage,
        category: project.category || 'web-saas',
        health_score: project.health_score,
        github_ci_status: project.github_ci_status,
        github_open_prs: project.github_open_prs,
        main_blocker: project.main_blocker,
        mrr: project.mrr,
      });
      setRec(r);
    } catch { /* silent */ }
  }, [project, rec]);

  const handleExpand = () => {
    setExpanded(e => !e);
    loadRec();
  };

  const handleGenerate = useCallback(async (action: string) => {
    setGenerating(true);
    setGeneratedPrompt('');
    try {
      const result = await api.generatePrompt({ projectId: project.id, action: action as PromptAction });
      setGeneratedPrompt(result);
      await api.logPromptUsage({ promptType: 'action', promptId: action, projectId: project.id });
    } catch {
      toast('Failed to generate prompt', 'error');
    } finally {
      setGenerating(false);
    }
  }, [project.id, toast]);

  const handleCopy = useCallback(async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  }, [generatedPrompt, toast]);

  const handleOutcome = useCallback(async (o: string) => {
    setOutcome(o);
    await api.updatePromptOutcome({ id: lastUsageId, outcome: o });
  }, [lastUsageId]);

  // Quick generate on ⚡ click (no expand)
  const handleQuickGenerate = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = rec || await (async () => {
      const r2 = await api.getRecommendedActions({
        stage: project.stage,
        category: project.category || 'web-saas',
        health_score: project.health_score,
        github_ci_status: project.github_ci_status,
        github_open_prs: project.github_open_prs,
        main_blocker: project.main_blocker,
        mrr: project.mrr,
      });
      setRec(r2);
      return r2;
    })();
    setExpanded(true);
    handleGenerate(r.primary);
  }, [rec, project, handleGenerate]);

  const urgencyClass = rec ? URGENCY_COLORS[rec.urgency] : URGENCY_COLORS.low;

  return (
    <div className={`border border-dark-border rounded-lg overflow-hidden transition-all ${expanded ? 'border-dark-border/70' : 'hover:border-dark-border/50'}`}>
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={handleExpand}
      >
        <HealthRing score={project.health_score} size={32} strokeWidth={3} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark-text truncate">{project.name}</span>
            {project.github_ci_status && (
              <span className={`text-[10px] ${ciColor(project.github_ci_status)}`} title={`CI: ${project.github_ci_status}`}>
                {project.github_ci_status === 'passing' ? '✓' : project.github_ci_status === 'failing' ? '✗' : '⟳'}
              </span>
            )}
            {(project.github_open_prs || 0) > 0 && (
              <span className="text-[10px] text-dark-muted">{project.github_open_prs} PR{(project.github_open_prs || 0) > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="text-[10px] text-dark-muted mt-0.5 flex items-center gap-2">
            {project.tech_stack && <span>{typeof project.tech_stack === 'string' ? project.tech_stack.split(',')[0] : (project.tech_stack as string[])[0] || ''}</span>}
            {project.mrr ? <span className="text-accent-green">₪{project.mrr}/mo</span> : null}
          </div>
        </div>

        {rec && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${urgencyClass}`}>
            {ACTION_LABELS[rec.primary as PromptAction] || rec.primary}
          </span>
        )}

        <button
          onClick={handleQuickGenerate}
          disabled={generating}
          title="Generate recommended prompt"
          className="shrink-0 text-sm w-7 h-7 flex items-center justify-center rounded border border-dark-border text-dark-muted hover:text-accent-blue hover:border-accent-blue/40 transition-colors disabled:opacity-40"
        >
          {generating ? <span className="animate-pulse text-[10px]">…</span> : '⚡'}
        </button>

        <button
          onClick={e => { e.stopPropagation(); onNavigate(project.id); }}
          title="Open project"
          className="shrink-0 text-[10px] text-dark-muted hover:text-dark-text transition-colors"
        >
          →
        </button>

        <span className="shrink-0 text-dark-muted/40 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-dark-border bg-dark-bg px-4 py-4">
          {rec && (
            <div className="mb-4">
              <p className="text-[10px] text-dark-muted mb-2">📍 {rec.reason}</p>
              <div className="flex flex-wrap gap-2">
                {[rec.primary, ...rec.secondary].map((action, i) => (
                  <button
                    key={action}
                    onClick={() => handleGenerate(action)}
                    disabled={generating}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                      i === 0
                        ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/40 hover:bg-accent-blue/25'
                        : 'bg-dark-surface border-dark-border text-dark-muted hover:text-dark-text hover:border-dark-border/70'
                    }`}
                  >
                    {i === 0 && '⚡ '}{ACTION_LABELS[action as PromptAction] || action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generated prompt */}
          {generating && (
            <div className="text-center py-4 text-sm text-dark-muted animate-pulse">Generating...</div>
          )}

          {generatedPrompt && !generating && (
            <div>
              <div
                className="bg-dark-surface border border-dark-border rounded-lg p-3 text-[10px] font-mono text-dark-text/80 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto cursor-pointer"
                onClick={handleCopy}
                title="Click to copy"
              >
                {generatedPrompt}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleCopy}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    copied ? 'border-accent-green/40 bg-accent-green/10 text-accent-green' : 'border-dark-border text-dark-muted hover:text-dark-text'
                  }`}
                >
                  {copied ? 'Copied ✓' : 'Copy prompt'}
                </button>
                <span className="text-[10px] text-dark-muted">{generatedPrompt.length.toLocaleString()} chars</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-dark-muted">Did it work?</span>
                  {(['success', 'partial', 'failure'] as const).map(o => (
                    <button
                      key={o}
                      onClick={() => handleOutcome(o)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        outcome === o
                          ? o === 'success' ? 'border-accent-green/60 bg-accent-green/15 text-accent-green'
                            : o === 'partial' ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-400'
                            : 'border-red-400/60 bg-red-400/10 text-red-400'
                          : 'border-dark-border text-dark-muted hover:border-dark-border/70'
                      }`}
                    >
                      {o === 'success' ? '✓ Worked' : o === 'partial' ? '~ Partial' : '✗ Failed'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!generatedPrompt && !generating && !rec && (
            <p className="text-xs text-dark-muted text-center py-2">Loading recommendations...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage({ activeWorkspaceId = 0 }: { activeWorkspaceId?: number }) {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // Get all unique stages present
  const presentStages = useMemo(() => {
    const seen = new Set<string>();
    for (const p of projects) seen.add(p.stage);
    return STAGE_ORDER.filter(s => seen.has(s));
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (activeWorkspaceId && p.workspace_id !== activeWorkspaceId) return false;
      if (stageFilter !== 'all' && p.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [projects, stageFilter, search, activeWorkspaceId]);

  // Grouped by stage in order
  const grouped = useMemo(() => {
    const map: Record<string, Project[]> = {};
    for (const p of filtered) {
      if (!map[p.stage]) map[p.stage] = [];
      map[p.stage].push(p);
    }
    return map;
  }, [filtered]);

  const orderedStages = useMemo(() => STAGE_ORDER.filter(s => grouped[s]?.length > 0), [grouped]);

  // Stats
  const stats = useMemo(() => ({
    total: projects.length,
    live: projects.filter(p => p.status === 'launched' || p.stage === 'live' || p.stage === 'live_optimization').length,
    avgHealth: projects.length ? Math.round(projects.reduce((s, p) => s + p.health_score, 0) / projects.length) : 0,
    critical: projects.filter(p => p.health_score < 40 || p.github_ci_status === 'failing').length,
  }), [projects]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-dark-muted text-sm">Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-dark-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Portfolio</h1>
              <p className="text-xs text-dark-muted mt-0.5">All projects · stage-grouped · recommended action per project</p>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-dark-text">{stats.total}</div>
                <div className="text-[10px] text-dark-muted">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent-green">{stats.live}</div>
                <div className="text-[10px] text-dark-muted">Live</div>
              </div>
              <div>
                <div className="text-lg font-bold text-dark-text">{stats.avgHealth}</div>
                <div className="text-[10px] text-dark-muted">Avg Health</div>
              </div>
              {stats.critical > 0 && (
                <div>
                  <div className="text-lg font-bold text-red-400">{stats.critical}</div>
                  <div className="text-[10px] text-dark-muted">Critical</div>
                </div>
              )}
            </div>
          </div>

          {/* Search + stage filters */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text placeholder-dark-muted/50 focus:outline-none focus:border-accent-blue w-52"
            />
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setStageFilter('all')}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                  stageFilter === 'all' ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/40' : 'border-dark-border text-dark-muted hover:text-dark-text'
                }`}
              >
                All
              </button>
              {presentStages.map(s => (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                    stageFilter === s ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/40' : 'border-dark-border text-dark-muted hover:text-dark-text'
                  }`}
                >
                  {stageLabel(s)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {orderedStages.length === 0 && (
            <div className="text-center py-16 text-dark-muted text-sm">No projects match your filter.</div>
          )}

          {orderedStages.map(stage => (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] uppercase tracking-wider text-dark-muted font-semibold">{stageLabel(stage)}</p>
                <span className="text-[10px] text-dark-muted/50">({grouped[stage].length})</span>
              </div>
              <div className="space-y-2">
                {grouped[stage].map(project => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onNavigate={id => navigate(`/project/${id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right sidebar: NextStepsWidget */}
      <div className="w-64 shrink-0 border-l border-dark-border p-4 overflow-y-auto">
        <NextStepsWidget context="portfolio" projects={projects} />
      </div>
    </div>
  );
}
