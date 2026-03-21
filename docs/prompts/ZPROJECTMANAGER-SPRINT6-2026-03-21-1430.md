# ZPROJECTMANAGER — SPRINT 6: Learning System + Final Polish
**Date:** 2026-03-21 | **Time:** 14:30 IST | **Project:** ZProjectManager

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

Sprint 6 closes the learning loop and adds final polish:

### A. LEARNING LOOP — prompts that improve themselves
Every prompt rated (success/partial/fail) → DB → analytics page → patterns emerge → recommendations get smarter.

### B. CONVERSATION IMPORT
Import session logs from Claude.ai conversations into ZProjectManager.
Extracts: decisions, tasks, what worked, what didn't → feeds the pattern engine.

### C. FINAL POLISH
- Loading states everywhere
- Empty states with helpful CTAs
- Keyboard shortcuts help overlay (Shift+?)
- App icon + tray menu

---

## AGENT 1 — Prompt Analytics Page

**Create:** `src/renderer/pages/PromptAnalyticsPage.tsx`

Shows which prompts work best across all projects.

Layout:
```
┌──────────────────────────────────────────────────────┐
│ 📊 Prompt Analytics          [Export CSV]            │
├──────────────────────────────────────────────────────┤
│ Total prompts used: X | Success rate: Y%             │
│ Most used: fix-bugs (34x) | Best success: add-auth   │
├─────────────────────────────────────────────────────┤
│ Per-prompt leaderboard:                              │
│ Prompt          | Used | Success | Fail | Rate       │
│ fix-bugs        | 34   | 28      | 6    | 82%  ████  │
│ add-feature     | 22   | 18      | 4    | 81%  ███   │
│ audit-codebase  | 15   | 10      | 5    | 66%  ██    │
│ ...                                                  │
├──────────────────────────────────────────────────────┤
│ Patterns learned:                                    │
│ • "fix-bugs" after "add-feature" = 89% success       │
│ • "testflight" stage → fix-bugs works 91% of time    │
│ • "web-saas + live" → add-payments works 95%         │
└──────────────────────────────────────────────────────┘
```

IPC: `prompts:get-stats` (already wired).

Add to sidebar: `{ path: '/prompt-analytics', label: 'Prompt Stats', icon: '📊' }`
Add shortcut: Alt+0

---

## AGENT 2 — Conversation Import (paste Claude.ai output)

**Add tab to SettingsPage:** "Import Session"

User pastes Claude Code output (the bot report).
System extracts:
- What was built (files changed)
- Decisions made
- Bugs found
- Next steps

```typescript
// src/main/conversation-importer.ts

export function parseClaudeOutput(rawText: string, projectId: number) {
  const lines = rawText.split('\n')

  const decisions: string[] = []
  const filesChanged: string[] = []
  const bugsFixed: string[] = []
  const nextSteps: string[] = []

  let currentSection = ''

  for (const line of lines) {
    const l = line.trim()

    // Section detection
    if (l.match(/what.*(was built|shipped)/i)) currentSection = 'built'
    if (l.match(/decision/i)) currentSection = 'decisions'
    if (l.match(/fix(ed)?/i)) currentSection = 'bugs'
    if (l.match(/next.*(session|step|action)/i)) currentSection = 'next'

    // Extract bullet points
    if (l.startsWith('-') || l.startsWith('•') || l.match(/^\d+\./)) {
      const content = l.replace(/^[-•\d.]\s*/, '').trim()
      if (!content) continue

      if (currentSection === 'built' && content.includes('.')) filesChanged.push(content)
      if (currentSection === 'decisions') decisions.push(content)
      if (currentSection === 'bugs') bugsFixed.push(content)
      if (currentSection === 'next') nextSteps.push(content)
    }
  }

  return { decisions, filesChanged, bugsFixed, nextSteps }
}

export function saveImportedSession(db: any, projectId: number, parsed: ReturnType<typeof parseClaudeOutput>, rawText: string) {
  const now = new Date().toISOString()

  // Save as session
  const sessionId = db.prepare(`
    INSERT INTO project_sessions (project_id, summary, session_type, created_at)
    VALUES (?, ?, 'imported', ?)
  `).run(projectId, `Imported: ${parsed.filesChanged.length} files, ${parsed.decisions.length} decisions`, now).lastInsertRowid

  // Save decisions
  for (const d of parsed.decisions) {
    db.prepare(`
      INSERT INTO project_decisions (project_id, title, created_at)
      VALUES (?, ?, ?)
    `).run(projectId, d, now)
  }

  // Save next steps as tasks
  for (const t of parsed.nextSteps) {
    db.prepare(`
      INSERT INTO project_tasks (project_id, title, status, created_at)
      VALUES (?, ?, 'todo', ?)
    `).run(projectId, t, now)
  }

  return sessionId
}
```

IPC handler:
```typescript
ipcMain.handle('sessions:import-claude-output', (_e, args: { projectId: number; rawText: string }) => {
  const { parseClaudeOutput, saveImportedSession } = require('./conversation-importer')
  const parsed = parseClaudeOutput(args.rawText, args.projectId)
  const sessionId = saveImportedSession(db, args.projectId, parsed, args.rawText)
  return { sessionId, ...parsed }
})
```

Add to preload.ts: `'sessions:import-claude-output'`

UI: In SettingsPage or ProjectDetail → new "Import" tab:
```tsx
<textarea placeholder="Paste Claude Code output here..." rows={10} value={rawInput} onChange={...} />
<button onClick={importSession}>Import Session</button>
{result && <p>✅ Imported: {result.filesChanged.length} files, {result.decisions.length} decisions, {result.nextSteps.length} next steps</p>}
```

---

## AGENT 3 — Keyboard shortcuts overlay

When user presses **Shift+?** → show full keyboard shortcuts overlay.

```tsx
// In App.tsx, add to keyboard handler:
if (e.shiftKey && e.key === '?') setShowShortcuts(true)

// Overlay component:
function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-dark-text mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-2">
          {[
            ['Ctrl+K', 'Global Search'],
            ['Alt+1', 'Dashboard'],
            ['Alt+2', 'Portfolio'],
            ['Alt+3', 'Kanban'],
            ['Alt+4', 'Revenue'],
            ['Alt+5', 'Learnings'],
            ['Ctrl+N', 'New Project'],
            ['Shift+?', 'This overlay'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-dark-muted">{desc}</span>
              <kbd className="text-[10px] px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-dark-text font-mono">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## AGENT 4 — Polish: Loading + Empty states

### Loading states
Every `useData` hook that currently shows blank → show skeleton loader:
```tsx
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface p-4 animate-pulse">
      <div className="h-3 bg-dark-bg rounded w-1/2 mb-2" />
      <div className="h-3 bg-dark-bg rounded w-3/4 mb-2" />
      <div className="h-3 bg-dark-bg rounded w-1/4" />
    </div>
  )
}
```

Apply to: Dashboard project list, PortfolioPage, RevenuePage.

### Empty states
When no data → helpful CTA instead of blank:
```tsx
// No projects yet:
<EmptyState
  icon="📁"
  title="No projects yet"
  description="Add your first project to get started"
  action={{ label: 'Add Project', onClick: () => setShowModal(true) }}
/>

// No prompt usage yet:
<EmptyState
  icon="📊"
  title="No prompt data yet"
  description="Use the Prompt Engine to generate prompts. Rate their outcomes to see analytics here."
/>
```

---

## AGENT 5 — Window title + tray menu

In `src/main/main.ts`:

```typescript
// Dynamic window title showing active project
win.webContents.on('did-navigate', (_e, url) => {
  const match = url.match(/\/projects\/(\d+)/)
  if (match) {
    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(match[1]) as { name: string } | undefined
    if (project) win.setTitle(`ZProjectManager — ${project.name}`)
    else win.setTitle('ZProjectManager')
  } else {
    win.setTitle('ZProjectManager')
  }
})

// System tray (optional — only if Tray is imported)
// Tray icon shows: notification count (critical projects + failing CI)
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
- PromptAnalyticsPage: per-prompt success rates, patterns learned
- Conversation importer: paste Claude output → extracts decisions/tasks/files
- Keyboard shortcuts overlay (Shift+?)
- Skeleton loaders + empty states
- Dynamic window title

## ZProjectManager status: COMPLETE
All sprints done:
1. GitHub API + Revenue page
2. Pattern Engine UI + Quick Actions
3. Prompt Engine (30 actions)
4. Situational Prompt Arsenal (19 situations)
5. Portfolio Dashboard + NextSteps Widget
6. Learning system + Polish

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | What shipped |
|---|-------|--------|--------------|
| 1 | Prompt Analytics page | ? | Success rates per prompt, patterns learned |
| 2 | Conversation importer | ? | Paste Claude output → auto-extract to DB |
| 3 | Shortcuts overlay | ? | Shift+? shows all shortcuts |
| 4 | Loading + empty states | ? | Skeletons + helpful empty CTAs |
| 5 | Window title + tray | ? | Dynamic title per project |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
