# PATCH QUEUE — Controlled Execution List
**Date:** 2026-03-09 | **Rule:** Do NOT execute without explicit mode activation

---

## SAFE AUTO PATCHES (Zero Risk — Can Execute Immediately)

### P-01: Add .gitignore to ftable-hands
- **Project:** ftable-hands
- **Why:** No .gitignore exists; secrets, pycache, pickles all trackable
- **Patch:** Create comprehensive .gitignore (see SECURITY_REMEDIATION_PLAN.md)
- **Risk:** None
- **Effort:** 2 min

### P-02: Add .gitignore entries to clubgg
- **Project:** clubgg
- **Why:** `__pycache__/`, `*.pyc`, `db/*.db`, `Weekly/*.xlsx`, `*.bak` should be ignored
- **Patch:** Create or update .gitignore
- **Risk:** None
- **Effort:** 2 min

### P-03: Delete 15 zip files from ftable root
- **Project:** ftable
- **Why:** v1.zip through v9.zip, ftable-full.zip, etc. — dead weight, hundreds of MB
- **Patch:** `git rm` all .zip files, add `*.zip` to .gitignore
- **Risk:** None (archives, not source)
- **Effort:** 5 min

### P-04: Delete Heroes.zip from Heroes-Hadera
- **Project:** Heroes-Hadera
- **Why:** Unnecessary archive binary in repo
- **Patch:** `git rm Heroes.zip`, add `*.zip` to .gitignore
- **Risk:** None
- **Effort:** 1 min

### P-05: Delete postpilot.db from KeyDrop root
- **Project:** KeyDrop
- **Why:** Leftover SQLite file from wrong project
- **Patch:** `rm postpilot.db` or `git rm` if tracked
- **Risk:** None
- **Effort:** 1 min

### P-06: Remove empty db/ and ui/ dirs from shared-utils
- **Project:** shared-utils
- **Why:** Dead placeholder directories with no content
- **Patch:** `rmdir src/db src/ui`
- **Risk:** None
- **Effort:** 1 min

### P-07: Fix shared-utils barrel exports
- **Project:** shared-utils
- **Why:** `index.ts` only exports 3 of 9 modules — inconsistent API surface
- **Patch:** Update `src/index.ts` to re-export all 9 modules
- **Risk:** Low (additive change, no breakage)
- **Effort:** 5 min

### P-08: Fix ProjectLearner `undefined` header
- **Project:** ProjectLearner
- **Why:** `'Prefer': undefined` sends literal string "undefined" as HTTP header
- **Patch:** Remove the `Prefer` header or set to proper value
- **Risk:** None
- **Effort:** 2 min

### P-09: Move PostPilot dev deps to devDependencies
- **Project:** PostPilot
- **Why:** `@types/node`, `@types/react`, `@tailwindcss/postcss`, `postcss`, `tailwindcss`, `typescript` are in `dependencies` instead of `devDependencies`
- **Patch:** Move to devDependencies in package.json
- **Risk:** Low (may affect Vercel build if it only installs prod deps — verify)
- **Effort:** 5 min

### P-10: Init git repos for orphan libraries
- **Project:** PromptGuard, SecretSauce, FlushQueue, CoinLedger, url-guard
- **Why:** No version history = lost work risk
- **Patch:** `git init && git add -A && git commit -m "Initial commit"`
- **Risk:** None
- **Effort:** 5 min each (25 min total)

### P-11: Delete clubgg investigation scripts
- **Project:** clubgg
- **Why:** `investigate_task1.py`, `investigate_task1b.py`, `investigate_task1c.py`, `investigate_task2.py`, `strategic_analysis.py` — one-off dead code
- **Patch:** `git rm investigate_task*.py strategic_analysis.py`
- **Risk:** None (one-off analysis scripts, not part of the app)
- **Effort:** 2 min

### P-12: Delete clubgg backup files
- **Project:** clubgg
- **Why:** `THEBOOK2.xlsx.bak`, `nul` (Windows artifact)
- **Patch:** `git rm THEBOOK2.xlsx.bak nul`
- **Risk:** None
- **Effort:** 1 min

---

## REVIEW BEFORE PATCH (Low Risk — Needs Verification)

### P-13: Fix TokenWise PRICING duplication
- **Project:** TokenWise
- **Why:** `estimator.ts` and `badge.ts` both contain full PRICING object; if a model price changes, must update both
- **Patch:** Extract PRICING to `src/pricing.ts`, import in both files
- **Review:** Verify badge.ts can import from a shared file (it's designed for browser — may need bundling consideration)
- **Risk:** Low
- **Effort:** 15 min

### P-14: Fix crypto-arb-bot `or True` hack
- **Project:** crypto-arb-bot
- **Why:** `if "--paper" in sys.argv or True` forces paper mode unconditionally — looks unintentional
- **Patch:** Remove `or True`, rely on CLI flag `--paper`
- **Review:** Confirm paper mode is properly selectable via CLI
- **Risk:** Low (but could enable live mode if --paper is forgotten — check safety guards)
- **Effort:** 1 min

### P-15: Fix KeyDrop Stripe → LemonSqueezy naming
- **Project:** KeyDrop
- **Why:** DB columns `stripeCustomerId`, `stripeSubscriptionId` and webhook route `/api/stripe/webhook` despite using LemonSqueezy
- **Patch:** Prisma migration to rename columns, move route to `/api/billing/webhook`
- **Review:** Verify no external integrations point to old webhook URL
- **Risk:** Low-Medium (requires DB migration)
- **Effort:** 1 hour

### P-16: Add .env.example to projects missing it
- **Projects:** ftable, ftable-hands, chicle, clubgg, cryptowhale, letsmakebillions, crypto-arb-bot, mypoly, VenueKit
- **Why:** Developer onboarding, documentation of required env vars
- **Patch:** Create `.env.example` with placeholder values per project
- **Review:** Must inspect actual .env or code to identify all required vars — don't guess
- **Risk:** None
- **Effort:** 30 min total

### P-17: Centralize Supabase anon keys
- **Projects:** ftable (3 files), Heroes-Hadera (4 files), chicle (1 file)
- **Why:** Same key duplicated across files — rotation requires touching multiple files
- **Patch:** Create `supabase-config.js` (or equivalent) as single source, import everywhere else
- **Review:** Ensure all import paths resolve correctly
- **Risk:** Low (but wide-reaching change across multiple files)
- **Effort:** 30 min per project

---

## MANUAL / HIGH RISK PATCHES

### P-18: Chicle secret externalization
- **Project:** chicle
- **Why:** API key, admin password, auth secret all hardcoded in config.php
- **Patch:** Create .env, refactor config.php to use getenv()
- **REQUIRES:** Key rotation FIRST (see SECURITY_REMEDIATION_PLAN.md)
- **Risk:** HIGH if done wrong (breaks live site)
- **Effort:** 30 min

### P-19: ftable-hands git history rewrite
- **Project:** ftable-hands
- **Why:** Google OAuth secrets in git history
- **Patch:** BFG Repo Cleaner or git filter-repo
- **REQUIRES:** Credential revocation FIRST
- **Risk:** HIGH (rewrites all commit hashes, breaks any existing references)
- **Effort:** 30 min

### P-20: Wingman secret audit + remediation
- **Project:** Wingman
- **Why:** Possible .env, .p8, env dump committed to git
- **Patch:** Audit first, then rotate + rewrite if confirmed
- **REQUIRES:** Full audit before any action
- **Risk:** HIGH (many external services to rotate)
- **Effort:** 1-3 hours depending on scope

---

## EXECUTION ORDER

**Phase 1 (Security First):** P-18, P-19, P-20 (MANUAL — need user action for key rotation)
**Phase 2 (Safe Auto):** P-01 through P-12 (all SAFE AUTO PATCH)
**Phase 3 (Review):** P-13 through P-17 (REVIEW BEFORE PATCH)

---

## TRACKING

After each patch is applied, update status:

| Patch | Status | Date | Notes |
|-------|--------|------|-------|
| P-01 | **DONE** | 2026-03-09 | Security Mode (ftable-hands .gitignore) |
| P-02 | **DONE** | 2026-03-09 | clubgg .gitignore hardened (commit 2fcd0ec) |
| P-03 | **SKIP** | 2026-03-09 | Already gitignored, none tracked |
| P-04 | **SKIP** | 2026-03-09 | Already gitignored |
| P-05 | **SKIP** | 2026-03-09 | Already gitignored |
| P-06 | **SKIP** | 2026-03-09 | Low value — empty dirs harmless |
| P-07 | **DONE** | 2026-03-09 | shared-utils barrel fix (commit c7b4134) |
| P-08 | **DONE** | 2026-03-09 | ProjectLearner bug fix (commit f42008a) |
| P-09 | **ESCALATED** | 2026-03-09 | Moved to REVIEW — safe but wide, verify build |
| P-10 | **DONE (4/5)** | 2026-03-09 | Git init: SecretSauce, FlushQueue, CoinLedger, PromptGuard. url-guard skipped (merge candidate) |
| P-11 | **DONE** | 2026-03-09 | Merged with P-02 — 5 scripts removed (commit 2fcd0ec) |
| P-12 | **SKIP** | 2026-03-09 | Files already untracked by .gitignore |
| P-13 | PENDING | — | REVIEW: TokenWise PRICING duplication |
| P-14 | PENDING | — | REVIEW: crypto-arb-bot `or True` hack |
| P-15 | PENDING | — | REVIEW: KeyDrop Stripe→LS naming |
| P-16 | PENDING | — | REVIEW: .env.example for 9 projects |
| P-17 | PENDING | — | REVIEW: Centralize Supabase keys |
| P-18 | PENDING | — | MANUAL: chicle secret externalization |
| P-19 | PENDING | — | MANUAL: ftable-hands history rewrite |
| P-20 | **RESOLVED** | 2026-03-09 | Wingman audit showed no secrets committed |
