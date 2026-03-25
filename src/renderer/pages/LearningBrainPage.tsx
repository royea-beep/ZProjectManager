import React, { useState, useEffect, useCallback } from 'react';

interface FinalReport {
  id: string;
  project: string;
  timestamp: string;
  duration_minutes: number;
  sprint: string;
  prompt_action: string;
  prompt_category: string;
  prompt_hebrew_input: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  bot_questions_asked: number;
  errors_encountered: number;
  commit_hash: string;
  commit_message: string;
  gems_discovered: string[];
  blockers_hit: string[];
  grade?: { score: number; efficiency: number; accuracy: number; completeness: number; reusability: number };
}

interface PromptPattern {
  id: string;
  action: string;
  category: string;
  description: string;
  source_project: string;
  grade_score: number;
  times_reused: number;
  projects_used_in: string[];
  template_snippet: string;
  gems_associated: string[];
  last_used_at: string;
}

type SubView = 'memory' | 'grades' | 'intelligence';

const gradeColor = (score: number) => score >= 8 ? 'text-accent-green' : score >= 6 ? 'text-yellow-400' : 'text-red-400';
const gradeBg = (score: number) => score >= 8 ? 'bg-accent-green/10 border-accent-green/30' : score >= 6 ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-red-400/10 border-red-400/30';

export default function LearningBrainPage() {
  const [subView, setSubView] = useState<SubView>('memory');
  const [reports, setReports] = useState<FinalReport[]>([]);
  const [patterns, setPatterns] = useState<PromptPattern[]>([]);
  const [categoryAverages, setCategoryAverages] = useState<{ category: string; avgScore: number; count: number }[]>([]);
  const [weakPrompts, setWeakPrompts] = useState<FinalReport[]>([]);
  const [insights, setInsights] = useState<{ mostReusedPatterns: PromptPattern[]; projectsWithSimilarNeeds: { projectA: string; projectB: string; sharedPatterns: number }[]; underutilizedPatterns: PromptPattern[] } | null>(null);
  const [stats, setStats] = useState<{ totalReports: number; projectCount: number; avgGrade: number } | null>(null);
  const [gradeSummary, setGradeSummary] = useState<{ totalGraded: number; avgScore: number; topCategory: string; weakCount: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FinalReport[] | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [r, p, ca, w, ins, s, gs] = await Promise.all([
      window.api.invoke('memory:get-all', 50) as Promise<FinalReport[]>,
      window.api.invoke('intel:get-all-patterns') as Promise<PromptPattern[]>,
      window.api.invoke('grading:category-averages') as Promise<{ category: string; avgScore: number; count: number }[]>,
      window.api.invoke('grading:weak-prompts') as Promise<FinalReport[]>,
      window.api.invoke('intel:get-insights') as Promise<{ mostReusedPatterns: PromptPattern[]; projectsWithSimilarNeeds: { projectA: string; projectB: string; sharedPatterns: number }[]; underutilizedPatterns: PromptPattern[] }>,
      window.api.invoke('memory:get-stats') as Promise<{ totalReports: number; projectCount: number; avgGrade: number }>,
      window.api.invoke('grading:summary') as Promise<{ totalGraded: number; avgScore: number; topCategory: string; weakCount: number }>,
    ]);
    setReports(r || []);
    setPatterns(p || []);
    setCategoryAverages(ca || []);
    setWeakPrompts(w || []);
    setInsights(ins || null);
    setStats(s || null);
    setGradeSummary(gs || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const results = await window.api.invoke('memory:search', searchQuery) as FinalReport[];
    setSearchResults(results || []);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    const result = await window.api.invoke('memory:import-raw', importText) as { success: boolean; error?: string };
    if (result.success) {
      setImportMsg('הדוח נשמר בהצלחה');
      setImportText('');
      load();
    } else {
      setImportMsg('שגיאה: ' + result.error);
    }
    setTimeout(() => setImportMsg(''), 4000);
  };

  const displayReports = searchResults !== null ? searchResults : (filterProject ? reports.filter(r => r.project === filterProject) : reports);
  const projects = [...new Set(reports.map(r => r.project))].sort();

  if (loading) return (
    <div className="p-8 text-center text-dark-muted">
      <div className="text-2xl mb-2">🧠</div>
      <div>טוען...</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🧠 Learning Brain</h1>
          <p className="text-dark-muted text-sm mt-1">קלוסינג לולמדינה — כל סשר משתפר את הסשר הבא</p>
        </div>
        {stats && (
          <div className="flex gap-4 text-center">
            <div><div className="text-lg font-bold text-accent-blue">{stats.totalReports}</div><div className="text-dark-muted text-xs">דוחות</div></div>
            <div><div className="text-lg font-bold text-accent-green">{stats.projectCount}</div><div className="text-dark-muted text-xs">פרויקטים</div></div>
            <div><div className={'text-lg font-bold ' + gradeColor(stats.avgGrade)}>{stats.avgGrade}/10</div><div className="text-dark-muted text-xs">ציון ממוצע</div></div>
            <div><div className="text-lg font-bold text-purple-400">{patterns.length}</div><div className="text-dark-muted text-xs">תבניות</div></div>
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-dark-surface rounded-lg p-1 w-fit">
        {([['memory', '📚 זיכרון משותף'], ['grades', '⭐ ציונים'], ['intelligence', '🔗 אינטליגנציה צולבת']] as [SubView, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubView(key)}
            className={'px-4 py-2 rounded text-sm font-medium transition-colors ' + (subView === key ? 'bg-accent-blue text-white' : 'text-dark-muted hover:text-dark-text')}
          >{label}</button>
        ))}
      </div>

      {subView === 'memory' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="חפש בדוחות..."
              className="flex-1 bg-dark-surface border border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-blue"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-accent-blue/20 border border-accent-blue/40 rounded text-sm text-accent-blue hover:bg-accent-blue/30">חפש</button>
            {searchResults && <button onClick={() => { setSearchResults(null); setSearchQuery(''); }} className="px-3 py-2 text-dark-muted text-sm hover:text-dark-text">נקה</button>}
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="bg-dark-surface border border-dark-border rounded px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">כל הפרויקטים</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <details className="bg-dark-surface border border-dark-border rounded-lg">
            <summary className="p-3 cursor-pointer text-sm text-dark-muted hover:text-dark-text">📥 ייבוא דוח חדש</summary>
            <div className="p-3 border-t border-dark-border space-y-2">
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='{ "project": "9soccer", "prompt_action": "add-game-mode", ... }'
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs font-mono h-24 focus:outline-none focus:border-accent-blue resize-none"
                dir="ltr"
              />
              <div className="flex items-center gap-2">
                <button onClick={handleImport} className="px-4 py-2 bg-accent-green/20 border border-accent-green/40 rounded text-sm text-accent-green hover:bg-accent-green/30">שמור</button>
                {importMsg && <span className="text-sm">{importMsg}</span>}
              </div>
            </div>
          </details>

          <div className="space-y-2">
            {displayReports.length === 0 && (
              <div className="text-center py-12 text-dark-muted">
                <div className="text-3xl mb-2">📂</div>
                <div>אין דוחות עדיין</div>
                <div className="text-xs mt-1">שמור את הדוח הראשון והסיסטמה תתחיל ללמוד</div>
              </div>
            )}
            {displayReports.map(r => (
              <div key={r.id} className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
                <button
                  className="w-full p-3 text-right flex items-center justify-between hover:bg-dark-hover transition-colors"
                  onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}
                >
                  <div className="flex items-center gap-3">
                    {r.grade && (
                      <span className={'text-sm font-bold px-2 py-0.5 rounded border ' + gradeBg(r.grade.score) + ' ' + gradeColor(r.grade.score)}>
                        {r.grade.score}/10
                      </span>
                    )}
                    <span className="text-xs text-dark-muted">{r.timestamp?.slice(0, 10)}</span>
                    <span className="text-xs bg-dark-border/50 px-2 py-0.5 rounded">{r.project}</span>
                    {r.prompt_category && <span className="text-xs text-purple-400">{r.prompt_category}</span>}
                  </div>
                  <div className="text-sm font-medium">{r.prompt_action || '—'}</div>
                </button>
                {expandedReport === r.id && (
                  <div className="p-4 border-t border-dark-border space-y-3 text-sm" dir="ltr">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-dark-bg rounded p-2"><div className="text-dark-muted text-xs">Tasks</div><div className="font-bold">{r.completed_tasks}/{r.total_tasks}</div></div>
                      <div className="bg-dark-bg rounded p-2"><div className="text-dark-muted text-xs">Questions</div><div className="font-bold">{r.bot_questions_asked}</div></div>
                      <div className="bg-dark-bg rounded p-2"><div className="text-dark-muted text-xs">Errors</div><div className="font-bold">{r.errors_encountered}</div></div>
                    </div>
                    {r.grade && (
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {(['efficiency', 'accuracy', 'completeness', 'reusability'] as const).map(k => (
                          <div key={k} className="bg-dark-bg rounded p-2">
                            <div className="text-dark-muted capitalize">{k}</div>
                            <div className={'font-bold ' + gradeColor(r.grade![k])}>{r.grade![k]}/10</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.commit_message && <div className="font-mono text-xs bg-dark-bg p-2 rounded text-dark-muted" dir="ltr">{r.commit_hash?.slice(0, 7)} — {r.commit_message}</div>}
                    {r.gems_discovered?.length > 0 && (
                      <div><div className="text-xs text-dark-muted mb-1">GEMs:</div>{r.gems_discovered.map((g, i) => <div key={i} className="text-xs text-accent-green">✨ {g}</div>)}</div>
                    )}
                    {r.blockers_hit?.length > 0 && (
                      <div><div className="text-xs text-dark-muted mb-1">Blockers:</div>{r.blockers_hit.map((b, i) => <div key={i} className="text-xs text-red-400">⚠ {b}</div>)}</div>
                    )}
                    {r.prompt_hebrew_input && <div className="text-xs text-dark-muted" dir="rtl">קלט: {r.prompt_hebrew_input}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subView === 'grades' && (
        <div className="space-y-6">
          {gradeSummary && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-dark-surface border border-dark-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-accent-blue">{gradeSummary.totalGraded}</div>
                <div className="text-xs text-dark-muted mt-1">סהכ צויינו</div>
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-lg p-4 text-center">
                <div className={'text-2xl font-bold ' + gradeColor(gradeSummary.avgScore)}>{gradeSummary.avgScore}/10</div>
                <div className="text-xs text-dark-muted mt-1">ציון ממוצע</div>
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-purple-400">{gradeSummary.topCategory || '—'}</div>
                <div className="text-xs text-dark-muted mt-1">קטגוריה מובילה</div>
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{gradeSummary.weakCount}</div>
                <div className="text-xs text-dark-muted mt-1">פרומפטים חלשים</div>
              </div>
            </div>
          )}

          {categoryAverages.length > 0 && (
            <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
              <h3 className="font-semibold mb-3">ציון לפי קטגוריה</h3>
              <div className="space-y-2">
                {categoryAverages.map(c => (
                  <div key={c.category} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-right">{c.category}</div>
                    <div className="flex-1 bg-dark-bg rounded-full h-2">
                      <div
                        className={'h-2 rounded-full ' + (c.avgScore >= 8 ? 'bg-accent-green' : c.avgScore >= 6 ? 'bg-yellow-400' : 'bg-red-400')}
                        style={{ width: (c.avgScore / 10 * 100) + '%' }}
                      />
                    </div>
                    <div className={'text-sm font-bold w-12 ' + gradeColor(c.avgScore)}>{c.avgScore}/10</div>
                    <div className="text-xs text-dark-muted w-16">{c.count} סשרים</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">כל הציונות</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="ltr">
                <thead>
                  <tr className="text-dark-muted text-xs border-b border-dark-border">
                    <th className="text-left py-2 pr-3">Project</th>
                    <th className="text-left py-2 pr-3">Action</th>
                    <th className="text-left py-2 pr-3">Category</th>
                    <th className="text-right py-2 pr-3">Score</th>
                    <th className="text-right py-2 pr-3">Eff.</th>
                    <th className="text-right py-2 pr-3">Acc.</th>
                    <th className="text-right py-2 pr-3">Comp.</th>
                    <th className="text-right py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.filter(r => r.grade).map(r => (
                    <tr key={r.id} className="border-b border-dark-border/30 hover:bg-dark-hover">
                      <td className="py-1.5 pr-3 text-dark-muted">{r.project}</td>
                      <td className="py-1.5 pr-3">{r.prompt_action}</td>
                      <td className="py-1.5 pr-3 text-purple-400 text-xs">{r.prompt_category}</td>
                      <td className={'py-1.5 pr-3 text-right font-bold ' + gradeColor(r.grade!.score)}>{r.grade!.score}</td>
                      <td className={'py-1.5 pr-3 text-right ' + gradeColor(r.grade!.efficiency)}>{r.grade!.efficiency}</td>
                      <td className={'py-1.5 pr-3 text-right ' + gradeColor(r.grade!.accuracy)}>{r.grade!.accuracy}</td>
                      <td className={'py-1.5 pr-3 text-right ' + gradeColor(r.grade!.completeness)}>{r.grade!.completeness}</td>
                      <td className="py-1.5 text-right text-dark-muted text-xs">{r.timestamp?.slice(0, 10)}</td>
                    </tr>
                  ))}
                  {reports.filter(r => r.grade).length === 0 && (
                    <tr><td colSpan={8} className="py-6 text-center text-dark-muted">אין ציונות עדיין</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {weakPrompts.length > 0 && (
            <div className="bg-dark-surface border border-red-400/30 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-red-400">⚠ פרומפטים חלשים — מומלץ לשכתיב</h3>
              <div className="space-y-2">
                {weakPrompts.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-red-400/5 border border-red-400/20 rounded">
                    <div className="text-sm">{r.prompt_action} <span className="text-dark-muted">({r.project})</span></div>
                    <div className="text-red-400 font-bold text-sm">{r.grade?.score}/10</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subView === 'intelligence' && (
        <div className="space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">📚 ספריית התבניות ({patterns.length})</h3>
            <div className="space-y-2">
              {patterns.length === 0 && (
                <div className="text-center py-8 text-dark-muted text-sm">
                  אין תבניות עדיין. דוחות עם ציון 8.0+ ייצרו תבניות אוטומטית.
                </div>
              )}
              {patterns.map(p => (
                <div key={p.id} className="border border-dark-border rounded-lg overflow-hidden">
                  <button
                    className="w-full p-3 text-right flex items-center justify-between hover:bg-dark-hover"
                    onClick={() => setExpandedPattern(expandedPattern === p.id ? null : p.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={'text-sm font-bold px-2 py-0.5 rounded border ' + gradeBg(p.grade_score) + ' ' + gradeColor(p.grade_score)}>{p.grade_score}/10</span>
                      <span className="text-xs bg-dark-border/50 px-2 py-0.5 rounded">{p.category}</span>
                      <span className="text-xs text-dark-muted">שומש {p.times_reused}x ב: {p.projects_used_in.join(', ')}</span>
                    </div>
                    <div className="text-sm font-medium">{p.action}</div>
                  </button>
                  {expandedPattern === p.id && (
                    <div className="p-4 border-t border-dark-border space-y-3" dir="ltr">
                      <div className="text-xs text-dark-muted">{p.description}</div>
                      <pre className="text-xs bg-dark-bg p-3 rounded font-mono whitespace-pre-wrap text-accent-green">{p.template_snippet}</pre>
                      {p.gems_associated?.length > 0 && (
                        <div>
                          <div className="text-xs text-dark-muted mb-1">Associated GEMs:</div>
                          {p.gems_associated.map((g, i) => <div key={i} className="text-xs text-yellow-400">✨ {g}</div>)}
                        </div>
                      )}
                      <div className="text-xs text-dark-muted">Source: {p.source_project} | Last used: {p.last_used_at?.slice(0, 10)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {insights && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">🔥 תבניות שבישום נעשו בהן</h3>
                {insights.mostReusedPatterns.length === 0 ? <div className="text-xs text-dark-muted">אין נתונים</div> :
                  insights.mostReusedPatterns.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-dark-border/30 last:border-0">
                      <div className="text-xs">{p.action}</div>
                      <div className="text-xs text-accent-blue font-bold">{p.times_reused}x</div>
                    </div>
                  ))}
              </div>

              <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">🤝 פרויקטים דומים</h3>
                {insights.projectsWithSimilarNeeds.length === 0 ? <div className="text-xs text-dark-muted">אין נתונים</div> :
                  insights.projectsWithSimilarNeeds.map((pair, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-dark-border/30 last:border-0">
                      <div className="text-xs">{pair.projectA} + {pair.projectB}</div>
                      <div className="text-xs text-purple-400">{pair.sharedPatterns} משותף</div>
                    </div>
                  ))}
              </div>

              <div className="bg-dark-surface border border-accent-green/30 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3 text-accent-green">💡 תבניות לנצל</h3>
                {insights.underutilizedPatterns.length === 0 ? <div className="text-xs text-dark-muted">אין נתונים</div> :
                  insights.underutilizedPatterns.map(p => (
                    <div key={p.id} className="py-1.5 border-b border-dark-border/30 last:border-0">
                      <div className="text-xs font-medium">{p.action}</div>
                      <div className="text-xs text-dark-muted">ציון: {p.grade_score}/10 — נוצר מ: {p.source_project}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
