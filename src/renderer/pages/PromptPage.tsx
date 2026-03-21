import React, { useState, useCallback, useEffect } from 'react';
import * as api from '../services/api';
import type { PromptAction, SituationMeta, SessionPatterns } from '../services/api';
import { ACTION_GROUPS, ACTION_LABELS } from '../../shared/prompt-templates';
import { PROJECT_CATEGORIES } from '../../shared/prompt-templates';
import type { Project } from '../../shared/types';
import { useToast } from '../components/Toast';

interface PromptPageProps {
  project: Project;
  onUpdate: (data: Partial<Project>) => Promise<unknown>;
}

const CHAR_COLORS: Record<number, string> = {};
function getCharColor(len: number): string {
  if (CHAR_COLORS[Math.floor(len / 100)]) return CHAR_COLORS[Math.floor(len / 100)];
  if (len < 2000) return 'text-dark-muted';
  if (len < 5000) return 'text-yellow-400';
  return 'text-accent-green';
}

type MainTab = 'actions' | 'situations';

const SITUATION_CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  workflow: { label: 'Workflow', emoji: '🔄' },
  problem: { label: 'Problems', emoji: '🐛' },
  organization: { label: 'Organization', emoji: '📁' },
  special: { label: 'Special', emoji: '⚡' },
};

export default function PromptPage({ project, onUpdate }: PromptPageProps) {
  const { toast } = useToast();

  // Shared
  const [mainTab, setMainTab] = useState<MainTab>('actions');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Actions tab
  const [selectedAction, setSelectedAction] = useState<PromptAction | ''>('');
  const [extraContext, setExtraContext] = useState('');
  const [editingCategory, setEditingCategory] = useState(false);

  // Situations tab
  const [situations, setSituations] = useState<SituationMeta[]>([]);
  const [selectedSituation, setSelectedSituation] = useState<SituationMeta | null>(null);
  const [situationContext, setSituationContext] = useState<Record<string, string>>({});
  const [patterns, setPatterns] = useState<SessionPatterns | null>(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  // Last-used prompt ID for outcome tracking
  const [lastUsageId, setLastUsageId] = useState<string | null>(null);

  useEffect(() => {
    api.getSituations().then(setSituations).catch(() => {});
  }, []);

  const loadPatterns = useCallback(async () => {
    if (!project.repo_path) return;
    setLoadingPatterns(true);
    try {
      const p = await api.analyzeSessionPatterns(project.repo_path);
      setPatterns(p);
    } catch { /* no sessions dir yet */ } finally {
      setLoadingPatterns(false);
    }
  }, [project.repo_path]);

  // Actions tab handlers
  const handleGenerate = useCallback(async () => {
    if (!selectedAction) return;
    setGenerating(true);
    setGeneratedPrompt('');
    try {
      const result = await api.generatePrompt({
        projectId: project.id,
        action: selectedAction as PromptAction,
        extraContext: extraContext.trim() || undefined,
      });
      setGeneratedPrompt(result);
      // Log usage
      const usageRes = await api.logPromptUsage({ promptType: 'action', promptId: selectedAction, projectId: project.id });
      if (usageRes?.ok) {
        // We don't get back the ID from logPromptUsage easily; outcome tracking is best-effort
      }
    } catch (err) {
      toast('Failed to generate prompt', 'error');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [selectedAction, extraContext, project.id, toast]);

  // Situations tab handlers
  const handleSituationSelect = (s: SituationMeta) => {
    setSelectedSituation(s);
    // Pre-fill context with project data for common fields
    setSituationContext({
      projectName: project.name,
      projectPath: project.repo_path || `C:/Projects/${project.name}`,
    });
    setGeneratedPrompt('');
  };

  const handleGenerateSituational = useCallback(async () => {
    if (!selectedSituation) return;
    setGenerating(true);
    setGeneratedPrompt('');
    try {
      const result = await api.generateSituationalPrompt({
        situation: selectedSituation.id,
        context: situationContext,
      });
      setGeneratedPrompt(result);
      await api.logPromptUsage({ promptType: 'situational', promptId: selectedSituation.id, projectId: project.id });
    } catch (err) {
      toast('Failed to generate situational prompt', 'error');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [selectedSituation, situationContext, project.id, toast]);

  const handleCopy = useCallback(async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast('Prompt copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  }, [generatedPrompt, toast]);

  const handleCategoryChange = async (category: string) => {
    await onUpdate({ category });
    setEditingCategory(false);
    toast('Category saved', 'success');
  };

  const promptLen = generatedPrompt.length;

  // Group situations by category
  const situationsByCategory = situations.reduce<Record<string, SituationMeta[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="flex gap-0 h-full -m-6">
      {/* Left sidebar */}
      <div className="w-52 shrink-0 border-r border-dark-border overflow-y-auto py-4">
        <div className="px-4 mb-3">
          <p className="text-xs font-semibold text-dark-text mb-0.5">Prompt Engine</p>
          <p className="text-[11px] text-dark-muted">Generate ready-to-paste prompts</p>
        </div>

        {/* Main tab switcher */}
        <div className="flex gap-1 px-4 mb-4">
          <button
            onClick={() => { setMainTab('actions'); setGeneratedPrompt(''); }}
            className={`flex-1 text-[11px] py-1 rounded font-medium transition-colors ${
              mainTab === 'actions' ? 'bg-accent-blue/20 text-accent-blue' : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            🔨 Actions
          </button>
          <button
            onClick={() => { setMainTab('situations'); setGeneratedPrompt(''); }}
            className={`flex-1 text-[11px] py-1 rounded font-medium transition-colors ${
              mainTab === 'situations' ? 'bg-accent-blue/20 text-accent-blue' : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            🎯 Situations
          </button>
        </div>

        {mainTab === 'actions' && (
          <>
            {/* Category picker */}
            <div className="px-4 mb-4">
              <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-1.5">Category</p>
              {editingCategory ? (
                <select
                  autoFocus
                  defaultValue={project.category || 'web-saas'}
                  onChange={e => handleCategoryChange(e.target.value)}
                  onBlur={() => setEditingCategory(false)}
                  className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-xs text-dark-text focus:outline-none"
                >
                  {PROJECT_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setEditingCategory(true)}
                  className="w-full text-left text-xs px-2 py-1 rounded bg-dark-bg border border-dark-border text-dark-muted hover:text-dark-text hover:border-dark-border/70 transition-colors"
                >
                  {PROJECT_CATEGORIES.find(c => c.value === project.category)?.label || project.category || 'Web SaaS'}
                  <span className="float-right text-dark-muted/50">✎</span>
                </button>
              )}
            </div>

            {/* Action groups */}
            {ACTION_GROUPS.map(group => (
              <div key={group.label} className="mb-3">
                <p className="text-[10px] text-dark-muted uppercase tracking-wider px-4 mb-1">
                  {group.icon} {group.label}
                </p>
                {group.actions.map(action => (
                  <button
                    key={action}
                    onClick={() => { setSelectedAction(action); setGeneratedPrompt(''); }}
                    className={`w-full text-left text-xs px-4 py-1.5 transition-colors ${
                      selectedAction === action
                        ? 'bg-accent-blue/15 text-accent-blue border-r-2 border-accent-blue'
                        : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
                    }`}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        {mainTab === 'situations' && (
          <>
            {Object.entries(SITUATION_CATEGORY_LABELS).map(([cat, { label, emoji }]) => (
              <div key={cat} className="mb-3">
                <p className="text-[10px] text-dark-muted uppercase tracking-wider px-4 mb-1">
                  {emoji} {label}
                </p>
                {(situationsByCategory[cat] || []).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSituationSelect(s)}
                    className={`w-full text-left text-xs px-4 py-1.5 transition-colors ${
                      selectedSituation?.id === s.id
                        ? 'bg-accent-blue/15 text-accent-blue border-r-2 border-accent-blue'
                        : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
                    }`}
                  >
                    {s.emoji} {s.title}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">

        {/* ============ ACTIONS TAB ============ */}
        {mainTab === 'actions' && (
          <>
            <div className="mb-3">
              <label className="text-xs text-dark-muted mb-1.5 block">
                Extra context <span className="text-dark-muted/50">(optional — specific task details, file names, what's broken)</span>
              </label>
              <textarea
                value={extraContext}
                onChange={e => setExtraContext(e.target.value)}
                placeholder={
                  selectedAction === 'add-feature'
                    ? 'Example: Add dark mode toggle. It should persist in localStorage. Wire to the existing ThemeContext.'
                    : selectedAction === 'fix-bugs'
                    ? 'Example: Users report the login button does nothing on Safari iOS. Also fix the broken avatar upload.'
                    : 'Describe what specifically needs to happen, mention file paths, error messages, or requirements...'
                }
                rows={3}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text placeholder-dark-muted/40 focus:outline-none focus:border-accent-blue resize-none"
              />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleGenerate}
                disabled={!selectedAction || generating}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                  selectedAction && !generating
                    ? 'bg-accent-green text-white hover:bg-accent-green/80'
                    : 'bg-dark-surface text-dark-muted cursor-not-allowed'
                }`}
              >
                {generating ? 'Generating...' : selectedAction ? `Generate: ${ACTION_LABELS[selectedAction as PromptAction]}` : 'Select an action →'}
              </button>

              {generatedPrompt && <CopyButton copied={copied} onCopy={handleCopy} />}
              {generatedPrompt && (
                <span className={`text-xs ml-auto ${getCharColor(promptLen)}`}>
                  {promptLen.toLocaleString()} chars · ~{Math.round(promptLen / 4).toLocaleString()} tokens
                </span>
              )}
            </div>

            <PromptOutput
              generatedPrompt={generatedPrompt}
              generating={generating}
              emptyTitle={selectedAction ? `Ready to generate: ${ACTION_LABELS[selectedAction as PromptAction]}` : 'Pick an action from the left'}
              emptyBody={selectedAction
                ? "Add extra context if needed, then hit Generate. The prompt pulls all data from this project's DB."
                : '30 actions covering the full development lifecycle. Each prompt includes project context, locked decisions, and infrastructure rules.'}
              onCopy={handleCopy}
            />
          </>
        )}

        {/* ============ SITUATIONS TAB ============ */}
        {mainTab === 'situations' && (
          <>
            {selectedSituation ? (
              <>
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-dark-text">
                      {selectedSituation.emoji} {selectedSituation.title}
                    </h3>
                    <p className="text-xs text-dark-muted mt-0.5">{selectedSituation.description}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedSituation(null); setGeneratedPrompt(''); }}
                    className="text-xs text-dark-muted hover:text-dark-text transition-colors ml-4"
                  >
                    ← Back
                  </button>
                </div>

                {/* Context fields */}
                {selectedSituation.contextFields.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <p className="text-[10px] text-dark-muted uppercase tracking-wider">Context</p>
                    {selectedSituation.contextFields.map(field => (
                      <div key={field.key}>
                        <label className="text-xs text-dark-muted mb-1 block">
                          {field.label}{field.required && <span className="text-accent-blue ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          value={situationContext[field.key] || ''}
                          onChange={e => setSituationContext(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-dark-text placeholder-dark-muted/40 focus:outline-none focus:border-accent-blue"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Generate button */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={handleGenerateSituational}
                    disabled={generating}
                    className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                      !generating
                        ? 'bg-accent-green text-white hover:bg-accent-green/80'
                        : 'bg-dark-surface text-dark-muted cursor-not-allowed'
                    }`}
                  >
                    {generating ? 'Generating...' : 'Generate Prompt'}
                  </button>
                  {generatedPrompt && <CopyButton copied={copied} onCopy={handleCopy} />}
                  {generatedPrompt && (
                    <span className={`text-xs ml-auto ${getCharColor(promptLen)}`}>
                      {promptLen.toLocaleString()} chars · ~{Math.round(promptLen / 4).toLocaleString()} tokens
                    </span>
                  )}
                </div>

                <PromptOutput
                  generatedPrompt={generatedPrompt}
                  generating={generating}
                  emptyTitle="Ready to generate"
                  emptyBody="Fill in the context fields above, then hit Generate."
                  onCopy={handleCopy}
                />
              </>
            ) : (
              <>
                {/* Situation picker overview */}
                <div className="flex-1 overflow-y-auto">
                  <p className="text-xs text-dark-muted mb-4">
                    Universal prompts for recurring scenarios — not tied to a project action, tied to a <strong className="text-dark-text">situation</strong>.
                  </p>

                  {Object.entries(SITUATION_CATEGORY_LABELS).map(([cat, { label, emoji }]) => (
                    <div key={cat} className="mb-5">
                      <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">{emoji} {label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(situationsByCategory[cat] || []).map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleSituationSelect(s)}
                            className="text-left p-3 rounded-lg bg-dark-bg border border-dark-border hover:border-accent-blue/40 hover:bg-dark-hover transition-all group"
                          >
                            <div className="text-base mb-1">{s.emoji}</div>
                            <div className="text-xs font-medium text-dark-text group-hover:text-accent-blue transition-colors">{s.title}</div>
                            <div className="text-[10px] text-dark-muted mt-0.5 leading-relaxed">{s.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Session Patterns */}
                  <div className="mt-4 p-4 rounded-xl border border-dark-border bg-dark-bg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-dark-text">📊 Session Patterns</p>
                      <button
                        onClick={loadPatterns}
                        disabled={loadingPatterns || !project.repo_path}
                        className="text-[10px] text-accent-blue hover:text-accent-blue/70 transition-colors disabled:opacity-40"
                      >
                        {loadingPatterns ? 'Loading...' : 'Analyze'}
                      </button>
                    </div>

                    {!project.repo_path && (
                      <p className="text-[10px] text-dark-muted">Set a repo path in Overview to enable pattern analysis.</p>
                    )}

                    {patterns && (
                      <div className="space-y-2">
                        <div className="flex gap-4 text-[11px]">
                          <div>
                            <span className="text-dark-muted">Sessions: </span>
                            <span className="text-dark-text font-medium">{patterns.totalSessions}</span>
                          </div>
                          <div>
                            <span className="text-dark-muted">Peak hour: </span>
                            <span className="text-dark-text font-medium">{patterns.mostProductiveHour}</span>
                          </div>
                        </div>
                        {patterns.recommendations.length > 0 && (
                          <div className="space-y-1">
                            {patterns.recommendations.map((r, i) => (
                              <p key={i} className="text-[10px] text-dark-muted">· {r}</p>
                            ))}
                          </div>
                        )}
                        {patterns.mostCommonBlockers.length > 0 && (
                          <div>
                            <p className="text-[10px] text-dark-muted mb-1">Common blockers:</p>
                            <div className="space-y-1">
                              {patterns.mostCommonBlockers.slice(0, 3).map((b, i) => (
                                <p key={i} className="text-[10px] text-yellow-400/80 line-clamp-1">· {b}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!patterns && !loadingPatterns && project.repo_path && (
                      <p className="text-[10px] text-dark-muted">Click Analyze to load patterns from session logs in {project.repo_path}/sessions/</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============ SHARED COMPONENTS ============

function CopyButton({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <button
      onClick={onCopy}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${
        copied
          ? 'bg-accent-green/15 text-accent-green border-accent-green/40'
          : 'bg-dark-surface border-dark-border text-dark-text hover:border-accent-blue/40 hover:text-accent-blue'
      }`}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

function PromptOutput({ generatedPrompt, generating, emptyTitle, emptyBody, onCopy }: {
  generatedPrompt: string;
  generating: boolean;
  emptyTitle: string;
  emptyBody: string;
  onCopy: () => void;
}) {
  if (!generatedPrompt && !generating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-dark-border rounded-xl">
        <div className="text-4xl mb-3">🤖</div>
        <p className="text-sm font-medium text-dark-text mb-1">{emptyTitle}</p>
        <p className="text-xs text-dark-muted max-w-sm">{emptyBody}</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-2xl mb-2 animate-pulse">⚡</div>
        <p className="text-sm text-dark-muted">Loading project data from DB...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className="flex-1 bg-dark-bg border border-dark-border rounded-xl p-4 text-xs font-mono text-dark-text/85 whitespace-pre-wrap leading-relaxed overflow-y-auto cursor-pointer select-all"
        onClick={onCopy}
        title="Click to copy"
      >
        {generatedPrompt}
      </div>
      <p className="text-[10px] text-dark-muted mt-1.5">
        Click prompt to copy · Paste directly into Claude Code
      </p>
    </div>
  );
}
