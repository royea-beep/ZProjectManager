import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';

interface PipelineStats {
  total: number;
  byProject: Record<string, number>;
  byPhase: Record<string, number>;
  avgQuality: number;
  lastUpdated: string;
}

interface QualityInsights {
  stats: PipelineStats;
  topPhases: [string, number][];
  topProjects: [string, number][];
  megaPromptsVersion?: number;
  pipelineDir?: string;
  lastRun?: string;
}

interface MegaContent {
  version: number;
  raw_content: string;
  phases_json: string;
  loaded_at: string;
}

const PHASE_EMOJI: Record<string, string> = {
  dev: '💻', qa: '🧪', ux: '🎨', publish: '🚀', post: '📝',
  arch: '🏗️', infra: '⚙️', biz: '💼', idea: '💡', plan: '📋',
  prep: '🔧', marketing: '📣',
};

export default function PipelinePage() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<QualityInsights | null>(null);
  const [megaContent, setMegaContent] = useState<MegaContent | null>(null);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'insights' | 'conversation' | 'heatmap'>('overview');
  const [classifyInput, setClassifyInput] = useState('');
  const [classifyResult, setClassifyResult] = useState<any>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [ins, content] = await Promise.all([
      window.api.invoke('pipeline:get-quality-insights') as Promise<QualityInsights | null>,
      window.api.invoke('pipeline:get-latest-content') as Promise<MegaContent | null>,
    ]);
    setInsights(ins);
    setMegaContent(content);
  };

  const handleRunPipeline = async () => {
    setRunning(true);
    const result = await window.api.invoke('pipeline:run') as { success: boolean; newVersion?: number; error?: string };
    if (result.success) {
      toast(`Pipeline ran — mega_prompts_v${result.newVersion || '?'} generated`, 'success');
      await window.api.invoke('pipeline:load-mega-prompts');
      await loadAll();
    } else {
      toast(`Pipeline error: ${result.error}`, 'error');
    }
    setRunning(false);
  };

  const handleLoadMegaPrompts = async () => {
    const result = await window.api.invoke('pipeline:load-mega-prompts') as { error?: string; version?: number };
    if (result?.error) {
      toast(result.error, 'error');
    } else {
      toast(`Loaded mega_prompts_v${result.version}`, 'success');
      await loadAll();
    }
  };

  const stats = insights?.stats;

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-dark-text">📊 Learning Pipeline</h2>
          <p className="text-xs text-dark-muted mt-0.5">
            11STEPS2DONE · {stats?.total?.toLocaleString() || '—'} sessions · avg Q={stats?.avgQuality || '—'}
            {insights?.megaPromptsVersion && <span className="ml-2">· mega_prompts_v{insights.megaPromptsVersion}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLoadMegaPrompts}
            className="text-xs px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-dark-text hover:border-accent-blue/40 transition-colors"
          >
            📥 Load Latest
          </button>
          <button
            onClick={handleRunPipeline}
            disabled={running}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors disabled:opacity-50"
          >
            {running ? '⏳ Running...' : '▶ Run Pipeline'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-border pb-3">
        {(['overview', 'content', 'insights', 'heatmap', 'conversation'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-accent-blue/15 text-accent-blue'
                : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'content' ? '📄 mega_prompts' : tab === 'insights' ? '💡 Insights' : tab === 'heatmap' ? '🔥 Heatmap' : '📋 Conversation'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        stats ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Sessions', value: stats.total.toLocaleString() },
                  { label: 'Avg Quality', value: `Q=${stats.avgQuality}` },
                  { label: 'Prompts Version', value: `v${insights?.megaPromptsVersion || '?'}` },
                ].map(card => (
                  <div key={card.label} className="bg-dark-bg border border-dark-border rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-dark-text">{card.value}</p>
                    <p className="text-[10px] text-dark-muted mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">Sessions by Phase</p>
                <div className="space-y-1.5">
                  {Object.entries(stats.byPhase || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([phase, count]) => {
                      const max = Math.max(...Object.values(stats.byPhase));
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={phase} className="flex items-center gap-3">
                          <span className="text-xs w-20 text-dark-muted">
                            {PHASE_EMOJI[phase] || '📋'} {phase}
                          </span>
                          <div className="flex-1 bg-dark-bg rounded-full h-1.5">
                            <div className="bg-accent-blue h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-dark-text w-16 text-right">{count.toLocaleString()}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">Sessions by Project</p>
              <div className="space-y-1.5">
                {Object.entries(stats.byProject || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([project, count]) => {
                    const max = Math.max(...Object.values(stats.byProject));
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={project} className="flex items-center gap-3">
                        <span className="text-xs w-24 text-dark-muted truncate">{project}</span>
                        <div className="flex-1 bg-dark-bg rounded-full h-1.5">
                          <div className="bg-accent-green h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-dark-text w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 p-3 bg-dark-bg border border-dark-border rounded-xl">
                <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-1">Pipeline</p>
                <p className="text-xs font-mono text-dark-text/70">{insights?.pipelineDir || 'C:/Users/royea/Desktop/11STEPS2DONE/'}</p>
                {insights?.lastRun && (
                  <p className="text-[10px] text-dark-muted mt-1">Last run: {insights.lastRun}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm text-dark-text mb-2">No pipeline data yet</p>
            <p className="text-xs text-dark-muted mb-4">Click "Load Latest" to import mega_prompts from 11STEPS2DONE</p>
            <button onClick={handleLoadMegaPrompts} className="text-xs px-4 py-2 rounded-lg bg-accent-blue/15 text-accent-blue">
              📥 Load mega_prompts
            </button>
          </div>
        )
      )}

      {/* Content tab */}
      {activeTab === 'content' && (
        <div>
          {megaContent ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-dark-muted">
                  mega_prompts_v{megaContent.version} · loaded {new Date(megaContent.loaded_at).toLocaleString('he-IL')}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(megaContent.raw_content)}
                  className="text-xs text-accent-blue hover:underline"
                >
                  Copy all
                </button>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4 text-xs font-mono text-dark-text/80 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[60vh]">
                {megaContent.raw_content}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm text-dark-text mb-2">mega_prompts not loaded yet</p>
              <button onClick={handleLoadMegaPrompts} className="text-xs px-4 py-2 rounded-lg bg-accent-blue/15 text-accent-blue">
                Load from Pipeline
              </button>
            </div>
          )}
        </div>
      )}

      {/* Conversation tab */}
      {activeTab === 'conversation' && (
        <div className="space-y-4 max-w-2xl">
          <div className="p-4 bg-dark-bg border border-dark-border rounded-xl">
            <p className="text-xs font-semibold text-dark-text mb-3">🔍 Message Classification Types</p>
            <div className="space-y-2">
              {[
                { type: '🧠 Roye', color: 'text-accent-green', desc: 'Short Hebrew text, decisions, questions from his own thinking', example: '"אני רוצה שהדשבורד יראה workspace filter"' },
                { type: '📋 Bot Output', color: 'text-accent-blue', desc: 'Tables, code blocks, commit hashes, Sprint reports', example: '"Sprint 12 done | TypeScript: clean | Pushed: bcf8833"' },
                { type: '🔀 Mixed', color: 'text-orange-400', desc: 'Roye adds comment above/below pasted bot output', example: 'Hebrew text + pasted MEGA FINAL REPORT' },
              ].map(item => (
                <div key={item.type} className="p-2 bg-dark-surface border border-dark-border rounded-lg">
                  <p className={`text-xs font-medium ${item.color}`}>{item.type}</p>
                  <p className="text-[10px] text-dark-muted mt-0.5">{item.desc}</p>
                  <p className="text-[10px] font-mono text-dark-muted/60 mt-1 italic">{item.example}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-dark-bg border border-dark-border rounded-xl">
            <p className="text-xs font-semibold text-dark-text mb-2">🧪 Live Classifier</p>
            <textarea
              className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text font-mono resize-none focus:outline-none focus:border-accent-blue mb-2"
              rows={4}
              placeholder="Paste any message here to classify it..."
              value={classifyInput}
              onChange={e => setClassifyInput(e.target.value)}
            />
            <button
              onClick={async () => {
                if (!classifyInput.trim()) return;
                const result = await window.api.invoke('pipeline:classify-message', classifyInput) as any;
                setClassifyResult(result);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors"
            >
              Classify
            </button>
            {classifyResult && (
              <div className="mt-3 p-3 bg-dark-surface border border-dark-border rounded-lg">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-xs font-bold ${
                    classifyResult.source === 'bot_output' ? 'text-accent-blue' :
                    classifyResult.source === 'roye' ? 'text-accent-green' :
                    classifyResult.source === 'mixed' ? 'text-orange-400' : 'text-dark-muted'
                  }`}>
                    {classifyResult.source === 'bot_output' ? '📋 Bot Output' :
                     classifyResult.source === 'roye' ? '🧠 Roye' :
                     classifyResult.source === 'mixed' ? '🔀 Mixed' : '❓ Unknown'}
                  </span>
                  <span className="text-[10px] text-dark-muted">confidence: {Math.round((classifyResult.confidence || 0) * 100)}%</span>
                </div>
                {classifyResult.indicators?.length > 0 && (
                  <p className="text-[10px] text-dark-muted/70">Signals: {classifyResult.indicators.slice(0, 4).join(', ')}</p>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-dark-bg border border-dark-border rounded-xl">
            <p className="text-xs font-semibold text-dark-text mb-2">📊 Why this matters for the learning loop</p>
            <p className="text-xs text-dark-muted leading-relaxed">
              When the system knows which parts are Roye's original requests vs. bot outputs,
              it learns: what request styles lead to Q=10 sessions, what bot output formats get
              immediate approval, and where the gap between intention and execution appears.
            </p>
          </div>
        </div>
      )}

      {/* Heatmap tab */}
      {activeTab === 'heatmap' && (
        <div>
          <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-3">Quality heatmap by project</p>
          {insights?.stats?.byProject && Object.keys(insights.stats.byProject).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {Object.entries(insights.stats.byProject as Record<string, number>).map(([project, count]) => {
                const avgQ = insights.stats.avgQuality || 0;
                const color = avgQ >= 8 ? '#22c55e' : avgQ >= 6 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={project} className="p-3 rounded-xl border border-dark-border bg-dark-bg">
                    <p className="text-xs font-medium text-dark-text truncate">{project}</p>
                    <p className="text-lg font-black" style={{ color }}>{count}</p>
                    <p className="text-[10px] text-dark-muted">sessions</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-dark-border rounded-xl">
              <p className="text-sm text-dark-muted">No session data yet — run pipeline first</p>
            </div>
          )}
        </div>
      )}

      {/* Insights tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4 max-w-2xl">
          <div className="p-4 bg-accent-green/5 border border-accent-green/20 rounded-xl">
            <p className="text-xs font-semibold text-accent-green mb-2">✅ What works (from {stats?.total?.toLocaleString() || '3,203'} sessions)</p>
            <ul className="space-y-1">
              {[
                'Always specify working directory (cd C:/Projects/X)',
                'List files to read first (cat MEMORY.md, cat file.ts)',
                'Numbered task steps with clear agent separation',
                'Explicit SUCCESS CRITERIA with checkboxes',
                'End with: tsc → build → git push → update MEMORY.md',
                'Short prompts ≤ 6 turns score Q=10 vs Q=2 for 30-turn loops',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-dark-text">• {tip}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-red-400/5 border border-red-400/20 rounded-xl">
            <p className="text-xs font-semibold text-red-400 mb-2">❌ What fails (from low-Q sessions)</p>
            <ul className="space-y-1">
              {[
                'Vague single-line requests ("fix the bug")',
                'Multi-project mixed tasks in one prompt',
                'No working directory specified',
                'No files to read — bot guesses structure',
                'Missing definition of done',
                'No error handling instructions',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-dark-text">• {tip}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-xl">
            <p className="text-xs font-semibold text-accent-blue mb-2">🔄 How this feeds ZProjectManager</p>
            <p className="text-xs text-dark-text leading-relaxed">
              Every GPROMPT generated by ZProjectManager is based on the patterns learned from {stats?.total?.toLocaleString() || '3,203'} real sessions.
              The pipeline runs daily, updates mega_prompts_vN.md, and ZProjectManager loads it automatically.
              The "best practices" in every prompt you generate are not invented — they're extracted from what actually worked.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
