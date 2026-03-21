# ZPROJECTMANAGER — SPRINT 11: Intelligence Layer + Billing + Cross-Project Patterns
**Date:** 2026-03-21 | **Time:** 10:20 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 11 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md
git log --oneline -3
npx tsc --noEmit 2>&1 | tail -3
cat C:/Projects/ZProjectManager/src/main/database.ts | grep "CURRENT_SCHEMA_VERSION"
```

---

## 7 PARALLEL AGENTS

---

## AGENT 1 — DB Migration v12

```sql
-- Intelligence: daily suggestions per project
CREATE TABLE IF NOT EXISTS intelligence_suggestions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK(suggestion_type IN (
    'action_needed',    -- משהו צריך לעשות עכשיו
    'opportunity',      -- הזדמנות לשיפור
    'risk',             -- סיכון שצריך לטפל
    'cross_project',    -- תובנה בין פרויקטים
    'revenue'           -- הזדמנות הכנסה
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5 CHECK(priority BETWEEN 1 AND 10),
  action_prompt_id TEXT,   -- איזה prompt לייצר אם לוחצים "Fix"
  dismissed INTEGER DEFAULT 0,
  auto_generated INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT          -- suggestions are ephemeral
);

-- Cross-project patterns (shared analysis)
CREATE TABLE IF NOT EXISTS cross_project_insights (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_project_ids TEXT,  -- JSON array of project IDs
  severity TEXT DEFAULT 'info' CHECK(severity IN ('critical','warning','info','opportunity')),
  auto_fix_available INTEGER DEFAULT 0,
  dismissed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Invoices for client workspaces
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  total_hours REAL NOT NULL,
  billing_rate INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'ILS',
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','cancelled')),
  line_items TEXT NOT NULL,  -- JSON
  notes TEXT,
  issued_at TEXT DEFAULT (datetime('now')),
  due_at TEXT,
  paid_at TEXT
);

-- Notification log
CREATE TABLE IF NOT EXISTS notification_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

Wire into `database.ts` as migration v12.

---

## AGENT 2 — Intelligence Engine

### Create `src/main/intelligence-engine.ts`

```typescript
import type Database from 'better-sqlite3'

interface IntelligenceSuggestion {
  project_id: number
  suggestion_type: string
  title: string
  description: string
  priority: number
  action_prompt_id?: string
  expires_at?: string
}

export function runIntelligenceEngine(db: any): IntelligenceSuggestion[] {
  const suggestions: IntelligenceSuggestion[] = []
  const tomorrow = new Date(Date.now() + 86400000).toISOString()

  // Load all active projects with full context
  const projects = db.prepare(`
    SELECT p.*, w.type as ws_type, w.name as ws_name, w.billing_rate
    FROM projects p
    LEFT JOIN workspaces w ON w.id = p.workspace_id
    WHERE p.status NOT IN ('archived', 'idea')
  `).all() as any[]

  for (const p of projects) {
    // ── RULE 1: CI failing ──────────────────────────────────────────────────
    if (p.github_ci_status === 'failing') {
      suggestions.push({
        project_id: p.id,
        suggestion_type: 'action_needed',
        title: `CI failing on ${p.name}`,
        description: 'Build is broken. Fix before any other work.',
        priority: 10,
        action_prompt_id: 'fix-bugs',
        expires_at: tomorrow,
      })
    }

    // ── RULE 2: Health < 40 ─────────────────────────────────────────────────
    if ((p.health_score || 100) < 40) {
      suggestions.push({
        project_id: p.id,
        suggestion_type: 'risk',
        title: `${p.name} health critical: ${p.health_score}/100`,
        description: 'Project health is dangerously low. Run full audit.',
        priority: 9,
        action_prompt_id: 'audit-full',
        expires_at: tomorrow,
      })
    }

    // ── RULE 3: Live project, no revenue ────────────────────────────────────
    if ((p.stage === 'live' || p.stage === 'scaling') && (!p.mrr || p.mrr === 0)) {
      suggestions.push({
        project_id: p.id,
        suggestion_type: 'revenue',
        title: `${p.name} is live but not monetized`,
        description: `Potential revenue left on the table. Add Payplus payment.`,
        priority: 7,
        action_prompt_id: 'add-payments',
        expires_at: tomorrow,
      })
    }

    // ── RULE 4: TestFlight, no session in 7+ days ────────────────────────────
    if (p.stage === 'testflight') {
      const lastSession = db.prepare(
        'SELECT created_at FROM project_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(p.id) as any
      if (!lastSession || new Date(lastSession.created_at) < new Date(Date.now() - 7 * 86400000)) {
        suggestions.push({
          project_id: p.id,
          suggestion_type: 'action_needed',
          title: `${p.name} on TestFlight — no activity in 7+ days`,
          description: 'TestFlight build gets stale. Push testers to report or submit to App Store.',
          priority: 6,
          action_prompt_id: 'fix-bugs',
          expires_at: tomorrow,
        })
      }
    }

    // ── RULE 5: Client project, unbilled hours ────────────────────────────────
    if (p.ws_type === 'client') {
      const unbilled = db.prepare(
        'SELECT SUM(hours) as total FROM work_sessions WHERE project_id = ? AND billed = 0'
      ).get(p.id) as any
      if ((unbilled?.total || 0) >= 4) {
        const amount = Math.round((unbilled.total || 0) * (p.billing_rate || 200))
        suggestions.push({
          project_id: p.id,
          suggestion_type: 'revenue',
          title: `${p.name}: ₪${amount.toLocaleString()} unbilled (${unbilled.total}h)`,
          description: `${p.billing_rate || 200}₪/h × ${unbilled.total}h = ₪${amount.toLocaleString()} waiting to be invoiced.`,
          priority: 8,
          action_prompt_id: undefined,
          expires_at: tomorrow,
        })
      }
    }

    // ── RULE 6: Open PRs > 3 ─────────────────────────────────────────────────
    if ((p.github_open_prs || 0) > 3) {
      suggestions.push({
        project_id: p.id,
        suggestion_type: 'action_needed',
        title: `${p.name}: ${p.github_open_prs} open PRs`,
        description: 'Too many open PRs. Review and merge or close.',
        priority: 5,
        action_prompt_id: 'audit-codebase',
        expires_at: tomorrow,
      })
    }

    // ── RULE 7: No MEMORY.md ─────────────────────────────────────────────────
    if (p.repo_path) {
      const fs = require('fs')
      const path = require('path')
      if (!fs.existsSync(path.join(p.repo_path, 'MEMORY.md'))) {
        suggestions.push({
          project_id: p.id,
          suggestion_type: 'opportunity',
          title: `${p.name}: no MEMORY.md`,
          description: 'Without MEMORY.md, every Claude session starts from zero.',
          priority: 4,
          action_prompt_id: undefined,
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        })
      }
    }
  }

  // Persist suggestions (clear old ones first)
  db.prepare('DELETE FROM intelligence_suggestions WHERE auto_generated = 1').run()
  const insert = db.prepare(`
    INSERT INTO intelligence_suggestions
    (project_id, suggestion_type, title, description, priority, action_prompt_id, expires_at)
    VALUES (?,?,?,?,?,?,?)
  `)
  for (const s of suggestions) {
    insert.run(s.project_id, s.suggestion_type, s.title, s.description, s.priority, s.action_prompt_id || null, s.expires_at || null)
  }

  return suggestions
}

// ── CROSS-PROJECT ANALYZER ────────────────────────────────────────────────────

export function runCrossProjectAnalysis(db: any): void {
  const projects = db.prepare("SELECT * FROM projects WHERE status NOT IN ('archived')").all() as any[]

  db.prepare('DELETE FROM cross_project_insights WHERE auto_generated_at IS NOT NULL OR 1=1').run()

  const insights: any[] = []

  // ── Check 1: Supabase projects with no RLS ───────────────────────────────
  // Detect via parameters_json
  const noRlsProjects: string[] = []
  for (const p of projects) {
    if (!p.parameters_json) continue
    try {
      const params = JSON.parse(p.parameters_json)
      if (params.tableNames?.length > 0 && params.hasRLS === false) {
        noRlsProjects.push(p.name)
      }
    } catch { /* skip */ }
  }
  if (noRlsProjects.length > 0) {
    insights.push({
      insight_type: 'security',
      title: `${noRlsProjects.length} projects may have missing RLS`,
      description: `${noRlsProjects.join(', ')} — Supabase tables detected but RLS status unknown. Run DB audit.`,
      affected_project_ids: JSON.stringify(noRlsProjects),
      severity: 'warning',
    })
  }

  // ── Check 2: Shared tech stack — reuse opportunity ───────────────────────
  const stackCounts: Record<string, string[]> = {}
  for (const p of projects) {
    if (!p.tech_stack) continue
    const techs = p.tech_stack.split(',').map((t: string) => t.trim()).filter(Boolean)
    for (const tech of techs) {
      if (!stackCounts[tech]) stackCounts[tech] = []
      stackCounts[tech].push(p.name)
    }
  }
  for (const [tech, projs] of Object.entries(stackCounts)) {
    if (projs.length >= 4) {
      insights.push({
        insight_type: 'opportunity',
        title: `${tech} used in ${projs.length} projects — extract shared config?`,
        description: `${projs.slice(0, 4).join(', ')}${projs.length > 4 ? ` +${projs.length - 4}` : ''} all use ${tech}. Shared utilities already in shared-utils.`,
        affected_project_ids: JSON.stringify(projs),
        severity: 'info',
      })
    }
  }

  // ── Check 3: Multiple stale projects ─────────────────────────────────────
  const stale = projects.filter(p => {
    if (!p.last_worked_at) return false
    return new Date(p.last_worked_at) < new Date(Date.now() - 30 * 86400000)
  })
  if (stale.length >= 3) {
    insights.push({
      insight_type: 'portfolio',
      title: `${stale.length} projects not touched in 30+ days`,
      description: `${stale.slice(0,3).map(p => p.name).join(', ')}${stale.length > 3 ? ` +${stale.length - 3}` : ''} — consider archiving or resuming.`,
      affected_project_ids: JSON.stringify(stale.map(p => p.id)),
      severity: 'info',
    })
  }

  // ── Check 4: Revenue opportunity — cluster of live, no MRR ──────────────
  const liveNoRevenue = projects.filter(p =>
    (p.stage === 'live' || p.stage === 'scaling') && (!p.mrr || p.mrr === 0)
  )
  if (liveNoRevenue.length >= 2) {
    insights.push({
      insight_type: 'revenue',
      title: `${liveNoRevenue.length} live products with ₪0 MRR`,
      description: `${liveNoRevenue.map(p => p.name).join(', ')} — all live, none monetized. One Payplus integration could unlock revenue across all.`,
      affected_project_ids: JSON.stringify(liveNoRevenue.map(p => p.id)),
      severity: 'opportunity',
    })
  }

  // Persist
  const insertInsight = db.prepare(`
    INSERT INTO cross_project_insights (insight_type, title, description, affected_project_ids, severity)
    VALUES (?,?,?,?,?)
  `)
  for (const i of insights) {
    insertInsight.run(i.insight_type, i.title, i.description, i.affected_project_ids, i.severity)
  }
}
```

---

## AGENT 3 — Wire Intelligence Engine to IPC

### Add to `ipc.ts`:
```typescript
import { runIntelligenceEngine, runCrossProjectAnalysis } from './intelligence-engine'

// Run on app start (background, non-blocking)
setTimeout(() => {
  try {
    runIntelligenceEngine(db)
    runCrossProjectAnalysis(db)
  } catch (e) {
    console.error('Intelligence engine error:', e)
  }
}, 5000) // 5s after app ready

// Manual trigger
ipcMain.handle('intelligence:run', () => {
  const suggestions = runIntelligenceEngine(db)
  runCrossProjectAnalysis(db)
  return suggestions
})

ipcMain.handle('intelligence:get-suggestions', (_e, projectId?: number) => {
  if (projectId) {
    return db.prepare(`
      SELECT * FROM intelligence_suggestions
      WHERE project_id = ? AND dismissed = 0
      ORDER BY priority DESC
    `).all(projectId)
  }
  return db.prepare(`
    SELECT s.*, p.name as project_name, p.stage, w.color as ws_color, w.name as ws_name
    FROM intelligence_suggestions s
    JOIN projects p ON p.id = s.project_id
    LEFT JOIN workspaces w ON w.id = p.workspace_id
    WHERE s.dismissed = 0
    ORDER BY s.priority DESC
    LIMIT 50
  `).all()
})

ipcMain.handle('intelligence:dismiss', (_e, id: string) => {
  db.prepare('UPDATE intelligence_suggestions SET dismissed = 1 WHERE id = ?').run(id)
  return { ok: true }
})

ipcMain.handle('intelligence:get-cross-project', () => {
  return db.prepare(`
    SELECT * FROM cross_project_insights WHERE dismissed = 0 ORDER BY severity DESC, created_at DESC
  `).all()
})

ipcMain.handle('intelligence:dismiss-insight', (_e, id: string) => {
  db.prepare('UPDATE cross_project_insights SET dismissed = 1 WHERE id = ?').run(id)
  return { ok: true }
})

// Billing / Invoices
ipcMain.handle('invoices:create', (_e, data: any) => {
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
  return runInsert(
    'INSERT INTO invoices (workspace_id, invoice_number, client_name, total_hours, billing_rate, total_amount, line_items, notes, due_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [data.workspace_id, invoiceNumber, data.client_name, data.total_hours, data.billing_rate,
     data.total_amount, JSON.stringify(data.line_items || []), data.notes || null, data.due_at || null]
  )
})

ipcMain.handle('invoices:get', (_e, workspaceId?: number) => {
  if (workspaceId) {
    return db.prepare('SELECT * FROM invoices WHERE workspace_id = ? ORDER BY issued_at DESC').all(workspaceId)
  }
  return db.prepare('SELECT * FROM invoices ORDER BY issued_at DESC LIMIT 50').all()
})

ipcMain.handle('invoices:update-status', (_e, id: string, status: string) => {
  const extra = status === 'paid' ? ", paid_at = datetime('now')" : ''
  db.prepare(`UPDATE invoices SET status = ? ${extra} WHERE id = ?`).run(status, id)
  return { ok: true }
})

// Mark work sessions as billed
ipcMain.handle('work-sessions:mark-billed', (_e, projectId: number) => {
  db.prepare('UPDATE work_sessions SET billed = 1 WHERE project_id = ? AND billed = 0').run(projectId)
  return { ok: true }
})
```

Add to `preload.ts`:
```typescript
'intelligence:run', 'intelligence:get-suggestions', 'intelligence:dismiss',
'intelligence:get-cross-project', 'intelligence:dismiss-insight',
'invoices:create', 'invoices:get', 'invoices:update-status',
'work-sessions:mark-billed',
```

---

## AGENT 4 — Intelligence Page

### Create `src/renderer/pages/IntelligencePage.tsx`

Full layout:
```
┌─────────────────────────────────────────────────────────┐
│ 🧠 Intelligence        [Run Analysis] [last run: Xs ago] │
├──────────────────────────┬──────────────────────────────┤
│ ACTION NEEDED            │ CROSS-PROJECT INSIGHTS        │
│ 🔴 9Soccer CI failing    │ 💡 3 live products, ₪0 MRR    │
│ 🟠 VenueKit unbilled ₪2800│ ⚠️ 5 projects no MEMORY.md    │
│ 🔵 Wingman no activity   │ 🔁 Next.js in 8 projects       │
│ ...                      │ ...                            │
└──────────────────────────┴──────────────────────────────┘
```

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTION_LABELS } from '../../shared/prompt-templates'
import type { PromptAction } from '../../shared/prompt-templates'
import { useToast } from '../components/Toast'
import NextStepsWidget from '../components/NextStepsWidget'

const PRIORITY_COLOR = (p: number) =>
  p >= 9 ? 'text-red-400 border-red-400/30 bg-red-400/5' :
  p >= 7 ? 'text-orange-400 border-orange-400/30 bg-orange-400/5' :
  p >= 5 ? 'text-accent-blue border-accent-blue/30 bg-accent-blue/5' :
  'text-dark-muted border-dark-border bg-dark-bg'

const PRIORITY_DOT = (p: number) =>
  p >= 9 ? 'bg-red-400' : p >= 7 ? 'bg-orange-400' : p >= 5 ? 'bg-accent-blue' : 'bg-dark-muted'

const SEVERITY_COLOR = {
  critical: 'text-red-400 border-red-400/30',
  warning: 'text-yellow-400 border-yellow-400/30',
  opportunity: 'text-green-400 border-green-400/30',
  info: 'text-dark-muted border-dark-border',
}

export default function IntelligencePage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = useCallback(async () => {
    const [s, i] = await Promise.all([
      window.api.invoke('intelligence:get-suggestions'),
      window.api.invoke('intelligence:get-cross-project'),
    ])
    setSuggestions(s || [])
    setInsights(i || [])
    setLastRun(new Date())
  }, [])

  const runAnalysis = async () => {
    setLoading(true)
    await window.api.invoke('intelligence:run')
    await loadAll()
    setLoading(false)
    toast('Analysis complete', 'success')
  }

  const dismiss = async (id: string, type: 'suggestion' | 'insight') => {
    if (type === 'suggestion') await window.api.invoke('intelligence:dismiss', id)
    else await window.api.invoke('intelligence:dismiss-insight', id)
    await loadAll()
  }

  const generateAndCopy = async (suggestion: any) => {
    if (!suggestion.action_prompt_id) return
    setGeneratingPrompt(suggestion.id)
    try {
      const prompt = await window.api.invoke('prompts:generate', {
        projectId: suggestion.project_id,
        action: suggestion.action_prompt_id,
        extraContext: suggestion.description,
      })
      await navigator.clipboard.writeText(prompt)
      toast('Prompt copied — paste into Claude Code', 'success')
    } catch {
      toast('Failed to generate prompt', 'error')
    } finally {
      setGeneratingPrompt(null)
    }
  }

  const timeSince = lastRun ? Math.round((Date.now() - lastRun.getTime()) / 1000) : null

  const criticalCount = suggestions.filter(s => s.priority >= 9).length
  const revenueOpps = suggestions.filter(s => s.suggestion_type === 'revenue')
  const totalUnbilled = revenueOpps
    .reduce((sum, s) => {
      const match = s.title.match(/₪([\d,]+)/)
      return sum + (match ? parseInt(match[1].replace(',', '')) : 0)
    }, 0)

  return (
    <div className="flex gap-0 h-full">
      {/* Main */}
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
                  <div
                    key={s.id}
                    className={`p-3 rounded-xl border ${PRIORITY_COLOR(s.priority)}`}
                  >
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
                              {generatingPrompt === s.id ? '⏳' : '⚡'} {ACTION_LABELS[s.action_prompt_id as PromptAction] || s.action_prompt_id}
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
                    className={`p-3 rounded-xl border ${SEVERITY_COLOR[insight.severity as keyof typeof SEVERITY_COLOR] || SEVERITY_COLOR.info}`}
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

      {/* Right: Next Steps */}
      <div className="w-64 shrink-0 border-l border-dark-border overflow-y-auto p-4">
        <NextStepsWidget context="dashboard" />
      </div>
    </div>
  )
}
```

---

## AGENT 5 — Billing Page (Client Workspaces)

### Create `src/renderer/pages/BillingPage.tsx`

```tsx
import React, { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'

interface WorkSummary {
  project_name: string
  project_id: number
  total_hours: number
  billed_hours: number
  billing_rate: number
}

export default function BillingPage() {
  const { toast } = useToast()
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null)
  const [summary, setSummary] = useState<WorkSummary[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [showLogHours, setShowLogHours] = useState(false)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)

  // Hours logging form
  const [logForm, setLogForm] = useState({ project_id: 0, hours: 1, description: '' })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [ws, inv] = await Promise.all([
      window.api.invoke('workspaces:get-all'),
      window.api.invoke('invoices:get'),
    ])
    const clientWorkspaces = (ws || []).filter((w: any) => w.type === 'client')
    setWorkspaces(clientWorkspaces)
    if (clientWorkspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspaceId(clientWorkspaces[0].id)
    }
    setInvoices(inv || [])
  }

  useEffect(() => {
    if (!activeWorkspaceId) return
    window.api.invoke('work-sessions:summary', activeWorkspaceId).then(setSummary).catch(() => {})
  }, [activeWorkspaceId])

  const logHours = async () => {
    await window.api.invoke('work-sessions:log', {
      ...logForm,
      workspace_id: activeWorkspaceId,
    })
    toast('Hours logged', 'success')
    setShowLogHours(false)
    window.api.invoke('work-sessions:summary', activeWorkspaceId).then(setSummary)
    window.api.invoke('intelligence:run')
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const unbilledSummary = summary.filter(s => s.total_hours - s.billed_hours > 0)
  const totalUnbilledHours = unbilledSummary.reduce((sum, s) => sum + (s.total_hours - s.billed_hours), 0)
  const totalUnbilledAmount = unbilledSummary.reduce((sum, s) =>
    sum + (s.total_hours - s.billed_hours) * (s.billing_rate || activeWorkspace?.billing_rate || 200), 0)

  const createInvoice = async () => {
    if (!activeWorkspace || unbilledSummary.length === 0) return
    const lineItems = unbilledSummary.map(s => ({
      project: s.project_name,
      hours: s.total_hours - s.billed_hours,
      rate: s.billing_rate || activeWorkspace.billing_rate || 200,
      amount: (s.total_hours - s.billed_hours) * (s.billing_rate || activeWorkspace.billing_rate || 200),
    }))

    await window.api.invoke('invoices:create', {
      workspace_id: activeWorkspace.id,
      client_name: activeWorkspace.client_name || activeWorkspace.name,
      total_hours: totalUnbilledHours,
      billing_rate: activeWorkspace.billing_rate || 200,
      total_amount: totalUnbilledAmount,
      line_items: lineItems,
      due_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    })

    // Mark all as billed
    for (const s of unbilledSummary) {
      await window.api.invoke('work-sessions:mark-billed', s.project_id)
    }

    toast(`Invoice created: ₪${totalUnbilledAmount.toLocaleString()}`, 'success')
    loadAll()
    window.api.invoke('work-sessions:summary', activeWorkspaceId).then(setSummary)
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="text-4xl mb-3">💼</div>
        <p className="text-sm font-semibold text-dark-text mb-1">No client workspaces yet</p>
        <p className="text-xs text-dark-muted max-w-xs">
          Create a client workspace from the sidebar to start tracking hours and generating invoices.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-dark-text">💼 Billing</h2>
          <p className="text-xs text-dark-muted mt-0.5">Hours tracking + Invoice generation</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogHours(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-dark-text hover:border-accent-blue/40 transition-colors"
          >
            + Log Hours
          </button>
          {totalUnbilledHours > 0 && (
            <button
              onClick={createInvoice}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent-green text-white font-medium hover:bg-accent-green/80 transition-colors"
            >
              🧾 Create Invoice (₪{totalUnbilledAmount.toLocaleString()})
            </button>
          )}
        </div>
      </div>

      {/* Workspace tabs */}
      <div className="flex gap-2 mb-6">
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspaceId(ws.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeWorkspaceId === ws.id
                ? 'text-white border-transparent'
                : 'border-dark-border text-dark-muted hover:text-dark-text'
            }`}
            style={activeWorkspaceId === ws.id ? { background: ws.color } : {}}
          >
            {ws.emoji} {ws.name}
          </button>
        ))}
      </div>

      {/* Unbilled summary */}
      {unbilledSummary.length > 0 && (
        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-yellow-400 mb-3">
            Unbilled: {totalUnbilledHours}h = ₪{totalUnbilledAmount.toLocaleString()}
          </p>
          <div className="space-y-1">
            {unbilledSummary.map(s => (
              <div key={s.project_id} className="flex items-center justify-between text-xs">
                <span className="text-dark-text">{s.project_name}</span>
                <span className="text-dark-muted">
                  {(s.total_hours - s.billed_hours)}h × ₪{s.billing_rate || activeWorkspace?.billing_rate || 200} =
                  <span className="text-yellow-400 ml-1 font-medium">
                    ₪{((s.total_hours - s.billed_hours) * (s.billing_rate || activeWorkspace?.billing_rate || 200)).toLocaleString()}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice history */}
      {invoices.filter(inv => inv.workspace_id === activeWorkspaceId).length > 0 && (
        <div>
          <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-3">Invoice History</p>
          <div className="space-y-2">
            {invoices
              .filter(inv => inv.workspace_id === activeWorkspaceId)
              .map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-dark-text">{inv.invoice_number}</p>
                    <p className="text-[10px] text-dark-muted">{inv.client_name} · {inv.total_hours}h · {new Date(inv.issued_at).toLocaleDateString('he-IL')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-dark-text">₪{inv.total_amount.toLocaleString()}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      inv.status === 'paid' ? 'text-green-400 border-green-400/30 bg-green-400/5' :
                      inv.status === 'sent' ? 'text-accent-blue border-accent-blue/30' :
                      'text-dark-muted border-dark-border'
                    }`}>
                      {inv.status}
                    </span>
                    {inv.status === 'draft' && (
                      <button
                        onClick={() => window.api.invoke('invoices:update-status', inv.id, 'sent').then(loadAll)}
                        className="text-[10px] text-accent-blue hover:underline"
                      >Mark sent</button>
                    )}
                    {inv.status === 'sent' && (
                      <button
                        onClick={() => window.api.invoke('invoices:update-status', inv.id, 'paid').then(loadAll)}
                        className="text-[10px] text-green-400 hover:underline"
                      >Mark paid</button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Log hours modal */}
      {showLogHours && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowLogHours(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">Log Hours</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Hours</label>
                <input type="number" step="0.5" min="0.5" value={logForm.hours}
                  onChange={e => setLogForm(f => ({ ...f, hours: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Description</label>
                <input value={logForm.description}
                  onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="מה עשיתי..."
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowLogHours(false)} className="flex-1 text-xs py-2 rounded-lg border border-dark-border text-dark-muted">Cancel</button>
                <button onClick={logHours} className="flex-1 text-xs py-2 rounded-lg bg-accent-green text-white font-medium">Log</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## AGENT 6 — Wire everything to App.tsx + routing

```tsx
// Add imports:
import IntelligencePage from './pages/IntelligencePage'
import BillingPage from './pages/BillingPage'

// Add to navItems:
{ path: '/intelligence', label: 'Intelligence', icon: '🧠' },
{ path: '/billing', label: 'Billing', icon: '💼' },

// Add shortcuts:
// Intelligence already Alt+? — use:
{ key: 'i', alt: true, description: 'Intelligence', action: 'nav:/intelligence' },
{ key: 'b', alt: true, description: 'Billing', action: 'nav:/billing' },

// Add routes:
<Route path="/intelligence" element={<IntelligencePage />} />
<Route path="/billing" element={<BillingPage />} />

// Wire intelligence to MorningBriefing — run engine before showing briefing:
// In MorningBriefing useEffect:
await window.api.invoke('intelligence:run')
// Then load suggestions and show in briefing
```

Also update `MorningBriefing.tsx` to show top 3 intelligence suggestions:
```tsx
const suggestions = await window.api.invoke('intelligence:get-suggestions')
const top3 = (suggestions || []).slice(0, 3)
// Show in briefing alongside CI/health status
```

---

## AGENT 7 — Add intelligence widget to ProjectDetail Overview

In `ProjectDetail.tsx` Overview tab, alongside NextStepsWidget:
```tsx
// After NextStepsWidget:
<ProjectIntelligenceWidget projectId={projectId} />
```

Create inside ProjectDetail.tsx:
```tsx
function ProjectIntelligenceWidget({ projectId }: { projectId: number }) {
  const [suggestions, setSuggestions] = React.useState<any[]>([])

  React.useEffect(() => {
    window.api.invoke('intelligence:get-suggestions', projectId).then(setSuggestions).catch(() => {})
  }, [projectId])

  if (suggestions.length === 0) return null

  return (
    <div className="mt-4">
      <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">🧠 Intelligence</p>
      <div className="space-y-1.5">
        {suggestions.slice(0, 3).map(s => (
          <div key={s.id} className={`text-xs p-2 rounded-lg border ${
            s.priority >= 9 ? 'border-red-400/30 bg-red-400/5 text-red-400' :
            s.priority >= 7 ? 'border-orange-400/30 bg-orange-400/5 text-orange-400' :
            'border-accent-blue/30 bg-accent-blue/5 text-accent-blue'
          }`}>
            {s.title}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## BUILD + COMMIT

```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat: intelligence engine + billing + cross-project insights"
git push origin master
```

## APPEND TO SESSION FILE
```bash
cat >> C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md << 'EOF'

## Sprint 11 — What shipped

### Intelligence Engine (intelligence-engine.ts)
7 rules: CI failing, health<40, live no revenue, TestFlight stale, unbilled hours, open PRs>3, no MEMORY.md
Auto-runs 5s after app start. Manual trigger: "Run Analysis".
Per-project + cross-project analysis.

### Cross-Project Analyzer
4 insights: missing RLS, shared tech stack opportunities, stale projects, live no revenue cluster.

### IntelligencePage
2-column layout: project actions (with ⚡ Fix button that generates+copies GPROMPT) + cross-project insights.
Dismiss button on each item.

### BillingPage
Client workspace hours tracking. Log hours. Unbilled summary with ₪ amount. Create invoice → marks hours as billed.
Invoice history: draft → sent → paid.

### DB v12
intelligence_suggestions, cross_project_insights, invoices, notification_log tables.

### Integrations
Intelligence widget in ProjectDetail Overview. Morning Briefing runs engine first.

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | Notes |
|---|-------|--------|-------|
| 1 | DB v12 | ? | 4 new tables |
| 2 | Intelligence Engine | ? | 7 per-project rules + 4 cross-project rules |
| 3 | IPC wiring | ? | 12 new handlers |
| 4 | IntelligencePage | ? | 2-column, dismiss, ⚡ Fix with GPROMPT |
| 5 | BillingPage | ? | Log hours, create invoice, history |
| 6 | App routing + nav | ? | /intelligence + /billing |
| 7 | ProjectDetail widget | ? | Intelligence inline in Overview |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
