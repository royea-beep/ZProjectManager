# MASTER ECOSYSTEM AUDIT — C:\Projects
**Date:** 2026-03-09 | **Auditor:** Claude Opus 4.6 (Senior AI Technical Auditor)
**Scope:** 26 projects + 1 standalone file in C:\Projects

---

# 1. EXECUTIVE SUMMARY

## What Exists
26 projects spanning a full-stack portfolio: 5 production apps, 6 MVPs, 5 draft libraries, 4 crypto/trading systems, 3 internal tools, 2 prototypes, 1 published npm package. The ecosystem covers web apps, mobile apps, desktop tools, trading bots, CLI utilities, and reusable libraries. Primary stacks: Next.js/React/TypeScript (web), Python/FastAPI (trading/data), Electron (desktop), React Native/Expo (mobile).

## Overall Health
**Average health score: 5.7/10.** The portfolio has impressive breadth and several genuinely clever systems. Code quality ranges from 3/10 (mypoly) to 8/10 (cryptowhale, letsmakebillions, TokenWise, SecretSauce, Wingman). The main systemic weaknesses are: **zero test coverage** in 22 of 26 projects, **hardcoded secrets** in 5 projects, and **6 libraries without git repos**.

## Biggest Problems (Critical)
1. **SECRETS IN GIT** — Anthropic API key in chicle, Google OAuth secrets in ftable-hands, possible .env/.p8 files in Wingman, Apple signing creds in 9soccer
2. **Zero tests** — Only cryptowhale and letsmakebillions have meaningful test suites. 22 projects have zero tests.
3. **6 libraries have NO git repo** — PromptGuard, SecretSauce, FlushQueue, url-guard, CoinLedger, mypoly
4. **Monolith components** — Game.tsx (955 lines), page.jsx (90KB), chicle index.html (873 lines), web/app.py (2000+ lines)
5. **Dead weight** — 15 zip files in ftable, investigation scripts in clubgg, OLD/ dirs, debug JSONs

## Biggest Opportunities
1. **SecretSauce** — Best code quality (8/10), zero deps, ready to publish as a paid developer CLI tool
2. **ProjectLearner** — Complete drop-in analytics SDK, unused. Could be a SaaS product.
3. **VenueKit** — Closest to a sellable white-label SaaS (pricing calculator already shows ₪2,500-5,900/venue)
4. **Shared payments module** — KeyDrop and PostPilot have near-identical LemonSqueezy code. Extract once, use everywhere.
5. **TokenWise** — Already published on npm, could become the standard AI cost tracking tool

## Strongest Reusable Assets
- `shared-utils` (9 modules), `FlushQueue`, `PromptGuard`, `SecretSauce`, `CoinLedger`, `TokenWise`
- `ProjectLearner` analytics engine (drop-in for any website)
- LemonSqueezy billing pattern (KeyDrop + PostPilot)
- Auth patterns (JWT + refresh tokens, Supabase OAuth)
- Risk management / circuit breaker patterns (cryptowhale, letsmakebillions)
- ftable deploy.sh (FTP with git diff detection)

## Highest-Value Next Moves
1. Rotate all exposed secrets immediately
2. Initialize git repos for 6 untracked libraries
3. Publish SecretSauce to npm as a CLI tool
4. Extract shared LemonSqueezy payments into shared-utils
5. Deploy ProjectLearner as a real product

---

# 2. PROJECT INVENTORY

| # | Project | Purpose | Stack | Status | Quality | Health | Git? | Tests? |
|---|---------|---------|-------|--------|---------|--------|------|--------|
| 1 | **9soccer** | Soccer trivia mobile game | Next.js 16, React 19, Capacitor, Supabase | Active MVP / TestFlight | 6/10 | 5/10 | Yes | No |
| 2 | **chicle** | Israeli e-commerce SPA | React+Babel SPA, PHP, Firebase | Production | 6/10 | 5/10 | Yes | No |
| 3 | **clubgg** | Poker club settlement calculator | Python FastAPI, SQLite | MVP / Internal | 7/10 | 6/10 | Yes | No |
| 4 | **CoinLedger** | Virtual currency ledger library | TypeScript | Draft library | 7/10 | 6/10 | **No** | No |
| 5 | **crypto-arb-bot** | Multi-engine crypto arb scanner | Python, asyncio, CCXT | MVP / Local | 7/10 | 6/10 | Yes | No |
| 6 | **cryptowhale** | Whale-tracking crypto trading bot | Python FastAPI, SQLite, Claude API | Production / Railway | 8/10 | 8/10 | Yes | **Yes (15 files)** |
| 7 | **ExplainIt** | Auto website documentation generator | Next.js 14, Playwright, Prisma, LS billing | Production / Railway+Vercel | 7/10 | 7/10 | Yes | **Yes (4 files)** |
| 8 | **FlushQueue** | Client-side event buffer library | TypeScript | Draft library | 7/10 | 5/10 | **No** | No |
| 9 | **ftable** | Israeli poker league portal | Vanilla JS, Supabase, Tailwind | Production / ftable.co.il | 7/10 | 7/10 | Yes | No |
| 10 | **ftable-hands** | Poker video highlight detection | Python, OpenCV, ffmpeg, Tkinter | Active / Production tool | 5/10 | 4/10 | Yes | No |
| 11 | **Heroes-Hadera** | Poker club web app (Hebrew) | Vanilla JS, Supabase, PWA | Production / heroes.ftable.co.il | 5/10 | 6/10 | Yes | No |
| 12 | **KeyDrop** | Secure credential collection | Next.js 16, Prisma 7, AES-256-GCM, LS billing | MVP / Railway | 7/10 | 7/10 | Yes | No |
| 13 | **letsmakebillions** | Crypto grid trading system | Python FastAPI, backtrader, SQLite, Claude API | Active / Railway | 8/10 | 7/10 | Yes | **Yes (16 files)** |
| 14 | **MegaPromptGPT** | Mega prompt builder CLI | Python (stdlib only) | Draft / Abandoned | 7/10 | 4/10 | No? | No |
| 15 | **mypoly** | Polymarket trading client | Python, py-clob-client | Draft / Prototype | 3/10 | 2/10 | No? | No |
| 16 | **PostPilot** | AI social media copilot | Next.js 16, Prisma 6, Claude Haiku, LS billing | MVP / Vercel | 7/10 | 7/10 | Yes | No |
| 17 | **preprompt-web** | Prompt engineering tool | Next.js 16, React 18 | MVP / Deployed | 6/10 | 5/10 | Yes | No |
| 18 | **ProjectLearner** | Drop-in analytics/learning SDK | Vanilla JS, Supabase | MVP / Complete but unused | 7/10 | 6/10 | Yes | No |
| 19 | **PromptGuard** | LLM input sanitizer library | TypeScript | Draft library | 6/10 | 4/10 | **No** | No |
| 20 | **SecretSauce** | Business logic protection scanner | TypeScript CLI | Draft / Complete | 8/10 | 6/10 | **No** | No |
| 21 | **shared-utils** | Shared utility library (9 modules) | TypeScript, React | Active library | 7/10 | 6/10 | Yes | No |
| 22 | **TokenWise** | AI API cost tracker (npm published) | Node.js, TypeScript, sql.js | Published / Active | 8/10 | 8/10 | Yes | No |
| 23 | **url-guard** | SSRF URL validator (thin wrapper) | TypeScript | Draft / Trivial | 5/10 | 3/10 | **No** | No |
| 24 | **VenueKit** | White-label venue site generator | Node.js (zero deps) | Draft / Prototype | 6/10 | 5/10 | Yes | No |
| 25 | **Wingman** | Dating app with wingman concept | NestJS + Expo (React Native), monorepo | Active MVP / TestFlight | 8/10 | 7/10 | Yes | Partial |
| 26 | **ZProjectManager** | Desktop project OS | Electron, React 18, SQLite, TypeScript | Active MVP | 7/10 | 7/10 | Yes | No |
| — | **CURSOR_MEGA_PROMPT.md** | Multi-project launch prompt file | Markdown | File (not a project) | — | — | — | — |

**Status Distribution:** 5 Production, 6 MVP, 5 Draft Library, 4 Active Dev, 3 Internal Tool, 2 Prototype, 1 Published

---

# 3. PER-PROJECT AUDIT

---

## 9soccer
### What it is
Mobile-first soccer trivia game. Watch 15s video clips, answer 5 questions per level across 5 difficulty tiers. Badges, leaderboards, streaks, sharing, Facebook integration. iOS (TestFlight) + Android via Capacitor.

### What's good
- Well-designed game mechanics (speed bonuses, streaks, star ratings, progressive unlocks)
- Clean type system, Zod validation on API routes, Sentry integration
- `.env.example` exists and is complete

### What's broken
- **Leaderboard is hardcoded/simulated** — `scoring.ts` returns fake static data
- **All game state in localStorage only** — server API exists but client doesn't use it
- Only 1 challenge defined ("Aguero 93:20") — no content pipeline
- Game.tsx is a 955-line monolith

### Risks / debt
- **Apple signing creds committed** (AuthKey .p8, distribution.cer, .mobileprovision)
- No tests

### Improvements
1. Split Game.tsx into 5 components
2. Wire up server-side score persistence
3. Build content pipeline for daily challenges
4. Remove signing creds from repo, use CI secrets

### Creative ideas
- Multiplayer head-to-head on same clip
- User-generated challenges (fan-submitted clips)
- Auto-generate questions from live match data APIs

### Reusable assets inside this project
- `celebrations.ts` — haptic + confetti patterns
- `badges.ts` — achievement system
- `auth.ts` — JWT auth module

### Priority: **MEDIUM** (needs content pipeline to have value)

---

## chicle
### What it is
Israeli e-commerce SPA for stainless steel tables/equipment. Full shopping with cart, checkout, gamification (coins, games, streaks, affiliate), live chat, 4-language support (he/en/ar/ru).

### What's good
- Impressive feature density: 96 useState hooks, 17 components, 31 animations, 4 languages
- Exceptional CLAUDE.md documentation
- PHP backend has rate limiting, XSS sanitization, HMAC auth
- SEO pre-renderer for bots

### What's broken
- **CRITICAL: Anthropic API key hardcoded in config.php** (`sk-ant-api03-...`)
- **CRITICAL: Admin password hardcoded** (`chicle2026`)
- Babel Standalone in production (transpiles JSX on every load)
- 260KB single-file SPA is unmaintainable

### Risks / debt
- Credentials in web root (one misconfiguration = full leak)
- AUTH_SECRET is a simple string, not cryptographic

### Improvements
1. **IMMEDIATELY rotate the Anthropic API key**
2. Move credentials to .env outside web root
3. Split into multiple files or add build step
4. Replace Babel Standalone with Vite/esbuild pre-compilation

### Creative ideas
- Extract gamification engine (coins + games + affiliate) as standalone loyalty module
- 4-language translation pattern reusable for VenueKit

### Reusable assets inside this project
- `send-email.php` — 4-language email templates
- `config.php` — PHP HMAC auth + rate limiter pattern
- Gamification system (coins, streaks, games, affiliate)
- Translation system (TX object, 350+ keys x 4 languages)

### Priority: **CRITICAL** (secrets exposure)

---

## clubgg
### What it is
ClubGG poker club settlement calculator. Parses weekly Excel reports, computes 3-channel settlements, tracks player P&L, validates against known targets. Web dashboard via FastAPI.

### What's good
- Clean architecture (parsers -> services -> routes -> templates)
- Robust Excel parser handles 6 format versions across 90+ weeks
- In-memory caching (300s TTL)
- Proper error handling with custom exception handlers

### What's broken
- Dead investigation scripts in root (5+ files)
- `__pycache__` committed, `.bak` file in repo
- No authentication on financial dashboard

### Risks / debt
- Anyone on localhost can see financial data
- Hardcoded partner names and financial details

### Improvements
1. Delete investigation scripts and .bak files
2. Add .gitignore for pycache, db, xlsx
3. Add basic auth to web dashboard

### Creative ideas
- Generalize settlement calculator for any multi-partner business
- Multi-format Excel parser as a Python package

### Reusable assets inside this project
- Multi-format Excel parser pattern
- FastAPI dashboard template (routes, templates, error handling)
- Player retention analytics with caching

### Priority: **LOW** (internal tool, functional)

---

## CoinLedger
### What it is
Virtual currency ledger library. Credit/debit operations with balance tracking and idempotency. Adapter pattern (memory for testing, Prisma for production).

### What's good
- Textbook adapter pattern (LedgerAdapter interface)
- Built-in idempotency, Prisma $transaction for atomic debits
- Clean TypeScript with good defensive coding

### What's broken
- **No git repo**
- No tests (on financial logic!)
- Not published to npm
- TOCTOU race condition in core API (mitigated in Prisma adapter)

### Improvements
1. Initialize git + push to GitHub
2. Add comprehensive tests
3. Add transaction history query
4. Publish to npm

### Creative ideas
- Add spending limits / daily caps
- Add webhook hooks for balance changes
- Build embeddable ledger dashboard component

### Reusable assets inside this project
- Entire library (designed for ftable coins, KeyDrop credits, etc.)
- Adapter pattern template

### Priority: **MEDIUM** (could serve multiple projects once published)

---

## crypto-arb-bot
### What it is
Multi-engine crypto arbitrage scanner. Cross-exchange, funding rate, triangular, price lag, Polymarket "Clawbot". Paper trade only — no live execution.

### What's good
- Excellent safety design: multiple kill switches, ENABLE_LIVE_TRADING=False hardcoded
- CLAUDE.md with 6 explicit safety rules
- Clean async architecture, 7 intelligence sources
- Learning pipeline (analyze -> optimize -> recommend)
- WhaleBridge integration with cryptowhale

### What's broken
- No tests at all
- Dashboard has no auth
- `or True` hardcoded in __main__ block
- No file-based logging

### Improvements
1. Add tests (scanners, paper trader, risk manager)
2. Add auth to dashboard
3. Fix `or True` hack
4. Add .env.example

### Creative ideas
- Generalize multi-engine architecture into pluggable "strategy marketplace"
- Develop Clawbot (Polymarket + BTC correlation) further
- Merge mypoly's trading client as Clawbot executor

### Reusable assets inside this project
- CrossExchangeScanner, FundingRateScanner
- PaperTrader P&L tracker
- ScannerAggregator (multi-engine combiner)
- FeeCalculator

### Priority: **LOW** (functional, paper-only)

---

## cryptowhale
### What it is
Whale-tracking crypto trading bot. Monitors whale activity on Bybit, generates signals, executes grid trades, learns from outcomes. Full web dashboard (65+ endpoints).

### What's good
- **Best-tested project** — 15 test files covering grid, risk, signals, security, load, stress
- Security audit performed and documented
- CircuitBreaker pattern, rate limiting, admin auth, CSP/HSTS headers
- Clean architecture across 12 modules

### What's broken
- runner.py and web/app.py are oversized (should be split)
- `datetime.utcnow()` deprecated in Python 3.12+
- CORS `Access-Control-Allow-Origin: *` in some setups

### Improvements
1. Split runner.py and web/app.py into smaller modules
2. Replace deprecated datetime calls
3. Add OpenAPI spec export

### Creative ideas
- Package LearningEngine as standalone "adaptive signal optimizer" library
- Feed whale detection to other bots via API

### Reusable assets inside this project
- CircuitBreaker class (generic)
- RiskManager (bankroll, drawdown, kill switch)
- LearningEngine (adaptive weight recalibration)
- MonteCarloSimulator
- Rate limiter, error tracker

### Priority: **LOW** (healthy, just maintenance)

---

## ExplainIt
### What it is
Automated website documentation generator. Captures screenshots (Playwright), generates explainer videos (HTML animation), creates annotated PDFs, packages everything. Smart Mode for AI-assisted content. LemonSqueezy billing.

### What's good
- Full SaaS architecture (auth, billing, usage tracking, tiered plans)
- Tests exist for core engines (capture, video, PDF, pipeline)
- scrypt + jose auth (Edge-compatible, no native deps)
- Hebrew/English bilingual UI

### What's broken
- Hardcoded Supabase anon key in ProjectLearner component
- page.tsx is 725 lines (monolith)
- file: dependencies break portability
- Rate limiting was removed

### Improvements
1. Split page.tsx into components
2. Re-add rate limiting
3. Replace file: deps with npm packages
4. Move ProjectLearner config to env vars

### Creative ideas
- AI narration (text-to-speech) for generated videos
- Chrome extension for current-page documentation
- Before/after comparison mode for UI changes

### Reusable assets inside this project
- scrypt + jose JWT auth module (Edge-compatible)
- Stage-based pipeline with status callbacks
- Playwright URL capture engine
- LemonSqueezy webhook pattern

### Priority: **MEDIUM** (production app, needs polish)

---

## FlushQueue
### What it is
Client-side event buffer library. Queues events, batch-POSTs with retry, optional offline persistence (localStorage).

### What's good
- Zero dependencies, clean API (push/flush/start/stop)
- Pluggable StorageAdapter, AbortController timeout
- Proper 4xx vs 5xx handling

### What's broken
- **No git repo**, no tests, not published
- Unbounded buffer (no max size)
- Only 1 retry, no exponential backoff
- Async-in-constructor pattern

### Improvements
1. Init git repo, add tests, publish to npm
2. Add maxBufferSize, exponential backoff
3. Add destroy() method that flushes remaining events

### Reusable assets inside this project
- Entire library (used by ExplainIt, KeyDrop, PostPilot)
- StorageAdapter interface pattern

### Priority: **HIGH** (3+ projects depend on it, needs proper foundation)

---

## ftable
### What it is
Israeli filmed poker league web portal. Full-featured Hebrew RTL site with tournaments, leaderboards, news, streams, FT Coins rewards economy, 36-page admin panel.

### What's good
- Excellent modular architecture (ES Modules, Web Components)
- Comprehensive Supabase integration (auth, realtime, edge functions)
- XSS protection, error logging, rate limiting, proper SEO
- Sophisticated PL learning engine (8 modules)
- deploy.sh with git diff detection

### What's broken
- Supabase anon key duplicated in 3+ files
- 15 .zip archive files cluttering repo root
- supabase/ directory may be missing migrations

### Improvements
1. Remove 15 zip files
2. Centralize Supabase key to single source
3. Add .env.example
4. Restore supabase migrations to repo

### Creative ideas
- Extract PL learning engine as standalone SDK
- Package ftTracker as self-hosted analytics platform

### Reusable assets inside this project
- errorHandler.js — generic Supabase error logger
- ftTracker.js — full analytics/session recording
- PL engine (8 modules) — adapted from cryptowhale
- deploy.sh — FTP with git diff detection
- Web component patterns (navbar, footer, bottom-nav)

### Priority: **MEDIUM** (production, needs cleanup)

---

## ftable-hands
### What it is
Poker video highlight detection system ("Feature Table LIVE v10.5"). OCR-based hand detection, player chip tracking, highlight rating, clip cutting. Episode production pipeline with Insta360 multi-angle support.

### What's good
- Massive, sophisticated system (~15K+ lines) that actually works
- Excellent CLAUDE.md documentation
- Smart OCR name learning (CONFIRMED/GARBAGE/PENDING)
- Atomic JSON saves, thread-safety fixes
- 10 mini-projects documented for extraction

### What's broken
- **CRITICAL: Google OAuth client_secret.json and token pickles committed to git**
- No .gitignore apparent
- No requirements.txt or pyproject.toml
- STAGE2_v10.py is ~3,100 lines
- No type hints anywhere

### Improvements
1. **URGENT: Remove secrets from git history** (BFG or git filter-repo)
2. Add .gitignore
3. Create requirements.txt
4. Split STAGE2_v10.py

### Creative ideas
- live_scorer.html as standalone PWA for live event scoring
- OCR name learning as a Python package
- Episode build pipeline as CLI for YouTube creators

### Reusable assets inside this project
- live_scorer.html — offline mobile scoring app
- name_learning.py — OCR entity classification
- utils.py — SafeVideoCapture, atomic JSON save
- Episode build pipeline (ffmpeg concat with music)
- YouTube/Drive managers

### Priority: **CRITICAL** (secrets in git history)

---

## Heroes-Hadera
### What it is
Hebrew poker tournament club web app. Tournament listings, registration, league standings, player profiles with badges, gallery, countdown timers, admin panel. PWA-enabled.

### What's good
- Comprehensive feature set for a club app
- Full Hebrew RTL, PWA with service worker
- OAuth integration (Google + Facebook) via Supabase
- Well-organized utilities module

### What's broken
- Supabase anon keys in 4 separate JS files
- No build step, no bundling (many HTTP requests)
- Global mutable state, no TypeScript
- Heroes.zip committed to repo

### Improvements
1. Centralize Supabase config to single source
2. Add build step (esbuild/Vite)
3. Remove Heroes.zip
4. Audit Supabase RLS policies

### Creative ideas
- Real-time tournament updates via Supabase Realtime
- Player statistics dashboard with charts
- Push notifications for upcoming tournaments

### Reusable assets inside this project
- utils.js — Hebrew date formatting, countdowns, currency, HTML escaping
- auth.js — Supabase OAuth pattern
- badges.js — achievement system
- content-filter.js — text content moderation
- Dark theme CSS with RTL support

### Priority: **LOW** (production, functional)

---

## KeyDrop (1-2Clicks)
### What it is
Secure credential collection platform. Create a request, send one-time link, client submits secrets through encrypted form. AES-256-GCM at rest. LemonSqueezy billing (FREE/PRO $19/TEAM $49).

### What's good
- Strong AES-256-GCM encryption, proper IV and auth tags
- Timing-safe HMAC on webhooks, audit logs
- Dual database adapter (SQLite dev / Postgres prod)
- Rate limiting, accessibility features

### What's broken
- **Naming chaos**: folder=KeyDrop, package.json=1-2clicks, CLAUDE.md=1-2Clicks
- Stale Stripe references (DB columns: stripeCustomerId, webhook route: /api/stripe/webhook)
- Middleware JWT verification doesn't check signature
- postpilot.db leftover file in root

### Improvements
1. Rename Stripe columns to LemonSqueezy
2. Move webhook route from /api/stripe/ to /api/billing/
3. Clean up postpilot.db
4. Resolve naming (pick one brand name)
5. Add JWT signature verification in middleware

### Creative ideas
- White-label version for agencies
- Browser extension for one-click credential requests
- Webhook/API integration with project management tools

### Reusable assets inside this project
- crypto.ts — AES-256-GCM encrypt/decrypt utility
- payments.ts — LemonSqueezy integration pattern
- Landing page template with pricing section

### Priority: **MEDIUM** (pre-launch, needs naming + Stripe cleanup)

---

## letsmakebillions
### What it is
Crypto grid trading system with whale tracking, signal generation, Monte Carlo simulation, backtesting, risk management, web dashboard. Live on Railway.

### What's good
- **Best Python architecture** — 12 clean modules, 16 test files
- Sophisticated risk management (kill switch, drawdown limits, cooldowns, circuit breakers)
- Adaptive learning engine with parameter analysis
- Proper security (timing-safe auth, CSRF, rate limiting)
- Paper trading safety net

### What's broken
- web/app.py is 2,131+ lines (god file)
- Messy root (debug*.json, backup*.json, OLD/, MEGA PROMPT.txt)
- private_key.pem in project directory (gitignored but risky)
- Admin API key defaults to empty string

### Improvements
1. Split web/app.py into route modules
2. Clean up root directory
3. Add .env.example
4. Make admin auth mandatory in production

### Creative ideas
- Mobile companion app (push alerts on whale signals)
- Social copy-trading
- Multi-exchange support (beyond Bybit)

### Reusable assets inside this project
- risk_manager.py — risk management framework
- monte_carlo.py — Monte Carlo simulation engine
- error_tracker.py — error tracking with circuit breaker
- learner/engine.py — adaptive learning system
- storage.py — SQLite storage abstraction

### Priority: **LOW** (well-tested, just cleanup)

---

## MegaPromptGPT
### What it is
Local Python CLI that transforms short prompts into structured "MEGA prompts." Hebrew-first prompt engineering tool.

### What's good
- Clean Python with dataclasses, pathlib, type hints
- Zero dependencies, proper CLI with argparse subcommands
- Config system with merge behavior

### What's broken
- Only 1 output ever generated — essentially unused
- No README, no git repo
- Rigid template structure

### Improvements
1. Add interactive mode
2. Add template customization
3. Add clipboard integration

### Reusable assets inside this project
- JSONL append/read utilities
- Config system pattern (default -> file merge -> runtime)
- CLI scaffold (argparse subcommands)

### Priority: **VERY LOW** (consider archiving or merging into preprompt-web)

---

## mypoly
### What it is
Thin Python wrapper around Polymarket CLOB API for prediction market trading.

### What's good
- .gitignore properly excludes .env
- Clean API wrapper, uses os.getenv() for secrets

### What's broken
- **No error handling whatsoever** on financial trading functions
- **No input validation** (could place orders with negative amounts)
- setup_api.py prints secrets to stdout
- Only 3 files, no README, no tests, no git

### Improvements
1. Add input validation (price 0-1 range, positive amounts)
2. Add error handling (try/except on API calls)
3. Stop printing secrets to stdout

### Creative ideas
- Merge into crypto-arb-bot as Clawbot executor

### Reusable assets inside this project
- Basic Polymarket CLOB API integration pattern

### Priority: **VERY LOW** (merge into crypto-arb-bot or archive)

---

## PostPilot
### What it is
AI-powered social media copilot. Create brands, send magic links, clients upload content, AI generates captions in brand's learned voice (Style DNA). LemonSqueezy billing (FREE/PRO $29/AGENCY $79).

### What's good
- Sophisticated Claude Haiku integration with proper prompt engineering
- Prompt injection protection via @royea/prompt-guard
- Edge rate limiting with per-route rules
- Style DNA system learns brand voice from past posts
- Graceful AI fallback (template captions if no API key)

### What's broken
- Media stored as base64 in SQLite (will bloat fast)
- Prisma version mismatch with KeyDrop (6.x vs 7.x)
- Dev dependencies in production dependencies
- No tests

### Improvements
1. Move dev deps to devDependencies
2. Replace base64 media storage with R2/S3
3. Upgrade Prisma to v7
4. Add test suite

### Creative ideas
- Implement scheduled posting (field exists in schema)
- A/B testing of caption styles
- "Style DNA import" — analyze competitor's Instagram
- Content calendar view

### Reusable assets inside this project
- ai-captions.ts — Claude API integration with style profiles
- style-engine.ts — Style DNA analysis
- edge-rate-limit.ts — edge-compatible rate limiter
- platforms.ts — social platform OAuth abstraction

### Priority: **MEDIUM** (deployed, needs media storage fix)

---

## preprompt-web
### What it is
Prompt engineering tool. Takes short prompt, expands into structured "PRE PROMPT" with guiding questions, quality scoring, profiles, versioning, AI suggestions. Hebrew-first.

### What's good
- Clean bilingual string system
- Knowledge base learns from user answers (localStorage)
- 8 built-in profiles (flirting, coding, marketing, etc.)
- Version history with diff support
- AI sanitization via @royea/prompt-guard

### What's broken
- **page.jsx is ~90KB** — entire app in one React component (worst monolith in portfolio)
- All CSS inline via dangerouslySetInnerHTML
- Local dependency via file:../PromptGuard
- No TypeScript, no tests

### Improvements
1. Split page.jsx into 10-15 components
2. Move CSS to proper files
3. Add TypeScript
4. Publish @royea/prompt-guard to npm

### Creative ideas
- Package as npm library (@royea/preprompt-engine)
- Add prompt marketplace (share/rate profiles)
- Integrate directly with Claude/ChatGPT APIs

### Reusable assets inside this project
- buildPrePrompt() — structured prompt expansion engine
- scorePrompt() — prompt quality assessment
- Knowledge base module (localStorage-based learning)
- Profile system with stats tracking

### Priority: **LOW** (deployed, functional but messy)

---

## ProjectLearner
### What it is
Universal drop-in analytics/learning SDK. Tracks behavior (page views, clicks, scroll, feature visibility, forms), runs learning engine to recalibrate feature weights, generates actionable insights. Ships as `<script>` tag or module.

### What's good
- Excellent architecture: 5 focused modules, zero dependencies
- Dual persistence (Supabase + localStorage fallback)
- Consent-aware tracking, event buffering
- 6 insight types with confidence scores
- Web Component dashboard
- Complete Supabase schema with RLS

### What's broken
- **Supabase RLS too permissive** (anon can INSERT/UPDATE learning state)
- No build system (referenced build.js doesn't exist)
- Not published to npm
- `'Prefer': undefined` passes literal "undefined" as header

### Improvements
1. Create build.js for bundling/minification
2. Tighten Supabase RLS policies
3. Publish to npm as @royea/project-learner
4. Fix undefined header bug

### Creative ideas
- **This is the most "productizable" project** — could be a SaaS analytics tool
- Add hosted dashboard via Supabase Edge Functions
- Add A/B test support
- Add heatmap visualization from click/scroll data

### Reusable assets inside this project
- Entire project is designed to be reusable
- Event tracker with consent, buffering, auto-tracking
- Learning engine with adaptive weight recalibration
- 6-type insight generator
- Dual-mode persistence pattern

### Priority: **HIGH** (complete product sitting unused)

---

## PromptGuard
### What it is
LLM input sanitizer. Masks PII (phones, emails, URLs) with placeholders and blocks prompt-injection phrases.

### What's good
- Zero dependencies, works everywhere
- Configurable via SanitizeOptions

### What's broken
- **No git repo**, no tests
- Only 73 lines, very thin
- Phone regex too broad (`\b\d{10,15}\b` matches non-phones)
- "act as" and "disregard" patterns cause false positives
- Creates false sense of security (regex can't reliably block injection)

### Improvements
1. Init git repo
2. Add tests
3. Add disclaimer about heuristic nature
4. Fix false-positive patterns
5. Consider merging into shared-utils

### Reusable assets inside this project
- PII masking regex patterns

### Priority: **MEDIUM** (3+ projects depend on it)

---

## SecretSauce
### What it is
Business logic protection scanner. Scans JS/TS codebases to find exposed business logic (scoring, pricing, algorithms, prompts, auth), rates uniqueness (1-5 stars), suggests protection levels with migration advice. CLI + API.

### What's good
- **Best code quality in the portfolio (8/10)**
- Clean pipeline: scan -> rate -> protect -> report
- 30+ detection patterns, false-positive filtering
- Beautiful ANSI CLI output
- Zero dependencies, dual interface (CLI + API)

### What's broken
- **No git repo**, no tests, not published
- Some patterns too broad (`.sort()`, `Math.pow()`)
- `delta: 0 as 1 | 2` type hack

### Improvements
1. Init git repo
2. Add tests (highly testable pipeline)
3. Publish to npm as CLI tool
4. Add JSON output mode
5. Add --ignore flag

### Creative ideas
- **Paid developer tool** (SaaS scanner for codebases)
- CI/CD integration (flag new business logic exposure)
- Auto-fix capabilities (generate server endpoint boilerplate)

### Reusable assets inside this project
- Entire scanner architecture (template for any code analysis tool)
- Pattern definition format (regex + category + name)
- ANSI reporter template

### Priority: **HIGH** (highest quality, easiest to ship)

---

## shared-utils
### What it is
Shared utility library (@royea/shared-utils) with 9 modules: error handling, content filtering, rate limiting, analytics, JWT auth, AES-256-GCM encryption, i18n, URL validation (SSRF), auth context/guard.

### What's good
- Clean TypeScript with JSDoc, zero-dep modules where possible
- Proper security (AES-256-GCM, bcrypt, SSRF protection)
- Configurable via env vars
- Hebrew profanity list alongside English

### What's broken
- db/ and ui/ directories are EMPTY
- index.ts barrel only re-exports 3 of 9 modules
- No tests ("echo no tests yet")
- Analytics uses global mutable state (not SSR-safe)

### Improvements
1. Add tests (especially crypto, auth, content-filter)
2. Remove empty directories or populate them
3. Fix barrel to re-export all modules
4. Publish to npm

### Reusable assets inside this project
- Every module is independently importable
- auth-context.tsx — complete JWT auth for React
- analytics tracker — production-grade
- SSRF validator — comprehensive

### Priority: **HIGH** (foundation for 5+ projects)

---

## TokenWise
### What it is
npm package (@royea/tokenwise@0.4.0) that tracks AI API costs by hooking into Claude Code events. SQLite storage, CLI dashboard, embeddable badge, 34 models across 8 providers.

### What's good
- **Published and working on npm**
- Excellent single-responsibility design
- Comprehensive model pricing database
- Smart exports (./badge, ./badge-react, ./estimator)
- Feature-rich CLI (stats, live dashboard, hook management)
- Zero TODO/FIXME/HACK comments

### What's broken
- **Duplicated PRICING table** in estimator.ts and badge.ts (maintenance risk)
- No tests

### Improvements
1. Extract PRICING to shared pricing.ts
2. Add unit tests
3. Add CI/CD for automated npm publishing
4. Add --json CLI flag

### Creative ideas
- Web dashboard for historical trends
- VS Code extension (cost in status bar)
- Team cost aggregation
- Budget alerts (threshold notifications)
- Model recommendation engine ("save X% by switching to Sonnet")

### Reusable assets inside this project
- Entire package (published)
- estimator.ts — standalone AI cost estimation library
- badge.ts — drop-in cost transparency widget
- sql.js WASM database pattern

### Priority: **LOW** (healthy, published, just minor fixes)

---

## url-guard
### What it is
Thin re-export of @royea/shared-utils/validate-url as standalone package. 13 lines of code.

### What's good
- Clean README
- Proper TypeScript config

### What's broken
- **No git repo**, no tests
- Only 13 lines — pure re-export with no added value
- Exports `clampMaxScreens` which doesn't belong in a URL guard

### Improvements
1. **Merge back into shared-utils** (no reason to exist separately)
2. OR add real value (Express/Fastify middleware, allowlists/blocklists)

### Priority: **LOW** (merge or delete)

---

## VenueKit
### What it is
Template-based site generator. Turns Heroes-Hadera poker club website into white-label venue websites. Landing page for selling the service.

### What's good
- Zero-dependency Node.js generator
- Smart template system with conditional blocks
- Landing page has interactive pricing calculator (₪2,500-5,900)
- Feature toggle system (15 features independently toggleable)
- Credential helper integrates with KeyDrop/1-2Clicks

### What's broken
- Supabase key hardcoded in example config
- Only 1 config (Heroes-Hadera) — never tested with second venue
- No validation against schema (schema exists but unused)
- No tests, no input sanitization on template injection

### Improvements
1. Validate config against schema before generating
2. HTML-escape injected values
3. Create second test config
4. Remove hardcoded key from example

### Creative ideas
- **Closest to sellable SaaS** — pricing calculator already defined
- Web-based config builder (instead of JSON editing)
- Expand beyond poker (sports clubs, event spaces)

### Reusable assets inside this project
- Template processing engine (placeholder + conditional blocks)
- Credential collection workflow via 1-2Clicks
- Marketing landing page with pricing calculator

### Priority: **MEDIUM** (high potential if developed further)

---

## Wingman
### What it is
Dating app with "wingman" concept — friends create your profile, vouch, write intros. Full-stack: NestJS API + React Native (Expo) mobile. Features: swipe, matches, real-time chat (Socket.io), games, coins, stories, push notifications, deep linking.

### What's good
- **Highest code quality (8/10)** — professional-grade monorepo
- Extremely defensive mobile code (ErrorBoundary, try/catch around every native API call)
- Comprehensive feature set, proper security stack
- Socket.io + Redis for scalable real-time
- Well-structured .env.example

### What's broken
- **POSSIBLE SECRETS COMMITTED** (.env files, .p8 Apple key, env dump file)
- API TypeScript source may not be committed (only dist/ found)
- react/react-dom in devDependencies at root with override hacks

### Improvements
1. **URGENT: Audit git history for committed secrets, rotate if found**
2. Ensure API TypeScript source is committed
3. Add API integration tests
4. Add monitoring beyond Sentry

### Creative ideas
- AI-generated wingman intros based on profile data
- Video intros (short clips)
- Group dates feature
- "Wingman score" leaderboard

### Reusable assets inside this project
- packages/shared — full typed interface library
- Mobile ErrorBoundary, OfflineBanner, deep link handling
- Socket.io + Redis adapter setup
- Onboarding completion guard pattern

### Priority: **HIGH** (most ambitious project, needs security audit)

---

## ZProjectManager
### What it is
Desktop "Project OS" — Electron app managing all C:\Projects. Tracks projects, sessions, launches dev environments, Kanban, patterns, synergy intelligence.

### What's good
- Clean IPC pipeline architecture
- 15+ features, 8 pages, 18 components
- Zero TODO/FIXME — clean code
- Builds pass (tsc + build both clean)

### What's broken
- No tests
- electron-updater dependency but no auto-update infrastructure
- constants.ts (273 lines) getting large

### Improvements
1. Add integration tests for IPC handlers
2. Split constants.ts into grouped files
3. Remove or implement electron-updater

### Reusable assets inside this project
- IPC pipeline pattern (Electron architecture template)
- Pattern detector, session intelligence
- Auto-backup system (6h interval, keeps 10)

### Priority: **LOW** (meta-tool, functional)

---

# 4. CROSS-PROJECT REUSABLE UTILITY MAP

## A. Existing Reusable Utilities

| Utility | Lives In | What It Does | Reusability | Can Benefit |
|---------|----------|-------------|-------------|-------------|
| **shared-utils** (9 modules) | shared-utils/ | Auth, crypto, rate-limit, analytics, i18n, content-filter, errors, URL validation, auth-guard | HIGH — designed for reuse | All web projects |
| **FlushQueue** | FlushQueue/ | Event buffering + batch POST | HIGH — 3 projects use it | Any app with analytics |
| **PromptGuard** | PromptGuard/ | LLM input sanitization | MEDIUM — limited effectiveness | PostPilot, preprompt-web, Wingman |
| **TokenWise** | TokenWise/ | AI cost tracking | HIGH — published on npm | Any AI-using project |
| **CoinLedger** | CoinLedger/ | Virtual currency operations | HIGH — adapter pattern | ftable, 9soccer, Wingman, chicle |
| **SecretSauce** | SecretSauce/ | Business logic scanner | HIGH — zero deps, CLI ready | All projects (audit tool) |
| **ProjectLearner** | ProjectLearner/ | Drop-in analytics SDK | HIGH — complete product | ftable, Heroes, chicle, any web app |
| **LemonSqueezy payments** | KeyDrop + PostPilot | Billing integration | HIGH — near-identical in 2 projects | ExplainIt, VenueKit, any SaaS |
| **JWT auth module** | ExplainIt | scrypt + jose (Edge-compatible) | HIGH — no native deps | All Next.js projects |
| **deploy.sh** | ftable | FTP deploy with git diff | MEDIUM — cPanel-specific | Heroes, chicle, VenueKit |
| **CircuitBreaker** | cryptowhale | API resilience pattern | HIGH — generic | Any API-calling project |
| **RiskManager** | cryptowhale + letsmakebillions | Drawdown/kill switch | MEDIUM — trading-specific | crypto-arb-bot, mypoly |
| **MonteCarloSimulator** | letsmakebillions | Risk simulation | MEDIUM | cryptowhale, crypto-arb-bot |
| **PaperTrader** | crypto-arb-bot | Paper trading P&L tracker | MEDIUM | mypoly, letsmakebillions |
| **live_scorer.html** | ftable-hands | Offline mobile scoring PWA | HIGH — standalone | Any live event |
| **Gamification engine** | chicle | Coins, streaks, games, affiliate | HIGH — extractable | ftable, 9soccer, Heroes |

## B. Extraction Priority

1. **LemonSqueezy payments** → Extract from KeyDrop/PostPilot into `@royea/shared-utils/payments`
2. **Gamification engine** → Extract from chicle into `@royea/gamification`
3. **CircuitBreaker + RiskManager** → Extract from cryptowhale into `@royea/resilience`
4. **live_scorer.html** → Already standalone, publish as PWA
5. **PL Engine (ProjectLearner)** → Already separate, just needs npm publish

## C. Recommended Shared Structure

```
C:\Projects\
├── shared-utils/          # Foundation library (auth, crypto, rate-limit, i18n, etc.)
│   └── + payments/        # NEW: LemonSqueezy integration
│   └── + gamification/    # NEW: Coins, streaks, achievements
│   └── + resilience/      # NEW: CircuitBreaker, RiskManager
├── FlushQueue/            # Event buffering (publish to npm)
├── PromptGuard/           # LLM sanitization (merge into shared-utils?)
├── TokenWise/             # AI cost tracking (already published)
├── CoinLedger/            # Virtual currency (publish to npm)
├── SecretSauce/           # Code scanner (publish to npm)
├── ProjectLearner/        # Analytics SDK (publish to npm)
└── url-guard/             # MERGE INTO shared-utils (delete as separate project)
```

---

# 5. MISSING UTILITIES TO BUILD

| Utility | Purpose | Projects Impacted | Effort | Value |
|---------|---------|-------------------|--------|-------|
| **@royea/payments** | Unified LemonSqueezy billing module | KeyDrop, PostPilot, ExplainIt, VenueKit | LOW (extract existing code) | HIGH |
| **Test scaffolding CLI** | Generate test files from existing code | ALL 22 untested projects | MEDIUM | VERY HIGH |
| **Secret scanner** | Scan all repos for committed secrets | ALL projects | LOW (SecretSauce could do this) | CRITICAL |
| **Dependency health checker** | Check outdated/vulnerable deps across all projects | ALL projects | LOW (npm audit + script) | HIGH |
| **Shared Supabase config** | Centralized Supabase key management | ftable, Heroes, chicle, ProjectLearner | LOW | MEDIUM |
| **Build/bundle wrapper** | esbuild/Vite config for vanilla JS projects | ftable, Heroes, chicle | MEDIUM | MEDIUM |
| **Cross-project search** | Search code across all projects | Developer productivity | LOW (ripgrep wrapper) | MEDIUM |
| **Project bootstrapper** | New project template with shared-utils pre-wired | Future projects | MEDIUM | HIGH |
| **Release checklist generator** | Automated pre-deploy checks per project | All deployable projects | MEDIUM | HIGH |
| **Dead code detector** | Find unused exports, components, routes | All projects | MEDIUM | MEDIUM |

---

# 6. NEW CREATIVE / STRATEGIC OPPORTUNITIES

## Per-Project Standouts

| Project | Opportunity | Impact | Effort |
|---------|-------------|--------|--------|
| **SecretSauce** | Publish as paid CLI tool ($9/mo or $29 one-time) | HIGH — unique product | LOW |
| **ProjectLearner** | Launch as free-tier SaaS analytics (compete with Plausible/Simple Analytics) | VERY HIGH | MEDIUM |
| **VenueKit** | Sell to 3 poker clubs as pilot (₪2,500+ each) | HIGH — immediate revenue | MEDIUM |
| **TokenWise** | VS Code extension + team dashboard | HIGH — growing AI market | MEDIUM |
| **PostPilot** | Add scheduled posting + content calendar | HIGH — table-stakes SaaS feature | LOW |
| **KeyDrop** | White-label for agencies | MEDIUM | LOW |
| **ExplainIt** | Chrome extension for instant page docs | HIGH — viral potential | MEDIUM |
| **Wingman** | AI-generated wingman intros | HIGH — core differentiator | LOW |
| **ftable** | Extract ftTracker as self-hosted analytics | MEDIUM | MEDIUM |
| **9soccer** | Auto-generate challenges from live match APIs | HIGH — solves content problem | MEDIUM |

## Cross-Project Combinations

1. **VenueKit + Heroes-Hadera + ftable** → White-label venue platform with real production templates
2. **ProjectLearner + ftTracker + shared-utils/analytics** → Unified analytics platform
3. **CoinLedger + chicle gamification** → Universal loyalty/rewards engine for all apps
4. **SecretSauce + PromptGuard** → Security toolkit suite (@royea/security)
5. **cryptowhale + letsmakebillions + crypto-arb-bot** → Unified trading platform with multiple strategies
6. **MegaPromptGPT + preprompt-web** → Merge into one prompt engineering tool
7. **mypoly → crypto-arb-bot** → Merge as Clawbot executor module

## Spinout Products (Hidden Inside Existing Projects)

1. **live_scorer.html** (ftable-hands) → Standalone "LiveScore" PWA for any tournament organizer
2. **Style DNA engine** (PostPilot) → Brand voice analyzer tool
3. **Celebration patterns** (9soccer) → Drop-in confetti/haptics library
4. **Hebrew date utils** (Heroes-Hadera) → @royea/hebrew-date npm package
5. **Monte Carlo simulator** (letsmakebillions) → Generic risk simulation tool
6. **Multi-format Excel parser** (clubgg) → Python package for robust spreadsheet ingestion

---

# 7. PRIORITIZED MASTER ACTION PLAN

## IMMEDIATE (Do This Week)

| # | Action | Project | Impact | Effort |
|---|--------|---------|--------|--------|
| 1 | **Rotate Anthropic API key** | chicle | CRITICAL | 5 min |
| 2 | **Remove Google OAuth secrets from git history** | ftable-hands | CRITICAL | 30 min |
| 3 | **Audit Wingman git for committed .env/.p8** | Wingman | CRITICAL | 15 min |
| 4 | **Remove Apple signing creds from repo** | 9soccer | HIGH | 10 min |
| 5 | **Move chicle credentials to .env outside web root** | chicle | CRITICAL | 15 min |
| 6 | **Init git repos** for PromptGuard, SecretSauce, FlushQueue, CoinLedger, url-guard | 5 libraries | HIGH | 20 min |
| 7 | **Delete 15 zip files** from ftable | ftable | LOW effort, HIGH cleanup | 5 min |
| 8 | **Clean up postpilot.db** from KeyDrop root | KeyDrop | LOW | 1 min |
| 9 | **Delete Heroes.zip** from Heroes-Hadera | Heroes-Hadera | LOW | 1 min |
| 10 | **Fix duplicated PRICING** in TokenWise | TokenWise | MEDIUM | 15 min |

## NEXT (This Month)

| # | Action | Project | Impact | Effort |
|---|--------|---------|--------|--------|
| 11 | **Publish SecretSauce to npm** (add tests + JSON output) | SecretSauce | HIGH | 1 day |
| 12 | **Extract LemonSqueezy payments into shared-utils** | KeyDrop + PostPilot | HIGH | 0.5 day |
| 13 | **Publish FlushQueue to npm** (add tests + max buffer + backoff) | FlushQueue | HIGH | 0.5 day |
| 14 | **Publish CoinLedger to npm** (add tests + tx history) | CoinLedger | MEDIUM | 0.5 day |
| 15 | **Publish ProjectLearner** (add build system + npm publish) | ProjectLearner | HIGH | 1 day |
| 16 | **Add tests to shared-utils** (crypto, auth, content-filter) | shared-utils | HIGH | 1 day |
| 17 | **Split monolith components**: Game.tsx, page.jsx, web/app.py | 9soccer, preprompt, letsmakebillions | MEDIUM | 2 days |
| 18 | **Fix Supabase key duplication** (centralize in all projects) | ftable, Heroes, chicle | MEDIUM | 0.5 day |
| 19 | **Merge url-guard into shared-utils** | url-guard | LOW effort | 15 min |
| 20 | **Merge mypoly into crypto-arb-bot** as Clawbot executor | mypoly + crypto-arb-bot | LOW | 0.5 day |

## LATER (Next Quarter)

| # | Action | Project | Impact | Effort |
|---|--------|---------|--------|--------|
| 21 | **Build VenueKit config builder** (web UI) | VenueKit | HIGH revenue potential | 3 days |
| 22 | **PostPilot: implement scheduled posting** | PostPilot | HIGH (table-stakes) | 2 days |
| 23 | **PostPilot: replace base64 media with R2/S3** | PostPilot | HIGH (scalability) | 1 day |
| 24 | **9soccer: build content pipeline** | 9soccer | HIGH (core value) | 3 days |
| 25 | **9soccer: wire server-side score persistence** | 9soccer | HIGH (real leaderboard) | 1 day |
| 26 | **ExplainIt: Chrome extension** | ExplainIt | HIGH (viral) | 5 days |
| 27 | **TokenWise: VS Code extension** | TokenWise | MEDIUM | 3 days |
| 28 | **Add build step** to Heroes-Hadera and ftable (esbuild) | Heroes, ftable | MEDIUM | 1 day |
| 29 | **Wingman: AI wingman intros** | Wingman | HIGH (differentiator) | 2 days |
| 30 | **Extract gamification engine** from chicle | chicle | MEDIUM | 2 days |

---

# 8. OPTIONAL PATCH QUEUE

Concrete fixes I can implement immediately if approved:

| # | Fix | Project | Risk |
|---|-----|---------|------|
| 1 | Add .gitignore to ftable-hands (exclude secrets, pycache, pickles) | ftable-hands | None |
| 2 | Delete 15 zip files from ftable root | ftable | None (cleanup) |
| 3 | Delete postpilot.db from KeyDrop root | KeyDrop | None |
| 4 | Fix TokenWise PRICING duplication (extract to pricing.ts) | TokenWise | Low |
| 5 | Fix shared-utils barrel to export all modules | shared-utils | Low |
| 6 | Remove empty db/ and ui/ dirs from shared-utils | shared-utils | None |
| 7 | Merge url-guard into shared-utils | url-guard | Low |
| 8 | Fix `or True` hack in crypto-arb-bot main block | crypto-arb-bot | None |
| 9 | Add .env.example to projects missing it | Multiple | None |
| 10 | Fix `'Prefer': undefined` header in ProjectLearner persistence.js | ProjectLearner | None |
| 11 | Add .gitignore to clubgg (pycache, db, xlsx, bak) | clubgg | None |
| 12 | Delete investigation scripts from clubgg root | clubgg | None |
| 13 | Fix KeyDrop naming: rename Stripe refs to LemonSqueezy | KeyDrop | Low |
| 14 | Move PostPilot dev deps to devDependencies | PostPilot | Low |
| 15 | Init git repos for PromptGuard, SecretSauce, FlushQueue, CoinLedger | 4 projects | None |

---

# APPENDIX: HEALTH SCORES RANKED

| Rank | Project | Health | Quality | Status |
|------|---------|--------|---------|--------|
| 1 | cryptowhale | 8/10 | 8/10 | Production |
| 2 | TokenWise | 8/10 | 8/10 | Published npm |
| 3 | ExplainIt | 7/10 | 7/10 | Production |
| 4 | KeyDrop | 7/10 | 7/10 | MVP |
| 5 | PostPilot | 7/10 | 7/10 | MVP |
| 6 | Wingman | 7/10 | 8/10 | TestFlight |
| 7 | letsmakebillions | 7/10 | 8/10 | Production |
| 8 | ZProjectManager | 7/10 | 7/10 | MVP |
| 9 | ftable | 7/10 | 7/10 | Production |
| 10 | CoinLedger | 6/10 | 7/10 | Draft |
| 11 | crypto-arb-bot | 6/10 | 7/10 | MVP |
| 12 | clubgg | 6/10 | 7/10 | Internal |
| 13 | Heroes-Hadera | 6/10 | 5/10 | Production |
| 14 | ProjectLearner | 6/10 | 7/10 | Unused |
| 15 | shared-utils | 6/10 | 7/10 | Library |
| 16 | SecretSauce | 6/10 | 8/10 | Draft |
| 17 | chicle | 5/10 | 6/10 | Production |
| 18 | FlushQueue | 5/10 | 7/10 | Draft |
| 19 | 9soccer | 5/10 | 6/10 | MVP |
| 20 | VenueKit | 5/10 | 6/10 | Draft |
| 21 | preprompt-web | 5/10 | 6/10 | MVP |
| 22 | MegaPromptGPT | 4/10 | 7/10 | Abandoned |
| 23 | ftable-hands | 4/10 | 5/10 | Active |
| 24 | PromptGuard | 4/10 | 6/10 | Draft |
| 25 | url-guard | 3/10 | 5/10 | Draft |
| 26 | mypoly | 2/10 | 3/10 | Prototype |

**Portfolio average: 5.7/10** — Significant room for improvement, especially in testing, security hygiene, and library formalization.

---

*Generated by Claude Opus 4.6 — Senior AI Technical Auditor*
*5 parallel audit agents, 26 projects scanned, ~438 tool operations*
