# ZPROJECTMANAGER — SPRINT 6: Learning System + Final Polish
**Date:** 2026-03-21 | **Time:** 05:55 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 6 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md

# Read current state
git log --oneline -5
npx tsc --noEmit 2>&1 | tail -3
```

---

## CONCEPT

Sprint 6 סוגר את מעגל הלמידה ומוסיף פוליש סופי:

### A. LEARNING LOOP — prompts שמשתפרים לבד
כל prompt שמדורג (success/partial/fail) → DB → analytics page → patterns → המלצות משתפרות.

### B. CONVERSATION IMPORT
ייבוא session logs מקלוד קוד ישירות ל-ZProjectManager.
מחלץ: decisions, tasks, files changed, next steps → feeds the pattern engine.

### C. FINAL POLISH
- Skeleton loaders בכל מקום שיש loading
- Empty states עם CTAs
- Shift+? → keyboard shortcuts overlay
- Dynamic window title לפי פרויקט פעיל

---

## AGENT 1 — Prompt Analytics Page

**Create:** `src/renderer/pages/PromptAnalyticsPage.tsx`

Layout:
```
┌──────────────────────────────────────────────────────┐
│ 📊 Prompt Analytics              [Export CSV]         │
├──────────────────────────────────────────────────────┤
│ Total used: X | Avg success: Y% | Most used: fix-bugs │
├──────────────────────────────────────────────────────┤
│ Per-prompt table:                                     │
│ Prompt          | Used | ✓ | ✗ | Rate  | Bar         │
│ fix-bugs        | 34   | 28| 6 | 82%   | ████        │
│ add-feature     | 22   | 18| 4 | 81%   | ███         │
│ audit-codebase  | 15   | 10| 5 | 66%   | ██          │
├──────────────────────────────────────────────────────┤
│ Patterns learned:                                     │
│ • fix-bugs after testflight = 91% success            │
│ • web-saas + live → add-payments works 95%           │
└──────────────────────────────────────────────────────┘
```

Data source: `prompts:get-stats` IPC (already wired).

Add to sidebar: `{ path: '/prompt-analytics', label: 'Prompt Stats', icon: '📊' }`
Shortcut: Alt+0

---

## AGENT 2 — Conversation Import

**Create:** `src/main/conversation-importer.ts`

```typescript
export function parseClaudeOutput(rawText: string) {
  const lines = rawText.split('\n')
  const decisions: string[] = []
  const filesChanged: string[] = []
  const bugsFixed: string[] = []
  const nextSteps: string[] = []
  let currentSection = ''

  for (const line of lines) {
    const l = line.trim()
    if (l.match(/what.*(was built|shipped)/i)) currentSection = 'built'
    if (l.match(/decision/i)) currentSection = 'decisions'
    if (l.match(/fix(ed)?/i)) currentSection = 'bugs'
    if (l.match(/next.*(session|step|action)/i)) currentSection = 'next'

    if (l.startsWith('-') || l.startsWith('•') || l.match(/^\d+\./)) {
      const content = l.replace(/^[-•\d.]\s*/, '').trim()
      if (!content) continue
      if (currentSection === 'built') filesChanged.push(content)
      if (currentSection === 'decisions') decisions.push(content)
      if (currentSection === 'bugs') bugsFixed.push(content)
      if (currentSection === 'next') nextSteps.push(content)
    }
  }
  return { decisions, filesChanged, bugsFixed, nextSteps }
}

export function saveImportedSession(db: any, projectId: number, parsed: ReturnType<typeof parseClaudeOutput>) {
  const now = new Date().toISOString()
  const sessionId = db.prepare(`
    INSERT INTO project_sessions (project_id, summary, session_type, created_at)
    VALUES (?, ?, 'imported', ?)
  `).run(projectId, `Imported: ${parsed.filesChanged.length} files, ${parsed.decisions.length} decisions`, now).lastInsertRowid

  for (const d of parsed.decisions) {
    db.prepare(`INSERT INTO project_decisions (project_id, title, created_at) VALUES (?, ?, ?)`).run(projectId, d, now)
  }
  for (const t of parsed.nextSteps) {
    db.prepare(`INSERT INTO project_tasks (project_id, title, status, created_at) VALUES (?, ?, 'todo', ?)`).run(projectId, t, now)
  }
  return sessionId
}
```

**Wire IPC in `ipc.ts`:**
```typescript
ipcMain.handle('sessions:import-claude-output', (_e, args: { projectId: number; rawText: string }) => {
  const { parseClaudeOutput, saveImportedSession } = require('./conversation-importer')
  const parsed = parseClaudeOutput(args.rawText)
  const sessionId = saveImportedSession(db, args.projectId, parsed)
  return { sessionId, ...parsed }
})
```

Add to `preload.ts`: `'sessions:import-claude-output'`

**UI: Add "Import" tab to ProjectDetail:**
```tsx
// New tab: "📥 Import"
// Textarea: "Paste Claude Code output here..."
// Button: "Import Session"
// Result: "✅ Imported: 8 files, 3 decisions, 4 next steps"
```

---

## AGENT 3 — Keyboard Shortcuts Overlay

In `App.tsx`, add Shift+? handler:
```typescript
if (e.shiftKey && e.key === '?') setShowShortcuts(prev => !prev)
```

Create `ShortcutsOverlay` component:
```tsx
const SHORTCUTS = [
  ['Ctrl+K', 'Global Search'],
  ['Alt+1', 'Dashboard'],
  ['Alt+2', 'Portfolio'],
  ['Alt+3', 'Kanban'],
  ['Alt+4', 'Revenue'],
  ['Alt+5', 'Learnings'],
  ['Alt+6', 'Patterns'],
  ['Alt+0', 'Prompt Stats'],
  ['Ctrl+N', 'New Project'],
  ['Shift+?', 'This overlay'],
]
// Dark overlay, centered card, kbd tags for keys
// Click anywhere to close
```

---

## AGENT 4 — Skeleton Loaders + Empty States

**Create:** `src/renderer/components/SkeletonCard.tsx`
```tsx
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface p-4 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-dark-bg rounded mb-2 ${i === 0 ? 'w-1/2' : i === lines-1 ? 'w-1/4' : 'w-3/4'}`} />
      ))}
    </div>
  )
}
```

**Create:** `src/renderer/components/EmptyState.tsx`
```tsx
interface Props {
  icon: string
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-dark-border rounded-xl">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-semibold text-dark-text mb-1">{title}</p>
      <p className="text-xs text-dark-muted max-w-xs mb-4">{description}</p>
      {action && (
        <button onClick={action.onClick} className="text-xs px-4 py-2 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 transition-colors">
          {action.label}
        </button>
      )}
    </div>
  )
}
```

Apply to:
- Dashboard: no projects → "Add your first project"
- PortfolioPage: no projects in stage → EmptyState
- RevenuePage: no revenue entries → "Start tracking revenue"
- PromptAnalyticsPage: no usage yet → "Use Prompt Engine to generate prompts, then rate outcomes"

---

## AGENT 5 — Dynamic Window Title

In `src/main/main.ts`, add after window creation:
```typescript
// Dynamic title: "ZProjectManager — ProjectName" when inside a project
win.webContents.on('did-navigate-in-page', (_e, url) => {
  const match = url.match(/\/projects\/(\d+)/)
  if (match) {
    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(match[1]) as { name: string } | undefined
    win.setTitle(project ? `ZProjectManager — ${project.name}` : 'ZProjectManager')
  } else {
    const pageMap: Record<string, string> = {
      '/portfolio': 'ZProjectManager — Portfolio',
      '/revenue': 'ZProjectManager — Revenue',
      '/patterns': 'ZProjectManager — Patterns',
      '/prompt-analytics': 'ZProjectManager — Prompt Stats',
    }
    const path = new URL(url).pathname
    win.setTitle(pageMap[path] || 'ZProjectManager')
  }
})
```

---

## BUILD + COMMIT

```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat: prompt analytics + conversation import + shortcuts overlay + polish"
git push origin master
```

## APPEND TO SESSION FILE
```bash
cat >> C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md << 'EOF'

## Sprint 6 — What shipped
- PromptAnalyticsPage: success rates per prompt, patterns learned
- conversation-importer.ts: paste Claude output → extract decisions/tasks/files to DB
- Keyboard shortcuts overlay (Shift+?)
- SkeletonCard + EmptyState components — applied everywhere
- Dynamic window title per page/project

## ZProjectManager — ALL SPRINTS COMPLETE
Sprint 1: GitHub API + Revenue page
Sprint 2: Pattern Engine UI + Quick Actions + Health Rings
Sprint 3: Prompt Engine (30 actions, context-aware)
Sprint 4: Situational Prompt Arsenal (19 situations) + Session Logger
Sprint 5: Portfolio Dashboard + NextSteps Widget (universal, 4 contexts)
Sprint 6: Learning system + Conversation import + Polish

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | What shipped |
|---|-------|--------|--------------|
| 1 | Prompt Analytics page | ? | Success rates, patterns learned, export CSV |
| 2 | Conversation importer | ? | Paste Claude output → auto-extract to DB |
| 3 | Shortcuts overlay | ? | Shift+? shows all shortcuts |
| 4 | Skeleton + Empty states | ? | Applied to Dashboard/Portfolio/Revenue |
| 5 | Dynamic window title | ? | Per page + per project |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
