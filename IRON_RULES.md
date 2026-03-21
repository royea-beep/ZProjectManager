# ZProjectManager — Iron Rules
# Read this file at the start of EVERY session.
# Auto-generated: 2026-03-21 IST

## UNIVERSAL RULES (all projects)

### Git
- NEVER commit directly to main/master without tsc check
- ALWAYS: npx tsc --noEmit → build → git commit → git push
- NEVER delete files — archive with reason in commit message
- Commit message format: "feat|fix|chore|docs: description"

### Code Quality
- TypeScript: 0 errors required before any commit
- NEVER leave TODO comments in committed code
- NEVER hardcode credentials, API keys, or secrets
- ALWAYS use environment variables for external services

### Database (Supabase)
- NEVER DROP TABLE or TRUNCATE without checking row count first
- NEVER expose service_role key in client-side code
- ALWAYS enable RLS on new tables
- ALWAYS use ALTER TABLE — never recreate tables with data

### Payments
- Israeli merchant = Payplus ONLY (never Stripe, never LemonSqueezy)
- import from shared-utils/payplus

### Deployment
- NEVER deploy without successful build first

## IRON RULE: Responsive Design
# Added: 2026-03-21 | Reason: Recurring bug across all projects

FORBIDDEN:
  w-[400px], h-[600px], style={{ width: "Xpx" }}, text-[18px] on layout

REQUIRED:
  w-full, max-w-*, flex-wrap, text-base sm:text-lg

TEST BREAKPOINTS: 320px / 390px / 768px / 1280px

QUICK AUDIT:
  grep -rn "w-\[" src --include="*.tsx"
  grep -rn "style={{ width" src --include="*.tsx"

## ELECTRON RULES (ZProjectManager)
- NEVER expose Node.js APIs to renderer without contextBridge
- ALWAYS use IPC for main↔renderer communication
- DB migrations: increment CURRENT_SCHEMA_VERSION
- Never run migration on startup if already at current version
- IPC pipeline: constants.ts → preload.ts ALLOWED_CHANNELS → ipc.ts handler → api.ts → component

## PROJECT: ZProjectManager
- Stack: Electron + React 18 + sql.js WASM + Tailwind + TypeScript strict
- Single-user, local-only, dark mode, Windows 11
- Add project-specific rules below
