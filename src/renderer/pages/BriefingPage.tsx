import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NextStepsWidget from '../components/NextStepsWidget';

interface BriefingSection {
  workspaceName: string;
  workspaceColor: string;
  workspaceEmoji: string;
  critical: Array<{ text: string; projectId: number; actionId?: string }>;
  warnings: Array<{ text: string; projectId: number }>;
  good: Array<{ text: string }>;
  unbilledAmount?: number;
}

export default function BriefingPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<BriefingSection[]>([]);
  const [pipelineInfo, setPipelineInfo] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null);
  const now = new Date();
  const hour = now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  const dayOfWeek = now.toLocaleDateString('he-IL', { weekday: 'long', timeZone: 'Asia/Jerusalem' });
  const hourNum = parseInt(hour);

  useEffect(() => { load(); }, []);

  const load = useCallback(async () => {
    setLoading(true);

    await window.api.invoke('intelligence:run').catch(() => {});

    const [workspaces, projects, sug, pipeline] = await Promise.all([
      window.api.invoke('workspaces:get-all'),
      window.api.invoke('projects:getAll'),
      window.api.invoke('intelligence:get-suggestions'),
      window.api.invoke('pipeline:get-quality-insights').catch(() => null),
    ]);

    setSuggestions((sug as any[]) || []);
    setPipelineInfo(pipeline);

    const builtSections: BriefingSection[] = [];
    for (const ws of ((workspaces as any[]) || [])) {
      const wsProjects = ((projects as any[]) || []).filter((p: any) =>
        p.workspace_id === ws.id && p.status !== 'archived'
      );
      if (wsProjects.length === 0) continue;

      const critical = wsProjects
        .filter((p: any) => p.github_ci_status === 'failing' || (p.health_score || 100) < 40)
        .map((p: any) => ({
          text: `${p.name}: ${p.github_ci_status === 'failing' ? 'CI failing' : `health ${p.health_score}/100`}`,
          projectId: p.id,
          actionId: 'fix-bugs',
        }));

      const warnings = wsProjects
        .filter((p: any) => p.main_blocker || (p.github_open_prs || 0) > 2)
        .map((p: any) => ({
          text: `${p.name}: ${p.main_blocker || `${p.github_open_prs} open PRs`}`,
          projectId: p.id,
        }));

      const good = wsProjects
        .filter((p: any) => p.github_ci_status === 'passing' && (p.health_score || 0) >= 80)
        .map((p: any) => ({ text: `${p.name} green` }))
        .slice(0, 3);

      let unbilledAmount = 0;
      if (ws.type === 'client') {
        const summary = await window.api.invoke('work-sessions:summary', ws.id).catch(() => []);
        for (const s of ((summary as any[]) || [])) {
          unbilledAmount += (s.total_hours - s.billed_hours) * (s.billing_rate || ws.billing_rate || 200);
        }
      }

      builtSections.push({
        workspaceName: ws.name,
        workspaceColor: ws.color,
        workspaceEmoji: ws.emoji,
        critical,
        warnings,
        good,
        unbilledAmount: unbilledAmount > 0 ? unbilledAmount : undefined,
      });
    }
    setSections(builtSections);
    setLoading(false);
  }, []);

  const generateAndCopy = async (sug: any) => {
    if (!sug.action_prompt_id) return;
    setGeneratingPrompt(sug.id);
    try {
      const prompt = await window.api.invoke('prompts:generate', {
        projectId: sug.project_id,
        action: sug.action_prompt_id,
        extraContext: sug.description,
      });
      await navigator.clipboard.writeText(prompt as string);
    } finally { setGeneratingPrompt(null); }
  };

  const totalCritical = sections.reduce((s, sec) => s + sec.critical.length, 0);
  const totalUnbilled = sections.reduce((s, sec) => s + (sec.unbilledAmount || 0), 0);
  const greeting = hourNum < 12 ? 'בוקר טוב' : hourNum < 17 ? 'צהריים טובים' : 'ערב טוב';

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main briefing */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-dark-text">
            {greeting} —
          </h1>
          <p className="text-sm text-dark-muted mt-1">
            {dayOfWeek} · {hour} IST
            {totalCritical > 0 && <span className="text-red-400 ml-2">· {totalCritical} critical</span>}
            {totalUnbilled > 0 && <span className="text-yellow-400 ml-2">· ₪{totalUnbilled.toLocaleString()} unbilled</span>}
          </p>
        </div>

        {/* Pipeline status */}
        {(pipelineInfo as any)?.stats && (
          <div className="flex items-center gap-3 px-3 py-2 bg-dark-surface border border-dark-border rounded-xl mb-5 text-xs text-dark-muted">
            <span>📊</span>
            <span>Pipeline: mega_prompts_v{(pipelineInfo as any).megaPromptsVersion}</span>
            <span>·</span>
            <span>{(pipelineInfo as any).stats.total?.toLocaleString()} sessions</span>
            <span>·</span>
            <span>avg Q={(pipelineInfo as any).stats.avgQuality}</span>
            <button
              onClick={() => window.api.invoke('pipeline:run')}
              className="ml-auto text-accent-blue hover:underline"
            >
              Run pipeline
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-dark-surface animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Workspace sections */}
            {sections.map((sec, i) => (
              <div key={i} className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border">
                  <div className="w-2 h-2 rounded-full" style={{ background: sec.workspaceColor }} />
                  <span className="text-sm font-semibold text-dark-text">{sec.workspaceEmoji} {sec.workspaceName}</span>
                  {sec.unbilledAmount && (
                    <span className="ml-auto text-xs text-yellow-400">₪{sec.unbilledAmount.toLocaleString()} unbilled</span>
                  )}
                </div>

                <div className="p-4 space-y-1.5">
                  {sec.critical.map((c, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-red-400 text-xs w-2 shrink-0">●</span>
                      <span className="text-xs text-red-400 flex-1">{c.text}</span>
                      {c.actionId && (
                        <button
                          onClick={() => generateAndCopy({ ...c, action_prompt_id: c.actionId, description: c.text })}
                          disabled={generatingPrompt === String(c.projectId)}
                          className="text-[10px] px-2 py-0.5 rounded border border-red-400/30 text-red-400 bg-red-400/5 hover:bg-red-400/15 transition-colors"
                        >
                          {generatingPrompt === String(c.projectId) ? '⏳' : '⚡ Fix'}
                        </button>
                      )}
                    </div>
                  ))}
                  {sec.warnings.map((w, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-yellow-400 text-xs w-2 shrink-0">●</span>
                      <span className="text-xs text-yellow-400">{w.text}</span>
                    </div>
                  ))}
                  {sec.good.map((g, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-green-400/50 text-xs w-2 shrink-0">●</span>
                      <span className="text-xs text-dark-muted">{g.text}</span>
                    </div>
                  ))}
                  {sec.critical.length === 0 && sec.warnings.length === 0 && (
                    <p className="text-xs text-dark-muted">הכל ירוק</p>
                  )}
                </div>
              </div>
            ))}

            {/* Top intelligence suggestions */}
            {((suggestions as any[]).filter(s => s.priority >= 8)).length > 0 && (
              <div>
                <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">🧠 Intelligence</p>
                <div className="space-y-2">
                  {(suggestions as any[]).filter(s => s.priority >= 8).slice(0, 3).map((s: any) => (
                    <div key={s.id} className="flex items-start gap-2 px-3 py-2 bg-dark-surface border border-dark-border rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: s.priority >= 9 ? '#ef4444' : '#f59e0b' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-dark-text">{s.project_name}: {s.title}</p>
                      </div>
                      {s.action_prompt_id && (
                        <button
                          onClick={() => generateAndCopy(s)}
                          className="text-[10px] px-2 py-0.5 rounded border border-accent-blue/30 text-accent-blue shrink-0"
                        >
                          ⚡
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start working button */}
        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 py-3 rounded-2xl bg-accent-green text-white font-bold text-sm hover:bg-accent-green/80 transition-colors"
        >
          בוא נעבוד →
        </button>
      </div>

      {/* Right: next steps */}
      <div className="w-56 shrink-0 border-l border-dark-border overflow-y-auto p-4">
        <NextStepsWidget context="dashboard" />
      </div>
    </div>
  );
}
