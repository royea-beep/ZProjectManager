# ZPROJECTMANAGER — SPRINT 10: Workspace System
**Date:** 2026-03-21 | **Time:** 10:05 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 10 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md
git log --oneline -3
npx tsc --noEmit 2>&1 | tail -3
cat C:/Projects/ZProjectManager/src/main/database.ts | grep "CURRENT_SCHEMA_VERSION"
cat C:/Projects/ZProjectManager/src/renderer/App.tsx | grep "navItems\|Sidebar\|workspace" | head -20
cat C:/Projects/ZProjectManager/src/shared/types.ts | grep "Project\|interface" | head -20
```

---

## AGENT 1 — DB Migration v11: Workspaces

### Add to `database.ts` migration v11:
```sql
-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mine' CHECK(type IN ('mine', 'client', 'partnership')),
  color TEXT DEFAULT '#22c55e',
  emoji TEXT DEFAULT '🏠',
  client_name TEXT,
  partner_name TEXT,
  billing_rate INTEGER DEFAULT 0,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Add workspace_id to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id INTEGER DEFAULT 1 REFERENCES workspaces(id);

-- Default workspaces
INSERT OR IGNORE INTO workspaces (id, name, type, color, emoji) VALUES
  (1, 'שלי', 'mine', '#22c55e', '🏠'),
  (2, 'לקוחות', 'client', '#3b82f6', '💼'),
  (3, 'שותפויות', 'partnership', '#f59e0b', '🤝');

-- All existing projects → workspace 1 (mine) by default
UPDATE projects SET workspace_id = 1 WHERE workspace_id IS NULL;

-- Hours tracking (for client projects)
CREATE TABLE IF NOT EXISTS work_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id INTEGER REFERENCES workspaces(id),
  hours REAL NOT NULL,
  description TEXT,
  billed INTEGER DEFAULT 0,
  date TEXT DEFAULT (date('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Active workspace setting
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('active_workspace_id', '0');
```

---

## AGENT 2 — Workspace types + IPC

### Add to `src/shared/types.ts`:
```typescript
export interface Workspace {
  id: number
  name: string
  type: 'mine' | 'client' | 'partnership'
  color: string
  emoji: string
  client_name?: string
  partner_name?: string
  billing_rate?: number
  notes?: string
  is_active: number
  created_at: string
  // computed:
  project_count?: number
}

export interface WorkSession {
  id: string
  project_id: number
  workspace_id: number
  hours: number
  description?: string
  billed: number
  date: string
}
```

### Add to `src/shared/constants.ts` IPC_CHANNELS:
```typescript
WORKSPACES_GET_ALL: 'workspaces:get-all',
WORKSPACES_CREATE: 'workspaces:create',
WORKSPACES_UPDATE: 'workspaces:update',
WORKSPACES_DELETE: 'workspaces:delete',
WORKSPACES_GET_ACTIVE: 'workspaces:get-active',
WORKSPACES_SET_ACTIVE: 'workspaces:set-active',
WORK_SESSIONS_LOG: 'work-sessions:log',
WORK_SESSIONS_GET: 'work-sessions:get',
WORK_SESSIONS_SUMMARY: 'work-sessions:summary',
```

### Add IPC handlers in `ipc.ts`:
```typescript
// Workspaces
ipcMain.handle(IPC_CHANNELS.WORKSPACES_GET_ALL, () => {
  return db.prepare(`
    SELECT w.*, COUNT(p.id) as project_count
    FROM workspaces w
    LEFT JOIN projects p ON p.workspace_id = w.id AND p.status != 'archived'
    GROUP BY w.id
    ORDER BY w.id ASC
  `).all()
})

ipcMain.handle(IPC_CHANNELS.WORKSPACES_CREATE, (_e, data: Partial<Workspace>) => {
  return runInsert(
    'INSERT INTO workspaces (name, type, color, emoji, client_name, partner_name, billing_rate, notes) VALUES (?,?,?,?,?,?,?,?)',
    [data.name, data.type || 'mine', data.color || '#22c55e', data.emoji || '🏢',
     data.client_name || null, data.partner_name || null, data.billing_rate || 0, data.notes || null]
  )
})

ipcMain.handle(IPC_CHANNELS.WORKSPACES_UPDATE, (_e, id: number, data: Partial<Workspace>) => {
  const fields = Object.entries(data).map(([k]) => `${k} = ?`).join(', ')
  const values = [...Object.values(data), id]
  runQuery(`UPDATE workspaces SET ${fields} WHERE id = ?`, values)
  return { ok: true }
})

ipcMain.handle(IPC_CHANNELS.WORKSPACES_GET_ACTIVE, () => {
  const setting = db.prepare("SELECT value FROM app_settings WHERE key = 'active_workspace_id'").get() as any
  const id = parseInt(setting?.value || '0')
  if (id === 0) return null // 0 = show all
  return db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id)
})

ipcMain.handle(IPC_CHANNELS.WORKSPACES_SET_ACTIVE, (_e, id: number) => {
  runQuery("UPDATE app_settings SET value = ? WHERE key = 'active_workspace_id'", [String(id)])
  return { ok: true }
})

// Work sessions (hours tracking)
ipcMain.handle(IPC_CHANNELS.WORK_SESSIONS_LOG, (_e, data: Partial<WorkSession>) => {
  return runInsert(
    'INSERT INTO work_sessions (project_id, workspace_id, hours, description, billed, date) VALUES (?,?,?,?,?,?)',
    [data.project_id, data.workspace_id, data.hours, data.description || null, data.billed || 0, data.date || new Date().toISOString().slice(0,10)]
  )
})

ipcMain.handle(IPC_CHANNELS.WORK_SESSIONS_GET, (_e, projectId: number) => {
  return db.prepare('SELECT * FROM work_sessions WHERE project_id = ? ORDER BY date DESC LIMIT 50').all(projectId)
})

ipcMain.handle(IPC_CHANNELS.WORK_SESSIONS_SUMMARY, (_e, workspaceId?: number) => {
  if (workspaceId) {
    return db.prepare(`
      SELECT 
        p.name as project_name, p.id as project_id,
        SUM(ws.hours) as total_hours,
        SUM(CASE WHEN ws.billed = 1 THEN ws.hours ELSE 0 END) as billed_hours,
        w.billing_rate
      FROM work_sessions ws
      JOIN projects p ON p.id = ws.project_id
      JOIN workspaces w ON w.id = ws.workspace_id
      WHERE ws.workspace_id = ?
      GROUP BY p.id
    `).all(workspaceId)
  }
  return db.prepare(`
    SELECT w.name as workspace_name, w.type, w.billing_rate,
      SUM(ws.hours) as total_hours,
      SUM(CASE WHEN ws.billed = 0 THEN ws.hours ELSE 0 END) as unbilled_hours
    FROM work_sessions ws
    JOIN workspaces w ON w.id = ws.workspace_id
    GROUP BY ws.workspace_id
  `).all()
})
```

### Update preload.ts:
```typescript
'workspaces:get-all', 'workspaces:create', 'workspaces:update', 'workspaces:delete',
'workspaces:get-active', 'workspaces:set-active',
'work-sessions:log', 'work-sessions:get', 'work-sessions:summary',
```

---

## AGENT 3 — Workspace Switcher in Sidebar

### Create `src/renderer/components/WorkspaceSwitcher.tsx`:
```tsx
import React, { useState, useEffect } from 'react'
import type { Workspace } from '../../shared/types'

interface Props {
  onWorkspaceChange: (id: number) => void
}

const TYPE_ICONS = {
  mine: '🏠',
  client: '💼',
  partnership: '🤝',
}

export default function WorkspaceSwitcher({ onWorkspaceChange }: Props) {
  const [workspaces, setWorkspaces] = useState<(Workspace & { project_count: number })[]>([])
  const [activeId, setActiveId] = useState<number>(0)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    const [all, active] = await Promise.all([
      window.api.invoke('workspaces:get-all'),
      window.api.invoke('workspaces:get-active'),
    ])
    setWorkspaces(all || [])
    setActiveId(active?.id || 0)
  }

  const switchTo = async (id: number) => {
    await window.api.invoke('workspaces:set-active', id)
    setActiveId(id)
    onWorkspaceChange(id)
  }

  return (
    <div className="px-3 mb-4">
      {/* "All" option */}
      <button
        onClick={() => switchTo(0)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors mb-1 ${
          activeId === 0
            ? 'bg-dark-hover text-dark-text font-medium'
            : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
        }`}
      >
        <span>📁</span>
        <span className="flex-1 text-left">כולם</span>
        <span className="text-[10px] opacity-50">{workspaces.reduce((s, w) => s + (w.project_count || 0), 0)}</span>
      </button>

      {/* Workspace list */}
      {workspaces.map(ws => (
        <button
          key={ws.id}
          onClick={() => switchTo(ws.id)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors mb-0.5 ${
            activeId === ws.id
              ? 'bg-dark-hover text-dark-text font-medium'
              : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
          }`}
        >
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: ws.color }}
          />
          <span className="flex-1 text-left truncate">{ws.name}</span>
          <span className="text-[10px] opacity-50">{ws.project_count || 0}</span>
        </button>
      ))}

      {/* Add workspace */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-dark-muted hover:text-dark-text transition-colors mt-1"
      >
        <span className="opacity-50">+</span>
        <span>Add workspace</span>
      </button>

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { loadWorkspaces(); setShowCreate(false) }}
        />
      )}
    </div>
  )
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'mine' | 'client' | 'partnership'>('client')
  const [clientName, setClientName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [billingRate, setBillingRate] = useState(200)
  const [color, setColor] = useState('#3b82f6')

  const create = async () => {
    if (!name.trim()) return
    await window.api.invoke('workspaces:create', {
      name: name.trim(),
      type,
      color,
      emoji: type === 'mine' ? '🏠' : type === 'client' ? '💼' : '🤝',
      client_name: type === 'client' ? clientName : null,
      partner_name: type === 'partnership' ? partnerName : null,
      billing_rate: type === 'client' ? billingRate : 0,
    })
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-dark-surface border border-dark-border rounded-xl p-5 w-80" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-4">New Workspace</h3>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Type</label>
            <div className="flex gap-2">
              {(['mine', 'client', 'partnership'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                    type === t ? 'border-accent-blue text-accent-blue bg-accent-blue/10' : 'border-dark-border text-dark-muted'
                  }`}
                >
                  {t === 'mine' ? '🏠 שלי' : t === 'client' ? '💼 לקוח' : '🤝 שותפות'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={type === 'client' ? 'לקוח: אבי' : type === 'partnership' ? 'שותפות: Heroes' : 'שלי'}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
            />
          </div>

          {type === 'client' && (
            <>
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Client name</label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Tzach"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Billing rate (₪/hour)</label>
                <input
                  type="number"
                  value={billingRate}
                  onChange={e => setBillingRate(parseInt(e.target.value) || 0)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
            </>
          )}

          {type === 'partnership' && (
            <div>
              <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Partner name</label>
              <input
                value={partnerName}
                onChange={e => setPartnerName(e.target.value)}
                placeholder="דביר"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 text-xs py-2 rounded-lg border border-dark-border text-dark-muted">Cancel</button>
            <button onClick={create} disabled={!name.trim()} className="flex-1 text-xs py-2 rounded-lg bg-accent-green text-white font-medium disabled:opacity-40">Create</button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Wire WorkspaceSwitcher to App.tsx:
```tsx
// In App.tsx — add WorkspaceSwitcher to sidebar, above navItems
// Pass workspace change handler → update global filter state
const [activeWorkspaceId, setActiveWorkspaceId] = useState(0)

// Pass activeWorkspaceId as prop to Dashboard, Portfolio, etc.
// They filter projects based on workspace_id
```

---

## AGENT 4 — Morning Briefing

### Create `src/renderer/components/MorningBriefing.tsx`:
```tsx
import React, { useState, useEffect } from 'react'

interface BriefingItem {
  workspaceName: string
  workspaceColor: string
  critical: string[]
  warnings: string[]
  good: string[]
}

export default function MorningBriefing({ onDismiss }: { onDismiss: () => void }) {
  const [briefing, setBriefing] = useState<BriefingItem[]>([])
  const [loading, setLoading] = useState(true)
  const hour = new Date().toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    generateBriefing()
  }, [])

  const generateBriefing = async () => {
    const [workspaces, projects] = await Promise.all([
      window.api.invoke('workspaces:get-all'),
      window.api.invoke('projects:getAll'),
    ])

    const items: BriefingItem[] = []

    for (const ws of workspaces || []) {
      const wsProjects = (projects || []).filter((p: any) => p.workspace_id === ws.id && p.status !== 'archived')
      if (wsProjects.length === 0) continue

      const critical = wsProjects
        .filter((p: any) => p.github_ci_status === 'failing' || (p.health_score || 100) < 40)
        .map((p: any) => `${p.name}: ${p.github_ci_status === 'failing' ? 'CI ❌' : `health ${p.health_score}/100`}`)

      const warnings = wsProjects
        .filter((p: any) => (p.github_open_prs || 0) > 0 || p.main_blocker)
        .map((p: any) => `${p.name}: ${p.main_blocker || `${p.github_open_prs} open PRs`}`)

      const good = wsProjects
        .filter((p: any) => p.github_ci_status === 'passing' && (p.health_score || 0) >= 80)
        .map((p: any) => `${p.name} ✅`)
        .slice(0, 3)

      if (critical.length > 0 || warnings.length > 0) {
        items.push({ workspaceName: ws.name, workspaceColor: ws.color, critical, warnings, good })
      }
    }

    setBriefing(items)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-dark-text">🌅 בוקר טוב</h2>
            <p className="text-xs text-dark-muted mt-0.5">{hour} IST · סיכום הפורטפוליו</p>
          </div>
          <button onClick={onDismiss} className="text-dark-muted hover:text-dark-text transition-colors text-lg">✕</button>
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

        <button
          onClick={onDismiss}
          className="w-full mt-5 text-xs py-2 rounded-lg bg-dark-bg border border-dark-border text-dark-muted hover:text-dark-text transition-colors"
        >
          בוא נעבוד
        </button>
      </div>
    </div>
  )
}
```

### Wire to App.tsx:
```tsx
// Show MorningBriefing if last dismiss > 4 hours ago
const [showBriefing, setShowBriefing] = useState(false)

useEffect(() => {
  const lastDismiss = localStorage.getItem('briefing_dismissed')
  if (!lastDismiss || Date.now() - parseInt(lastDismiss) > 4 * 60 * 60 * 1000) {
    setShowBriefing(true)
  }
}, [])

const dismissBriefing = () => {
  localStorage.setItem('briefing_dismissed', String(Date.now()))
  setShowBriefing(false)
}

// In JSX:
{showBriefing && <MorningBriefing onDismiss={dismissBriefing} />}
```

---

## AGENT 5 — Wire workspace filter to Dashboard + Portfolio

### Update Dashboard.tsx:
```tsx
// Accept activeWorkspaceId prop
interface Props { activeWorkspaceId?: number }

// In project filter:
const filtered = projects.filter(p => {
  const matchesWorkspace = !activeWorkspaceId || p.workspace_id === activeWorkspaceId
  const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
  const matchesFilter = filter === 'all' || p.status === filter
  return matchesWorkspace && matchesSearch && matchesFilter
})
```

### Update PortfolioPage.tsx:
```tsx
// Same: accept activeWorkspaceId, filter projects
// Add workspace color dot on each project card
```

### Update GPROMPT injection in ipc.ts:
```typescript
// In PROMPTS_GENERATE handler, after building paramBlock:
const project = getOne('SELECT p.*, w.type as ws_type, w.name as ws_name, w.client_name, w.partner_name, w.billing_rate FROM projects p LEFT JOIN workspaces w ON w.id = p.workspace_id WHERE p.id = ?', [args.projectId]) as any

let workspaceBlock = ''
if (project?.ws_type === 'client') {
  workspaceBlock = `
## WORKSPACE: CLIENT — ${project.client_name || project.ws_name}
- Client project — build correctly the first time, no experiments
- Track time after this session
- Billing rate: ₪${project.billing_rate || 0}/hour
- Deliverable: confirm scope before starting`
} else if (project?.ws_type === 'partnership') {
  workspaceBlock = `
## WORKSPACE: PARTNERSHIP — with ${project.partner_name || 'partner'}
- Architectural changes need both partners to approve
- Document all decisions in Decision log
- Tag tasks: "mine" or "partner"`
}
```

---

## BUILD + COMMIT
```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat: workspace system (mine/client/partnership) + morning briefing"
git push origin master
```

## APPEND TO SESSION FILE
```bash
cat >> C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md << 'EOF'

## Sprint 10 — What shipped
- workspaces table + work_sessions table (DB v11)
- WorkspaceSwitcher: sidebar widget, switch context, create workspace modal
- 3 default workspaces: שלי / לקוחות / שותפויות
- MorningBriefing: opens on app launch if >4h since last dismiss
- Dashboard + Portfolio: filter by active workspace
- GPROMPT: workspace context injected (client rules / partnership rules)
- Hours tracking IPC (work-sessions:log/get/summary)

## Architecture
Every project belongs to a workspace.
Active workspace = filter throughout entire app.
Morning briefing = 30-second overview of what needs attention today.

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | What shipped |
|---|-------|--------|--------------|
| 1 | DB migration v11 | ? | workspaces + work_sessions + workspace_id on projects |
| 2 | Workspace IPC + types | ? | 9 IPC handlers + types + constants |
| 3 | WorkspaceSwitcher UI | ? | Sidebar widget + CreateWorkspaceModal |
| 4 | Morning Briefing | ? | Auto-shows on launch, per-workspace status |
| 5 | Dashboard + Portfolio filter | ? | Filtered by active workspace |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
