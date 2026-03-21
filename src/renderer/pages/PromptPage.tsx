import React, { useState, useCallback } from 'react';
import * as api from '../services/api';
import type { PromptAction } from '../services/api';
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

export default function PromptPage({ project, onUpdate }: PromptPageProps) {
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState<PromptAction | ''>('');
  const [extraContext, setExtraContext] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);

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
    } catch (err) {
      toast('Failed to generate prompt', 'error');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [selectedAction, extraContext, project.id, toast]);

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

  return (
    <div className="flex gap-0 h-full -m-6">
      {/* Left sidebar: action picker */}
      <div className="w-52 shrink-0 border-r border-dark-border overflow-y-auto py-4">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-dark-text mb-0.5">Prompt Engine</p>
          <p className="text-[11px] text-dark-muted">Select an action, generate, copy</p>
        </div>

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
      </div>

      {/* Right panel: generator */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Extra context */}
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

        {/* Generate button */}
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

          {generatedPrompt && (
            <button
              onClick={handleCopy}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${
                copied
                  ? 'bg-accent-green/15 text-accent-green border-accent-green/40'
                  : 'bg-dark-surface border-dark-border text-dark-text hover:border-accent-blue/40 hover:text-accent-blue'
              }`}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          )}

          {generatedPrompt && (
            <span className={`text-xs ml-auto ${getCharColor(promptLen)}`}>
              {promptLen.toLocaleString()} chars · ~{Math.round(promptLen / 4).toLocaleString()} tokens
            </span>
          )}
        </div>

        {/* Empty state */}
        {!generatedPrompt && !generating && (
          <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-dark-border rounded-xl">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-sm font-medium text-dark-text mb-1">
              {selectedAction ? `Ready to generate: ${ACTION_LABELS[selectedAction as PromptAction]}` : 'Pick an action from the left'}
            </p>
            <p className="text-xs text-dark-muted max-w-sm">
              {selectedAction
                ? 'Add extra context if needed, then hit Generate. The prompt pulls all data from this project\'s DB.'
                : '30 actions covering the full development lifecycle. Each prompt includes project context, locked decisions, and infrastructure rules.'}
            </p>
          </div>
        )}

        {/* Generating state */}
        {generating && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-2xl mb-2 animate-pulse">⚡</div>
            <p className="text-sm text-dark-muted">Loading project data from DB...</p>
          </div>
        )}

        {/* Generated prompt */}
        {generatedPrompt && !generating && (
          <div className="flex-1 flex flex-col min-h-0">
            <div
              className="flex-1 bg-dark-bg border border-dark-border rounded-xl p-4 text-xs font-mono text-dark-text/85 whitespace-pre-wrap leading-relaxed overflow-y-auto cursor-pointer select-all"
              onClick={handleCopy}
              title="Click to copy"
            >
              {generatedPrompt}
            </div>
            <p className="text-[10px] text-dark-muted mt-1.5">
              Click prompt to copy · Paste directly into Claude Code
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
