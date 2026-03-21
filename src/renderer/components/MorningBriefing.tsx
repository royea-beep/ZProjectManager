import React, { useState, useEffect } from 'react';
import type { Project, Workspace } from '../../shared/types';

interface BriefingItem {
  workspaceName: string;
  workspaceColor: string;
  critical: string[];
  warnings: string[];
  good: string[];
}

export default function MorningBriefing({ onDismiss }: { onDismiss: () => void }) {
  const [briefing, setBriefing] = useState<BriefingItem[]>([]);
  const [topSuggestions, setTopSuggestions] = useState<any[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hour = new Date().toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    generateBriefing();
  }, []);

  const generateBriefing = async () => {
    // Run intelligence engine first
    try {
      await window.api.invoke('intelligence:run');
      const suggestions = await window.api.invoke('intelligence:get-suggestions') as any[];
      setTopSuggestions((suggestions || []).slice(0, 3));
    } catch { /* non-blocking */ }

    try {
      const pipelineInsights = await window.api.invoke('pipeline:get-quality-insights') as any;
      if (pipelineInsights?.megaPromptsVersion) {
        setPipelineStatus(`mega_prompts_v${pipelineInsights.megaPromptsVersion} · ${pipelineInsights.stats?.total?.toLocaleString() || '?'} sessions · avg Q=${pipelineInsights.stats?.avgQuality || '?'}`);
      }
    } catch { /* non-blocking */ }

    const [workspaces, projects] = await Promise.all([
      window.api.invoke('workspaces:get-all') as Promise<(Workspace & { project_count: number })[]>,
      window.api.invoke('projects:getAll') as Promise<Project[]>,
    ]);

    const items: BriefingItem[] = [];

    for (const ws of (workspaces || [])) {
      const wsProjects = (projects || []).filter(p => p.workspace_id === ws.id && p.status !== 'archived');
      if (wsProjects.length === 0) continue;

      const critical = wsProjects
        .filter(p => p.github_ci_status === 'failing' || (p.health_score || 100) < 40)
        .map(p => `${p.name}: ${p.github_ci_status === 'failing' ? 'CI ❌' : `health ${p.health_score}/100`}`);

      const warnings = wsProjects
        .filter(p => (p.github_open_prs || 0) > 0 || !!p.main_blocker)
        .map(p => `${p.name}: ${p.main_blocker || `${p.github_open_prs} open PRs`}`);

      const good = wsProjects
        .filter(p => p.github_ci_status === 'passing' && (p.health_score || 0) >= 80)
        .map(p => `${p.name} ✅`)
        .slice(0, 3);

      if (critical.length > 0 || warnings.length > 0) {
        items.push({ workspaceName: ws.name, workspaceColor: ws.color, critical, warnings, good });
      }
    }

    setBriefing(items);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-dark-text">🌅 בוקר טוב</h2>
            <p className="text-xs text-dark-muted mt-0.5">{hour} IST · סיכום הפורטפוליו</p>
          </div>
          <button onClick={onDismiss} className="text-dark-muted hover:text-dark-text transition-colors text-lg leading-none">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-dark-muted text-sm animate-pulse">טוען...</div>
        ) : briefing.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🟢</div>
            <p className="text-sm text-dark-text">הכל ירוק</p>
            <p className="text-xs text-dark-muted mt-1">אין בעיות פעילות</p>
          </div>
        ) : (
          <div className="space-y-4">
            {briefing.map((item, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.workspaceColor }} />
                  <span className="text-xs font-semibold text-dark-text">{item.workspaceName}</span>
                </div>
                <div className="space-y-1 pl-4">
                  {item.critical.map((c, j) => (
                    <p key={j} className="text-xs text-red-400">🔴 {c}</p>
                  ))}
                  {item.warnings.map((w, j) => (
                    <p key={j} className="text-xs text-yellow-400">🟡 {w}</p>
                  ))}
                  {item.good.map((g, j) => (
                    <p key={j} className="text-xs text-green-400/70">{g}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {topSuggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dark-border">
            <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">🧠 Intelligence</p>
            <div className="space-y-1.5">
              {topSuggestions.map((s: any) => (
                <p key={s.id} className={`text-xs ${s.priority >= 9 ? 'text-red-400' : s.priority >= 7 ? 'text-orange-400' : 'text-accent-blue'}`}>
                  {s.priority >= 9 ? '🔴' : s.priority >= 7 ? '🟠' : '🔵'} {s.project_name}: {s.title}
                </p>
              ))}
            </div>
          </div>
        )}

        {pipelineStatus && (
          <div className="mt-4 pt-4 border-t border-dark-border">
            <p className="text-[10px] text-dark-muted">📊 Pipeline: {pipelineStatus}</p>
          </div>
        )}

        <button
          onClick={onDismiss}
          className="w-full mt-5 text-xs py-2 rounded-lg bg-dark-bg border border-dark-border text-dark-muted hover:text-dark-text transition-colors"
        >
          בוא נעבוד
        </button>
      </div>
    </div>
  );
}
