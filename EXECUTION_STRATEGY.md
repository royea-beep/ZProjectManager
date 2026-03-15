# PHASE 2: EXECUTION STRATEGY & REMEDIATION PLAN
**Date:** 2026-03-09 | **Lead:** Claude Opus 4.6 (Execution Strategist + Remediation Lead)
**Source:** MASTER_AUDIT.md (26 projects, 5 parallel agents, 438 tool operations)

---

# 1. STRUCTURED AUDIT FINDINGS MODEL

All findings from MASTER_AUDIT.md classified into 10 operational buckets:

---

## Bucket 1: Critical Security Issues

| ID | Project | Issue | Severity | Exposure Type |
|----|---------|-------|----------|---------------|
| SEC-01 | chicle | Anthropic API key `sk-ant-api03-...` hardcoded in `config.php` | **CRITICAL** | API key in source + git history |
| SEC-02 | chicle | Admin password `chicle2026` hardcoded in `config.php` | **CRITICAL** | Credential in source |
| SEC-03 | chicle | AUTH_SECRET `chicle-auth-k8x2m9p4` hardcoded | HIGH | Auth secret in source |
| SEC-04 | ftable-hands | `client_secret.json` (Google OAuth) committed to git | **CRITICAL** | OAuth secret in git history |
| SEC-05 | ftable-hands | `drive_client_secret.json` committed to git | **CRITICAL** | OAuth secret in git history |
| SEC-06 | ftable-hands | `youtube_token.pickle` + `drive_token.pickle` committed | HIGH | Auth tokens in git history |
| SEC-07 | Wingman | `.env` files (2,677B + 138B) possibly committed in `apps/api/` and `apps/mobile/` | **CRITICAL** | Env vars possibly in git |
| SEC-08 | Wingman | `AuthKey_WTWALQMG5N.p8` (Apple private key) in `apps/mobile/` | HIGH | Signing key in repo |
| SEC-09 | Wingman | `ProjectsWingmanappsapi.env` (2,820B env dump) in `apps/api/` | HIGH | Env dump in repo |
| SEC-10 | 9soccer | `AuthKey_WTWALQMG5N.p8`, `distribution.cer`, `.mobileprovision` committed | HIGH | Apple signing creds in repo |
| SEC-11 | CURSOR_MEGA_PROMPT.md | LemonSqueezy webhook secrets visible (`68f5bab...`, `5a15d60...`) | MEDIUM | Secrets in standalone file |
| SEC-12 | letsmakebillions | `private_key.pem` in project root (gitignored but risky) | MEDIUM | Key on disk |
| SEC-13 | letsmakebillions | Admin API key defaults to empty string (no auth in dev) | MEDIUM | No-auth fallback |
| SEC-14 | mypoly | `setup_api.py` prints API key, secret, passphrase to stdout | MEDIUM | Credential leakage via terminal |
| SEC-15 | VenueKit | Supabase anon key hardcoded in `configs/heroes-hadera.json` | LOW | Public key in config (anon keys are public by design) |
| SEC-16 | ExplainIt | Supabase anon key hardcoded in `ProjectLearner.tsx` | LOW | Public key in source |
| SEC-17 | Heroes-Hadera | Supabase anon key duplicated in 4 JS files | LOW | Key duplication (rotation pain) |
| SEC-18 | ftable | Supabase anon key duplicated in 3+ files | LOW | Key duplication |
| SEC-19 | ProjectLearner | Supabase RLS too permissive (anon can INSERT/UPDATE) | MEDIUM | Data pollution risk |
| SEC-20 | clubgg | No authentication on financial dashboard | MEDIUM | Local-only but unprotected |

---

## Bucket 2: High-Priority Technical Debt

| ID | Project | Issue | Impact |
|----|---------|-------|--------|
| DEBT-01 | 6 libraries | No git repos (PromptGuard, SecretSauce, FlushQueue, url-guard, CoinLedger, mypoly) | No version history, no collaboration |
| DEBT-02 | 22 projects | Zero test coverage | Regression risk on every change |
| DEBT-03 | KeyDrop | Stripe naming throughout (columns, routes) despite using LemonSqueezy | Confusion, maintenance burden |
| DEBT-04 | KeyDrop + PostPilot | Near-identical `payments.ts` files (LemonSqueezy) | Code duplication |
| DEBT-05 | PostPilot | Prisma 6.x while KeyDrop uses 7.x | Version inconsistency |
| DEBT-06 | PostPilot | Dev deps (`@types/node`, `tailwindcss`, `typescript`) in `dependencies` | Build bloat |
| DEBT-07 | PostPilot | Media stored as base64 in SQLite | DB bloat, won't scale |
| DEBT-08 | ExplainIt | Rate limiting removed | Security regression |
| DEBT-09 | ExplainIt + PostPilot + preprompt | `file:` dependencies to local libraries | Breaks portability |
| DEBT-10 | shared-utils | Barrel `index.ts` only exports 3 of 9 modules | Inconsistent API |
| DEBT-11 | shared-utils | Empty `db/` and `ui/` directories | Dead placeholders |
| DEBT-12 | TokenWise | PRICING table duplicated in estimator.ts and badge.ts | Maintenance risk |
| DEBT-13 | KeyDrop | Middleware JWT verification doesn't check signature | Auth gap |
| DEBT-14 | PromptGuard | False-positive patterns ("act as", "disregard") | Blocks legitimate text |
| DEBT-15 | PromptGuard | Phone regex `\b\d{10,15}\b` too broad | Matches non-phones |

---

## Bucket 3: Build / Runtime Failures

| ID | Project | Issue |
|----|---------|-------|
| BUILD-01 | ProjectLearner | Referenced `build.js` and `test.js` don't exist |
| BUILD-02 | chicle | Babel Standalone in production (transpiles on every load) |
| BUILD-03 | ftable-hands | No `requirements.txt` or `pyproject.toml` |
| BUILD-04 | Heroes-Hadera | No build step — all JS loaded individually via script tags |
| BUILD-05 | ftable | No build step (acceptable for vanilla JS but no minification) |
| BUILD-06 | Wingman | API TypeScript source may not be committed (only dist/) |

---

## Bucket 4: Product Weaknesses

| ID | Project | Issue |
|----|---------|-------|
| PROD-01 | 9soccer | Leaderboard is hardcoded/simulated (fake data) |
| PROD-02 | 9soccer | Only 1 challenge defined — no content pipeline |
| PROD-03 | 9soccer | Game state in localStorage only, server API unused |
| PROD-04 | VenueKit | Only tested with 1 config (Heroes-Hadera) |
| PROD-05 | VenueKit | Config schema exists but generator doesn't validate against it |
| PROD-06 | PostPilot | `scheduledFor` field exists in schema but not implemented |
| PROD-07 | KeyDrop | Brand naming chaos (KeyDrop vs 1-2clicks vs 1-2Clicks) |
| PROD-08 | MegaPromptGPT | Only 1 output ever generated — effectively abandoned |
| PROD-09 | ProjectLearner | Complete but never deployed or published |

---

## Bucket 5: UX / Flow Weaknesses

| ID | Project | Issue |
|----|---------|-------|
| UX-01 | preprompt-web | Entire app is one 90KB React component |
| UX-02 | 9soccer | Game.tsx is 955-line monolith (home + watch + play + results + leaderboard) |
| UX-03 | chicle | 260KB single-file SPA, unmaintainable |
| UX-04 | ExplainIt | page.tsx is 725 lines |
| UX-05 | letsmakebillions | web/app.py is 2,131+ lines |
| UX-06 | cryptowhale | runner.py and web/app.py oversized |
| UX-07 | ftable-hands | STAGE2_v10.py is ~3,100 lines |

---

## Bucket 6: Extraction Candidates

| ID | Source | Asset | Extraction Form | Target Users |
|----|--------|-------|-----------------|-------------|
| EXT-01 | KeyDrop + PostPilot | LemonSqueezy payments.ts | shared-utils module | ExplainIt, VenueKit, any SaaS |
| EXT-02 | chicle | Gamification engine (coins, streaks, games, affiliate) | Standalone package | ftable, 9soccer, Heroes, Wingman |
| EXT-03 | cryptowhale | CircuitBreaker class | shared-utils module | Any API-calling project |
| EXT-04 | cryptowhale + LMB | RiskManager + error_tracker | Trading toolkit package | crypto-arb-bot |
| EXT-05 | ftable-hands | live_scorer.html | Standalone PWA | Any live event organizer |
| EXT-06 | ExplainIt | scrypt + jose auth module | shared-utils module | All Next.js projects |
| EXT-07 | PostPilot | Style DNA engine | Standalone tool | Brand analysis product |
| EXT-08 | PostPilot | edge-rate-limit.ts | shared-utils module | All Edge-deployed apps |
| EXT-09 | Heroes-Hadera | Hebrew date/time utils | npm package | All Hebrew projects |
| EXT-10 | ftable | deploy.sh (FTP with git diff) | Shared script | Heroes, chicle, VenueKit |
| EXT-11 | ftable | PL engine (8 modules) | Part of ProjectLearner | All web projects |
| EXT-12 | letsmakebillions | MonteCarloSimulator | Trading toolkit | cryptowhale, crypto-arb-bot |
| EXT-13 | clubgg | Multi-format Excel parser | Python package | Any data ingestion project |
| EXT-14 | 9soccer | celebrations.ts (confetti + haptics) | npm micro-library | Any gamified app |

---

## Bucket 7: Missing Shared Utilities

| ID | Utility | Purpose | Priority |
|----|---------|---------|----------|
| MISS-01 | @royea/payments | Unified LemonSqueezy billing | HIGH |
| MISS-02 | Secret scanner script | Scan repos for committed secrets | CRITICAL |
| MISS-03 | Dependency health checker | npm audit across all projects | HIGH |
| MISS-04 | Test scaffolding CLI | Generate test stubs from existing code | HIGH |
| MISS-05 | Shared Supabase config pattern | Centralized key management | MEDIUM |
| MISS-06 | Project bootstrapper | New project template with shared-utils | MEDIUM |
| MISS-07 | Universal .gitignore template | Covers all project types in portfolio | HIGH |
| MISS-08 | Pre-commit hook (secret detection) | Block commits with secrets | HIGH |

---

## Bucket 8: Monetization Opportunities

| ID | Project | Opportunity | Revenue Model | Time to Value |
|----|---------|------------|---------------|---------------|
| MON-01 | SecretSauce | Paid CLI tool for developers | $29 one-time or $9/mo | 1 week |
| MON-02 | VenueKit | White-label venue sites | ₪2,500-5,900 per venue | 2 weeks |
| MON-03 | ProjectLearner | Free-tier SaaS analytics | Freemium ($19/mo pro) | 1 month |
| MON-04 | KeyDrop | Agency white-label | $49/mo per agency | 2 weeks |
| MON-05 | PostPilot | Scheduled posting upgrade | Increases plan value | 3 days |
| MON-06 | ExplainIt | Chrome extension | Viral acquisition → paid plans | 1 week |
| MON-07 | TokenWise | VS Code extension + team features | Freemium | 1 week |
| MON-08 | ftable-hands | live_scorer PWA | Free tool → brand/lead gen | 2 days |
| MON-09 | Wingman | AI wingman intros (premium feature) | In-app purchase | 3 days |

---

## Bucket 9: Creative Feature Opportunities

| ID | Project | Feature | Impact | Effort |
|----|---------|---------|--------|--------|
| FEAT-01 | PostPilot | Scheduled posting + content calendar | Table-stakes for SaaS | LOW |
| FEAT-02 | PostPilot | Style DNA import (analyze competitor Instagram) | Differentiator | MEDIUM |
| FEAT-03 | 9soccer | Auto-generate challenges from live match APIs | Solves content problem | MEDIUM |
| FEAT-04 | 9soccer | Multiplayer head-to-head | Viral loop | HIGH |
| FEAT-05 | Wingman | AI-generated wingman intros | Core value prop | LOW |
| FEAT-06 | ExplainIt | AI narration (TTS) for videos | Premium feel | MEDIUM |
| FEAT-07 | TokenWise | Budget alerts + model recommendations | Power-user feature | LOW |
| FEAT-08 | VenueKit | Web-based config builder UI | Removes JSON editing | MEDIUM |
| FEAT-09 | ProjectLearner | A/B testing + heatmaps | Compete with analytics tools | HIGH |
| FEAT-10 | ftable | Real-time tournament via Supabase Realtime | Engagement boost | LOW |

---

## Bucket 10: Projects to Archive / Merge / Pause

| ID | Project | Recommendation | Reason |
|----|---------|---------------|--------|
| ARCH-01 | mypoly | **MERGE** into crypto-arb-bot | 3-file prototype, Clawbot already scans Polymarket |
| ARCH-02 | MegaPromptGPT | **ARCHIVE** or merge into preprompt-web | Abandoned, only 1 output ever generated |
| ARCH-03 | url-guard | **MERGE** into shared-utils | 13 lines of re-exports, no standalone value |
| ARCH-04 | CURSOR_MEGA_PROMPT.md | **DELETE** or move to private notes | Contains webhook secrets, shouldn't be in projects folder |
| ARCH-05 | preprompt-web | **FREEZE** | Functional but messy, low strategic value unless rebuilt |

---

# 2. MASTER PRIORITY MATRIX

## P0 — DO IMMEDIATELY (blocks everything else)

| Item | Category | Impact | Effort | Risk if Delayed |
|------|----------|--------|--------|-----------------|
| Rotate chicle Anthropic API key | Security | CRITICAL | 5 min | Active key exposure, billing risk |
| Audit Wingman git for committed secrets | Security | CRITICAL | 15 min | Full credential set may be exposed |
| Remove ftable-hands OAuth secrets from git history | Security | CRITICAL | 30 min | Google OAuth compromise |
| Remove 9soccer signing creds from repo | Security | HIGH | 10 min | Apple signing compromise |
| Move chicle credentials to .env | Security | CRITICAL | 15 min | One misconfiguration = full leak |
| Init git repos for 6 libraries | Infrastructure | HIGH | 20 min | No version history = lost work risk |

## P1 — NEXT CRITICAL WAVE (this week)

| Item | Category | Impact | Effort |
|------|----------|--------|--------|
| Create universal .gitignore template | Security hardening | HIGH | 15 min |
| Delete dead weight (zips, postpilot.db, Heroes.zip, debug files) | Cleanup | MEDIUM | 15 min |
| Fix shared-utils barrel exports | Infrastructure | HIGH | 10 min |
| Fix TokenWise PRICING duplication | Code quality | MEDIUM | 15 min |
| Fix ProjectLearner `undefined` header bug | Bug fix | LOW | 5 min |
| Centralize Supabase keys (ftable, Heroes, chicle) | Security hygiene | MEDIUM | 30 min |
| Tighten ProjectLearner Supabase RLS | Security | MEDIUM | 20 min |
| Add .env.example to projects missing it | DX | MEDIUM | 30 min |

## P2 — IMPORTANT BUT NOT URGENT (this month)

| Item | Category | Impact | Effort |
|------|----------|--------|--------|
| Extract LemonSqueezy payments to shared-utils | Extraction | HIGH | 4h |
| Publish SecretSauce to npm (+ tests) | Monetization | HIGH | 8h |
| Publish FlushQueue to npm (+ tests + backoff) | Infrastructure | HIGH | 4h |
| Publish CoinLedger to npm (+ tests) | Infrastructure | MEDIUM | 4h |
| Publish ProjectLearner (+ build system) | Monetization | HIGH | 8h |
| Add tests to shared-utils (crypto, auth) | Quality | HIGH | 8h |
| Fix KeyDrop Stripe → LemonSqueezy naming | Debt cleanup | MEDIUM | 2h |
| Move PostPilot dev deps to devDependencies | Build quality | LOW | 15 min |
| Merge url-guard into shared-utils | Cleanup | LOW | 15 min |
| Merge mypoly into crypto-arb-bot | Cleanup | LOW | 4h |
| Re-add rate limiting to ExplainIt | Security | MEDIUM | 1h |
| Add JWT signature verification in KeyDrop middleware | Security | MEDIUM | 1h |

## P3 — NICE TO HAVE / LATER

| Item | Category | Impact | Effort |
|------|----------|--------|--------|
| Split monolith components (Game.tsx, page.jsx, etc.) | Code quality | MEDIUM | 2 days |
| Add build step to Heroes-Hadera + ftable | Performance | MEDIUM | 1 day |
| Replace PostPilot base64 media with R2/S3 | Scalability | HIGH | 1 day |
| PostPilot scheduled posting | Product | HIGH | 2 days |
| VenueKit config builder web UI | Revenue | HIGH | 3 days |
| 9soccer content pipeline | Product | HIGH | 3 days |
| Archive MegaPromptGPT | Cleanup | LOW | 10 min |
| TokenWise VS Code extension | Monetization | MEDIUM | 3 days |
| ExplainIt Chrome extension | Monetization | HIGH | 5 days |

---

# 3. SECURITY REMEDIATION PLAN

## SEC-01: chicle — Anthropic API Key Hardcoded
- **Project:** chicle
- **Exact Issue:** `sk-ant-api03-wRwmKDvZWLMaWVCI_-...` in `config.php` line 13
- **Severity:** CRITICAL
- **Exposure:** API key in source code, accessible if Apache misconfigured
- **Immediate Containment:** Rotate the key at console.anthropic.com NOW
- **Permanent Fix:** Move to `.env` file outside web root, load via `getenv()`
- **Git History Rewrite:** YES — key is in commit history
- **Key Rotation:** YES — immediately
- **.gitignore Hardening:** YES — add `.env`, `*.env`
- **Env/Config Refactor:** YES — create `.env` with `ANTHROPIC_API_KEY`, `ADMIN_PASS`, `AUTH_SECRET`

## SEC-02: chicle — Admin Password Hardcoded
- **Project:** chicle
- **Exact Issue:** `chicle2026` in `config.php` line 12
- **Severity:** CRITICAL
- **Immediate Containment:** Change the admin password
- **Permanent Fix:** Move to `.env`, use `password_hash()` for storage
- **Key Rotation:** YES — change password immediately

## SEC-03: chicle — AUTH_SECRET Hardcoded
- **Project:** chicle
- **Exact Issue:** `chicle-auth-k8x2m9p4` as HMAC secret
- **Severity:** HIGH
- **Permanent Fix:** Generate a proper 256-bit secret, store in `.env`

## SEC-04/05: ftable-hands — Google OAuth Secrets in Git
- **Project:** ftable-hands
- **Exact Issue:** `client_secret.json`, `drive_client_secret.json` with `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`
- **Severity:** CRITICAL
- **Immediate Containment:** Revoke client secret in Google Cloud Console
- **Permanent Fix:** Add to `.gitignore`, store outside repo
- **Git History Rewrite:** YES — use `git filter-repo` or BFG Repo Cleaner
- **Key Rotation:** YES — create new OAuth client credentials

## SEC-06: ftable-hands — Token Pickles in Git
- **Project:** ftable-hands
- **Exact Issue:** `youtube_token.pickle`, `drive_token.pickle` committed
- **Severity:** HIGH
- **Permanent Fix:** Add `*.pickle` to `.gitignore`, remove from tracking
- **Git History Rewrite:** YES (same operation as SEC-04/05)

## SEC-07/08/09: Wingman — Possible Secrets in Git
- **Project:** Wingman
- **Exact Issue:** `.env` (2.7KB), `.p8` Apple key, env dump file in repo
- **Severity:** CRITICAL (pending audit confirmation)
- **Immediate Action:** Run `git log --all --diff-filter=A -- "*.env" "*.p8"` to confirm
- **If Confirmed:** Rotate ALL keys (Firebase, Supabase, Twilio, AWS, Redis, Sentry, Mixpanel)
- **Git History Rewrite:** YES if confirmed
- **Key Rotation:** YES — all service credentials

## SEC-10: 9soccer — Apple Signing Creds in Repo
- **Project:** 9soccer
- **Exact Issue:** `AuthKey_WTWALQMG5N.p8`, `distribution.cer`, `.mobileprovision`
- **Severity:** HIGH
- **Permanent Fix:** Move to CI secrets (EAS/GitHub Actions), remove from repo
- **Git History Rewrite:** RECOMMENDED
- **.gitignore:** Add `*.p8`, `*.cer`, `*.mobileprovision`

## SEC-11: CURSOR_MEGA_PROMPT.md — Webhook Secrets
- **Project:** Standalone file
- **Exact Issue:** LemonSqueezy webhook secrets visible in plain text
- **Severity:** MEDIUM
- **Action:** Move to private notes or delete from C:\Projects. Not a git repo risk but a local exposure risk.

## SEC-12/13: letsmakebillions — Local Key + No Auth Fallback
- **Project:** letsmakebillions
- **Exact Issue:** `private_key.pem` in project root, empty admin key default
- **Severity:** MEDIUM
- **Action:** Move PEM out of project dir. Make admin auth mandatory when `RAILWAY_ENVIRONMENT` is set.

---

## Security Action Timeline

### DO TODAY

1. **Rotate chicle Anthropic API key** at console.anthropic.com
2. **Change chicle admin password** to something strong
3. **Run `git log` audit on Wingman** for committed .env/.p8 files
4. **Revoke Google OAuth client secret** for ftable-hands in Google Cloud Console
5. **Move chicle credentials** from `config.php` to `.env` outside web root
6. **Remove 9soccer signing creds** from git tracking

### THIS WEEK

7. **Run BFG/git-filter-repo** on ftable-hands to purge secrets from history
8. **If Wingman secrets confirmed:** rotate ALL service credentials, rewrite history
9. **Create .gitignore** for ftable-hands (*.pickle, client_secret*, *.json data)
10. **Move CURSOR_MEGA_PROMPT.md** to private notes location
11. **Fix letsmakebillions** admin auth to be mandatory in production

### HARDENING RULES — APPLY ACROSS ALL PROJECTS

**Universal .gitignore additions (every project):**
```gitignore
# Secrets & credentials
.env
.env.*
!.env.example
*.pem
*.p8
*.p12
*.key
*.cer
*.mobileprovision
client_secret*.json
*_token.pickle
credentials.json

# Database files
*.db
*.sqlite
*.sqlite3

# OS / IDE
.DS_Store
Thumbs.db
*.swp
.vscode/settings.json

# Build artifacts
__pycache__/
*.pyc
dist/
node_modules/
.next/

# Archives (should not be in repos)
*.zip
*.tar.gz
*.rar
```

**Universal Secrets Policy:**
1. **NEVER** commit API keys, passwords, signing keys, or tokens
2. **ALWAYS** use `.env` files loaded at runtime (not imported into source)
3. **ALWAYS** provide `.env.example` with placeholder values
4. **NEVER** place `.env` files in web-accessible directories
5. **USE** `git secrets` or a pre-commit hook to scan for high-entropy strings
6. For client-side keys (Supabase anon, Firebase config): centralize in ONE config file, import everywhere else
7. For signing credentials: store ONLY in CI/CD secrets (GitHub Actions, EAS)
8. For webhook secrets: store in `.env`, verify signatures server-side

---

# 4. PORTFOLIO TRIAGE

## 1. PROTECT + KEEP INVESTING

| Project | Rationale |
|---------|-----------|
| **Wingman** | Most ambitious project, highest code quality (8/10), active TestFlight, real product-market potential. Needs security audit then full steam. |
| **PostPilot** | Deployed SaaS with billing, AI integration, growing feature set. Fix media storage, add scheduled posting → ready for users. |
| **KeyDrop** | Deployed with encryption + billing. Fix naming, add JWT verification → launch on Product Hunt. |
| **ExplainIt** | Production SaaS with auth + billing + tests. Re-add rate limiting, fix deps → market it. |
| **ftable** | Production app serving real users. Clean up zips, centralize keys → maintain. |

## 2. FIX + SHIP

| Project | Rationale |
|---------|-----------|
| **9soccer** | Active TestFlight but core product incomplete (fake leaderboard, 1 challenge). Wire real backend + content pipeline → ship. |
| **VenueKit** | High revenue potential (₪2,500+/venue) but untested with second venue. Add validation + second config → sell to poker clubs. |

## 3. EXTRACT UTILITIES FROM IT

| Project | What to Extract |
|---------|----------------|
| **chicle** | Gamification engine (coins, streaks, games, affiliate), 4-language translation system |
| **Heroes-Hadera** | Hebrew date utils, Supabase OAuth pattern, badge system, content filter |
| **cryptowhale** | CircuitBreaker, RiskManager, LearningEngine, MonteCarloSimulator |
| **letsmakebillions** | RiskManager, MonteCarloSimulator, error tracker, storage abstraction |
| **ftable-hands** | live_scorer.html, OCR name learning, YouTube/Drive managers |
| **clubgg** | Multi-format Excel parser |

## 4. MERGE INTO ANOTHER PROJECT

| Project | Merge Into | Rationale |
|---------|-----------|-----------|
| **mypoly** | crypto-arb-bot | 3-file Polymarket client → becomes Clawbot executor module |
| **url-guard** | shared-utils | 13 lines of re-exports, no standalone value |
| **MegaPromptGPT** | preprompt-web (or archive) | Abandoned, only 1 output generated, preprompt-web does same thing better |

## 5. FREEZE FOR LATER

| Project | Rationale |
|---------|-----------|
| **preprompt-web** | Functional but 90KB monolith. Low strategic value unless rebuilt. Keep deployed, don't invest. |
| **clubgg** | Internal tool, works fine. No active need to improve. |
| **crypto-arb-bot** | Paper-only scanner, working. Low priority vs revenue projects. |

## 6. ARCHIVE

| Project | Rationale |
|---------|-----------|
| **MegaPromptGPT** | 1 output ever generated. preprompt-web supersedes it. Archive to `C:\Projects\_archived\`. |
| **CURSOR_MEGA_PROMPT.md** | One-time prompt file with leaked secrets. Move to private notes, delete from Projects. |

## 7. MONETIZE ASAP

| Project | Path to Revenue | Time |
|---------|----------------|------|
| **SecretSauce** | Publish to npm, market as CLI tool ($29 one-time) | 1 week |
| **VenueKit** | Sell to 3 poker clubs as pilot | 2 weeks |
| **KeyDrop** | Product Hunt launch, agency outreach | 1 week |
| **PostPilot** | Add scheduled posting, push to agencies | 1 week |

## 8. PUBLISH AS INFRASTRUCTURE

| Project | Action |
|---------|--------|
| **shared-utils** | Fix barrel, add tests, publish to npm |
| **FlushQueue** | Add tests + backoff, publish to npm |
| **CoinLedger** | Add tests + tx history, publish to npm |
| **ProjectLearner** | Add build system, publish to npm |
| **TokenWise** | Already published — fix PRICING duplication |
| **PromptGuard** | Init git, fix false positives, consider merging into shared-utils |
| **SecretSauce** | Init git, add tests, publish to npm |

---

# 5. SHARED UTILITY EXTRACTION STRATEGY

## Priority-Ordered Extractions

### Extraction 1: LemonSqueezy Payments → shared-utils/payments
- **Source:** KeyDrop `src/lib/payments.ts` + PostPilot `src/lib/payments.ts`
- **What:** Checkout URL creation, webhook signature verification, subscription management, plan display helpers
- **Why:** Near-identical code in 2 projects, 2 more could use it (ExplainIt, VenueKit)
- **Reusability:** HIGH — any LemonSqueezy SaaS project
- **Form:** `@royea/shared-utils/payments` module
- **Difficulty:** LOW — extract common interface, parameterize plan configs
- **Priority:** #1

### Extraction 2: Edge Rate Limiter → shared-utils/rate-limit (upgrade)
- **Source:** PostPilot `src/lib/edge-rate-limit.ts`
- **What:** Edge-runtime-compatible rate limiter with per-route rules
- **Why:** Current shared-utils rate-limit is memory-only; PostPilot's version is Edge-compatible
- **Form:** Upgrade existing `@royea/shared-utils/rate-limit`
- **Difficulty:** LOW
- **Priority:** #2

### Extraction 3: CircuitBreaker → shared-utils/resilience
- **Source:** cryptowhale `core/` (CircuitBreaker class)
- **What:** Generic circuit breaker pattern for API resilience
- **Why:** Any project calling external APIs benefits from this
- **Form:** New `@royea/shared-utils/resilience` module
- **Difficulty:** LOW — class is already generic
- **Priority:** #3

### Extraction 4: Gamification Engine → @royea/gamification
- **Source:** chicle `index.html` (embedded in SPA)
- **What:** Coins, streaks, daily check-in, mini-games, affiliate tracking
- **Why:** Reusable loyalty/engagement system for ftable, 9soccer, Heroes, Wingman
- **Form:** Standalone npm package
- **Difficulty:** MEDIUM — currently embedded in 260KB single file, needs extraction + modularization
- **Priority:** #4

### Extraction 5: live_scorer.html → Standalone PWA
- **Source:** ftable-hands
- **What:** Offline-capable mobile scoring app for live events
- **Why:** Already standalone, zero dependencies. Could be published as-is.
- **Form:** PWA (hosted on ftable.co.il or separate domain)
- **Difficulty:** LOW — already complete and standalone
- **Priority:** #5

### Extraction 6: Hebrew Date Utils → @royea/hebrew-date
- **Source:** Heroes-Hadera `js/utils.js`
- **What:** Hebrew date formatting, countdowns, currency formatting
- **Why:** Used in Heroes, ftable, chicle, 9soccer — any Hebrew project
- **Form:** npm micro-package
- **Difficulty:** LOW
- **Priority:** #6

### Extraction 7: Style DNA Engine → @royea/style-dna
- **Source:** PostPilot `src/lib/style-engine.ts`
- **What:** Brand voice analysis from content history
- **Why:** Unique differentiator, could be a standalone product
- **Form:** npm package + potential SaaS
- **Difficulty:** LOW — already modular
- **Priority:** #7

## Recommended Shared Architecture

```
C:\Projects\
├── shared-utils/              # Foundation (already exists)
│   ├── src/auth/              # JWT auth + bcrypt
│   ├── src/crypto/            # AES-256-GCM
│   ├── src/rate-limit/        # Rate limiting (upgrade with Edge version)
│   ├── src/payments/          # NEW: LemonSqueezy billing
│   ├── src/resilience/        # NEW: CircuitBreaker
│   ├── src/analytics/         # Event tracking
│   ├── src/content-filter/    # PII + profanity
│   ├── src/errors/            # Error handling
│   ├── src/i18n/              # Hebrew/English
│   ├── src/validate-url/      # SSRF protection
│   ├── src/auth-context.tsx   # React auth context
│   └── src/auth-guard.ts      # Next.js middleware
├── FlushQueue/                # Event buffer (publish @royea/flush-queue)
├── CoinLedger/                # Virtual currency (publish @royea/coin-ledger)
├── TokenWise/                 # AI cost tracking (already @royea/tokenwise)
├── SecretSauce/               # Code scanner (publish @royea/secret-sauce)
├── ProjectLearner/            # Analytics SDK (publish @royea/project-learner)
└── PromptGuard/               # LLM sanitizer (merge into shared-utils or publish)
```

**DELETE as separate projects:**
- `url-guard/` → merged into shared-utils
- `mypoly/` → merged into crypto-arb-bot
- `MegaPromptGPT/` → archived

---

# 6. NEW UTILITIES TO BUILD

Ranked by value-to-effort ratio:

### Rank 1: Secret Scanner Script
- **Name:** `scan-secrets.sh` (or extend SecretSauce)
- **Purpose:** Scan all repos for committed secrets (high-entropy strings, key patterns, .env files)
- **Users:** ALL 26 projects
- **Value:** CRITICAL — prevents future exposures
- **Complexity:** LOW — regex + entropy check
- **Stack:** Bash script or TypeScript CLI (could be a SecretSauce mode)
- **MVP:** Scan for patterns: `sk-ant-`, `GOCSPX-`, `eyJ` (JWT), `-----BEGIN`, `API_KEY=`, high-entropy strings >30 chars
- **Where:** `C:\Projects\shared-utils\scripts\scan-secrets.sh` or `SecretSauce --mode=secrets`

### Rank 2: Universal .gitignore Generator
- **Name:** `generate-gitignore.sh`
- **Purpose:** Generate comprehensive .gitignore covering all portfolio project types
- **Users:** ALL projects, especially the 6 without proper .gitignore
- **Value:** HIGH — prevents future secret commits
- **Complexity:** VERY LOW — template file
- **MVP:** One master template covering Node, Python, Electron, React Native, PHP
- **Where:** `C:\Projects\shared-utils\templates\.gitignore.universal`

### Rank 3: @royea/payments (LemonSqueezy Module)
- **Name:** `@royea/payments` or `shared-utils/payments`
- **Purpose:** Unified billing module: checkout, webhooks, subscription status, plan display
- **Users:** KeyDrop, PostPilot, ExplainIt, VenueKit (4 projects)
- **Value:** HIGH — eliminates duplication, accelerates new SaaS launches
- **Complexity:** LOW — extract and parameterize existing code
- **Stack:** TypeScript, zero deps
- **MVP:** `createCheckout()`, `verifyWebhook()`, `getSubscriptionStatus()`, `getPlanDisplay()`
- **Where:** `C:\Projects\shared-utils\src\payments\`

### Rank 4: Dependency Health Checker
- **Name:** `check-deps.sh`
- **Purpose:** Run `npm audit` + `npm outdated` across all Node.js projects, report unified results
- **Users:** ALL 15+ Node.js projects
- **Value:** HIGH — catches vulnerable dependencies
- **Complexity:** LOW — bash loop + output formatting
- **MVP:** Scan all `package.json` files, run `npm audit --json`, aggregate results
- **Where:** `C:\Projects\shared-utils\scripts\check-deps.sh`

### Rank 5: Test Scaffolding Utility
- **Name:** `scaffold-tests`
- **Purpose:** Generate test file stubs from existing source files
- **Users:** 22 untested projects
- **Value:** HIGH — lowers barrier to adding tests
- **Complexity:** MEDIUM — parse exports, generate describe/it blocks
- **Stack:** TypeScript CLI
- **MVP:** Input a source file, output a test file with describe blocks for each export
- **Where:** Could be a SecretSauce companion tool or standalone

### Rank 6: Pre-commit Secret Hook
- **Name:** `.pre-commit-hook`
- **Purpose:** Block commits containing secrets (API keys, passwords, PEMs)
- **Users:** ALL projects
- **Value:** HIGH — prevents future SEC-01 through SEC-10 type issues
- **Complexity:** LOW — regex scan of staged diff
- **MVP:** Check staged changes for patterns: `sk-ant-`, `GOCSPX-`, `BEGIN PRIVATE KEY`, high-entropy >40 chars
- **Where:** `C:\Projects\shared-utils\hooks\pre-commit`

---

# 7. CREATIVE / STRATEGIC UPSIDE

## Strongest Monetization Plays

### 1. SecretSauce → Developer Tool Product
**What:** Publish as `npx secret-sauce scan ./src` CLI. Add JSON output, CI integration, --ignore flag.
**Revenue:** $29 one-time or $9/mo for teams. Or free tier (3 scans) + paid.
**Why now:** Best code quality in portfolio (8/10), zero deps, CLI-ready. Literally just needs git init + tests + npm publish.
**Grounding:** Audit confirmed clean pipeline architecture, 30+ patterns, false-positive filtering already built.

### 2. VenueKit → White-Label SaaS
**What:** Sell white-label poker venue websites to clubs. Pricing already defined (₪2,500-5,900).
**Revenue:** ₪7,500-17,700 from first 3 pilot clients.
**Why now:** Generator works, Heroes-Hadera is the living template. Need: second test config, config validation, config builder UI.
**Grounding:** Audit confirmed working generator, 27 templates, 15 feature toggles, credential helper integrated with KeyDrop.

### 3. ProjectLearner → SaaS Analytics
**What:** Compete with Plausible/Simple Analytics. Zero-dep tracker, consent-aware, learning engine generates insights automatically.
**Revenue:** Free tier → $19/mo pro.
**Why now:** Complete product sitting unused. Need: build system, npm publish, hosted dashboard.
**Grounding:** Audit confirmed 5 clean modules, dual persistence, 6 insight types, complete Supabase schema.

### 4. KeyDrop → Agency Tool
**What:** Launch on Product Hunt. White-label for agencies. Browser extension for one-click credential requests.
**Revenue:** PRO $19/mo, TEAM $49/mo already defined.
**Why now:** Deployed, encrypted, has billing. Just fix naming + JWT.
**Grounding:** Audit confirmed strong encryption (AES-256-GCM), timing-safe webhooks, audit logs.

### 5. TokenWise → AI Cost Intelligence
**What:** VS Code extension showing cost in status bar. Team cost aggregation. Budget alerts.
**Revenue:** Freemium for individuals, $29/mo for teams.
**Why now:** Already published on npm, growing AI market.
**Grounding:** Audit confirmed 34 models, 8 providers, clean exports, zero dead code.

## Cross-Project Synergy Plays

### Play A: Unified Trading Platform
**Combine:** cryptowhale + letsmakebillions + crypto-arb-bot
**Result:** Multi-strategy trading platform with whale tracking, grid trading, arbitrage scanning, Monte Carlo risk analysis, adaptive learning
**Value:** More robust than any individual bot, shared infrastructure

### Play B: Loyalty/Gamification Platform
**Combine:** CoinLedger + chicle gamification engine
**Result:** Drop-in loyalty system: virtual coins, streaks, achievements, mini-games, affiliate tracking
**Target:** ftable, 9soccer, Heroes, Wingman, any future app with engagement mechanics

### Play C: Hebrew-First SaaS Toolkit
**Combine:** shared-utils/i18n + Heroes-Hadera Hebrew utils + chicle 4-language system
**Result:** Comprehensive Hebrew/RTL toolkit for Israeli developers
**Target:** Niche npm package for Israeli dev community

## Mini-Products Worth Spinning Out

1. **live_scorer.html → "LiveScore" PWA** — Standalone tournament scoring app. Zero deps, offline-capable. Market to poker clubs, sports leagues, gaming events.
2. **Style DNA Engine → "BrandVoice Analyzer"** — Upload 10 Instagram posts, get your brand voice profile. Standalone tool or PostPilot lead gen.
3. **celebrations.ts → "@royea/confetti"** — Drop-in celebration effects (confetti, haptics, sounds). npm micro-package for gamified apps.

---

# 8. CONTROLLED PATCH QUEUE

## Category 1: Security Cleanup

| # | Project | Issue | Patch Type | Risk | Auto-Safe? |
|---|---------|-------|-----------|------|------------|
| S1 | chicle | Hardcoded API key in config.php | Config refactor | MANUAL — needs key rotation first | **MANUAL / HIGH RISK** |
| S2 | ftable-hands | OAuth secrets in git | .gitignore + git filter-repo | MANUAL — needs credential revocation first | **MANUAL / HIGH RISK** |
| S3 | Wingman | Possible .env/.p8 in git | Audit first, then remediate | MANUAL — scope unknown | **REVIEW BEFORE PATCH** |
| S4 | 9soccer | Signing creds in repo | .gitignore + rm from tracking | MEDIUM — doesn't affect running app | **REVIEW BEFORE PATCH** |

## Category 2: .gitignore Hardening

| # | Project | Issue | Risk | Auto-Safe? |
|---|---------|-------|------|------------|
| G1 | ftable-hands | No .gitignore | None | **SAFE AUTO PATCH** |
| G2 | clubgg | Missing .gitignore entries | None | **SAFE AUTO PATCH** |
| G3 | ALL projects | Ensure universal .gitignore coverage | None | **SAFE AUTO PATCH** |

## Category 3: Config Cleanup

| # | Project | Issue | Risk | Auto-Safe? |
|---|---------|-------|------|------------|
| C1 | KeyDrop | postpilot.db leftover in root | None | **SAFE AUTO PATCH** |
| C2 | shared-utils | Empty db/ and ui/ directories | None | **SAFE AUTO PATCH** |
| C3 | shared-utils | Barrel exports only 3 of 9 modules | Low | **SAFE AUTO PATCH** |
| C4 | PostPilot | Dev deps in `dependencies` | Low | **SAFE AUTO PATCH** |
| C5 | TokenWise | PRICING table duplicated | Low | **REVIEW BEFORE PATCH** |

## Category 4: Dead Code Removal

| # | Project | Issue | Risk | Auto-Safe? |
|---|---------|-------|------|------------|
| D1 | ftable | 15 .zip archive files in repo root | None | **SAFE AUTO PATCH** |
| D2 | Heroes-Hadera | Heroes.zip in repo | None | **SAFE AUTO PATCH** |
| D3 | clubgg | Investigation scripts (5+ files) | None | **SAFE AUTO PATCH** |
| D4 | letsmakebillions | debug*.json, backup*.json, OLD/, MEGA PROMPT.txt | None — gitignored already? Check first | **REVIEW BEFORE PATCH** |

## Category 5: Bug Fixes

| # | Project | Issue | Risk | Auto-Safe? |
|---|---------|-------|------|------------|
| B1 | ProjectLearner | `'Prefer': undefined` sends literal "undefined" as header | None | **SAFE AUTO PATCH** |
| B2 | crypto-arb-bot | `or True` hack in __main__ | None — just removes forced paper mode | **REVIEW BEFORE PATCH** |

## Category 6: Git Initialization

| # | Project | Risk | Auto-Safe? |
|---|---------|------|------------|
| GI1 | PromptGuard | None | **SAFE AUTO PATCH** |
| GI2 | SecretSauce | None | **SAFE AUTO PATCH** |
| GI3 | FlushQueue | None | **SAFE AUTO PATCH** |
| GI4 | CoinLedger | None | **SAFE AUTO PATCH** |
| GI5 | url-guard | None (will be merged later) | **SAFE AUTO PATCH** |

---

# 9. EXECUTION WAVES

## Wave 1 — EMERGENCY PROTECTION (Day 1)
**Objective:** Eliminate all critical secret exposures and establish baseline security

**Projects:** chicle, ftable-hands, Wingman, 9soccer

**Tasks:**
1. Rotate chicle Anthropic API key (console.anthropic.com)
2. Change chicle admin password
3. Create chicle `.env` file with credentials, refactor `config.php` to use `getenv()`
4. Audit Wingman git history: `git log --all --diff-filter=A -- "*.env" "*.p8"`
5. If Wingman secrets confirmed: document ALL affected services, rotate credentials
6. Revoke ftable-hands Google OAuth client secret (Google Cloud Console)
7. Add .gitignore to ftable-hands
8. Remove 9soccer signing creds from git tracking, add to .gitignore
9. Init git repos for PromptGuard, SecretSauce, FlushQueue, CoinLedger
10. Move CURSOR_MEGA_PROMPT.md to private notes

**Expected Result:** Zero exposed secrets across portfolio
**Risks:** Key rotation may temporarily break chicle's AI features and ftable-hands' YouTube/Drive integration
**Success Metric:** `scan-secrets` script returns clean across all repos

---

## Wave 2 — HIGH-VALUE STABILIZATION (Days 2-3)
**Objective:** Clean up dead weight, fix infrastructure, standardize foundations

**Projects:** ftable, Heroes, shared-utils, TokenWise, ProjectLearner, clubgg, KeyDrop, PostPilot

**Tasks:**
1. Delete ftable zip files (15 files)
2. Delete Heroes.zip, KeyDrop postpilot.db
3. Delete clubgg investigation scripts + .bak files
4. Fix shared-utils barrel exports (all 9 modules)
5. Remove shared-utils empty db/ and ui/ directories
6. Fix TokenWise PRICING duplication
7. Fix ProjectLearner `undefined` header bug
8. Add .env.example to all projects missing it
9. Move PostPilot dev deps to devDependencies
10. Centralize Supabase anon keys in ftable, Heroes, chicle (single config file)
11. Apply universal .gitignore template to all repos
12. Add .gitignore entries to clubgg

**Expected Result:** Clean repos, consistent configs, no dead weight
**Risks:** None — all changes are cleanup
**Success Metric:** No unnecessary files, all .gitignore files hardened

---

## Wave 3 — SHARED LEVERAGE EXTRACTION (Week 1-2)
**Objective:** Extract and publish reusable utilities for cross-project leverage

**Projects:** shared-utils, KeyDrop, PostPilot, FlushQueue, CoinLedger, SecretSauce, ProjectLearner

**Tasks:**
1. Extract LemonSqueezy payments from KeyDrop/PostPilot → shared-utils/payments
2. Merge url-guard into shared-utils (delete url-guard as project)
3. Add tests to shared-utils (crypto, auth, content-filter, payments)
4. Publish FlushQueue to npm (add tests, maxBufferSize, exponential backoff)
5. Publish CoinLedger to npm (add tests, transaction history query)
6. Publish SecretSauce to npm (add tests, JSON output, --ignore flag)
7. Create ProjectLearner build system, publish to npm
8. Fix PromptGuard false positives, consider merging into shared-utils
9. Merge mypoly into crypto-arb-bot as Clawbot executor
10. Archive MegaPromptGPT to `C:\Projects\_archived\`

**Expected Result:** 5+ packages published to npm, shared-utils is the complete foundation
**Risks:** npm publish requires proper package.json, README, LICENSE
**Success Metric:** `npm install @royea/shared-utils @royea/flush-queue @royea/coin-ledger @royea/secret-sauce @royea/project-learner` all work

---

## Wave 4 — PRODUCT STRENGTHENING (Week 2-4)
**Objective:** Fix critical product gaps in revenue-generating projects

**Projects:** KeyDrop, PostPilot, 9soccer, VenueKit, ExplainIt

**Tasks:**
1. KeyDrop: Rename Stripe → LemonSqueezy (DB columns, webhook route, naming)
2. KeyDrop: Add JWT signature verification in middleware
3. KeyDrop: Resolve brand name (KeyDrop vs 1-2Clicks — pick one)
4. PostPilot: Replace base64 media storage with R2/S3
5. PostPilot: Implement scheduled posting
6. PostPilot: Upgrade Prisma to v7
7. 9soccer: Wire server-side score persistence (use existing API)
8. 9soccer: Build content pipeline for challenges
9. VenueKit: Validate config against schema
10. VenueKit: Create second test config (different venue)
11. ExplainIt: Re-add rate limiting
12. ExplainIt: Replace file: dependencies with npm packages (from Wave 3)

**Expected Result:** All revenue projects are launch-ready
**Risks:** PostPilot media migration needs data migration script
**Success Metric:** Each product passes a "would I pay for this?" test

---

## Wave 5 — CREATIVE EXPANSION (Month 2+)
**Objective:** Ship monetizable features and new products

**Projects:** SecretSauce, VenueKit, TokenWise, ExplainIt, Wingman, PostPilot

**Tasks:**
1. SecretSauce: Launch on Product Hunt / dev communities ($29 one-time)
2. VenueKit: Build web-based config builder UI, sell to 3 poker clubs
3. TokenWise: Build VS Code extension
4. ExplainIt: Build Chrome extension
5. Wingman: Add AI-generated wingman intros
6. PostPilot: A/B testing for captions, Style DNA import
7. Extract gamification engine from chicle → @royea/gamification
8. Extract live_scorer.html → standalone PWA ("LiveScore")
9. 9soccer: Multiplayer head-to-head mode
10. ProjectLearner: Add hosted dashboard, A/B testing, heatmaps

**Expected Result:** 3+ revenue streams active, 2+ new products launched
**Risks:** Market validation needed for SecretSauce and VenueKit pricing
**Success Metric:** First paying customers for at least 2 products

---

# 10. FINAL RECOMMENDATIONS

## Best security action now:
**Rotate the chicle Anthropic API key.** It's a confirmed exposed key (not "possible" like Wingman). Takes 5 minutes at console.anthropic.com. Do it before anything else.

## Best technical action now:
**Init git repos for 6 orphan libraries.** PromptGuard, SecretSauce, FlushQueue, CoinLedger, url-guard — these are code assets with zero version history. One accidental deletion = permanent loss. Takes 20 minutes for all 6.

## Best extraction action now:
**Extract LemonSqueezy payments into shared-utils.** KeyDrop and PostPilot have near-identical code. Extract once, parameterize plans, share across all SaaS projects. Highest leverage extraction with lowest effort.

## Best monetization action now:
**Publish SecretSauce to npm.** Best code quality (8/10), zero dependencies, CLI-ready, unique value proposition. Needs: git init, 10 tests, npm publish. Could be live in 1 day. Market to dev communities for $29.

## Best creative opportunity now:
**PostPilot scheduled posting.** The `scheduledFor` field already exists in the Prisma schema. It's a table-stakes SaaS feature that increases perceived value immediately. Low effort, high impact.

## Best neglected project worth reviving:
**ProjectLearner.** Complete analytics SDK with 5 modules, dual persistence, 6 insight types, Supabase schema. Just needs a build system and npm publish. Could compete with Plausible/Simple Analytics in the lightweight analytics space.

## Best project to pause:
**preprompt-web.** Functional but the 90KB single-file component is unmaintainable. Low strategic value. Keep it deployed but invest zero additional effort unless doing a full rebuild.

## Best project to archive:
**MegaPromptGPT.** Only 1 output ever generated. preprompt-web does the same thing with a better UI. Move to `C:\Projects\_archived\` and forget about it.

---

# CHOOSE YOUR MODE

Select one of these execution modes and I'll begin:

1. **SECURITY EXECUTION MODE** — Apply security fixes (rotate keys, add .gitignore, audit Wingman, remove creds from repos). Start with Wave 1 tasks.

2. **PATCH EXECUTION MODE** — Execute all SAFE AUTO PATCH items from the controlled patch queue (dead code removal, config cleanup, git init, barrel fixes). Non-destructive, zero-risk changes.

3. **EXTRACTION MODE** — Start extracting the top reusable utilities (LemonSqueezy payments, CircuitBreaker, edge rate limiter) into shared-utils and preparing libraries for npm publish.

4. **PORTFOLIO CLEANUP MODE** — Archive MegaPromptGPT, merge url-guard into shared-utils, merge mypoly into crypto-arb-bot, delete dead weight files across all repos.

5. **PRODUCT UPSIDE MODE** — Focus on shipping monetizable features: SecretSauce npm publish, PostPilot scheduled posting, VenueKit second config + validation, KeyDrop naming resolution.

Which mode do you want to activate?
