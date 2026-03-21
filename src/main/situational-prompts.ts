export type Situation =
  | 'session-start'
  | 'session-end'
  | 'session-start-vamos'
  | 'end-of-session-vamos'
  | 'terminal-crashed'
  | 'context-window-full'
  | 'handoff-between-bots'
  | 'new-project-setup'
  | 'bug-mid-sprint'
  | 'build-failing'
  | 'deploy-failing'
  | 'migration-dangerous'
  | 'unknown-codebase'
  | 'organize-files'
  | 'organize-sessions'
  | 'sprint-planning'
  | 'weekly-review'
  | 'app-store-rejection'
  | 'production-incident'
  | 'performance-degraded'
  | 'security-breach';

export type SituationCategory =
  | 'workflow'
  | 'problem'
  | 'organization'
  | 'special';

export interface SituationalPrompt {
  id: Situation;
  title: string;
  emoji: string;
  description: string;
  category: SituationCategory;
  contextFields: Array<{ key: string; label: string; placeholder: string; required?: boolean }>;
  prompt: (context?: Record<string, string>) => string;
}

const c = (ctx: Record<string, string> | undefined, key: string, fallback = '') =>
  (ctx?.[key] || fallback);

export const SITUATIONAL_PROMPTS: SituationalPrompt[] = [

  // ================================================================
  // WORKFLOW
  // ================================================================
  {
    id: 'session-start',
    title: 'Start New Session',
    emoji: '🚀',
    description: 'Opens a new Claude Code session with full context of working style and rules',
    category: 'workflow',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ZProjectManager' },
      { key: 'currentTask', label: 'What to work on', placeholder: 'Fix the auth bug on login page' },
      { key: 'lastSession', label: 'Last session date', placeholder: '2026-03-21' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const task = c(ctx, 'currentTask');
      const last = c(ctx, 'lastSession');
      return `## SESSION START — ${name}_${new Date().toISOString().slice(0, 10)}_[HH-MM]

Yes, allow all edits in components

## WHO YOU ARE
You are Claude Code — the executor in a 3-part system:
- Roye (owner) = makes all product decisions
- Strategic AI (Claude.ai) = plans, advises, writes prompts
- You (Claude Code) = reads, builds, fixes, deploys

## WORKING RULES — READ THESE BEFORE TOUCHING ANYTHING

### File naming
Every session creates a log file:
\`{ProjectName}_{YYYY-MM-DD}_{HH-MM}.md\` in \`{project}/sessions/\`
Start by creating this file. Append to it as you work.

### Before you touch any code
1. Read the session file from last time (latest file in sessions/)
2. Read PROJECT_STATE.md or MASTER_STATE.md if present
3. Run: git log --oneline -5 (understand what changed)
4. Run: npx tsc --noEmit (understand current health)
NEVER start building without knowing where we left off.

### Decision rules
- YOU decide: file structure, implementation approach, which library to use
- YOU ask Roye: product direction, feature scope, anything that changes UX
- YOU never ask: "should I create a file?" — just do it
- YOU never ask multiple questions — one at a time, only when truly blocked

### Code rules
- No mock data, no placeholder functions, no TODO comments
- Every feature must be wired end-to-end before moving to the next
- Always: npx tsc --noEmit before committing
- Always: npm run build before deploying
- Commit message format: "feat/fix/chore: description"

### Automation rules
- Use APIs/CLI for EVERYTHING — never say "do this manually in the UI"
- Parallel agents when possible
- Every complex task ends with MEGA FINAL REPORT

### Infrastructure (always check)
- Supabase: never prisma db push, always ALTER TABLE
- Payments: Payplus (Israeli merchant, NOT Stripe)
- iOS: Capacitor → PlistBuddy + GitHub Actions, Expo → EAS
- Deploy: Vercel (Next.js) or Railway (Node/NestJS)

## CURRENT PROJECT STATE
Path: ${path}
${last ? `Last session: ${last}` : ''}
${task ? `Task: ${task}` : ''}

## STEP 1 — LOAD CONTEXT
\`\`\`bash
TIMESTAMP=$(date +%H-%M)
mkdir -p "${path}/sessions"
echo "# Session $(date '+%Y-%m-%d %H:%M')" > "${path}/sessions/${name}_$(date +%Y-%m-%d)_\${TIMESTAMP}.md"
ls "${path}/sessions/" | tail -3
cat "${path}/sessions/"$(ls "${path}/sessions/" | tail -2 | head -1) 2>/dev/null | head -60
git -C "${path}" log --oneline -5
npx tsc --noEmit 2>&1 | tail -3
\`\`\`

## STEP 2 — CONFIRM STATE LOADED
After reading, output exactly:
"✅ STATE LOADED
Last session: [date + what was done]
Current health: [TypeScript errors count]
Ready for: [task]"

Then wait for instructions.

Yes, allow all edits in components`;
    },
  },

  {
    id: 'session-end',
    title: 'End of Day Save',
    emoji: '🌙',
    description: 'Saves all state, updates docs, commits everything, prepares for next session',
    category: 'workflow',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ZProjectManager' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      return `## SESSION END — ${name}_$(date +%Y-%m-%d)_END

Yes, allow all edits in components
Project: ${path}

## WHAT YOU MUST DO BEFORE THIS SESSION CLOSES

### Step 1 — Save session log
\`\`\`bash
SESSION_FILE=$(ls ${path}/sessions/ 2>/dev/null | grep $(date +%Y-%m-%d) | tail -1)
if [ -n "$SESSION_FILE" ]; then
cat >> "${path}/sessions/$SESSION_FILE" << 'ENDLOG'

## SESSION END — $(date '+%Y-%m-%d %H:%M')

### What was built
[LIST EVERY FILE CHANGED]

### Decisions made (LOCKED)
[LIST EVERY PRODUCT/ARCHITECTURE DECISION]

### What works now
[LIST FEATURES THAT ARE LIVE AND TESTED]

### What's NOT done
[HONEST LIST OF WHAT WAS LEFT INCOMPLETE]

### Blockers
[ANYTHING THAT STOPPED PROGRESS]

### Next session — start here
[EXACT FIRST COMMAND TO RUN NEXT SESSION]

### TypeScript: [clean/X errors]
### Build: [clean/failing]
ENDLOG
fi
\`\`\`

### Step 2 — Update project state doc
Update or create ${path}/PROJECT_STATE.md with:
- Current version, score /10, what's live, what's pending, blockers

### Step 3 — Commit everything
\`\`\`bash
cd ${path}
git add -A
git commit -m "chore: end of day save $(date +%Y-%m-%d)"
git push origin master
\`\`\`

### Step 4 — Verify clean state
\`\`\`bash
npx tsc --noEmit 2>&1 | tail -3
npm run build 2>&1 | tail -3
git status
\`\`\`

### Step 5 — Final report
"🌙 SESSION CLOSED — $(date '+%Y-%m-%d %H:%M')
Built: [X things]
Committed: [commit hash]
TypeScript: clean/[X errors]
Next session starts at: [exact point]
File: sessions/[filename]"

Yes, allow all edits in components`;
    },
  },

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
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name.toLowerCase()}`);
      return `## VAMOS SESSION START — ${name}

Yes, allow all edits in components
Project: ${path}

## FIRST ACTIONS (in this exact order)
\`\`\`bash
cd ${path}

# 1. Read project state
cat MEMORY.md || echo "⚠️ MEMORY.md not found — generate it in ZProjectManager → Docs tab"
cat IRON_RULES.md || echo "⚠️ IRON_RULES.md not found — generate it in ZProjectManager → Docs tab"

# 2. Create session file
TIMESTAMP=$(date +%H-%M)
mkdir -p docs/sessions docs/prompts
SESSION_FILE="docs/sessions/SESSION-$(date +%Y-%m-%d)-\${TIMESTAMP}.md"
echo "# ${name} Session — $(date '+%Y-%m-%d %H:%M')" > "\$SESSION_FILE"

# 3. Check current health
git log --oneline -5
git status
npx tsc --noEmit 2>&1 | tail -3
\`\`\`

## CONFIRM STATE LOADED
Output exactly:
"✅ VAMOS SESSION STARTED
Project: ${name}
Last commit: [hash + message]
MEMORY.md: [read / not found]
IRON_RULES.md: [read / not found]
TypeScript: [clean / X errors]
Session file: docs/sessions/SESSION-[date]-[time].md
Ready for: [what Roye asked]"

Then wait for instructions.

Yes, allow all edits in components`;
    },
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
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name.toLowerCase()}`);
      const done = c(ctx, 'whatWasDone', '[fill in]');
      const next = c(ctx, 'nextPriority', '[fill in]');
      return `## VAMOS SESSION END — ${name}

Yes, allow all edits in components
Project: ${path}

## STEP 1 — Verify clean state
\`\`\`bash
cd ${path}
npx tsc --noEmit 2>&1 | tail -3
npm run build 2>&1 | tail -3
git status
\`\`\`

## STEP 2 — Update MEMORY.md
Read current MEMORY.md.
Update these sections:
- **Date** → today IST
- **Last Session** → what was done: ${done}
- **Next Priority** → ${next}
- **CI Status** → current status from git + build
Keep all other sections intact.

## STEP 3 — Write session log
\`\`\`bash
SESSION_FILE=$(ls docs/sessions/ 2>/dev/null | grep $(date +%Y-%m-%d) | tail -1)
if [ -n "$SESSION_FILE" ]; then
  cat >> "docs/sessions/$SESSION_FILE" << 'SESSIONEOF'

## What was done
${done}

## Build status
- TypeScript: [clean / X errors]
- Build: [clean / failing]

## Next session starts at
${next}
SESSIONEOF
fi
\`\`\`

## STEP 4 — Commit everything
\`\`\`bash
git add -A
git commit -m "chore: session end $(date +%Y-%m-%d) — ${done.slice(0, 50)}"
git push origin master
\`\`\`

## FINAL OUTPUT
"🌙 SESSION CLOSED
Time: $(date '+%Y-%m-%d %H:%M') IST
MEMORY.md: updated ✅
Session log: saved ✅
Pushed: [commit hash]
Next: ${next}"

Yes, allow all edits in components`;
    },
  },

  {
    id: 'terminal-crashed',
    title: 'Terminal Crashed — Recover',
    emoji: '🔧',
    description: 'Finds last known state and recovers all context after a crash',
    category: 'workflow',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ZProjectManager' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      return `## TERMINAL RECOVERY — ${name}

Yes, allow all edits in components
Project: ${path}

## THE TERMINAL CRASHED. DO THIS EXACTLY IN ORDER.

### Step 1 — Find where we were
\`\`\`bash
cd ${path}
git log --oneline -10
git status
git stash list
ls sessions/ | tail -5
cat sessions/$(ls sessions/ | tail -1)
find . -name "*.tmp" -o -name "*.partial" -o -name ".wip" 2>/dev/null | grep -v node_modules
\`\`\`

### Step 2 — Recover uncommitted work
\`\`\`bash
git diff --stat
git diff --cached --stat
git stash list
# If stash exists: git stash pop
\`\`\`

### Step 3 — Verify current health
\`\`\`bash
npx tsc --noEmit 2>&1 | tail -10
npm run build 2>&1 | tail -5
\`\`\`

### Step 4 — Report exact state
"🔧 RECOVERED
Last commit: [hash + message + time]
Uncommitted changes: [yes/no — what files]
Stash: [yes/no — what]
TypeScript: [clean/errors]
Build: [passing/failing]
Last known task: [from session file]
Ready to continue at: [exact next step]"

### Step 5 — Continue
Resume from exactly where the session log says we were.
DO NOT restart from scratch. DO NOT redo committed work.

Yes, allow all edits in components`;
    },
  },

  {
    id: 'context-window-full',
    title: 'Context Window Full',
    emoji: '🗜️',
    description: 'Compresses context and hands off to a fresh Claude instance',
    category: 'workflow',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ZProjectManager' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      return `## CONTEXT HANDOFF — ${name}
## (Previous instance hit context limit — you are the new instance)

Yes, allow all edits in components
Project: ${path}

## READ THIS BEFORE ANYTHING ELSE
\`\`\`bash
cd ${path}
cat sessions/$(ls sessions/ | tail -1)
git log --oneline -10
git status && git diff --stat
npx tsc --noEmit 2>&1 | tail -5
\`\`\`

## RULES FOR THIS INSTANCE
1. Do NOT ask "what should I do" — read the session file
2. Do NOT redo anything already committed
3. Pick up from the EXACT line that says "Next: ..."
4. If session file doesn't exist — ask Roye for ONE sentence: "what was I doing?"
5. Commit every completed sub-task — don't let work pile up again

## CONFIRM HANDOFF
"🗜️ HANDOFF COMPLETE
Previous instance: [what it was doing]
Committed: [last 3 commits]
Uncommitted: [what files]
Continuing at: [exact next step]"

Yes, allow all edits in components`;
    },
  },

  {
    id: 'handoff-between-bots',
    title: 'Handoff Between Instances',
    emoji: '🤝',
    description: 'Pass work cleanly from one Claude instance to another',
    category: 'workflow',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ZProjectManager' },
      { key: 'currentTask', label: 'What the previous instance was doing', placeholder: 'Building the auth module' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const task = c(ctx, 'currentTask', '[TASK FROM PREVIOUS INSTANCE]');
      return `## INSTANCE HANDOFF — ${name}

Yes, allow all edits in components
Project: ${path}

## PREVIOUS INSTANCE WAS DOING: ${task}

## YOUR FIRST 5 COMMANDS (run in order)
\`\`\`bash
cd ${path}
git log --oneline -5
git status
cat sessions/$(ls sessions/ | tail -1)
npx tsc --noEmit 2>&1 | grep "error" | head -10
\`\`\`

## RULES
- Do NOT re-read files that were already summarized in the session log
- Do NOT re-do work that shows as committed
- Trust the session log — it was written by a reliable previous instance
- Your first output must be: "I'm at [exact point]. Next step: [exact action]"

## IF THERE'S NO SESSION LOG
Ask exactly: "No session log found — what was the previous instance working on?"

Yes, allow all edits in components`;
    },
  },

  {
    id: 'new-project-setup',
    title: 'New Project — Day 1',
    emoji: '🌱',
    description: 'Full setup for a brand new project from zero',
    category: 'workflow',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'MyNewApp', required: true },
      { key: 'category', label: 'Type', placeholder: 'web-saas / mobile-app / desktop-app / api-backend' },
      { key: 'stack', label: 'Stack', placeholder: 'Next.js + Supabase + Vercel' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT NAME]');
      const category = c(ctx, 'category', 'web-saas');
      const stack = c(ctx, 'stack', '[STACK]');
      return `## NEW PROJECT SETUP — ${name}

Yes, allow all edits in components

## PROJECT INFO
Name: ${name}
Type: ${category}
Stack: ${stack}
Path: C:/Projects/${name}

## STEP 1 — Initialize
\`\`\`bash
cd C:/Projects
${stack.includes('Next') ? `npx create-next-app@latest ${name} --typescript --tailwind --app` : `mkdir ${name} && cd ${name} && git init`}
cd ${name}
mkdir -p sessions docs scripts
\`\`\`

## STEP 2 — GitHub
\`\`\`bash
gh repo create royea-beep/${name.toLowerCase()} --private
git remote add origin https://github.com/royea-beep/${name.toLowerCase()}.git
git push -u origin main
\`\`\`

## STEP 3 — Supabase (if needed)
- Create project at supabase.com
- Get: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Create initial migration: users/profiles table

## STEP 4 — Structure
\`\`\`bash
# Create first session file
echo "# ${name} — Project Start — $(date '+%Y-%m-%d')" > sessions/${name}_$(date +%Y-%m-%d)_start.md
# Create PROJECT_STATE.md
echo "# ${name} — State\\n\\n## Status: scaffold\\n## Score: 1/10\\n## Started: $(date +%Y-%m-%d)" > docs/PROJECT_STATE.md
\`\`\`

## STEP 5 — CI/CD
- Create .github/workflows/deploy.yml
- Set GitHub secrets
- Push → verify auto-deploy works

## STEP 6 — Register in ZProjectManager
- Open ZProjectManager
- Add project with all fields
- Set category: ${category}, stage: scaffold

Yes, allow all edits in components`;
    },
  },

  // ================================================================
  // PROBLEMS
  // ================================================================
  {
    id: 'bug-mid-sprint',
    title: 'Bug Appeared Mid-Sprint',
    emoji: '🐛',
    description: 'Diagnose and fix a bug that appeared during active development',
    category: 'problem',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ZProjectManager' },
      { key: 'bugDescription', label: 'Bug description', placeholder: 'Login button does nothing on Safari iOS', required: true },
      { key: 'suspectedFile', label: 'Suspected file/area', placeholder: 'src/auth/login.tsx' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const bug = c(ctx, 'bugDescription', '[DESCRIBE BUG]');
      const suspected = c(ctx, 'suspectedFile', 'src/');
      return `## BUG INVESTIGATION — ${name}

Yes, allow all edits in components
Project: ${path}

## BUG REPORTED: ${bug}

## INVESTIGATION PROTOCOL — DO IN THIS ORDER

### Step 1 — Reproduce first, fix second
\`\`\`bash
cd ${path}
git log --oneline -20
git diff HEAD~3 -- ${suspected} | head -80
npx tsc --noEmit 2>&1 | head -20
\`\`\`

### Step 2 — Isolate
- What is the MINIMAL reproduction case?
- Is it frontend or backend?
- Only on certain data/users/conditions?
- Production only or also local?

### Step 3 — Root cause (not symptom)
\`\`\`bash
git log --oneline -10 -- ${suspected}
\`\`\`
- What changed that could have introduced this?
- Is there an error in the console / network tab / Supabase logs?

### Step 4 — Fix + verify
- Fix the root cause, NOT the symptom
- npx tsc --noEmit — zero errors
- Test the broken scenario
- Test adjacent features
- npm run build

### Step 5 — Commit and document
\`\`\`bash
git add -A
git commit -m "fix: [describe what was broken and how fixed]"
git push
\`\`\`

Append to session file:
"BUG FIXED: ${bug}
Root cause: [actual cause]
Fix: [what changed]
Commit: [hash]"

Yes, allow all edits in components`;
    },
  },

  {
    id: 'build-failing',
    title: 'Build is Failing',
    emoji: '🔴',
    description: 'Diagnose and fix a failing build',
    category: 'problem',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ZProjectManager' },
      { key: 'errorSummary', label: 'Error summary (paste first lines)', placeholder: "TS2345: Argument of type 'string' is not assignable..." },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const err = c(ctx, 'errorSummary');
      return `## BUILD FAILURE — ${name}

Yes, allow all edits in components
Project: ${path}
${err ? `\nKnown error: ${err}\n` : ''}
## DIAGNOSIS PROTOCOL

\`\`\`bash
cd ${path}
npx tsc --noEmit 2>&1
npm run build 2>&1
git log --oneline -10
git diff HEAD~1 --stat
\`\`\`

## FIX RULES
1. Fix TypeScript errors before build errors
2. Fix imports before logic errors
3. NEVER use // @ts-ignore — fix the actual type
4. NEVER use 'any' — define the actual type
5. One error at a time — fix → verify → next

## VERIFY
\`\`\`bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l  # must be 0
npm run build 2>&1 | tail -5                        # must show success
\`\`\`

## COMMIT
\`\`\`bash
git add -A && git commit -m "fix: resolve build errors" && git push
\`\`\`

Yes, allow all edits in components`;
    },
  },

  {
    id: 'deploy-failing',
    title: 'Deploy is Failing',
    emoji: '🚫',
    description: 'Diagnose and fix a failing deployment',
    category: 'problem',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'PostPilot', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/PostPilot' },
      { key: 'platform', label: 'Platform', placeholder: 'Vercel / Railway / EAS / TestFlight' },
      { key: 'errorSummary', label: 'Error from deploy log', placeholder: 'Build failed: Cannot find module...' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const platform = c(ctx, 'platform', '[PLATFORM]');
      const err = c(ctx, 'errorSummary');
      return `## DEPLOY FAILURE — ${name} on ${platform}

Yes, allow all edits in components
Project: ${path}
${err ? `\nDeploy error: ${err}\n` : ''}
## TRIAGE

### Step 1 — Does it build locally?
\`\`\`bash
cd ${path}
npm run build 2>&1
npx tsc --noEmit 2>&1 | tail -5
\`\`\`

### Step 2 — Check deploy logs
\`\`\`bash
${platform === 'Vercel' ? 'npx vercel logs --follow' : ''}
${platform === 'Railway' ? 'railway logs --tail' : ''}
${platform === 'EAS' ? 'eas build:list --limit 3' : ''}
\`\`\`

### Step 3 — Common causes
- Missing env var on ${platform} (check dashboard)
- Build script difference between local and CI
- Node version mismatch
- Missing dependency in package.json (was installed globally locally)
- PATH or OS difference (Windows local → Linux CI)

### Step 4 — Fix and redeploy
\`\`\`bash
git add -A
git commit -m "fix: deploy failure on ${platform}"
git push
# ${platform === 'Vercel' ? '# Vercel auto-deploys' : '# Push triggers CI'}
\`\`\`

### Step 5 — Verify
Hit the production URL and confirm the fix works.

Yes, allow all edits in components`;
    },
  },

  {
    id: 'migration-dangerous',
    title: 'DB Migration — Dangerous',
    emoji: '⚠️',
    description: 'Safely apply a DB migration that might destroy data',
    category: 'problem',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'PostPilot', required: true },
      { key: 'migrationFile', label: 'Migration file path', placeholder: 'supabase/migrations/20260321_add_column.sql' },
      { key: 'whatItDoes', label: 'What the migration does', placeholder: 'Adds premium_tier column to users, removes old plan column' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const mfile = c(ctx, 'migrationFile', '[migration.sql]');
      const what = c(ctx, 'whatItDoes', '[DESCRIBE MIGRATION]');
      return `## SAFE MIGRATION PROTOCOL — ${name}

Yes, allow all edits in components

## Migration: ${mfile}
## What it does: ${what}

## ⚠️ NEVER RUN prisma db push IF:
- Any tables exist in DB not in schema
- Any tables have real user data
- Migration would DROP anything

## STEP 1 — Read migration first
\`\`\`bash
cat ${mfile}
grep -i "drop\\|delete\\|truncate\\|alter.*drop" ${mfile}
\`\`\`
**STOP if any DROP/TRUNCATE found. Ask Roye before continuing.**

## STEP 2 — Check current state
\`\`\`sql
-- Via Supabase MCP: list_tables
-- Count rows in affected tables:
SELECT COUNT(*) FROM affected_table;
\`\`\`

## SAFE OPERATIONS ONLY
✅ ALTER TABLE ... ADD COLUMN IF NOT EXISTS
✅ CREATE TABLE IF NOT EXISTS
✅ CREATE INDEX IF NOT EXISTS
✅ INSERT OR IGNORE
✅ UPDATE with WHERE clause

❌ DROP TABLE
❌ ALTER TABLE DROP COLUMN
❌ prisma db push --accept-data-loss
❌ TRUNCATE

## STEP 3 — Apply
Run migration statements one at a time. Verify after each.

## STEP 4 — Verify
\`\`\`sql
SELECT COUNT(*) FROM affected_table;  -- row count same?
SELECT column_name FROM information_schema.columns WHERE table_name = 'affected_table';
\`\`\`

Yes, allow all edits in components`;
    },
  },

  {
    id: 'unknown-codebase',
    title: 'Working on Unfamiliar Code',
    emoji: '🗺️',
    description: 'Explore and understand a codebase you\'ve never seen before',
    category: 'problem',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'SomeOtherApp', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/SomeOtherApp' },
      { key: 'task', label: 'What needs to be done', placeholder: 'Fix the broken checkout flow' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const task = c(ctx, 'task', '[TASK]');
      return `## UNFAMILIAR CODEBASE — ${name}

Yes, allow all edits in components
Project: ${path}
Task: ${task}

## STEP 1 — Map the territory (read before touching anything)
\`\`\`bash
cd ${path}
cat README.md 2>/dev/null | head -60
cat package.json | jq '{name, version, scripts, dependencies}' 2>/dev/null || cat package.json | head -40
ls src/ 2>/dev/null || ls app/ 2>/dev/null || ls lib/ 2>/dev/null
git log --oneline -10
npx tsc --noEmit 2>&1 | tail -5
\`\`\`

## STEP 2 — Understand the flow
- What is the entry point? (index.ts / app.ts / pages/_app.tsx / main.ts)
- What is the DB? (Supabase / Prisma / sqlite / MongoDB)
- What is the auth? (Supabase Auth / NextAuth / custom JWT)
- What is the deploy target? (Vercel / Railway / Expo / Electron)

## STEP 3 — Find what's relevant for: ${task}
\`\`\`bash
# Search for relevant files
grep -r "${task.split(' ').slice(0, 3).join('\\|')}" src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -10
\`\`\`

## STEP 4 — Make a map
Before touching code, output:
"MAP:
Entry: [file]
DB: [type + connection]
Auth: [type]
Relevant files for task: [list]
Plan: [3-step plan for ${task}]"

## STEP 5 — Execute
Only after mapping — make changes. Test incrementally. Never change more than needed.

Yes, allow all edits in components`;
    },
  },

  // ================================================================
  // ORGANIZATION
  // ================================================================
  {
    id: 'organize-files',
    title: 'Organize Files & Folders',
    emoji: '📁',
    description: 'Clean up messy folder structure across projects',
    category: 'organization',
    contextFields: [
      { key: 'projectName', label: 'Project name (or "ALL")', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Root path', placeholder: 'C:/Projects/ZProjectManager' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', 'ALL PROJECTS');
      const path = c(ctx, 'projectPath', 'C:/Projects');
      return `## FILE ORGANIZATION — ${name}

Yes, allow all edits in components

## SCAN CURRENT STATE
\`\`\`bash
find ${path} -maxdepth 2 -type d | grep -v "node_modules\\.git\\.next dist .expo" | sort
find ${path} -maxdepth 1 -type f | sort
find ${path} -name "*.md" | grep -v "node_modules\\|README" | sort
\`\`\`

## TARGET STRUCTURE FOR EVERY PROJECT
\`\`\`
ProjectName/
├── src/                    # All source code
├── sessions/               # Session logs: ProjectName_YYYY-MM-DD_HH-MM.md
├── docs/                   # Documentation
│   ├── PROJECT_STATE.md
│   └── LAUNCH_CHECKLIST.md
├── scripts/                # Utility scripts
├── .github/workflows/      # CI/CD
└── README.md
\`\`\`

## EXECUTE
1. Create missing directories (sessions/, docs/)
2. Move loose .md files to docs/ or sessions/
3. Rename files that don't follow naming convention
4. Delete: .DS_Store, Thumbs.db, *.log, tmp/
5. Verify: git status — make sure nothing important was deleted

\`\`\`bash
git add -A
git commit -m "chore: organize folder structure"
git push
\`\`\`

Yes, allow all edits in components`;
    },
  },

  {
    id: 'organize-sessions',
    title: 'Archive & Structure Session Logs',
    emoji: '🗂️',
    description: 'Archive old session logs and create a structured index',
    category: 'organization',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ZProjectManager', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ZProjectManager' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      return `## SESSION LOG ORGANIZATION — ${name}

Yes, allow all edits in components
Project: ${path}

## STEP 1 — Inventory
\`\`\`bash
ls ${path}/sessions/ | sort
ls ${path}/sessions/ | wc -l
\`\`\`

## STEP 2 — Create index
Create ${path}/sessions/INDEX.md with:
- Date | What was built | Key decisions | Next step
- One row per session file

## STEP 3 — Archive old sessions
\`\`\`bash
mkdir -p ${path}/sessions/archive
# Move sessions older than 30 days to archive/
find ${path}/sessions/ -name "*.md" -not -name "INDEX.md" -older +30 2>/dev/null | while read f; do mv "$f" ${path}/sessions/archive/; done
\`\`\`

## STEP 4 — Verify sessions folder
Only recent sessions + INDEX.md in root of sessions/
Archive has older files

\`\`\`bash
ls ${path}/sessions/
ls ${path}/sessions/archive/ | head -20
\`\`\`

Yes, allow all edits in components`;
    },
  },

  {
    id: 'sprint-planning',
    title: 'Sprint Planning',
    emoji: '🗓️',
    description: 'Plan next sprint across all projects with priorities',
    category: 'organization',
    contextFields: [
      { key: 'focusProjects', label: 'Projects to include', placeholder: 'ZProjectManager, 9Soccer, PostPilot' },
      { key: 'timeframe', label: 'Timeframe', placeholder: 'This week / Next 3 days / Today' },
    ],
    prompt: (ctx) => {
      const projects = c(ctx, 'focusProjects', 'all active projects');
      const time = c(ctx, 'timeframe', 'this sprint');
      return `## SPRINT PLANNING — ${time}

Yes, allow all edits in components

## PROJECTS IN SCOPE
${projects}

## STEP 1 — Load current state for each project
\`\`\`bash
for project in C:/Projects/*/; do
  name=$(basename "$project")
  echo "=== $name ==="
  git -C "$project" log --oneline -3 2>/dev/null || echo "(no git)"
  cat "$project/sessions/"$(ls "$project/sessions/" 2>/dev/null | tail -1) 2>/dev/null | grep -A3 "Next session\\|Next step\\|Blocker" | head -8
done
\`\`\`

## STEP 2 — Score each project
For each project in scope:
- Health: [X/100]
- Blocker: [top blocker or "none"]
- Next action: [one sentence]
- Effort: [S/M/L]

## STEP 3 — Plan
Pick top 3 priorities for ${time}:
1. **[Project]** — [task] — because [reason]
2. **[Project]** — [task] — because [reason]
3. **[Project]** — [task] — because [reason]

## STEP 4 — Save
Create sprint plan in C:/Projects/ZProjectManager/sessions/sprint_$(date +%Y-%m-%d).md

Yes, allow all edits in components`;
    },
  },

  {
    id: 'weekly-review',
    title: 'Weekly Review + Plan',
    emoji: '📊',
    description: 'End of week summary and next week planning',
    category: 'organization',
    contextFields: [],
    prompt: () => {
      return `## WEEKLY REVIEW — Week of $(date '+%Y-%m-%d')

Yes, allow all edits in components

## STEP 1 — Collect all session logs from this week
\`\`\`bash
find C:/Projects -path "*/sessions/*.md" -newer $(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || gdate -v-7d +%Y-%m-%d 2>/dev/null || date +%Y-%m-%d) 2>/dev/null | sort

for dir in C:/Projects/*/; do
  project=$(basename "$dir")
  count=$(git -C "$dir" log --oneline --since="7 days ago" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    echo "$project: $count commits this week"
  fi
done
\`\`\`

## STEP 2 — Score each project with activity
For each project with commits this week:
- What was built? (one sentence)
- Score /10?
- Blocker?

## STEP 3 — 5 wins this week
List 5 specific things that shipped and work.

## STEP 4 — Next week priorities
Top 3 projects + reason for each.

## STEP 5 — Save report
Create: C:/Projects/ZProjectManager/sessions/weekly_review_$(date +%Y-%m-%d).md

Yes, allow all edits in components`;
    },
  },

  // ================================================================
  // SPECIAL
  // ================================================================
  {
    id: 'app-store-rejection',
    title: 'App Store Rejection',
    emoji: '🍎',
    description: 'Apple rejected the app — fix and resubmit',
    category: 'special',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: '9Soccer', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/90Soccer-Mascots' },
      { key: 'rejectionReason', label: 'Rejection reason from Apple', placeholder: 'Guideline 4.0 - Design: Your app is not useful enough...', required: true },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const reason = c(ctx, 'rejectionReason', '[APPLE REJECTION REASON]');
      return `## APP STORE REJECTION — ${name}

Yes, allow all edits in components
Project: ${path}

## REJECTION REASON
${reason}

## STEP 1 — Understand the guideline
- Which guideline was violated? (e.g., 4.0 Design, 2.1 Performance, 5.1 Privacy)
- Is it a code fix or a metadata fix?
- Can it be fixed without a new build? (metadata, screenshots, description)

## STEP 2 — Fix plan
\`\`\`bash
cd ${path}
git log --oneline -5
# Read the rejection email carefully — is there a specific screen/flow mentioned?
\`\`\`

Code fixes (if needed):
- Fix the specific issue Apple flagged
- npx tsc --noEmit
- npm run build / eas build / npx cap build

Metadata fixes (ASC only):
- Update app description
- Update screenshots
- Update age rating
- Add privacy policy URL

## STEP 3 — Test thoroughly before resubmit
- Test the specific flow Apple mentioned
- Test on real device (not just simulator)
- Verify crash-free on launch

## STEP 4 — Resubmit
\`\`\`bash
# Build new binary (if code changed)
eas build --platform ios --profile production
# OR for Capacitor:
cd ios && fastlane beta

# Submit to App Store
eas submit --platform ios --latest
# OR manual upload via Xcode → Organizer
\`\`\`

## STEP 5 — Response to Apple (if needed)
If you need to send a message to the review team:
- Be concise and specific
- Reference the exact guideline
- Explain what you changed
- Do NOT argue — just explain the fix

Yes, allow all edits in components`;
    },
  },

  {
    id: 'production-incident',
    title: '🚨 Production Incident',
    emoji: '🚨',
    description: 'Something is broken in production RIGHT NOW',
    category: 'special',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'PostPilot', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/PostPilot' },
      { key: 'productionUrl', label: 'Production URL', placeholder: 'https://postpilot.ftable.co.il' },
      { key: 'whatsBroken', label: 'What is broken', placeholder: 'Login returns 500, all users locked out', required: true },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const url = c(ctx, 'productionUrl', '[PRODUCTION URL]');
      const broken = c(ctx, 'whatsBroken', '[WHAT IS BROKEN]');
      return `## 🚨 PRODUCTION INCIDENT — ${name}

Yes, allow all edits in components
Project: ${path}
Production: ${url}

## BROKEN: ${broken}

## TRIAGE IN THIS EXACT ORDER (time is critical)

### 1. SCOPE (2 minutes)
\`\`\`bash
curl -s ${url}/api/status || echo "SITE DOWN"
# Vercel: npx vercel logs --follow
# Railway: railway logs --tail
\`\`\`

### 2. WHEN DID IT START?
\`\`\`bash
git -C ${path} log --oneline -10
# What was the last deploy?
\`\`\`

### 3. ROLLBACK IF NEEDED (fastest fix — do this first if last deploy caused it)
\`\`\`bash
git -C ${path} revert HEAD
git -C ${path} push origin main
# Vercel auto-deploys in ~30s. Verify: curl ${url}/api/status
\`\`\`

### 4. FIX FORWARD (if rollback not enough)
- Find root cause in logs
- Fix in code
- Test locally: npm run build && npm start
- Deploy + verify immediately

### 5. POST-INCIDENT (after fixing)
Append to session file:
"🚨 INCIDENT: ${broken}
Root cause: [what failed]
Fix: [what changed]
Time to fix: [X minutes]
Commit: [hash]
Prevention: [what to add to avoid recurrence]"

## PRIORITY ORDER
1. Users working again (rollback if needed)
2. Root cause identified
3. Permanent fix deployed
4. Post-mortem written

Yes, allow all edits in components`;
    },
  },

  {
    id: 'performance-degraded',
    title: 'Performance Degraded',
    emoji: '🐌',
    description: 'App got slow — diagnose and fix',
    category: 'special',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'ftable', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/ftable' },
      { key: 'symptom', label: 'Symptom', placeholder: 'Dashboard takes 8s to load, was 1s before' },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const symptom = c(ctx, 'symptom', '[PERFORMANCE SYMPTOM]');
      return `## PERFORMANCE INVESTIGATION — ${name}

Yes, allow all edits in components
Project: ${path}

## SYMPTOM: ${symptom}

## STEP 1 — Measure (before touching anything)
- Open Chrome DevTools → Network tab → reload → record timing
- Note: total load time, largest requests, waterfall
- Open Performance tab → record interaction → find long tasks

## STEP 2 — Common culprits (check in this order)
\`\`\`bash
# Bundle size — is it too large?
npm run build 2>&1 | grep "kB\\|KB" | sort -rh | head -20

# DB queries — are any N+1?
# Check Supabase logs for slow queries
# SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# What changed recently?
git -C ${path} log --oneline -20
git -C ${path} diff HEAD~5 --stat
\`\`\`

## STEP 3 — Fix (based on cause)
- Too many re-renders: add React.memo, useMemo, useCallback
- Large bundle: code-split with React.lazy, remove unused deps
- Slow API: add indices, limit query scope, paginate
- No caching: add SWR/React Query caching, Supabase caching
- Images: convert to WebP, add lazy loading

## STEP 4 — Measure again (verify improvement)
Before: [X seconds]
After: [Y seconds]
Improvement: [Z%]

## COMMIT
\`\`\`bash
git add -A && git commit -m "perf: [describe optimization]" && git push
\`\`\`

Yes, allow all edits in components`;
    },
  },

  {
    id: 'security-breach',
    title: 'Security Issue Detected',
    emoji: '🔐',
    description: 'Suspected or confirmed security vulnerability',
    category: 'special',
    contextFields: [
      { key: 'projectName', label: 'Project name', placeholder: 'PostPilot', required: true },
      { key: 'projectPath', label: 'Project path', placeholder: 'C:/Projects/PostPilot' },
      { key: 'issueDescription', label: 'What was found', placeholder: 'API key exposed in client bundle / RLS not enabled / SQL injection in search', required: true },
    ],
    prompt: (ctx) => {
      const name = c(ctx, 'projectName', '[PROJECT]');
      const path = c(ctx, 'projectPath', `C:/Projects/${name}`);
      const issue = c(ctx, 'issueDescription', '[SECURITY ISSUE]');
      return `## SECURITY ISSUE — ${name}

Yes, allow all edits in components
Project: ${path}

## ISSUE: ${issue}

## IMMEDIATE ACTIONS (do now, in order)

### 1. CONTAIN (stop the bleeding)
- If API key exposed: ROTATE IT NOW via the provider dashboard
- If RLS missing: enable RLS on Supabase table immediately
- If data exposed: assess scope (which rows, which users)
- If injection found: add parameterized queries, do NOT wait

### 2. ASSESS SCOPE
- Was this exploited? Check logs for suspicious patterns:
\`\`\`sql
-- Supabase: unusual queries
SELECT * FROM audit_log WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at DESC LIMIT 50;
\`\`\`
- What data was potentially exposed?

### 3. FIX
\`\`\`bash
cd ${path}
# Find all instances of the vulnerability
grep -r "ISSUE_PATTERN" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Fix each instance
# Test: npm run build && npx tsc --noEmit
\`\`\`

Supabase RLS fix:
\`\`\`sql
ALTER TABLE affected_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON affected_table USING (auth.uid() = user_id);
\`\`\`

### 4. VERIFY
- Confirm fix is deployed
- Test the attack vector no longer works
- Scan for similar issues in adjacent code

### 5. DOCUMENT
\`\`\`bash
git add -A && git commit -m "security: fix [brief description of issue]" && git push
\`\`\`

Append to session file:
"SECURITY FIX: ${issue}
Scope: [what was exposed/vulnerable]
Fix: [what was done]
Deployed: [timestamp]
Similar issues found/fixed: [list]"

Yes, allow all edits in components`;
    },
  },
];

export function getSituationalPrompt(situation: Situation, context?: Record<string, string>): string {
  const template = SITUATIONAL_PROMPTS.find(p => p.id === situation);
  if (!template) return `## ${situation}\n\n[No template found]\n\nYes, allow all edits in components`;
  return template.prompt(context);
}

export const SITUATION_CATEGORY_LABELS: Record<SituationCategory, { label: string; emoji: string }> = {
  workflow: { label: 'Workflow', emoji: '🔄' },
  problem: { label: 'Problems', emoji: '🐛' },
  organization: { label: 'Organization', emoji: '📁' },
  special: { label: 'Special', emoji: '⚡' },
};
