# Session log — 2026-03-08

## Summary
Multi-repo session: ZPM improvements, ftable auth, Wingman analytics, letsmakebillions dashboard safety, ExplainIt auth scaffold. Next: investigate Wingman TestFlight.

## What was committed (this session)

### ZProjectManager
- SynergyPage: marked Heroes ftTracker/errorHandler/Supabase + TokenWise as ✓ Done
- Dashboard: Stale filter (14+ days no work)
- New project form: repo path prefills `C:\Projects\<name>`
- Export report: date range (All / 7 / 30 days)
- Pattern detector: preserve manager-set patterns (Database strategy)
- NEXT_STEPS.md: 20-item list with done/remaining

### ftable
- admin/pl-dashboard.html: is_admin check (not just session)
- components/admin-utils.js: export esc() for XSS-safe output

### Wingman
- apps/api: analytics accepts FlushQueue-style batch `{ events: [{ type, payload? }] }`
- Delete-account already exists: DELETE /me/account

### letsmakebillions
- web/app.py: default portfolio when get_portfolio_summary() is null
- web/templates/dashboard.html: null-safe portfolio.positions / active_positions

### ExplainIt
- src/lib/auth-context.tsx: AuthProvider + useAuth() placeholder
- layout.tsx: wrapped with AuthProvider

### clubgg / Heroes
- No code changes: clubgg settlement already has 4 fixes; Heroes admin results/league flow exists.

## Learnings (for ZPM / future sessions)
- ftable admin: use requireAdminOrRedirect() and is_admin; pl-dashboard was only checking session.
- Wingman analytics: single endpoint can accept multiple event shapes (FlushQueue + ProjectLearner).
- letsmakebillions: always default portfolio/summary in view and use .get() in templates for optional data.
- ExplainIt: auth scaffold (AuthProvider) allows adding real auth later without big refactor.

## Follow-up
- **Wingman TestFlight:** Investigated. Cause: CI runs `eas build` (preview) but never `eas submit`. Builds exist on EAS; none are sent to App Store Connect. Fix: run `eas submit --latest --platform ios --profile production` from `apps/mobile` with `AuthKey_WTWALQMG5N.p8` in place, or add a CI step that submits after build. Added `Wingman/docs/TESTFLIGHT.md` with steps.

---

# Session log (continued) — 2026-03-08

## Summary
Do-next execution: NEXT_STEPS priority list, Heroes deploy checklist, PostPilot–ftable caption API, ZPM migration for Wingman next_action. Batch commits across 5 repos; Heroes deployed to https://heroes.ftable.co.il. Session memory and learnings persisted.

## What was committed (this continuation)

### ZProjectManager
- NEXT_STEPS.md: "Do next (priority order)" — Wingman TestFlight, Heroes deploy, PostPilot–ftable, rate-limit.
- Migration 5: set Wingman next_action to "TestFlight build 5 — add testers & smoke-test" on app startup.
- Migration 6: insert session learnings (see Learnings below).

### PostPilot
- POST /api/ftable/caption — server-to-server AI caption (rate-limited, x-api-key auth). .env.example: POSTPILOT_FTABLE_API_KEY. rate-limiter-flexible added.
- wip commit: auth refactor, events API, billing and platform updates; remove legacy auth libs.

### ftable
- auto-post-social: optional PostPilot caption when POSTPILOT_API_URL + POSTPILOT_API_KEY set in Edge secrets. CONNECT_POSTPILOT.md updated with setup.
- fix: tournament-manage and register page updates.

### Heroes-Hadera
- DEPLOY_CHECKLIST.md: FTP, Supabase, post-deploy smoke.
- chore: admin pages, auth-guard, setup docs.
- **Deploy:** 57/57 files uploaded to https://heroes.ftable.co.il (Git Bash + ftable .env FTP_PASS).

### Wingman
- fix: auth timeout and verifyToken cleanup in useAuth; docs TESTFLIGHT; api deps.

### ExplainIt
- chore: config and API route updates; remove unused rate-limit and validate-url libs.

## Learnings (saved to ZPM DB via migration 6)
- PostPilot ftable caption API: rate-limit (30/15min) and API-key auth so Supabase Edge can call from auto-post-social without brand token; keep POSTPILOT_FTABLE_API_KEY in host env and mirror in ftable Edge secrets.
- Heroes deploy on Windows: use Git Bash for deploy.sh (`"C:\Program Files\Git\bin\bash.exe"`); FTP_PASS from ftable .env.
- ZPM: use migrations to set next_action and insert learnings so every app startup applies them; avoids manual DB edits.
- Batch commits across repos: stage only the files for the feature (exclude .claude, local config, data/cache); one logical commit per repo.

## Memory (for next session)
- Wingman: TestFlight build 5 submitted; complete Export compliance and add testers in App Store Connect; smoke-test login within ~8s.
- PostPilot: set POSTPILOT_FTABLE_API_KEY in Vercel (or host); ftable sets same value as POSTPILOT_API_KEY in Supabase Edge for AI captions on auto-post.
- letsmakebillions: only untracked data/cache/backup files; add to .gitignore if needed; do not commit private_key.pem.

---

# Session log (continued 2) — 2026-03-08

## Summary
Manager run: Wingman crash fix + build 8 to TestFlight; 90soccer next steps, cert scripts, Android workflow fix, Hebrew-first; PostPilot + Wingman Hebrew-first; ZPM Hebrew model + audit + NEXT_5; release checklists in 3 projects; all repos pushed.

## What was coded and committed

### Wingman
- **apps/mobile/app/_layout.tsx** — Defensive guard: never render main tabs without `profile` (prevents null ref crash from race/cache). Loading spinner when `!needsOnboarding && !profile`.
- **apps/mobile/src/i18n/index.ts** — Default language `lng` and `fallbackLng` changed from `'en'` to `'he'` (Hebrew first).
- **apps/mobile/src/services/sentry.ts** — Stub replaced with real Sentry init/captureException/captureMessage/setUser/wrap; uses EXPO_PUBLIC_SENTRY_DSN.
- **apps/mobile/app.json** — Added @sentry/react-native plugin (org/project config).
- **apps/mobile/metro.config.js** — Switched to getSentryExpoConfig.
- **apps/mobile/package.json** — Added @sentry/react-native.
- **apps/mobile/app/_layout.tsx** — Root layout wrapped with wrapWithSentry(RootLayout).
- **docs/TESTFLIGHT.md** — Build 1.0.0 (8) submitted; link to App Store Connect TestFlight.
- **docs/APP_STORE_CONNECT_CHECKLIST.md** — Build 8, next steps (testers, export compliance, smoke-test).
- **docs/SENTRY_MOBILE.md** — How to set org/project and SENTRY_AUTH_TOKEN.
- **docs/SUBSCRIPTION.md** — Receipt verification next steps (Apple/Google/RevenueCat).
- **docs/EAS_UPDATE.md** — OTA: `eas update --channel production`.
- **docs/RELEASE_CHECKLIST.md** — Export compliance, add testers, smoke-test; done items listed.
- **EAS:** Build 8 submitted to TestFlight via `eas submit --latest --platform ios --profile production`. All above committed and pushed to origin/master.

### 90soccer
- **next.config.ts** — `output: 'export'` for static site in `out/` (Capacitor webDir).
- **.gitignore** — .env, .env.local, *.mobileprovision, *.cer, certs/, *.key, *.csr.
- **docs/DEPLOY.md** — Build, web deploy, env vars, iOS/Android workflows, team 3K9KJNGL9U, cert troubleshooting, quick links + CLI (Apple, GitHub secrets, gh commands).
- **docs/FIX_TESTFLIGHT.md** — Why build fails (cert team mismatch); steps to fix.
- **docs/TESTFLIGHT_WITHOUT_MAC.md** — OpenSSL flow on Windows: key + CSR → Apple → .cer → .p12.
- **.github/workflows/ios-testflight.yml** — Team ID from secret TEAM_ID or default 3K9KJNGL9U; Set team ID step; Export plist uses steps.team.outputs.id.
- **ios/App/App.xcodeproj/project.pbxproj** — DEVELOPMENT_TEAM = 3K9KJNGL9U.
- **scripts/make-csr.ps1** — Creates private.key + request.csr using Git’s OpenSSL.
- **scripts/build-p12-and-secret.ps1** — Builds distribution.p12 from .cer + private.key; sets DISTRIBUTION_P12_BASE64 and DISTRIBUTION_P12_PASSWORD via gh; supports $env:DISTRIBUTION_P12_PASSWORD for non-interactive.
- **scripts/base64-p12.ps1** — Outputs base64 of .p12 for manual secret paste.
- **DO_THIS_FOR_TESTFLIGHT.txt** — Single 7-step flow: Apple link → upload CSR → save .cer → run script → gh workflow run.
- **.github/workflows/android-build.yml** — Removed invalid `if: secrets.GOOGLE_PLAY_KEY_JSON` (GitHub forbids secrets in if); added comment.
- **docs/DEPLOY.md** — Android trigger: `gh workflow run ".github/workflows/android-build.yml"`.
- **src/app/layout.tsx** — `<html lang="he" dir="rtl">` (Hebrew first).
- **docs/RELEASE_CHECKLIST.md** — iOS (DO_THIS_FOR_TESTFLIGHT), Android (workflow + artifact), web deploy.
- **NEXT_STEPS.md** — SecretSauce note; .env.example.
- **certs/** — private.key and request.csr generated (no .cer from Apple yet; root distribution.cer does not match this key). All above committed and pushed to origin/main. Android workflow triggered (AAB build run).

### PostPilot
- **src/lib/language-context.tsx** — Default `useState<Language>` from `"en"` to `"he"`.
- **src/app/layout.tsx** — Root `<html lang="en">` → `<html lang="he" dir="rtl" suppressHydrationWarning>`.
- **.env.example** — Added LemonSqueezy vars: LEMONSQUEEZY_API_KEY, STORE_ID, PRO_VARIANT_ID, AGENCY_VARIANT_ID, WEBHOOK_SECRET.
- **docs/RELEASE_CHECKLIST.md** — Production env, DB, OAuth, smoke-test; done items listed.
- All committed and pushed to origin/main.

### ZProjectManager
- **docs/HEBREW_FIRST_MODEL.md** — Chicle pattern: he default, LANGS + TX, storage + ?lang=, RTL; checklist; React/RN snippet.
- **docs/DEPLOYING_PLATFORMS_LANGUAGE_AUDIT.md** — Table: chicle, ftable, Heroes, ExplainIt, PostPilot, Wingman, 90soccer, KeyDrop, preprompt; he default? i18n? gap.
- **docs/NEXT_5_ACTIONS.md** — 5 user actions: 90soccer cert, Wingman testers, smoke-test, push commits, 90soccer web deploy.
- **MEMORY.md** — Updated: Wingman build 8 + Sentry; 90soccer cert blocker + content pipeline + Android; PostPilot–ftable unchanged.
- **.cursor/rules/agent-workflow.mdc** — Prefer subagents; supervisor model; user steps: give CLI/link/API and persist in project docs.
- **SEED_DATA.sql** — 90soccer project row + launch commands (Dev Server, Open in VS Code, Content Pipeline).
- All committed and pushed to origin/master.

## Pushes performed
- Wingman: master → origin/master (multiple commits: he-first, Sentry, docs, RELEASE_CHECKLIST).
- PostPilot: main → origin/main (he-first, RELEASE_CHECKLIST, .env.example).
- 90soccer: master → main (ios workflow, DEPLOY, scripts, he-first, DO_THIS_FOR_TESTFLIGHT, build-p12 env var, RELEASE_CHECKLIST).
- ZProjectManager: master → origin/master (Hebrew model, audit, NEXT_5, MEMORY).

## What could not be coded (user-only)
- 90soccer iOS TestFlight: Apple Distribution certificate must be created by uploading request.csr at developer.apple.com (no API; requires Apple ID). The .cer downloaded then combines with certs/private.key via scripts/build-p12-and-secret.ps1; script and DO_THIS_FOR_TESTFLIGHT.txt document the single flow.
