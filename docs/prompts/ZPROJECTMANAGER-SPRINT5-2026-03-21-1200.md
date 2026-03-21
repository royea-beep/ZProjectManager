# ZPROJECTMANAGER — SPRINT 5: Portfolio Dashboard + Smart Recommendations
**Date:** 2026-03-21 | **Time:** 12:00 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 5 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md
```

## READ FIRST
```bash
cat C:/Projects/ZProjectManager/src/renderer/pages/Dashboard.tsx | head -80
cat C:/Projects/ZProjectManager/src/renderer/pages/PromptPage.tsx | head -40
cat C:/Projects/ZProjectManager/src/main/prompt-engine.ts | head -60
cat C:/Projects/ZProjectManager/src/shared/types.ts
cat C:/Projects/ZProjectManager/src/main/ipc.ts | grep -n "handle\|invoke" | head -60
cat C:/Projects/ZProjectManager/src/main/database.ts | grep -n "CREATE TABLE\|stage\|category\|health" | head -30
```

---

## CONCEPT

Three systems being built:

### A. PORTFOLIO DASHBOARD — "Projects Folder"
Dedicated section showing ALL projects grouped by stage.
Each project has:
- Current stage rating
- Single best MEGA PROMPT for where it is RIGHT NOW
- 3 recommended next steps
- Outcome rating (success/partial/fail) → feeds back into learning

### B. PROMPT LEARNING SYSTEM
Every prompt that gets used can be rated.
System learns which prompts work best for which project types + stages.
"Recommended prompt" becomes smarter over time.

### C. 3-NEXT-STEPS WIDGET
Floating recommendation panel — appears contextually throughout the app.
Based on: current page + project stage + recent activity + blockers.
Always exactly 3 recommendations. Click any → MEGA PROMPT generated instantly.

---

## AGENT 1 — Prompt Scoring Engine

### Add to: `src/main/prompt-engine.ts`

```typescript
export const STAGE_RECOMMENDED_ACTIONS: Record<string, {
  primary: PromptAction
  secondary: PromptAction[]
  reason: string
}> = {
  'idea':        { primary: 'scaffold-project',  secondary: ['add-database', 'setup-ci-cd'],         reason: 'Nothing built yet — scaffold first, then infrastructure' },
  'scaffold':    { primary: 'add-auth',           secondary: ['add-database', 'add-analytics'],       reason: 'Structure exists — auth and DB are the foundation' },
  'building':    { primary: 'add-feature',        secondary: ['fix-bugs', 'audit-codebase'],          reason: 'Active development — build features, catch bugs early' },
  'alpha':       { primary: 'fix-bugs',           secondary: ['security-audit', 'performance-audit'], reason: 'Core done — clean up bugs, harden before real users' },
  'testflight':  { primary: 'fix-bugs',           secondary: ['add-analytics', 'add-feedback-widget'],reason: 'Real users testing — listen to feedback, fix what breaks' },
  'pre-launch':  { primary: 'launch-checklist',   secondary: ['app-store-prep', 'marketing-page'],    reason: 'Almost there — run checklist, prepare all launch assets' },
  'live':        { primary: 'add-payments',       secondary: ['performance-audit', 'add-admin-dashboard'], reason: 'Live product — monetize, monitor, optimize' },
  'scaling':     { primary: 'performance-audit',  secondary: ['add-subscription', 'refactor'],        reason: 'Growing — optimize for scale, deepen monetization' },
  'maintenance': { primary: 'update-state-docs',  secondary: ['add-analytics', 'security-audit'],     reason: 'Stable — keep docs current, watch for security issues' },
  'paused':      { primary: 'audit-codebase',     secondary: ['update-state-docs', 'refactor'],       reason: 'Resuming — audit what was built, then plan next move' },
  'pivot':       { primary: 'audit-codebase',     secondary: ['scaffold-project', 'add-feature'],     reason: 'Changing direction — audit what to keep, rebuild what to change' },
}

// Category+Stage overrides — even more specific
export const CATEGORY_STAGE_OVERRIDES: Partial<Record<string, { primary: PromptAction; reason: string }>> = {
  'mobile-app_testflight':  { primary: 'fix-bugs',       reason: 'Mobile on TestFlight — crash reports are #1 priority' },
  'mobile-app_pre-launch':  { primary: 'app-store-prep', reason: 'Mobile pre-launch — screenshots and metadata block submission' },
  'web-saas_live':          { primary: 'add-payments',   reason: 'Live SaaS with no monetization = leaving money on the table' },
  'web-saas_building':      { primary: 'add-auth',       reason: 'SaaS without auth cannot have users' },
  'game_testflight':        { primary: 'fix-bugs',       reason: 'Game on TestFlight — gameplay bugs kill retention immediately' },
}

export function getRecommendedActions(project: {
  stage: string
  category: string
  health_score: number
  github_ci_status?: string
  github_open_prs?: number
  main_blocker?: string
}): {
  primary: PromptAction
  secondary: PromptAction[]
  reason: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
} {
  const overrideKey = `${project.category}_${project.stage}`
  const override = CATEGORY_STAGE_OVERRIDES[overrideKey]
  const base = STAGE_RECOMMENDED_ACTIONS[project.stage] || STAGE_RECOMMENDED_ACTIONS['building']
  const primary = (override?.primary || base.primary) as PromptAction
  const reason = override?.reason || base.reason

  let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  if (project.github_ci_status === 'failing') urgency = 'critical'
  else if (project.health_score < 40) urgency = 'critical'
  else if (project.health_score < 60) urgency = 'high'
  else if ((project.github_open_prs || 0) > 3) urgency = 'high'

  // CI failing overrides everything
  if (project.github_ci_status === 'failing') {
    return {
      primary: 'build-failing' as PromptAction,
      secondary: [primary, base.secondary[0]],
      reason: '🔴 CI is failing — fix the build before anything else',
      urgency: 'critical',
    }
  }

  return { primary, secondary: base.secondary as PromptAction[], reason, urgency }
}
```

### Wire IPC handlers in `ipc.ts`:
```typescript
ipcMain.handle('prompts:get-recommended', (_e, project: any) => {
  const { getRecommendedActions } = require('./prompt-engine')
  return getRecommendedActions(project)
})

ipcMain.handle('prompts:get-stats', (_e, filters?: { promptId?: string; projectId?: number }) => {
  let query = `
    SELECT prompt_id, prompt_type, COUNT(*) as total_uses,
      SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) as successes,
      SUM(CASE WHEN outcome = 'failure' THEN 1 ELSE 0 END) as failures,
      ROUND(100.0 * SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) / COUNT(*), 0) as success_rate
    FROM prompt_usage WHERE outcome != 'unknown'
  `
  if (filters?.promptId) query += ` AND prompt_id = '${filters.promptId}'`
  if (filters?.projectId) query += ` AND project_id = ${filters.projectId}`
  query += ` GROUP BY prompt_id, prompt_type ORDER BY total_uses DESC`
  return getAll(query)
})
```

Add to `preload.ts`:
```typescript
'prompts:get-recommended',
'prompts:get-stats',
```

---

## AGENT 2 — PortfolioPage

**Create:** `src/renderer/pages/PortfolioPage.tsx`

Features:
- All projects grouped by stage (idea → scaffold → building → alpha → testflight → pre-launch → live → scaling → maintenance → paused → pivot)
- Each project card shows:
  - Health ring (24px SVG)
  - CI status badge
  - Recommended action badge (color-coded by urgency: critical=red, high=orange, medium=blue)
  - ⚡ button → generates recommended MEGA PROMPT instantly
  - Expand → shows full prompt + secondary actions + outcome rating buttons
- Stage filter pills at top
- Search bar
- Summary stats: X projects · Y live · avg health Z/100 · N critical

**Urgency colors:**
```typescript
const URGENCY_COLORS = {
  critical: 'text-red-400 border-red-400/30 bg-red-400/10',
  high:     'text-orange-400 border-orange-400/30 bg-orange-400/10',
  medium:   'text-accent-blue border-accent-blue/30 bg-accent-blue/10',
  low:      'text-dark-muted border-dark-border bg-dark-bg',
}
```

**Outcome rating (shown after prompt generated):**
```tsx
{(['success', 'partial', 'failure'] as const).map(outcome => (
  <button key={outcome} onClick={() => markOutcome(project, outcome)}>
    {outcome === 'success' ? '✓ Worked' : outcome === 'partial' ? '~ Partial' : '✗ Failed'}
  </button>
))}
```

When rated → `prompts:update-outcome` → DB updated → future recommendations improve.

---

## AGENT 3 — NextStepsWidget (universal component)

**Create:** `src/renderer/components/NextStepsWidget.tsx`

Props:
```typescript
interface Props {
  context: 'portfolio' | 'project' | 'dashboard' | 'patterns' | 'revenue' | 'settings'
  project?: Project
  projects?: Project[]
  selectedStage?: string
}
```

Logic per context:
- `project` → calls `prompts:get-recommended` → 3 steps (primary + 2 secondary)
- `portfolio` → finds: critical projects, live-no-revenue, testflight projects
- `dashboard` → Sync GitHub + Weekly Review + Fix critical
- `revenue` → add-payments + add-subscription + add-freemium

Always exactly 3 steps.
Click any step → generates prompt inline → shows preview → copy button.

**Wire to:**
- `Dashboard.tsx` — right column
- `ProjectDetail.tsx` — Overview tab right side
- `RevenuePage.tsx` — right sidebar
- `PortfolioPage.tsx` — right sidebar

---

## AGENT 4 — Routing + Sidebar

Add to router:
```tsx
{ path: '/portfolio', element: <PortfolioPage onProjectSelect={(id) => navigate(`/projects/${id}`)} /> }
```

Add to sidebar navigation (near top):
```tsx
{ path: '/portfolio', label: 'Portfolio', icon: '📁' }
```

Keyboard shortcut: **Alt+2** → Portfolio

---

## AGENT 5 — API + IPC wiring

Add to `src/renderer/services/api.ts` if missing:
```typescript
export const generateMegaPrompt = (args: { projectId: number; action: string; extraContext?: string }) =>
  invoke(IPC_CHANNELS.PROMPTS_GENERATE, args) as Promise<string>

export const getRecommendedActions = (project: any) =>
  invoke('prompts:get-recommended', project) as Promise<{
    primary: string; secondary: string[]; reason: string; urgency: 'critical' | 'high' | 'medium' | 'low'
  }>

export const getPromptStats = (filters?: { promptId?: string; projectId?: number }) =>
  invoke('prompts:get-stats', filters) as Promise<Array<{
    prompt_id: string; total_uses: number; successes: number; failures: number; success_rate: number
  }>>
```

---

## BUILD + COMMIT

```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -10
npm run build 2>&1 | tail -10
git add -A
git commit -m "feat: portfolio dashboard + next-steps widget + prompt learning"
git push origin master
```

## APPEND TO SESSION FILE
```bash
cat >> C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md << 'EOF'

## Sprint 5 — What shipped
- PortfolioPage.tsx: all projects grouped by stage, recommended prompt per project
- NextStepsWidget.tsx: universal 3-steps component, 4 contexts
- Prompt learning: outcome rating → DB → smarter recommendations
- STAGE_RECOMMENDED_ACTIONS + CATEGORY_STAGE_OVERRIDES
- Portfolio in sidebar + Alt+2 shortcut

## Architecture
Every "Next 3 Steps":
1. Reads project stage + category + health + CI
2. Looks up recommended action (with category override)
3. Click → MEGA PROMPT generated
4. Rate outcome → DB updated → future recommendations improve

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | What shipped |
|---|-------|--------|--------------|
| 1 | Prompt scoring engine | ? | STAGE_RECOMMENDED_ACTIONS + CATEGORY_STAGE_OVERRIDES + urgency |
| 2 | PortfolioPage | ? | Full view, stage groups, recommended prompts, outcome rating |
| 3 | NextStepsWidget | ? | Universal widget, 4 contexts, generates prompt on click |
| 4 | Routing + sidebar | ? | /portfolio + Alt+2 |
| 5 | API + IPC | ? | generateMegaPrompt + getRecommendedActions + getPromptStats |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
