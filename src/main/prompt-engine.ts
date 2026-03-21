import type { PromptAction } from '../shared/prompt-templates';

export interface ProjectPromptData {
  id: number;
  name: string;
  description: string | null;
  repo_path: string | null;
  status: string;
  stage: string;
  health_score: number;
  tech_stack: string[];
  github_repo: string | null;
  github_ci_status: string | null;
  github_open_prs: number | null;
  revenue_model: string | null;
  mrr: number | null;
  main_blocker: string | null;
  next_action: string | null;
  category: string | null;
  decisions: Array<{ decision: string; reason: string | null }>;
  tasks: Array<{ title: string; priority: string; status: string }>;
  sessions: Array<{ summary: string | null; session_date: string }>;
}

// ── Header ─────────────────────────────────────────────────────────────────

function buildHeader(p: ProjectPromptData, action: PromptAction): string {
  const today = new Date().toISOString().slice(0, 10);
  const repoPath = p.repo_path || `C:\\Projects\\${p.name}`;
  return `## ${p.name}_${today}_[HH-MM] — ${getActionTitle(action)}

Yes, allow all edits in components
Project: ${repoPath}

## SAVE SESSION FILE
TIMESTAMP=$(date +%H-%M)
mkdir -p "${repoPath}/sessions"
echo "# ${p.name} — $(date '+%Y-%m-%d %H:%M')" > "${repoPath}/sessions/${p.name.replace(/\s/g,'_')}_$(date +%Y-%m-%d)_\${TIMESTAMP}.md"`;
}

function getActionTitle(action: PromptAction): string {
  const titles: Record<PromptAction, string> = {
    'scaffold-project': 'Scaffold Project from Scratch',
    'add-feature': 'Add Feature',
    'fix-bugs': 'Fix Bugs',
    'audit-codebase': 'Full Codebase Audit',
    'refactor': 'Refactor',
    'add-auth': 'Add Authentication',
    'add-payments': 'Add Payments (Payplus)',
    'add-database': 'Add Database (Supabase)',
    'add-realtime': 'Add Realtime',
    'add-notifications': 'Add Push Notifications',
    'add-analytics': 'Add Analytics + Error Logging',
    'add-tests': 'Write Tests',
    'deploy-vercel': 'Deploy to Vercel',
    'deploy-railway': 'Deploy to Railway',
    'testflight-submit': 'Build + Submit to TestFlight',
    'setup-ci-cd': 'Set Up CI/CD',
    'security-audit': 'Security Audit',
    'performance-audit': 'Performance Audit',
    'seo-audit': 'SEO Audit',
    'accessibility-audit': 'Accessibility Audit',
    'add-paywall': 'Add Paywall',
    'add-subscription': 'Add Subscription',
    'add-freemium': 'Add Freemium Tier',
    'app-store-prep': 'App Store Prep',
    'launch-checklist': 'Launch Checklist',
    'marketing-page': 'Marketing / Landing Page',
    'add-admin-dashboard': 'Add Admin Dashboard',
    'add-bug-reporter': 'Add BugReporter',
    'add-feedback-widget': 'Add Feedback Widget',
    'update-state-docs': 'Update State Docs',
  };
  return titles[action] || action;
}

// ── Context ─────────────────────────────────────────────────────────────────

function buildContext(p: ProjectPromptData): string {
  const repoPath = p.repo_path || `C:\\Projects\\${p.name}`;
  const recentSessions = p.sessions.length > 0
    ? p.sessions.map(s => `  - ${s.session_date}: ${s.summary || '(no summary)'}`).join('\n')
    : '  (no sessions logged yet)';

  const openTasks = p.tasks.filter(t => t.status !== 'done');
  const tasksStr = openTasks.length > 0
    ? openTasks.map(t => `  - [${t.priority.toUpperCase()}] ${t.title}`).join('\n')
    : '  (no open tasks)';

  const githubLine = p.github_repo
    ? `GitHub: https://github.com/${p.github_repo} | CI: ${p.github_ci_status || 'unknown'} | Open PRs: ${p.github_open_prs ?? 0}`
    : 'GitHub: not configured';

  return `## READ FIRST — PROJECT CONTEXT
Name: ${p.name}
Path: ${repoPath}
Category: ${p.category || 'web-saas'}
Stage: ${p.stage}
Status: ${p.status} | Health: ${p.health_score}/100
Stack: ${p.tech_stack.join(', ') || 'not specified'}
${githubLine}
Revenue: ${p.revenue_model || 'pre-revenue'} | MRR: ₪${p.mrr ?? 0}
${p.main_blocker ? `\nCURRENT BLOCKER: ${p.main_blocker}` : ''}
${p.next_action ? `NEXT ACTION: ${p.next_action}` : ''}

Recent sessions (last 3):
${recentSessions}

Open tasks:
${tasksStr}`;
}

// ── Locked Decisions ────────────────────────────────────────────────────────

function buildDecisions(p: ProjectPromptData): string {
  if (!p.decisions.length) return '';
  return `## LOCKED DECISIONS — DO NOT CHANGE THESE
${p.decisions.map(d => `- ${d.decision}${d.reason ? ' — ' + d.reason : ''}`).join('\n')}`;
}

// ── Infrastructure Constants ─────────────────────────────────────────────────

function buildInfrastructure(p: ProjectPromptData): string {
  const stack = p.tech_stack.map(s => s.toLowerCase());
  const blocks: string[] = [];

  const hasSupabase = stack.some(s => s.includes('supabase'));
  const hasCapacitor = stack.some(s => s.includes('capacitor'));
  const hasExpo = stack.some(s => s.includes('expo'));
  const hasNextjs = stack.some(s => s.includes('next'));
  const hasRailway = stack.some(s => s.includes('railway'));

  if (hasSupabase) {
    blocks.push(`## SUPABASE RULES
- NEVER use prisma db push (may drop tables with live data)
- ALTER TABLE for schema changes only
- Use Supabase MCP or apply_migration for new tables
- NEVER expose service_role key in client code
- RLS must be enabled on every table`);
  }

  if (hasCapacitor) {
    blocks.push(`## CAPACITOR / IOS RULES
- Check capacitor.config.ts for bundle ID
- iOS version bump: use PlistBuddy on Info.plist
- npx cap sync ONLY after npm run build
- TestFlight: push to main → GitHub Actions auto-deploys (~4 min)
- Monitor: gh run list --repo ${p.github_repo || '[repo]'} --limit 3`);
  }

  if (hasExpo) {
    blocks.push(`## EXPO / EAS RULES
- Submit profile: use 'preview' (has ASC API key) not 'ci'
- Build + submit: eas build --platform ios --profile testflight --non-interactive
- NEVER run npx eas-cli on a different account — check: npx eas-cli whoami
- Version bump: update app.json version + buildNumber`);
  }

  if (hasNextjs) {
    blocks.push(`## NEXT.JS RULES
- Deploy: npx vercel --prod --yes 2>&1 | tail -5
- Env vars: vercel env add KEY_NAME production
- Never commit .env.local — use Vercel dashboard for secrets
- Edge functions: add schedule to vercel.json for crons`);
  }

  if (hasRailway) {
    blocks.push(`## RAILWAY RULES
- Deploy: railway up --detach 2>&1 | tail -5
- Env: railway variables set KEY=VALUE
- Logs: railway logs --tail
- Port: always read from process.env.PORT`);
  }

  return blocks.join('\n\n');
}

// ── Task Blocks ──────────────────────────────────────────────────────────────

function buildTask(action: PromptAction, p: ProjectPromptData): string {
  const repoPath = p.repo_path || `C:\\Projects\\${p.name}`;
  const repoSlug = (p.github_repo || `royea-beep/${p.name.toLowerCase().replace(/\s/g, '-')}`);
  const stack = p.tech_stack.join(', ');
  const hasExpo = p.tech_stack.some(s => s.toLowerCase().includes('expo'));

  const tasks: Record<PromptAction, string> = {
    'scaffold-project': `## TASK — Scaffold ${p.name} from scratch
1. Initialize project with stack: ${stack}
2. Set up folder structure per conventions
3. Create GitHub repo: ${repoSlug}
4. Connect Supabase: create project, run initial migration
5. Set up CI/CD: .github/workflows/deploy.yml → push main → auto-deploy
6. Add /api/status health endpoint
7. Add BugReporter (shake/FAB → Supabase bug_reports)
8. Add error logging (unhandled errors → Supabase error_logs)
9. Push to GitHub → verify CI green
10. Commit: git add -A && git commit -m "feat: initial scaffold" && git push`,

    'add-feature': `## TASK — Add Feature to ${p.name}
[DESCRIBE FEATURE HERE]

Requirements:
- Wire to existing data layer — no parallel state
- Add to existing navigation/routing
- No new dependencies without checking compatibility
- Test: happy path + error state + edge cases
- No hardcoded strings — user-facing text in constants/i18n
- Mobile: test on real device or simulator before committing`,

    'fix-bugs': `## TASK — Fix bugs in ${p.name}
Step 1 — Read context
  cat ${repoPath}/sessions/*.md | tail -100

Step 2 — Check error sources
  Supabase → Table Editor → error_logs (filter by app_name = '${p.name}')

Step 3 — For each bug:
  a. Identify root cause (read the file, don't guess)
  b. Fix it
  c. Test that fix doesn't break adjacent features
  d. Document fix in session file

Step 4 — Build verify
  cd ${repoPath}
  npx tsc --noEmit 2>&1 | tail -5
  npm run build 2>&1 | tail -5`,

    'audit-codebase': `## TASK — Full audit of ${p.name}
1. Read EVERY file in src/ — no summaries, actual content
2. Security check:
   grep -r "service_role" ${repoPath}/src/ --include="*.ts" --include="*.tsx"
   grep -r "SUPABASE_SERVICE" ${repoPath}/src/ --include="*.ts"
3. Build: npx tsc --noEmit && npm run build
4. Score per category (/10): Security | Performance | UX | Completeness | Code Quality
5. List: what VISION exists vs what was BUILT (gap analysis)
6. Output: ranked top 10 improvements with effort estimate
7. Fix all Critical items immediately`,

    'refactor': `## TASK — Refactor ${p.name}
1. Find dead code:
   grep -r "TODO\|FIXME\|HACK\|unused\|deprecated" ${repoPath}/src/ --include="*.ts" --include="*.tsx"
2. Find duplicate patterns:
   grep -rn "console.log" ${repoPath}/src/ (remove all)
3. Ensure consistent error handling: all async functions have try/catch
4. Remove any 'as any' TypeScript casts — fix types properly
5. Extract repeated UI patterns into shared components
6. Run: npx tsc --noEmit → must be zero errors after refactor`,

    'add-auth': `## TASK — Add authentication to ${p.name}
Stack: Supabase Auth (email + Google OAuth)
1. Set up auth providers in Supabase dashboard
2. Create lib/supabase.ts (client + server clients)
3. Create middleware.ts (protect /dashboard and /api routes)
4. Create app/auth/login/page.tsx
5. Create app/auth/callback/route.ts
6. Add profiles table:
   CREATE TABLE profiles (id UUID REFERENCES auth.users(id) PRIMARY KEY, email TEXT, tier TEXT DEFAULT 'free', created_at TIMESTAMPTZ DEFAULT NOW());
   Enable RLS + add policies
7. Test: signup → confirm email → login → protected route → logout`,

    'add-payments': `## TASK — Add Payplus payments to ${p.name}
CRITICAL: Israeli merchant — Payplus ONLY (not Stripe, not LemonSqueezy)
1. Copy util from C:/Projects/shared-utils/src/payplus.ts
2. Set env vars: PAYPLUS_API_KEY, PAYPLUS_SECRET, PAYPLUS_PAGE_UID
3. Create: app/api/payment/create/route.ts
4. Create: app/api/payment/webhook/route.ts (verify signature + update DB)
5. Create: app/pricing/page.tsx (RTL Hebrew, dark theme)
6. Wire: payment complete → UPDATE profiles SET tier = 'pro' WHERE id = user_id
7. Test: create payment → complete → verify tier updated in Supabase`,

    'add-database': `## TASK — Set up Supabase for ${p.name}
1. Create Supabase project via dashboard
2. Get env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
3. Create lib/supabase.ts:
   - createBrowserClient (for components)
   - createServerClient (for server actions/route handlers)
4. Design schema — define tables and relationships
5. Apply via MCP: apply_migration
6. Enable RLS on ALL tables
7. Add initial RLS policies
8. NEVER use prisma db push on existing databases`,

    'add-realtime': `## TASK — Add Supabase realtime to ${p.name}
1. Enable realtime on target table:
   ALTER PUBLICATION supabase_realtime ADD TABLE [table_name];
2. Create subscription in component:
   const channel = supabase.channel('channel-name')
     .on('postgres_changes', { event: '*', schema: 'public', table: '[table]' }, (payload) => {
       // update state
     }).subscribe()
3. Cleanup in useEffect return
4. Test: 2 browser tabs — change in one appears in other within 500ms`,

    'add-notifications': `## TASK — Add push notifications to ${p.name}
${hasExpo ? `Expo approach:
1. npx expo install expo-notifications expo-device
2. Request permissions on app open
3. Save push_token to Supabase profiles table
4. Create /api/send-push/route.ts (uses Expo Push API)
5. Create scheduled notification via vercel.json cron
6. Test: receive notification on real device` : `Capacitor approach:
1. npm i @capacitor/push-notifications
2. npx cap sync
3. Configure Firebase in capacitor.config.ts
4. Save token to Supabase on app open
5. Create server-side FCM sender`}`,

    'add-analytics': `## TASK — Add analytics + error monitoring to ${p.name}
1. Copy from C:/Projects/shared-utils/src/error-logger.ts
2. Deploy log-error Edge Function to Supabase (if not exists)
3. Create table: error_logs (id, app_name, error_message, stack, url, user_id, created_at)
4. Wire to app root layout — catches ALL unhandled errors
5. Add /api/status endpoint:
   return Response.json({ status: 'ok', db: 'ok', version: '1.0.0' })
6. Add FeedbackWidget (shows after 3rd page visit)
7. Verify: throw a test error → appears in Supabase error_logs`,

    'add-tests': `## TASK — Write tests for ${p.name}
Focus on critical paths only (don't test implementation details):
1. Unit tests: utility functions (calculations, formatters, validators)
2. Integration tests: API routes (auth required, auth missing, invalid input)
3. E2E tests: key user flows (signup → feature → payment → result)
4. Mobile: Detox or Maestro for critical flows
5. Run: npm run test (all must pass)
6. Add to CI: test step before deploy in .github/workflows/`,

    'deploy-vercel': `## TASK — Deploy ${p.name} to Vercel
1. cd ${repoPath}
2. npx tsc --noEmit 2>&1 | head -5  # Must be zero errors
3. npm run build 2>&1 | tail -5      # Must pass
4. git add -A && git commit -m "deploy: [description]" && git push
5. npx vercel --prod --yes 2>&1 | tail -5
6. Verify: curl [deploy-url]/api/status
7. Check Vercel dashboard: env vars, functions, domains`,

    'deploy-railway': `## TASK — Deploy ${p.name} to Railway
1. cd ${repoPath}
2. npm run build 2>&1 | tail -5      # Must pass
3. git add -A && git commit -m "deploy: [description]" && git push
4. railway up --detach 2>&1 | tail -5
5. railway logs --tail               # Watch startup
6. curl [railway-url]/api/status     # Verify health`,

    'testflight-submit': `## TASK — Build + submit ${p.name} to TestFlight
${hasExpo ? `EAS approach:
1. Bump version in app.json (version + buildNumber)
2. cd ${repoPath}
3. eas build --platform ios --profile testflight --non-interactive --wait
4. eas submit --platform ios --profile preview --latest --non-interactive
5. Watch build: gh run list --repo ${repoSlug} --limit 3` : `Capacitor + GitHub Actions approach:
1. Bump package.json version + ios/App/App.xcodeproj buildNumber
2. git add -A && git commit -m "release: v[VERSION] build [NUM]" && git push origin main
3. Watch: gh run list --repo ${repoSlug} --limit 5
4. Monitor Actions tab → All steps must pass
5. TestFlight appears ~5 min after CI completes`}`,

    'setup-ci-cd': `## TASK — Set up CI/CD for ${p.name}
Create .github/workflows/deploy.yml:
On push to main:
  1. npm ci
  2. npm run build
  3. Deploy to Vercel/Railway

GitHub secrets to set:
  gh secret set VERCEL_TOKEN --repo ${repoSlug}
  gh secret set VERCEL_PROJECT_ID --repo ${repoSlug}
  gh secret set VERCEL_ORG_ID --repo ${repoSlug}

${hasExpo ? `Mobile CI (EAS):
  gh secret set EXPO_TOKEN --repo ${repoSlug}
  gh secret set ASC_API_KEY_ID --repo ${repoSlug}` : ''}`,

    'security-audit': `## TASK — Security audit of ${p.name}
Run each check, report Pass/Warning/Fail:

1. Service role key in client code (FAIL if found):
   grep -r "service_role" ${repoPath}/src/ --include="*.ts" --include="*.tsx"

2. Hardcoded secrets:
   grep -r "SUPABASE_SERVICE\|API_KEY\|SECRET" ${repoPath}/src/ --include="*.ts"

3. Rate limiting on auth routes (check middleware.ts)
4. CORS headers on all API routes
5. Input validation on forms (no unescaped user input to DB)
6. RLS enabled: check all tables in Supabase dashboard
7. Auth required on all protected routes

Fix all FAIL items immediately. Warn about Warnings.`,

    'performance-audit': `## TASK — Performance audit of ${p.name}
1. Bundle size: npm run build → check output sizes
2. Heavy imports: grep -r "import \* as" ${repoPath}/src/
3. Large components: should be dynamic() if >50KB
4. Image optimization: all using next/image with sizes prop
5. DB queries: check for N+1 patterns
6. API caching: add Cache-Control headers where appropriate
7. Mobile: check re-render count with React DevTools profiler`,

    'seo-audit': `## TASK — SEO audit of ${p.name}
1. Each page has unique <title> and <meta description>
2. robots.txt at /public/robots.txt
3. sitemap.ts generates all routes
4. JSON-LD structured data in layout.tsx
5. Canonical URLs on all pages
6. OG tags: og:title, og:description, og:image (1200×630)
7. /api/og generates OG image dynamically`,

    'accessibility-audit': `## TASK — Accessibility audit of ${p.name}
1. All images: alt text present and descriptive
2. All buttons: aria-label or visible text
3. Color contrast: minimum 4.5:1 ratio for body text
4. Keyboard: all interactive elements reachable via Tab
5. Focus: visible focus ring on all interactive elements
6. Forms: labels associated with inputs via htmlFor/id`,

    'add-paywall': `## TASK — Add paywall to ${p.name}
1. Define in constants: FREE_LIMITS, PRO_FEATURES
2. Check user tier on page load (from Supabase profiles)
3. On limit hit: show upgrade modal (CTA → payment)
4. Wire to Payplus (C:/Projects/shared-utils/src/payplus.ts)
5. Webhook: payment complete → UPDATE profiles SET tier = 'pro'
6. Test flow: free user hits limit → sees paywall → pays → feature unlocked`,

    'add-subscription': `## TASK — Add subscription to ${p.name}
CRITICAL: Israeli merchant = Payplus (NOT Stripe)
1. Create subscription plan in Payplus dashboard
2. Create /api/subscribe/route.ts (creates Payplus subscription)
3. Create /api/webhook/payplus/route.ts (handles renewal/cancel events)
4. Add to profiles: subscription_status, subscription_expires_at
5. Add /account/billing page: status + cancel button
6. Test: subscribe → check profiles updated → cancel → check downgrade`,

    'add-freemium': `## TASK — Add freemium tier to ${p.name}
1. Define limits: FREE_LIMIT (e.g., 3/mo), PRO_LIMIT (unlimited)
2. Add usage_count to relevant table (resets monthly via cron)
3. Check on every action: if (usage >= FREE_LIMIT) → show upgrade CTA
4. Upgrade flow → Payplus payment → webhook → update tier
5. Show usage in dashboard: "${`{usage}`}/${`{limit}`} used this month"`,

    'app-store-prep': `## TASK — App Store prep for ${p.name}
1. Privacy page at /privacy (required by Apple)
2. Support page at /support (required by Apple)
3. 6 screenshots at 1290×2796 (iPhone 6.9" required):
   - Main screen, key feature 1, key feature 2, settings
4. App Store metadata (write to docs/app-store-metadata.md):
   - Title: max 30 chars
   - Subtitle: max 30 chars
   - Description: max 4000 chars (Hebrew primary)
   - Keywords: max 100 chars
   - What's New section
5. Info.plist: add usage descriptions for ALL permissions
6. Age rating: determine based on content
WARNING: do NOT submit without real user testing first`,

    'launch-checklist': `## TASK — Launch checklist for ${p.name}
Verify each item (write Pass/Fail for each):

□ TypeScript: npx tsc --noEmit → zero errors
□ Build: npm run build → passes
□ All env vars set in production (Vercel/Railway dashboard)
□ DB migrations applied (check Supabase migration list)
□ RLS enabled on ALL Supabase tables
□ Rate limiting on auth routes
□ No service_role key in any client-side file
□ Error logging wired (errors appear in Supabase error_logs)
□ /api/status returns { status: 'ok' }
□ robots.txt exists at /public/robots.txt
□ Privacy policy page exists
□ Real user testing completed (TestFlight or staging)
${p.revenue_model && p.revenue_model !== 'pre-revenue' ? '□ Monetization wired + tested E2E\n' : ''}□ Analytics wired

Output a table with Pass/Fail for each item.`,

    'marketing-page': `## TASK — Marketing/landing page for ${p.name}
Structure:
1. Hero: headline (6 words max) + subheadline + primary CTA button
2. Problem/Solution: 2-3 sentences on what pain this solves
3. Features: 3-4 key benefits with icons and one-line descriptions
4. Social proof: screenshots / testimonials / usage numbers
5. Pricing section (if applicable)
6. FAQ: 3-5 questions that remove purchase objections
7. Footer: links + copyright

Style rules:
- RTL Hebrew for Israeli audience (dir="rtl")
- Dark theme (#0f172a background)
- Mobile-first
- Primary CTA: accent green (#22c55e)`,

    'add-admin-dashboard': `## TASK — Add admin dashboard to ${p.name}
Route: /admin
Auth: check ?key=ADMIN_KEY query param (from env) OR admin role in profiles

Sections:
1. Key metrics (users, DAU, revenue if applicable)
2. Recent activity log (last 20 actions from audit_log)
3. Error log (from Supabase error_logs, last 50)
4. User management (list users, view profile, ban/unban)
5. Content management (if applicable)

Implementation:
- Server component (no client-side auth check)
- Read-only for most actions, write only for user management`,

    'add-bug-reporter': `## TASK — Add BugReporter to ${p.name}
Source: C:/Projects/shared-utils/src/bug-reporter.ts
1. Add FloatingBugButton (fixed bottom-right, z-index:9999)
2. Shake detection (mobile) OR button tap → open report modal
3. Capture: description + screenshot (if possible) + device info
4. Submit → Supabase bug_reports table
5. bug_reports schema:
   (id, project_name, description, screenshot_url, device_info, created_at)
6. Edge Function: on insert → send to Google Drive folder
7. Test: submit a bug → verify it appears in Supabase bug_reports`,

    'add-feedback-widget': `## TASK — Add feedback widget to ${p.name}
Source: C:/Projects/shared-utils/src/FeedbackWidget.tsx
1. Shows after 3rd page visit (localStorage counter: '${p.name.toLowerCase()}_visit_count')
2. UI: thumbs up/down + optional text input + submit
3. Submit → Supabase user_feedback table:
   CREATE TABLE user_feedback (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     app_name TEXT DEFAULT '${p.name}',
     rating INT, message TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
4. Wire to layout.tsx (client component)
5. Test: visit 3 times → widget appears → submit → check Supabase`,

    'update-state-docs': `## TASK — Update state docs for ${p.name}
Write to: ${repoPath}/docs/${p.name.replace(/\s/g,'_').toUpperCase()}_STATE.md

Required sections:
1. Current version + build number
2. Live URL (if deployed)
3. Score /10 (your honest assessment)
4. What was built in this session
5. Open tasks (copy from DB tasks)
6. Blocked on what
7. Next session starts with

Then:
git add -A
git commit -m "docs: state update $(date +%Y-%m-%d)"
git push origin main`,
  };

  return `## TASK — ${getActionTitle(action)}\n${tasks[action] || '[Describe task here]'}`;
}

// ── Footer ───────────────────────────────────────────────────────────────────

function buildFooter(p: ProjectPromptData, action: PromptAction): string {
  const repoPath = p.repo_path || `C:\\Projects\\${p.name}`;
  const stack = p.tech_stack.map(s => s.toLowerCase());
  const hasVercel = stack.some(s => s.includes('vercel') || s.includes('next'));
  const hasRailway = stack.some(s => s.includes('railway'));

  return `## BUILD + VERIFY
cd ${repoPath}
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5

## COMMIT
git add -A
git commit -m "feat: [description] — ${getActionTitle(action)}"
git push origin main
${hasVercel ? '\n## DEPLOY\nnpx vercel --prod --yes 2>&1 | tail -3' : ''}
${hasRailway ? '\n## DEPLOY\nrailway up --detach 2>&1 | tail -3' : ''}
## SESSION FILE UPDATE
cat >> "${repoPath}/sessions/${p.name.replace(/\s/g,'_')}_$(date +%Y-%m-%d)_\${TIMESTAMP}.md" << 'EOF'
## What was built
- Action: ${action}
- Files changed: [list here]

## Status
TypeScript: [clean/errors]
Build: [clean/errors]
EOF

## MEGA FINAL REPORT
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | [first task] | ✅ Done | |
(fill in each task above)

Yes, allow all edits in components`;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function generateMegaPrompt(
  project: ProjectPromptData,
  action: PromptAction,
  extraContext?: string,
): string {
  const sections: string[] = [
    buildHeader(project, action),
    buildContext(project),
  ];

  const decisions = buildDecisions(project);
  if (decisions) sections.push(decisions);

  const infra = buildInfrastructure(project);
  if (infra) sections.push(infra);

  if (extraContext?.trim()) {
    sections.push(`## ADDITIONAL CONTEXT\n${extraContext.trim()}`);
  }

  sections.push(buildTask(action, project));
  sections.push(buildFooter(project, action));

  return sections.join('\n\n');
}

// ── Prompt Scoring / Recommendations ─────────────────────────────────────────

export const STAGE_RECOMMENDED_ACTIONS: Record<string, {
  primary: PromptAction;
  secondary: PromptAction[];
  reason: string;
}> = {
  'idea':        { primary: 'scaffold-project',  secondary: ['add-database', 'setup-ci-cd'],           reason: 'Nothing built yet — scaffold first, then infrastructure' },
  'scaffold':    { primary: 'add-auth',           secondary: ['add-database', 'add-analytics'],         reason: 'Structure exists — auth and DB are the foundation' },
  'building':    { primary: 'add-feature',        secondary: ['fix-bugs', 'audit-codebase'],            reason: 'Active development — build features, catch bugs early' },
  'alpha':       { primary: 'fix-bugs',           secondary: ['security-audit', 'performance-audit'],   reason: 'Core done — clean up bugs, harden before real users' },
  'testflight':  { primary: 'fix-bugs',           secondary: ['add-analytics', 'add-feedback-widget'],  reason: 'Real users testing — listen to feedback, fix what breaks' },
  'pre-launch':  { primary: 'launch-checklist',   secondary: ['app-store-prep', 'marketing-page'],      reason: 'Almost there — run checklist, prepare all launch assets' },
  'live':        { primary: 'add-payments',       secondary: ['performance-audit', 'add-admin-dashboard'], reason: 'Live product — monetize, monitor, optimize' },
  'scaling':     { primary: 'performance-audit',  secondary: ['add-subscription', 'refactor'],          reason: 'Growing — optimize for scale, deepen monetization' },
  'maintenance': { primary: 'update-state-docs',  secondary: ['add-analytics', 'security-audit'],       reason: 'Stable — keep docs current, watch for security issues' },
  'paused':      { primary: 'audit-codebase',     secondary: ['update-state-docs', 'refactor'],         reason: 'Resuming — audit what was built, then plan next move' },
  'pivot':       { primary: 'audit-codebase',     secondary: ['scaffold-project', 'add-feature'],       reason: 'Changing direction — audit what to keep, rebuild what to change' },
  // Map to existing stages in DB
  'concept':     { primary: 'scaffold-project',   secondary: ['add-database', 'setup-ci-cd'],           reason: 'Concept stage — scaffold first to validate the idea' },
  'research':    { primary: 'scaffold-project',   secondary: ['audit-codebase', 'add-database'],        reason: 'Research stage — start building to validate assumptions' },
  'architecture':{ primary: 'scaffold-project',   secondary: ['add-database', 'add-auth'],              reason: 'Architecture stage — scaffold based on your design' },
  'setup':       { primary: 'add-auth',           secondary: ['add-database', 'setup-ci-cd'],           reason: 'Setup stage — wire auth and DB before building features' },
  'development': { primary: 'add-feature',        secondary: ['fix-bugs', 'audit-codebase'],            reason: 'Active development — build features, catch bugs early' },
  'content_assets':{ primary: 'marketing-page',   secondary: ['app-store-prep', 'seo-audit'],           reason: 'Content stage — polish the marketing and store assets' },
  'launch_prep': { primary: 'launch-checklist',   secondary: ['security-audit', 'performance-audit'],   reason: 'Launch prep — run the full checklist before going live' },
  'live_optimization':{ primary: 'performance-audit', secondary: ['add-subscription', 'add-admin-dashboard'], reason: 'Live and optimizing — deepen monetization, monitor performance' },
};

export const CATEGORY_STAGE_OVERRIDES: Partial<Record<string, { primary: PromptAction; reason: string }>> = {
  'mobile-app_testflight':  { primary: 'fix-bugs',       reason: 'Mobile on TestFlight — crash reports are #1 priority' },
  'mobile-app_pre-launch':  { primary: 'app-store-prep', reason: 'Mobile pre-launch — screenshots and metadata block submission' },
  'web-saas_live':          { primary: 'add-payments',   reason: 'Live SaaS with no monetization = leaving money on the table' },
  'web-saas_live_optimization': { primary: 'add-subscription', reason: 'Live SaaS — subscription model beats one-time payments' },
  'web-saas_building':      { primary: 'add-auth',       reason: 'SaaS without auth cannot have users' },
  'web-saas_development':   { primary: 'add-auth',       reason: 'SaaS without auth cannot have users' },
  'game_testflight':        { primary: 'fix-bugs',       reason: 'Game on TestFlight — gameplay bugs kill retention immediately' },
  'mobile-app_development': { primary: 'testflight-submit', reason: 'Mobile in development — get it on TestFlight for real device testing' },
  'ai-tool_live':           { primary: 'add-payments',   reason: 'AI tool with users = prime time to monetize' },
  'desktop-app_live_optimization': { primary: 'add-subscription', reason: 'Desktop app live — subscription is the best monetization model' },
};

export interface RecommendedActions {
  primary: PromptAction;
  secondary: PromptAction[];
  reason: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export function getRecommendedActions(project: {
  stage: string;
  category: string;
  health_score: number;
  github_ci_status?: string | null;
  github_open_prs?: number | null;
  main_blocker?: string | null;
  mrr?: number | null;
}): RecommendedActions {
  const overrideKey = `${project.category}_${project.stage}`;
  const override = CATEGORY_STAGE_OVERRIDES[overrideKey];
  const base = STAGE_RECOMMENDED_ACTIONS[project.stage] || STAGE_RECOMMENDED_ACTIONS['development'];
  const primary = (override?.primary || base.primary) as PromptAction;
  const reason = override?.reason || base.reason;

  let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  if (project.github_ci_status === 'failing') urgency = 'critical';
  else if (project.health_score < 40) urgency = 'critical';
  else if (project.health_score < 60) urgency = 'high';
  else if ((project.github_open_prs || 0) > 3) urgency = 'high';
  else if ((project.mrr || 0) === 0 && (project.stage === 'live' || project.stage === 'live_optimization')) urgency = 'high';

  // CI failing overrides everything
  if (project.github_ci_status === 'failing') {
    return {
      primary: 'fix-bugs' as PromptAction,
      secondary: [primary, base.secondary[0]] as PromptAction[],
      reason: '🔴 CI is failing — fix the build before anything else',
      urgency: 'critical',
    };
  }

  return {
    primary,
    secondary: base.secondary as PromptAction[],
    reason,
    urgency,
  };
}
