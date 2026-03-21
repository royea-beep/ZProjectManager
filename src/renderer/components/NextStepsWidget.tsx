import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import type { RecommendedActions } from '../services/api';
import type { Project } from '../../shared/types';
import { ACTION_LABELS } from '../../shared/prompt-templates';
import type { PromptAction } from '../../shared/prompt-templates';
import { useToast } from './Toast';

export type WidgetContext = 'portfolio' | 'project' | 'dashboard' | 'patterns' | 'revenue' | 'settings';

interface Step {
  action: string;
  label: string;
  reason: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  projectId?: number;
  projectName?: string;
}

interface Props {
  context: WidgetContext;
  project?: Project;
  projects?: Project[];
}

const URGENCY_DOT: Record<string, string> = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-accent-blue',
  low: 'bg-dark-muted',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action as PromptAction] || action;
}

function buildDashboardSteps(projects: Project[]): Step[] {
  const critical = projects.filter(p => p.health_score < 40 || p.github_ci_status === 'failing');
  const liveNoRevenue = projects.filter(
    p => (p.status === 'launched' || p.stage === 'live' || p.stage === 'live_optimization') && !p.mrr
  );
  const steps: Step[] = [];

  if (critical.length > 0) {
    steps.push({
      action: 'fix-bugs',
      label: `Fix ${critical[0].name}`,
      reason: `${critical.length} critical project${critical.length > 1 ? 's' : ''} — health or CI failing`,
      urgency: 'critical',
      projectId: critical[0].id,
      projectName: critical[0].name,
    });
  }
  if (liveNoRevenue.length > 0) {
    steps.push({
      action: 'add-payments',
      label: `Monetize ${liveNoRevenue[0].name}`,
      reason: 'Live with no revenue tracked — add payments',
      urgency: 'high',
      projectId: liveNoRevenue[0].id,
      projectName: liveNoRevenue[0].name,
    });
  }
  steps.push({
    action: 'weekly-review',
    label: 'Run weekly review',
    reason: 'Stay on top of all projects with a weekly summary',
    urgency: 'low',
  });

  return steps.slice(0, 3);
}

function buildRevenueSteps(projects: Project[]): Step[] {
  const withoutPayments = projects.filter(
    p => (p.status === 'launched' || p.stage === 'live' || p.stage === 'live_optimization') && !p.mrr
  );
  const steps: Step[] = [];

  if (withoutPayments[0]) {
    steps.push({ action: 'add-payments', label: `Add payments to ${withoutPayments[0].name}`, reason: 'Live product, no revenue tracked', urgency: 'high', projectId: withoutPayments[0].id, projectName: withoutPayments[0].name });
  }
  if (withoutPayments[1]) {
    steps.push({ action: 'add-subscription', label: `Add subscription to ${withoutPayments[1].name}`, reason: 'Subscription beats one-time for SaaS', urgency: 'medium', projectId: withoutPayments[1].id, projectName: withoutPayments[1].name });
  }
  steps.push({ action: 'add-freemium', label: 'Add freemium tier', reason: 'Lower the acquisition barrier with a free tier', urgency: 'low' });

  return steps.slice(0, 3);
}

function buildPortfolioSteps(projects: Project[]): Step[] {
  const testflight = projects.filter(p => p.stage === 'testflight');
  const preLaunch = projects.filter(p => p.stage === 'pre-launch' || p.stage === 'launch_prep');
  const stale = projects.filter(p => {
    if (!p.last_worked_at) return true;
    const days = (Date.now() - new Date(p.last_worked_at).getTime()) / 86400000;
    return days > 14;
  });

  const steps: Step[] = [];
  if (testflight[0]) steps.push({ action: 'fix-bugs', label: `QA ${testflight[0].name} TestFlight`, reason: 'On TestFlight — user feedback needs action', urgency: 'high', projectId: testflight[0].id, projectName: testflight[0].name });
  if (preLaunch[0]) steps.push({ action: 'launch-checklist', label: `Launch ${preLaunch[0].name}`, reason: 'Pre-launch — run the checklist now', urgency: 'high', projectId: preLaunch[0].id, projectName: preLaunch[0].name });
  if (stale[0]) steps.push({ action: 'update-state-docs', label: `Update ${stale[0].name} state`, reason: 'Not touched in 2+ weeks — update docs before re-engaging', urgency: 'medium', projectId: stale[0].id, projectName: stale[0].name });

  while (steps.length < 3) {
    steps.push({ action: 'audit-codebase', label: 'Audit a project', reason: 'Regular audits catch issues early', urgency: 'low' });
  }
  return steps.slice(0, 3);
}

export default function NextStepsWidget({ context, project, projects = [] }: Props) {
  const { toast } = useToast();
  const [steps, setSteps] = useState<Step[]>([]);
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<Record<number, string>>({});
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [outcomePending, setOutcomePending] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (context === 'project' && project) {
        try {
          const rec = await api.getRecommendedActions({
            stage: project.stage,
            category: project.category || 'web-saas',
            health_score: project.health_score,
            github_ci_status: project.github_ci_status,
            github_open_prs: project.github_open_prs,
            main_blocker: project.main_blocker,
            mrr: project.mrr,
          });
          if (cancelled) return;
          setSteps([
            { action: rec.primary, label: actionLabel(rec.primary), reason: rec.reason, urgency: rec.urgency, projectId: project.id, projectName: project.name },
            { action: rec.secondary[0] || 'fix-bugs', label: actionLabel(rec.secondary[0] || 'fix-bugs'), reason: 'Secondary recommendation', urgency: 'medium', projectId: project.id, projectName: project.name },
            { action: rec.secondary[1] || 'update-state-docs', label: actionLabel(rec.secondary[1] || 'update-state-docs'), reason: 'Secondary recommendation', urgency: 'low', projectId: project.id, projectName: project.name },
          ]);
        } catch { /* fallback */ }
      } else if (context === 'dashboard') {
        setSteps(buildDashboardSteps(projects));
      } else if (context === 'revenue') {
        setSteps(buildRevenueSteps(projects));
      } else if (context === 'portfolio') {
        setSteps(buildPortfolioSteps(projects));
      }
    }
    load();
    return () => { cancelled = true; };
  }, [context, project?.id, projects.length]);

  const handleGenerate = useCallback(async (step: Step, idx: number) => {
    if (!step.projectId) {
      toast('Select a project first', 'error');
      return;
    }
    setGeneratingIdx(idx);
    try {
      const result = await api.generatePrompt({ projectId: step.projectId, action: step.action as PromptAction });
      setGeneratedPrompts(prev => ({ ...prev, [idx]: result }));
      await api.logPromptUsage({ promptType: 'action', promptId: step.action, projectId: step.projectId });
    } catch {
      toast('Failed to generate prompt', 'error');
    } finally {
      setGeneratingIdx(null);
    }
  }, [toast]);

  const handleCopy = useCallback(async (prompt: string, idx: number) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedIdx(idx);
    toast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedIdx(null), 2000);
  }, [toast]);

  if (steps.length === 0) return null;

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
      <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-3">⚡ Next 3 Steps</p>
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const prompt = generatedPrompts[idx];
          return (
            <div key={idx} className="rounded-lg border border-dark-border bg-dark-bg overflow-hidden">
              <div className="flex items-start gap-2 p-3">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${URGENCY_DOT[step.urgency]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dark-text leading-snug">{step.label}</p>
                  <p className="text-[10px] text-dark-muted mt-0.5 leading-relaxed">{step.reason}</p>
                  {step.projectName && <p className="text-[10px] text-accent-blue/60 mt-0.5">{step.projectName}</p>}
                </div>
                <button
                  onClick={() => prompt ? handleCopy(prompt, idx) : handleGenerate(step, idx)}
                  disabled={generatingIdx === idx || !step.projectId}
                  className={`shrink-0 text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                    prompt
                      ? copiedIdx === idx
                        ? 'border-accent-green/40 bg-accent-green/10 text-accent-green'
                        : 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'
                      : 'border-dark-border text-dark-muted hover:text-dark-text hover:border-accent-blue/40'
                  }`}
                >
                  {generatingIdx === idx ? '...' : prompt ? (copiedIdx === idx ? '✓' : 'Copy') : '⚡'}
                </button>
              </div>

              {/* Generated prompt preview */}
              {prompt && (
                <div className="border-t border-dark-border px-3 pb-3 pt-2">
                  <div className="text-[10px] font-mono text-dark-text/70 bg-dark-surface rounded p-2 max-h-20 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {prompt.slice(0, 300)}...
                  </div>
                  {/* Outcome rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-dark-muted">Did it work?</span>
                    {(['success', 'partial', 'failure'] as const).map(outcome => (
                      <button
                        key={outcome}
                        onClick={async () => {
                          setOutcomePending(prev => ({ ...prev, [idx]: outcome }));
                          await api.updatePromptOutcome({ id: 'latest', outcome });
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                          outcomePending[idx] === outcome
                            ? outcome === 'success' ? 'border-accent-green/60 bg-accent-green/15 text-accent-green'
                              : outcome === 'partial' ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-400'
                              : 'border-red-400/60 bg-red-400/10 text-red-400'
                            : 'border-dark-border text-dark-muted hover:border-dark-border/70 hover:text-dark-text'
                        }`}
                      >
                        {outcome === 'success' ? '✓ Worked' : outcome === 'partial' ? '~ Partial' : '✗ Failed'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
