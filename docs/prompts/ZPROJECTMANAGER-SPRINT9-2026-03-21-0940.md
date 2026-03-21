# ZPROJECTMANAGER — SPRINT 9: VAMOS Infrastructure Generator
**Date:** 2026-03-21 | **Time:** 09:40 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 9 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md
git log --oneline -3
npx tsc --noEmit 2>&1 | tail -3
```

## READ FIRST
```bash
cat C:/Projects/ZProjectManager/src/main/prompt-engine.ts | grep "export\|function\|const " | head -40
cat C:/Projects/ZProjectManager/src/shared/prompt-templates.ts | grep "PromptAction\|ACTION_LABELS" | head -30
cat C:/Projects/ZProjectManager/src/renderer/pages/ProjectDetail.tsx | grep "BASE_TABS\|tab ==="
cat C:/Projects/ZProjectManager/src/shared/types.ts | head -60
```

---

## CONTEXT
לומדים מ-42 sprints של CAPS + 9Soccer adaptation:
הבעיה הגדולה ביותר = כל session מתחיל מאפס.
הפתרון = MEMORY.md + IRON_RULES.md שהבוט קורא ב-FIRST ACTIONS.
Sprint זה מוסיף generators לשני הקבצים + pre-launch checklist + VAMOS sprint format.

---

## AGENT 1 — MEMORY.md + IRON_RULES.md Generators

### Add to `src/main/prompt-engine.ts`:

```typescript
// ─── MEMORY.md GENERATOR ────────────────────────────────────────────────────

export function generateMemoryMd(project: {
  name: string
  version?: string
  description?: string
  tech_stack?: string
  stage: string
  category: string
  health_score: number
  github_repo?: string
  github_ci_status?: string
  github_open_prs?: number
  mrr?: number
  revenue_model?: string
  main_blocker?: string
  next_action?: string
  repo_path?: string
  bundleId?: string
}, sessions: Array<{ summary: string; created_at: string }>, tasks: Array<{ title: string; status: string; priority: string }>): string {
  const today = new Date().toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' })
  const isMobile = project.category === 'mobile-app' || project.category === 'game'
  const isSaaS = project.category === 'web-saas' || project.category === 'ai-tool'

  const openTasks = tasks.filter(t => t.status !== 'done')
  const blockedTasks = tasks.filter(t => t.status === 'blocked')
  const highTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done')

  const lastSession = sessions[0]

  return `# ${project.name} MEMORY
**Version:** ${project.version || 'unknown'} | **Date:** ${today} IST
**Stage:** ${project.stage} | **Health:** ${project.health_score}/100

## Stack
${project.tech_stack || 'not set'}
${project.github_repo ? `Repo: https://github.com/${project.github_repo}` : ''}
${project.repo_path ? `Local: ${project.repo_path}` : ''}
${project.bundleId ? `Bundle: ${project.bundleId}` : ''}

## CI Status
${project.github_ci_status === 'passing' ? '- CI: ✅ passing' : project.github_ci_status === 'failing' ? '- CI: ❌ FAILING — fix immediately' : '- CI: unknown'}
${project.github_open_prs ? `- Open PRs: ${project.github_open_prs}` : ''}
${isMobile ? `- TestFlight: check ASC` : ''}
${isSaaS ? `- Vercel: https://${project.github_repo?.split('/')[1] || project.name}.vercel.app/api/status` : ''}

## Revenue
${project.revenue_model || 'pre-revenue'}${project.mrr ? ` | MRR: ₪${project.mrr}` : ''}

## Last Session
${lastSession ? `${lastSession.created_at.slice(0, 10)}: ${lastSession.summary}` : 'No sessions recorded yet'}

## Known Issues
${blockedTasks.length > 0 ? blockedTasks.map(t => `- ⚠️ ${t.title}`).join('\n') : '- None recorded'}

## Next Priority
${highTasks.length > 0 ? highTasks.slice(0, 3).map((t, i) => `${i + 1}. ${t.title}`).join('\n') : project.next_action || 'Not set'}
${project.main_blocker ? `\nBLOCKER: ${project.main_blocker}` : ''}

## Open Tasks (${openTasks.length})
${openTasks.slice(0, 5).map(t => `- [${t.priority?.toUpperCase() || 'MED'}] ${t.title}`).join('\n') || 'None'}
`
}

// ─── IRON_RULES.md GENERATOR ────────────────────────────────────────────────

export function generateIronRulesMd(project: {
  name: string
  category: string
  stage: string
}): string {
  const universalRules = [
    'NEVER delete files — move to _archive/ only',
    'NEVER give Roye commands to run — fix autonomously',
    'ALWAYS tsc --noEmit before commit (0 errors required)',
    'ALWAYS end session with session-summary + MEMORY.md update',
    'ALL timestamps = Israel time (IST, UTC+3)',
    'ALL prompt files = .md with date+time IST in filename (PROJ-TASK-YYYY-MM-DD-HHMM.md)',
    'NEVER use mock/static/placeholder data — always wire to real DB',
    'NEVER write TODO comments — fix it or ask Roye',
  ]

  const categoryRules: Record<string, string[]> = {
    'mobile-app': [
      'NEVER push to TestFlight without explicit "אשר" from Roye',
      'NEVER touch p12/cert manually — EAS remote ONLY',
      'NEVER set iOS build number manually — EAS autoIncrement only',
      'Deploy = EAS (iOS) + Vercel (web) — never manual Xcode',
    ],
    'game': [
      'NEVER push to TestFlight without explicit "אשר" from Roye',
      'NEVER touch p12/cert manually — EAS remote ONLY',
      'NEVER set iOS build number manually — EAS autoIncrement only',
      'Game quality before monetization — engagement first',
      'NO betting/gambling mechanics — child audience',
    ],
    'web-saas': [
      'NEVER use Stripe — Israeli merchant = Payplus only',
      'NEVER expose service_role key in client code',
      'NEVER run prisma db push if unknown tables exist in DB',
      'ALWAYS ALTER TABLE — never DROP/TRUNCATE with real data',
      'Deploy = Vercel (npx vercel --prod --yes)',
    ],
    'api-backend': [
      'NEVER run prisma db push without checking existing tables first',
      'ALWAYS add rate limiting to auth endpoints',
      'ALWAYS validate JWT on protected routes',
      'Deploy = Railway (railway up --detach)',
    ],
    'desktop-app': [
      'NEVER expose IPC channels without preload whitelist',
      'NEVER use require() in renderer — only through preload bridge',
      'ALWAYS auto-backup DB before schema changes',
    ],
    'internal-tool': [
      'NEVER expose admin routes without auth',
      'ALWAYS require ADMIN_KEY for sensitive operations',
    ],
  }

  const stageRules: Record<string, string[]> = {
    'testflight': [
      'CRASH REPORTS are #1 priority — check logs before anything else',
      'DO NOT add new features — fix bugs from testers first',
    ],
    'pre-launch': [
      'FREEZE feature development — only bug fixes and checklist items',
      'DO NOT submit to App Store without Roye approval',
    ],
    'live': [
      'PRODUCTION INCIDENT = drop everything, fix immediately',
      'ROLLBACK if unsure — git revert HEAD + deploy',
    ],
  }

  const rules = [
    ...universalRules,
    ...(categoryRules[project.category] || []),
    ...(stageRules[project.stage] || []),
  ]

  return `# ${project.name} — Iron Rules
**NEVER BREAK THESE. Read before every session.**

${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---
*Generated by ZProjectManager — update if project context changes.*
`
}

// ─── PRE-LAUNCH CHECKLIST GENERATOR ─────────────────────────────────────────

export function generatePreLaunchChecklist(project: {
  name: string
  category: string
}): string {
  const technical = [
    'TypeScript: 0 errors (npx tsc --noEmit)',
    'Build: clean (npm run build)',
    'All env vars set in production',
    'Error monitoring wired (Sentry / log-error Edge Function)',
    '/api/status returns 200',
    'robots.txt + sitemap',
    'Rate limiting on auth routes',
    'No service_role key in client code',
    'RLS enabled on all Supabase tables',
  ]

  const mobileExtra = [
    'Push notifications: end-to-end tested on physical device',
    'Cert valid + not expiring within 90 days',
    'Build number: correct (EAS autoIncrement)',
    'All game modes tested on physical device',
    'Crash-free rate: >99% on TestFlight',
    'Tested by minimum 3 real users on TestFlight',
    'App Store screenshots: 6 sizes for iPhone 6.9"',
    'Privacy policy URL: live',
    'Support URL: live',
    'Age rating: correct',
    'App Store description: reviewed and approved',
  ]

  const saasExtra = [
    'Payment processor wired (Payplus)',
    'Email/notification flow tested end-to-end',
    'Pricing page accurate',
    'Cancellation/refund flow works',
    'GDPR/privacy compliance checked',
  ]

  const content = [
    'All user-facing text reviewed (no lorem ipsum)',
    'Hebrew RTL layout verified',
    'OG image for social sharing',
    'SEO meta tags (title, description)',
    'JSON-LD structured data',
    'Favicon + app icon correct',
  ]

  const monitoring = [
    'Sentry or error logging: connected and tested',
    'BugReporter: wired and sending to Drive',
    'Feedback widget: active',
    'GitHub Actions: all workflows green',
    'Alert on down: verified',
  ]

  const isMobile = project.category === 'mobile-app' || project.category === 'game'
  const isSaaS = project.category === 'web-saas' || project.category === 'ai-tool'

  return `# ${project.name} — Pre-Launch Checklist
**Generated:** ${new Date().toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' })} IST
**Complete ALL items before launch.**

## Technical
${technical.map(t => `- [ ] ${t}`).join('\n')}
${isMobile ? '\n## Mobile / App Store\n' + mobileExtra.map(t => `- [ ] ${t}`).join('\n') : ''}
${isSaaS ? '\n## SaaS / Business\n' + saasExtra.map(t => `- [ ] ${t}`).join('\n') : ''}

## Content & UX
${content.map(t => `- [ ] ${t}`).join('\n')}

## Monitoring
${monitoring.map(t => `- [ ] ${t}`).join('\n')}

---
**Rule:** If any item is ❌ — do not launch. Fix first.
`
}

// ─── VAMOS SPRINT TEMPLATE ───────────────────────────────────────────────────

export function generateVamosSprint(project: {
  name: string
  repo_path?: string
  version?: string
  tech_stack?: string
  stage: string
  category: string
}, sprintName: string, agents: Array<{ name: string; task: string }>): string {
  const now = new Date()
  const istTime = now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour12: false })
    .replace(/[./]/g, '-').replace(',', '').replace(/:/g, '').replace(' ', '-')

  const isMobile = project.category === 'mobile-app' || project.category === 'game'
  const deployCmd = isMobile
    ? 'npx tsc --noEmit → npx vitest run → next build → git push (EAS auto-deploys)'
    : 'npx tsc --noEmit → npm run build → git add -A && git commit -m "..." && git push → npx vercel --prod --yes'

  return `# VAMOS MEGA PROMPT — ${sprintName}
**Project:** ${project.name} | **Version:** ${project.version || 'unknown'} | **Date:** ${istTime} IST

Yes, allow all edits in components
Project path: ${project.repo_path || `C:/Projects/${project.name.toLowerCase()}`}

## ROLE
Senior ${project.tech_stack || 'full-stack'} developer managing ${project.name}.

## FIRST ACTIONS
\`\`\`bash
cd ${project.repo_path || `C:/Projects/${project.name.toLowerCase()}`}
cat MEMORY.md
cat IRON_RULES.md
TIMESTAMP=$(date +%H-%M)
echo "# ${project.name} Session — $(date '+%Y-%m-%d %H:%M')" > docs/sessions/SESSION-$(date +%Y-%m-%d)-${"{TIMESTAMP}"}.md
cp "$0" docs/prompts/ 2>/dev/null || true
\`\`\`

## CONTEXT
[מה קרה, מה הביא לsprint הזה, evidence]

${agents.map((a, i) => `## AGENT ${i + 1} — ${a.name}\n${a.task}`).join('\n\n')}

## AGENT ${agents.length + 1} — Deploy & Verify
\`\`\`bash
${deployCmd}
curl ${project.repo_path ? '' : 'https://[your-url]'}/api/status
gh run list --repo ${project.category === 'game' || project.category === 'mobile-app' ? 'royea-beep/' + project.name.toLowerCase() : '[repo]'} --limit 3
\`\`\`

## SUCCESS CRITERIA
- [ ] TypeScript: 0 errors
- [ ] Build: clean
- [ ] Tests: passing
- [ ] [specific criteria for this sprint]

## ON COMPLETION
\`\`\`bash
# Update MEMORY.md with today's changes
# Write session summary to docs/sessions/SESSION-$(date +%Y-%m-%d)-${"{TIMESTAMP}"}.md
git add -A
git commit -m "chore: update MEMORY.md + session log"
git push
\`\`\`

## MANUAL_TASKS
(ריק — הבוט עושה הכל. אם יש כאן משהו — זו כשל בתכנון)

Yes, allow all edits in components`
}
```

---

## AGENT 2 — Wire to IPC

### Add to `ipc.ts`:
```typescript
import { generateMemoryMd, generateIronRulesMd, generatePreLaunchChecklist, generateVamosSprint } from './prompt-engine'

ipcMain.handle('docs:generate-memory', (_e, projectId: number) => {
  const project = getOne('SELECT * FROM projects WHERE id = ?', [projectId]) as any
  if (!project) return { error: 'Project not found' }
  const sessions = getAll('SELECT summary, created_at FROM project_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 5', [projectId]) as any[]
  const tasks = getAll('SELECT title, status, priority FROM project_tasks WHERE project_id = ? ORDER BY priority DESC', [projectId]) as any[]
  const techStack = project.tech_stack
  return generateMemoryMd({ ...project, bundleId: project.bundle_id, version: project.version }, sessions, tasks)
})

ipcMain.handle('docs:generate-iron-rules', (_e, projectId: number) => {
  const project = getOne('SELECT name, category, stage FROM projects WHERE id = ?', [projectId]) as any
  if (!project) return { error: 'Project not found' }
  return generateIronRulesMd(project)
})

ipcMain.handle('docs:generate-checklist', (_e, projectId: number) => {
  const project = getOne('SELECT name, category FROM projects WHERE id = ?', [projectId]) as any
  if (!project) return { error: 'Project not found' }
  return generatePreLaunchChecklist(project)
})

ipcMain.handle('docs:generate-vamos', (_e, args: { projectId: number; sprintName: string; agents: Array<{ name: string; task: string }> }) => {
  const project = getOne('SELECT * FROM projects WHERE id = ?', [args.projectId]) as any
  if (!project) return { error: 'Project not found' }
  return generateVamosSprint(project, args.sprintName, args.agents)
})
```

### Add to `preload.ts`:
```typescript
'docs:generate-memory', 'docs:generate-iron-rules',
'docs:generate-checklist', 'docs:generate-vamos',
```

### Add to `api.ts`:
```typescript
export const generateMemoryMd = (projectId: number) =>
  invoke('docs:generate-memory', projectId) as Promise<string>
export const generateIronRulesMd = (projectId: number) =>
  invoke('docs:generate-iron-rules', projectId) as Promise<string>
export const generatePreLaunchChecklist = (projectId: number) =>
  invoke('docs:generate-checklist', projectId) as Promise<string>
export const generateVamosSprint = (args: { projectId: number; sprintName: string; agents: any[] }) =>
  invoke('docs:generate-vamos', args) as Promise<string>
```

---

## AGENT 3 — "Docs" Tab in ProjectDetail

### Add to `BASE_TABS`:
```typescript
const BASE_TABS = ['Overview', 'Memory', 'Tasks', 'Notes', 'Launcher', 'Metrics',
  'Decisions', 'Learnings', 'Activity', 'Prompt', 'Import', 'Params', 'Docs']
```

### Add render:
```tsx
{tab === 'Docs' && <DocsTab projectId={projectId} project={project} />}
```

### Create `DocsTab` inside `ProjectDetail.tsx`:
```tsx
function DocsTab({ projectId, project }: { projectId: number; project: Project }) {
  const [activeDoc, setActiveDoc] = React.useState<'memory' | 'iron-rules' | 'checklist' | 'vamos' | null>(null)
  const [content, setContent] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const { toast } = useToast()

  const generate = async (type: typeof activeDoc) => {
    setActiveDoc(type)
    setLoading(true)
    setContent('')
    try {
      let result = ''
      if (type === 'memory') result = await api.generateMemoryMd(projectId)
      if (type === 'iron-rules') result = await api.generateIronRulesMd(projectId)
      if (type === 'checklist') result = await api.generatePreLaunchChecklist(projectId)
      if (type === 'vamos') result = await api.generateVamosSprint({
        projectId,
        sprintName: 'Sprint Name',
        agents: [
          { name: 'Audit', task: '[describe what to audit]' },
          { name: 'Fix', task: '[describe what to fix]' },
        ],
      })
      setContent(result)
    } catch {
      toast('Generation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Copied — paste into a file in your project', 'success')
  }

  const docs = [
    { id: 'memory' as const, label: 'MEMORY.md', emoji: '🧠', desc: 'Bot reads this at session start — version, CI status, known issues, next steps' },
    { id: 'iron-rules' as const, label: 'IRON_RULES.md', emoji: '⚙️', desc: 'Rules that NEVER break — auto-tailored to category and stage' },
    { id: 'checklist' as const, label: 'Pre-Launch Checklist', emoji: '🚀', desc: 'Complete before any launch — technical, content, monitoring' },
    { id: 'vamos' as const, label: 'VAMOS Sprint', emoji: '⚡', desc: 'Full sprint prompt template with FIRST ACTIONS, agents, deploy, session log' },
  ]

  return (
    <div className="flex gap-4 h-full">
      {/* Left: doc picker */}
      <div className="w-52 shrink-0 space-y-2">
        <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-3">Generate docs</p>
        {docs.map(doc => (
          <button
            key={doc.id}
            onClick={() => generate(doc.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              activeDoc === doc.id
                ? 'border-accent-blue/40 bg-accent-blue/10'
                : 'border-dark-border bg-dark-bg hover:border-dark-border/70 hover:bg-dark-hover'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span>{doc.emoji}</span>
              <span className={`text-xs font-medium ${activeDoc === doc.id ? 'text-accent-blue' : 'text-dark-text'}`}>
                {doc.label}
              </span>
            </div>
            <p className="text-[10px] text-dark-muted leading-relaxed">{doc.desc}</p>
          </button>
        ))}
      </div>

      {/* Right: generated content */}
      <div className="flex-1 flex flex-col min-w-0">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-dark-muted animate-pulse">Generating...</div>
          </div>
        )}

        {!content && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-dark-border rounded-xl">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm text-dark-text mb-1">Pick a document to generate</p>
            <p className="text-xs text-dark-muted max-w-xs">
              Generated from this project's DB — version, tasks, sessions, category, stage
            </p>
          </div>
        )}

        {content && !loading && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-dark-muted">
                Save as <span className="font-mono">{
                  activeDoc === 'memory' ? 'MEMORY.md' :
                  activeDoc === 'iron-rules' ? 'IRON_RULES.md' :
                  activeDoc === 'checklist' ? 'PRE_LAUNCH_CHECKLIST.md' :
                  `VAMOS-${project.name.toUpperCase()}-SPRINT-${new Date().toISOString().slice(0,10)}.md`
                }</span> in project root
              </p>
              <button
                onClick={copy}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  copied
                    ? 'bg-accent-green/15 text-accent-green'
                    : 'bg-dark-surface border border-dark-border text-dark-text hover:border-accent-blue/40'
                }`}
              >
                {copied ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>
            <div className="flex-1 bg-dark-bg border border-dark-border rounded-xl p-4 text-xs font-mono text-dark-text/85 whitespace-pre-wrap leading-relaxed overflow-y-auto">
              {content}
            </div>
            <p className="text-[10px] text-dark-muted mt-1.5">
              Copy → create file in project → git commit → bot reads it every session
            </p>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## AGENT 4 — Add VAMOS to situational prompts

In `src/main/situational-prompts.ts`, add new situations:

```typescript
// Add to Situation type:
| 'session-start-vamos'   // VAMOS-style session start with MEMORY.md
| 'end-of-session-vamos'  // VAMOS-style session end with MEMORY.md update

// Add to SITUATIONAL_PROMPTS array:
{
  id: 'session-start-vamos',
  title: 'Start Session (VAMOS)',
  emoji: '🚀',
  description: 'Reads MEMORY.md + Iron Rules, creates session log, confirms state',
  category: 'workflow',
  contextFields: [
    { key: 'projectName', label: 'Project name', placeholder: '9Soccer', required: true },
    { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/9soccer', required: true },
  ],
  prompt: (ctx) => `## VAMOS SESSION START — ${ctx?.projectName || '[PROJECT]'}
**Date:** $(date '+%Y-%m-%d %H:%M') IST

Yes, allow all edits in components
Project: ${ctx?.projectPath || 'C:/Projects/[PROJECT]'}

## FIRST ACTIONS (in this exact order)
\`\`\`bash
cd ${ctx?.projectPath || 'C:/Projects/[PROJECT]'}

# 1. Read project state
cat MEMORY.md || echo "⚠️ MEMORY.md not found — create it first"
cat IRON_RULES.md || echo "⚠️ IRON_RULES.md not found — create it first"

# 2. Create session file
TIMESTAMP=$(date +%H-%M)
mkdir -p docs/sessions docs/prompts
SESSION_FILE="docs/sessions/SESSION-$(date +%Y-%m-%d)-\${TIMESTAMP}.md"
echo "# ${ctx?.projectName || '[PROJECT]'} Session — $(date '+%Y-%m-%d %H:%M')" > "\$SESSION_FILE"

# 3. Check current health
git log --oneline -5
git status
npx tsc --noEmit 2>&1 | tail -3
\`\`\`

## CONFIRM STATE LOADED
Output:
"✅ VAMOS SESSION STARTED
Project: ${ctx?.projectName || '[PROJECT]'}
Last commit: [hash + message]
MEMORY.md: [read / not found]
IRON_RULES.md: [read / not found]
TypeScript: [clean / X errors]
Session file: $SESSION_FILE
Ready for: [what Roye asked]"

Then wait for instructions.

Yes, allow all edits in components`,
},
{
  id: 'end-of-session-vamos',
  title: 'End Session (VAMOS)',
  emoji: '🌙',
  description: 'Updates MEMORY.md, writes session log, commits, pushes',
  category: 'workflow',
  contextFields: [
    { key: 'projectName', label: 'Project name', placeholder: '9Soccer', required: true },
    { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/9soccer', required: true },
    { key: 'whatWasDone', label: 'What was done this session', placeholder: 'Fixed auth bug, deployed to TestFlight', required: false },
    { key: 'nextPriority', label: 'Next priority', placeholder: 'Fix crash in Showdown mode', required: false },
  ],
  prompt: (ctx) => `## VAMOS SESSION END — ${ctx?.projectName || '[PROJECT]'}

Yes, allow all edits in components
Project: ${ctx?.projectPath || 'C:/Projects/[PROJECT]'}

## STEP 1 — Verify clean state
\`\`\`bash
cd ${ctx?.projectPath || 'C:/Projects/[PROJECT]'}
npx tsc --noEmit 2>&1 | tail -3
npm run build 2>&1 | tail -3
git status
\`\`\`

## STEP 2 — Update MEMORY.md
Read current MEMORY.md.
Update these sections:
- **Date** → today IST
- **Last Session** → what was done: ${ctx?.whatWasDone || '[fill in]'}
- **Next Priority** → ${ctx?.nextPriority || '[fill in]'}
- **CI Status** → current status from git + build
Keep all other sections intact.

## STEP 3 — Write session log
\`\`\`bash
SESSION_FILE=$(ls docs/sessions/ | grep $(date +%Y-%m-%d) | tail -1)
cat >> "docs/sessions/\$SESSION_FILE" << 'EOF'

## What was done
${ctx?.whatWasDone || '[fill in]'}

## Build status
- TypeScript: [clean / X errors]
- Build: [clean / failing]
- CI: [green / red]

## Next session starts at
${ctx?.nextPriority || '[fill in]'}
EOF
\`\`\`

## STEP 4 — Commit everything
\`\`\`bash
git add -A
git commit -m "chore: session end $(date +%Y-%m-%d) — ${ctx?.whatWasDone?.slice(0, 50) || 'session close'}"
git push origin main
\`\`\`

## FINAL OUTPUT
"🌙 SESSION CLOSED
Time: $(date '+%Y-%m-%d %H:%M') IST
MEMORY.md: updated ✅
Session log: saved ✅
Pushed: [commit hash]
Next: ${ctx?.nextPriority || '[fill in]'}"

Yes, allow all edits in components`,
},
```

---

## BUILD + COMMIT

```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat: VAMOS docs generator — MEMORY.md + IRON_RULES.md + pre-launch checklist + VAMOS sprint"
git push origin master
```

## APPEND TO SESSION FILE
```bash
cat >> C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md << 'EOF'

## Sprint 9 — What shipped
- generateMemoryMd(): creates MEMORY.md from DB (version, CI, sessions, tasks)
- generateIronRulesMd(): creates IRON_RULES.md tailored to category + stage
- generatePreLaunchChecklist(): full checklist per category (mobile/saas/universal)
- generateVamosSprint(): VAMOS sprint template with FIRST ACTIONS + agents + deploy
- "Docs" tab in ProjectDetail: generate all 4 docs + copy button
- VAMOS situational prompts: session-start-vamos + end-of-session-vamos
- IPC: docs:generate-memory/iron-rules/checklist/vamos

## Why this matters
Without MEMORY.md + IRON_RULES.md:
  Every session starts from zero. Bot guesses what's allowed.
With MEMORY.md + IRON_RULES.md:
  Every session starts at exactly where we left off. Bot knows the rules.

## Learning source
42 CAPS sprints + 9Soccer adaptation (2026-03-21 files)
Key insight: Iron Rules + MEMORY.md = the difference between sessions that drift and sessions that build.

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | What shipped |
|---|-------|--------|--------------|
| 1 | MEMORY/IRON_RULES/Checklist/VAMOS generators | ? | 4 generator functions in prompt-engine.ts |
| 2 | IPC + API wiring | ? | 4 new IPC handlers + preload + api.ts |
| 3 | "Docs" tab in ProjectDetail | ? | DocsTab with 4 doc types + copy |
| 4 | VAMOS situational prompts | ? | session-start-vamos + end-of-session-vamos |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
