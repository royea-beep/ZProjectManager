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
