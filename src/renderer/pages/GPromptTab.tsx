import React from 'react';
import type { Project } from '../../shared/types';
import {
  extractProjectParams, getProjectParams, saveProjectParam, deleteProjectParam, bulkSaveParams,
  getParamsAsContext, analyzeGoldenPrompts, getGoldenPrompts, deleteGoldenPrompt,
  type ProjectParameter, type GoldenPrompt, type GoldenAnalysis,
} from '../services/api';

interface Props {
  project: Project;
}

const CATEGORY_LABELS: Record<string, string> = {
  structure: '📁 Structure',
  stack: '⚙️ Stack & Deploy',
  supabase: '🗄️ Supabase',
  auth: '🔐 Auth',
  design: '🎨 Design',
  state: '🔄 State',
  components: '🧩 Components',
  api: '🔌 API',
  general: '📋 General',
};

const PARAM_DESCRIPTIONS: Record<string, string> = {
  srcPath: 'Root source directory (e.g., src, app)',
  importAlias: 'Import alias (e.g., @/ or ~/ from tsconfig)',
  componentPaths: 'Where components live',
  pagesPaths: 'Where pages/routes live',
  framework: 'Main framework (next.js, react, capacitor...)',
  isCapacitor: 'Is this a Capacitor project?',
  isExpo: 'Is this an Expo project?',
  isNextJs: 'Is this a Next.js project?',
  isElectron: 'Is this an Electron project?',
  isVanillaJs: 'Pure JS (no React/Vue/etc)?',
  bundleId: 'iOS/Android bundle ID',
  deployTarget: 'Deploy target (vercel, railway, cpanel-ftp...)',
  supabaseClientPath: 'Path to supabase client file',
  supabaseClientExport: 'Export name of supabase client',
  supabaseTableNames: 'Supabase table names used in this project',
  authPattern: 'How to get current user (useUser(), getServerSession...)',
  userIdField: 'User ID field name (user.id, userId...)',
  stylingSystem: 'CSS system (tailwind, css-modules, styled-components)',
  hasDesignTokens: 'Has custom design tokens?',
  colorTokenSample: 'Sample design token class names',
  stateManager: 'State management (useState, zustand, jotai...)',
  serverState: 'Server state (react-query, swr, manual)',
  existingComponents: 'Reusable components already in codebase',
  apiResponseFormat: 'API response format ({ data, error } or similar)',
  errorHandlingPattern: 'Error handling strategy',
};

const PARAM_IMPORTANCE: Record<string, 'critical' | 'important' | 'optional'> = {
  importAlias: 'critical',
  supabaseClientPath: 'critical',
  supabaseClientExport: 'critical',
  supabaseTableNames: 'critical',
  authPattern: 'critical',
  framework: 'critical',
  srcPath: 'important',
  bundleId: 'important',
  deployTarget: 'important',
  stylingSystem: 'important',
  userIdField: 'important',
  stateManager: 'important',
  colorTokenSample: 'important',
  existingComponents: 'optional',
  componentPaths: 'optional',
  pagesPaths: 'optional',
  isCapacitor: 'optional',
  isExpo: 'optional',
  isNextJs: 'optional',
  isElectron: 'optional',
  isVanillaJs: 'optional',
  hasDesignTokens: 'optional',
  serverState: 'optional',
  apiResponseFormat: 'optional',
  errorHandlingPattern: 'optional',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="px-2 py-1 text-xs bg-dark-hover border border-dark-border rounded hover:bg-dark-border transition-colors"
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
}

function ParamRow({
  param,
  onSave,
  onDelete,
}: {
  param: ProjectParameter;
  onSave: (key: string, value: string | null) => void;
  onDelete: (key: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(param.value ?? '');
  const isMissing = !param.value || param.value.trim() === '' || param.value === 'false';
  const importance = PARAM_IMPORTANCE[param.key] || 'optional';

  const handleSave = () => {
    onSave(param.key, draft.trim() || null);
    setEditing(false);
  };

  const importanceColor = importance === 'critical'
    ? isMissing ? 'text-accent-red' : 'text-accent-green'
    : importance === 'important'
      ? isMissing ? 'text-yellow-400' : 'text-accent-blue'
      : isMissing ? 'text-dark-muted' : 'text-dark-muted';

  return (
    <div className={`py-2.5 px-3 rounded-lg border ${
      isMissing && importance === 'critical'
        ? 'border-accent-red/30 bg-accent-red/5'
        : isMissing && importance === 'important'
          ? 'border-yellow-400/20 bg-yellow-400/5'
          : 'border-dark-border bg-dark-bg/30'
    }`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-mono font-semibold ${importanceColor}`}>
              {param.key}
              {isMissing && importance !== 'optional' && (
                <span className="ml-1.5 text-[10px] font-sans font-normal opacity-70">
                  {importance === 'critical' ? '⚠ MISSING' : '◦ empty'}
                </span>
              )}
            </span>
            {!param.is_auto_extracted && (
              <span className="text-[10px] text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-1 rounded">manual</span>
            )}
          </div>
          {PARAM_DESCRIPTIONS[param.key] && (
            <div className="text-[10px] text-dark-muted mb-1">{PARAM_DESCRIPTIONS[param.key]}</div>
          )}
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setDraft(param.value ?? ''); setEditing(false); } }}
                autoFocus
                className="flex-1 bg-dark-bg border border-accent-blue/50 rounded px-2 py-1 text-xs font-mono text-dark-text outline-none focus:ring-1 focus:ring-accent-blue/50"
                placeholder="Enter value..."
              />
              <button onClick={handleSave} className="px-2 py-1 bg-accent-green text-black text-xs rounded font-semibold">Save</button>
              <button onClick={() => { setDraft(param.value ?? ''); setEditing(false); }} className="px-2 py-1 bg-dark-hover text-dark-muted text-xs rounded">Cancel</button>
            </div>
          ) : (
            <div
              onClick={() => { setDraft(param.value ?? ''); setEditing(true); }}
              className={`text-xs font-mono cursor-pointer rounded px-1 py-0.5 -mx-1 hover:bg-dark-hover transition-colors ${
                isMissing ? 'text-dark-muted italic' : 'text-dark-text'
              }`}
            >
              {isMissing ? 'click to set...' : param.value}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(param.key)}
          className="text-dark-muted hover:text-accent-red text-xs mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove parameter"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function AddParamForm({ projectId, category, onAdded }: { projectId: number; category: string; onAdded: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState('');
  const [value, setValue] = React.useState('');

  const handleAdd = async () => {
    if (!key.trim()) return;
    await saveProjectParam({ projectId, key: key.trim(), category, value: value.trim() || null });
    setKey(''); setValue(''); setOpen(false);
    onAdded();
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-dark-muted hover:text-accent-blue transition-colors mt-1">
      + Add parameter
    </button>
  );

  return (
    <div className="flex gap-2 mt-2 items-center">
      <input value={key} onChange={e => setKey(e.target.value)} placeholder="key" className="w-32 bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs font-mono text-dark-text outline-none focus:border-accent-blue/50" />
      <input value={value} onChange={e => setValue(e.target.value)} placeholder="value" className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs font-mono text-dark-text outline-none focus:border-accent-blue/50"
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} />
      <button onClick={handleAdd} className="px-2 py-1 bg-accent-blue text-white text-xs rounded">Add</button>
      <button onClick={() => setOpen(false)} className="text-dark-muted text-xs">Cancel</button>
    </div>
  );
}

type TabMode = 'params' | 'golden' | 'context';

export default function GPromptTab({ project }: Props) {
  const [params, setParams] = React.useState<ProjectParameter[]>([]);
  const [golden, setGolden] = React.useState<GoldenPrompt[]>([]);
  const [analysis, setAnalysis] = React.useState<GoldenAnalysis | null>(null);
  const [contextBlock, setContextBlock] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [tab, setTab] = React.useState<TabMode>('params');
  const [filterCat, setFilterCat] = React.useState<string>('all');
  const [showMissingOnly, setShowMissingOnly] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, g] = await Promise.all([
        getProjectParams(project.id),
        getGoldenPrompts(project.id),
      ]);
      setParams(p);
      setGolden(g);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, [project.id]);

  const handleExtract = async () => {
    if (!project.repo_path) return;
    setExtracting(true);
    try {
      const result = await extractProjectParams({ projectId: project.id, projectPath: project.repo_path });
      setParams(result);
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveParam = async (key: string, value: string | null) => {
    const existing = params.find(p => p.key === key);
    if (!existing) return;
    await saveProjectParam({ projectId: project.id, key, category: existing.category, value });
    setParams(prev => prev.map(p => p.key === key ? { ...p, value, is_auto_extracted: 0 } : p));
  };

  const handleDeleteParam = async (key: string) => {
    await deleteProjectParam({ projectId: project.id, key });
    setParams(prev => prev.filter(p => p.key !== key));
  };

  const handleLoadContext = async () => {
    const ctx = await getParamsAsContext(project.id);
    setContextBlock(ctx);
    setTab('context');
  };

  const handleAnalyze = async () => {
    const a = await analyzeGoldenPrompts(project.id);
    setAnalysis(a);
  };

  const handleDeleteGolden = async (id: string) => {
    await deleteGoldenPrompt(id);
    setGolden(prev => prev.filter(g => g.id !== id));
  };

  const handleGenerateNextSprint = async () => {
    try {
      const tasks = await window.api.invoke('tasks:getAll', project.id) as any[];
      const openTasks = tasks.filter((t: any) => t.status === 'todo' || t.status === 'in_progress');
      const prompt = await window.api.invoke('prompts:generate', {
        projectId: project.id,
        action: 'add-feature',
        extraContext: `OPEN TASKS FOR NEXT SPRINT:\n${openTasks.map((t: any, i: number) => `${i + 1}. ${t.title}`).join('\n')}\n\nComplete all open tasks in one sprint.`,
      }) as string;
      await navigator.clipboard.writeText(prompt);
    } catch { /* silent */ }
  };

  // Grouped by category
  const categories = [...new Set(params.map(p => p.category))].sort();
  const missingCritical = params.filter(p => {
    const isMissing = !p.value || p.value === '' || p.value === 'false';
    return isMissing && (PARAM_IMPORTANCE[p.key] === 'critical' || PARAM_IMPORTANCE[p.key] === 'important');
  });

  const filteredParams = params.filter(p => {
    if (filterCat !== 'all' && p.category !== filterCat) return false;
    if (showMissingOnly) {
      const isMissing = !p.value || p.value === '' || p.value === 'false';
      return isMissing;
    }
    return true;
  });

  const grouped = categories.reduce<Record<string, ProjectParameter[]>>((acc, cat) => {
    acc[cat] = filteredParams.filter(p => p.category === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">GPROMPT Parameters</h2>
          <p className="text-xs text-dark-muted mt-0.5">Auto-extract project context → inject into every prompt → zero guessing</p>
        </div>
        <div className="flex gap-2 items-center">
          {missingCritical.length > 0 && (
            <div className="text-xs bg-accent-red/10 border border-accent-red/30 text-accent-red px-2 py-1 rounded-full">
              ⚠ {missingCritical.length} missing
            </div>
          )}
          <button
            onClick={handleExtract}
            disabled={extracting || !project.repo_path}
            className="px-3 py-1.5 bg-accent-blue text-white text-xs rounded font-semibold hover:bg-accent-blue/80 disabled:opacity-50 transition-colors"
          >
            {extracting ? '⏳ Extracting...' : '🔍 Extract from Codebase'}
          </button>
          <button
            onClick={handleLoadContext}
            disabled={params.length === 0}
            className="px-3 py-1.5 bg-dark-hover border border-dark-border text-xs rounded hover:bg-dark-border transition-colors disabled:opacity-50"
          >
            📋 Copy Context Block
          </button>
        </div>
      </div>

      {!project.repo_path && (
        <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
          ⚠ Set a repo path in the Overview tab to enable auto-extraction
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-dark-border pb-2">
        {(['params', 'golden', 'context'] as TabMode[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs rounded-t transition-colors ${
              tab === t ? 'bg-accent-blue/10 text-accent-blue border-b-2 border-accent-blue -mb-[2px]' : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            {t === 'params' ? `⚙️ Parameters (${params.length})` : t === 'golden' ? `⭐ Golden Prompts (${golden.length})` : '📄 Context Block'}
          </button>
        ))}
      </div>

      {/* PARAMS TAB */}
      {tab === 'params' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-dark-muted">Filter:</span>
            {['all', ...categories].map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  filterCat === cat ? 'bg-accent-blue/10 border-accent-blue/40 text-accent-blue' : 'border-dark-border text-dark-muted hover:text-dark-text'
                }`}>
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]?.replace(/[^\w\s]/g, '').trim() || cat}
              </button>
            ))}
            <label className="flex items-center gap-1.5 text-xs text-dark-muted cursor-pointer ml-2">
              <input type="checkbox" checked={showMissingOnly} onChange={e => setShowMissingOnly(e.target.checked)} className="w-3 h-3" />
              Missing only
            </label>
          </div>

          {loading ? (
            <div className="text-xs text-dark-muted animate-pulse">Loading parameters...</div>
          ) : params.length === 0 ? (
            <div className="text-center py-12 text-dark-muted">
              <div className="text-3xl mb-3">🔍</div>
              <div className="text-sm font-semibold mb-1">No parameters extracted yet</div>
              <div className="text-xs">Click "Extract from Codebase" to auto-detect your project's parameters</div>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map(cat => {
                const catParams = grouped[cat];
                if (!catParams || catParams.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="text-xs font-semibold text-dark-muted mb-2 flex items-center gap-2">
                      {CATEGORY_LABELS[cat] || cat}
                      <span className="text-[10px] font-normal opacity-60">
                        {catParams.filter(p => !p.value || p.value === '' || p.value === 'false').length > 0
                          ? `${catParams.filter(p => !p.value || p.value === '' || p.value === 'false').length} missing`
                          : '✓ complete'
                        }
                      </span>
                    </div>
                    <div className="space-y-1.5 group">
                      {catParams.map(p => (
                        <ParamRow
                          key={p.key}
                          param={p}
                          onSave={handleSaveParam}
                          onDelete={handleDeleteParam}
                        />
                      ))}
                    </div>
                    <AddParamForm projectId={project.id} category={cat} onAdded={load} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GOLDEN PROMPTS TAB */}
      {tab === 'golden' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dark-muted">Prompts you starred ⭐ from the Prompt tab. Your personal golden collection.</p>
            <button
              onClick={handleGenerateNextSprint}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 transition-colors shrink-0"
            >
              ▶ Next Sprint Ready
            </button>
            <button onClick={handleAnalyze} className="px-3 py-1.5 text-xs bg-dark-hover border border-dark-border rounded hover:bg-dark-border transition-colors">
              🧠 Analyze Patterns
            </button>
          </div>

          {analysis && (
            <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-accent-blue">Pattern Analysis</div>
              <p className="text-xs text-dark-text">{analysis.insight}</p>
              {analysis.topActions.length > 0 && (
                <div className="text-xs text-dark-muted">
                  Top actions: {analysis.topActions.map(([a, n]) => `${a} (${n})`).join(', ')}
                </div>
              )}
            </div>
          )}

          {golden.length === 0 ? (
            <div className="text-center py-12 text-dark-muted">
              <div className="text-3xl mb-3">⭐</div>
              <div className="text-sm font-semibold mb-1">No golden prompts yet</div>
              <div className="text-xs">Go to the Prompt tab → generate a prompt → click ⭐ to save it here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {golden.map(g => (
                <div key={g.id} className="bg-dark-surface border border-dark-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {g.action_type && (
                        <span className="text-[10px] bg-accent-blue/10 border border-accent-blue/20 text-accent-blue px-1.5 rounded">{g.action_type}</span>
                      )}
                      {g.project_stage && (
                        <span className="text-[10px] bg-dark-hover border border-dark-border text-dark-muted px-1.5 rounded">{g.project_stage}</span>
                      )}
                      <span className="text-[10px] text-dark-muted">{new Date(g.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <CopyButton text={g.prompt_text} />
                      <button onClick={() => handleDeleteGolden(g.id)} className="px-2 py-1 text-xs text-dark-muted hover:text-accent-red transition-colors">✕</button>
                    </div>
                  </div>
                  <pre className="text-xs text-dark-muted font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
                    {g.prompt_text.substring(0, 400)}{g.prompt_text.length > 400 ? '...' : ''}
                  </pre>
                  {g.notes && <div className="text-xs text-dark-muted italic mt-1 border-t border-dark-border pt-1">{g.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEXT BLOCK TAB */}
      {tab === 'context' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dark-muted">Copy this block and paste it at the top of any prompt to Claude. Eliminates all guessing.</p>
            <CopyButton text={contextBlock} />
          </div>
          {contextBlock ? (
            <pre className="text-xs font-mono text-dark-text bg-dark-bg border border-dark-border rounded-lg p-4 whitespace-pre-wrap leading-relaxed overflow-auto max-h-[500px]">
              {contextBlock}
            </pre>
          ) : (
            <div className="text-center py-8 text-dark-muted text-xs">
              Click "Copy Context Block" in the Parameters tab to generate this
            </div>
          )}
        </div>
      )}
    </div>
  );
}
