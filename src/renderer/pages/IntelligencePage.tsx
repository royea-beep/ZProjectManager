import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTION_LABELS } from '../../shared/prompt-templates';
import type { PromptAction } from '../../shared/prompt-templates';
import { useToast } from '../components/Toast';
import NextStepsWidget from '../components/NextStepsWidget';

const PRIORITY_COLOR = (p: number) =>
  p >= 9 ? 'text-red-400 border-red-400/30 bg-red-400/5' :
  p >= 7 ? 'text-orange-400 border-orange-400/30 bg-orange-400/5' :
  p >= 5 ? 'text-accent-blue border-accent-blue/30 bg-accent-blue/5' :
  'text-dark-muted border-dark-border bg-dark-bg';

const PRIORITY_DOT = (p: number) =>
  p >= 9 ? 'bg-red-400' : p >= 7 ? 'bg-orange-400' : p >= 5 ? 'bg-accent-blue' : 'bg-dark-muted';

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-red-400 border-red-400/30',
  warning: 'text-yellow-400 border-yellow-400/30',
  opportunity: 'text-green-400 border-green-400/30',
  info: 'text-dark-muted border-dark-border',
};

export default function IntelligencePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = useCallback(async () => {
    const [s, i] = await Promise.all([
      window.api.invoke('intelligence:get-suggestions'),
      window.api.invoke('intelligence:get-cross-project'),
    ]);
    setSuggestions((s as any[]) || []);
    setInsights((i as any[]) || []);
    setLastRun(new Date());
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    await window.api.invoke('intelligence:run');
    await loadAll();
    setLoading(false);
    toast('Analysis complete', 'success');
  };

  const dismiss = async (id: string, type: 'suggestion' | 'insight') => {
    if (type === 'suggestion') await window.api.invoke('intelligence:dismiss', id);
    else await window.api.invoke('intelligence:dismiss-insight', id);
    await loadAll();
  };

  const generateAndCopy = async (suggestion: any) => {
    if (!suggestion.action_prompt_id) return;
    setGeneratingPrompt(suggestion.id);
    try {
      const prompt = await window.api.invoke('prompts:generate', {
        projectId: suggestion.project_id,
        action: suggestion.action_prompt_id,
        extraContext: suggestion.description,
      });
      await navigator.clipboard.writeText(prompt as string);
      toast('Prompt copied — paste into Claude Code', 'success');
    } catch {
      toast('Failed to generate prompt', 'error');
    } finally {
      setGeneratingPrompt(null);
    }
  };

  const timeSince = lastRun ? Math.round((Date.now() - lastRun.getTime()) / 1000) : null;
  const criticalCount = suggestions.filter(s => s.priority >= 9).length;
  const revenueOpps = suggestions.filter(s => s.suggestion_type === 'revenue');
  const totalUnbilled = revenueOpps.reduce((sum, s) => {
    const match = s.title.match(/₪([\d,]+)/);
    return sum + (match ? parseInt(match[1].replace(',', '')) : 0);
  }, 0);

  return (
    <div className="flex gap-0 h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-dark-text">🧠 Intelligence</h2>
            <p className="text-xs text-dark-muted mt-0.5">
              {suggestions.length} suggestions
              {criticalCount > 0 && <span className="text-red-400 ml-2">· {criticalCount} critical</span>}
              {totalUnbilled > 0 && <span className="text-green-400 ml-2">· ₪{totalUnbilled.toLocaleString()} unbilled</span>}
              {timeSince !== null && <span className="ml-2 opacity-50">· updated {timeSince}s ago</span>}
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Analyzing...' : '🔄 Run Analysis'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* LEFT: Per-project suggestions */}
          <div>
            <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-3">
              Project Actions ({suggestions.length})
            </p>
            {suggestions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-dark-border rounded-xl">
                <div className="text-3xl mb-2">🟢</div>
                <p className="text-sm text-dark-text">הכל ירוק</p>
                <p className="text-xs text-dark-muted mt-1">No urgent actions detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map(s => (
                  <div key={s.id} className={`p-3 rounded-xl border ${PRIORITY_COLOR(s.priority)}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT(s.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {s.ws_color && (
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.ws_color }} />
                          )}
                          <button
                            onClick={() => navigate(`/projects/${s.project_id}`)}
                            className="text-xs font-semibold hover:underline truncate"
                          >
                            {s.project_name}
                          </button>
                        </div>
                        <p className="text-xs">{s.title}</p>
                        {s.description && (
                          <p className="text-[10px] opacity-60 mt-0.5 line-clamp-2">{s.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {s.action_prompt_id && (
                            <button
                              onClick={() => generateAndCopy(s)}
                              disabled={generatingPrompt === s.id}
                              className="text-[10px] px-2 py-0.5 rounded bg-dark-bg border border-current opacity-70 hover:opacity-100 transition-opacity"
                            >
                              {generatingPrompt === s.id ? '⏳' : '⚡'} {(ACTION_LABELS as Record<string, string>)[s.action_prompt_id as PromptAction] || s.action_prompt_id}
                            </button>
                          )}
                          <button
                            onClick={() => dismiss(s.id, 'suggestion')}
                            className="text-[10px] opacity-30 hover:opacity-60 transition-opacity ml-auto"
                          >
                            dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Cross-project insights */}
          <div>
            <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-3">
              Cross-Project Insights ({insights.length})
            </p>
            {insights.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-dark-border rounded-xl">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm text-dark-text">No cross-project issues</p>
              </div>
            ) : (
              <div className="space-y-2">
                {insights.map(insight => (
                  <div
                    key={insight.id}
                    className={`p-3 rounded-xl border ${SEVERITY_COLOR[insight.severity] || SEVERITY_COLOR.info}`}
                  >
                    <p className="text-xs font-medium mb-0.5">{insight.title}</p>
                    <p className="text-[10px] opacity-70 leading-relaxed">{insight.description}</p>
                    <button
                      onClick={() => dismiss(insight.id, 'insight')}
                      className="text-[10px] opacity-30 hover:opacity-60 transition-opacity mt-2 block"
                    >
                      dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar: Next Steps */}
      <div className="w-64 shrink-0 border-l border-dark-border overflow-y-auto p-4">
        <NextStepsWidget context="dashboard" />
      </div>
    </div>
  );
}
