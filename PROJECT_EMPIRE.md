# Roy's Project Empire — Master Reference

> Last updated: 2026-03-20 | 19 projects, 4 ecosystems
> This document is the single source of truth for all projects, reusable code, and cross-project opportunities.

---

## 1. PROJECT REGISTRY

### Poker Ecosystem (5 projects)

| Project | One-Liner | Status | Stack | URL |
|---------|-----------|--------|-------|-----|
| **ftable** | Israeli poker portal — tournaments, leaderboards, FTC coins, news, clubs directory, reporters | LIVE | Vanilla JS + Supabase + cPanel | ftable.co.il |
| **ftable-hands** | Video highlight detection — OCR hand scanning, clip cutting, player profiles, YouTube upload | Working (local) | Python + OpenCV + ffmpeg | — |
| **clubgg** | Financial settlement for 2-partner poker club (88 weeks, W25-W113) | Done (analysis) | Python + SQLite + Excel | — |
| **Heroes-Hadera** | Tournament registration & league system for Heroes poker club in Hadera | LIVE | Vanilla JS + Supabase | heroes.ftable.co.il |
| **ExplainIt** | Transform websites into explainer videos/PDFs (includes ClubGG templates) | LIVE | Next.js + Playwright + PDFKit + LemonSqueezy | explainit-one.vercel.app |

### Mobile Games (1 project)

| Project | One-Liner | Status | Stack | URL |
|---------|-----------|--------|-------|-----|
| **Caps Poker** | React Native Omaha poker — 4 boards, bot, local + internet multiplayer, WhatsApp bot, visual themes | LIVE | React Native + Expo SDK 55 + TypeScript + Zustand + Supabase | caps.ftable.co.il |

### AI / SaaS Tools (6 projects)

| Project | One-Liner | Status | Stack | URL |
|---------|-----------|--------|-------|-----|
| **PostPilot** | AI social media manager — upload content, get AI captions, publish to platforms | LIVE | Next.js + Prisma + Claude API + LemonSqueezy | postpilot.ftable.co.il |
| **KeyDrop** | Secure credential collection — clients submit API keys via encrypted links | LIVE | Next.js + Prisma + AES-256 + LemonSqueezy | 1-2clicks.vercel.app |
| **TokenWise** | Claude Code cost tracker — hooks into sessions, logs tokens & USD cost | Working (local CLI) | Node.js + sql.js | — |
| **MegaPromptGPT** | CLI prompt expander — short prompt to mega prompt with checkpoints | Working (local CLI) | Python (no deps) | — |
| **preprompt-web** | Web prompt builder with AI suggestions, profiles, versioning, knowledge base | MVP (local) | Next.js + OpenAI API | — |
| **chicle** | E-commerce SPA with gamification, coins, affiliate system, 4 languages | LIVE | Single HTML + React CDN | ftable.co.il/chicle |

### Trading Ecosystem (4 projects)

| Project | One-Liner | Status | Stack | URL |
|---------|-----------|--------|-------|-----|
| **cryptowhale** | Whale-tracking grid trading bot with adaptive learning on Bybit | LIVE | Python + FastAPI + Bybit API | Railway |
| **letsmakebillions** | Prediction market trader — whale tracking on Kalshi/Polymarket, 17-signal ensemble | LIVE | Python + Kalshi/Polymarket API | Railway |
| **crypto-arb-bot** | Multi-engine arbitrage scanner across 5+ crypto exchanges | Working (local) | Python + CCXT | — |
| **mypoly** | Polymarket API setup utility for proxy wallet auth | Incomplete | Python + py-clob-client | — |

### Standalone (2 projects)

| Project | One-Liner | Status | Stack | URL |
|---------|-----------|--------|-------|-----|
| **Wingman** | Dating app where friends vouch for matches (wingman approval gate) | Pre-launch (6.1/10) | React Native + NestJS + Supabase | — |
| **ZProjectManager** | Desktop app managing all 17 projects — sessions, tasks, patterns, launcher | Working (local) | Electron + React + SQLite | — |

---

## 2. REUSABLE LIBRARIES

### 2A. Auth & Security

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| JWT Auth + Refresh | KeyDrop, PostPilot | `src/lib/auth.ts` | 15min access + 7d refresh tokens, bcrypt hashing, token rotation | Any multi-user app |
| AES-256-GCM Crypto | KeyDrop, PostPilot | `src/lib/crypto.ts` | Encrypt/decrypt with unique IVs + auth tags | Sensitive data storage anywhere |
| Auth Context (React) | KeyDrop, PostPilot | `src/lib/auth-context.tsx` | `useAuth()` hook, auto-refresh, `authFetch()` wrapper | Any React app with JWT auth |
| Auth Guard (API) | KeyDrop, PostPilot | `src/lib/auth-guard.ts` | `withAuth()` HOF for protected API routes | Any Next.js API |
| Rate Limiter | KeyDrop, PostPilot, ExplainIt | `src/lib/rate-limit.ts` | In-memory per-IP rate limiting (no Redis) | Any public API |
| SSRF Validator | ExplainIt | `src/lib/validate-url.ts` | URL validation + DNS rebinding + private IP blocking | Any app accepting URLs |
| Firebase Auth Flow | Wingman | `services/auth-state.ts` | Phone auth + state persistence + token refresh | React Native apps |
| Supabase Auth Wrapper | ftable | `js/supabaseClient.js` | OAuth (Google/Facebook), guards, session management | Heroes, any Supabase project |

### 2B. AI & LLM Integration

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| AI Caption Generator | PostPilot | `src/lib/ai-captions.ts` | Claude API → 3 caption styles + Hebrew/English fallbacks | ftable, Heroes announcements |
| Style DNA Engine | PostPilot | `src/lib/style-engine.ts` | Learn brand voice from posts (tone, emoji, hashtags, patterns) | ftable social posting |
| Token Cost Estimator | TokenWise | `src/estimator.ts` | Character → token → USD for Claude models (Opus/Sonnet/Haiku) | ZProjectManager cost tracking |
| Claude Hook Manager | TokenWise | `src/cli.ts` | Install/uninstall Claude Code lifecycle hooks | Any Claude Code extension |
| Claude AI Scorer | letsmakebillions | `ai_scorer.py` | Market quality scoring via Claude API | AI-powered filtering anywhere |
| Claude Chat + Scoring | Wingman | `ai/ai.service.ts` | Conversational AI with prompt injection protection + scoring | AI chatbots, games |
| Prompt Template Engine | MegaPromptGPT | `megaprompt_local.py` | Short prompt → structured mega prompt with checkpoints | Combine with preprompt-web |
| Knowledge Base System | preprompt-web | `lib/kb.js` | Q&A frequency tracking, answer ranking, eviction policy | Any learning system |
| OpenAI Suggestions | preprompt-web | `lib/ai.js` | AI-powered answer suggestions for guided questions | Any form with AI assist |

### 2C. Analytics & Tracking

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| ftTracker.js | ftable | `js/ftTracker.js` | Full analytics: page views, clicks, scroll depth, UTM, sessions, device, share attribution | Heroes (immediate), any web project |
| Error Handler | ftable | `js/errorHandler.js` | Global error catching → Supabase `js_errors` table (rate-limited 5/page) | Heroes, any Supabase project |
| Token Usage Logger | TokenWise | `src/logger.ts` | Claude Code hook event processing + SQL storage | ZProjectManager |
| Mixpanel Integration | Wingman | `services/analytics.ts` | Event tracking hooks for user behavior | Any app needing analytics |
| Sentry Integration | Wingman | `services/sentry.ts` | Crash reporting with 401/403 filtering | Any production app |

### 2D. UI Components & Patterns

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| Web Components (14) | ftable | `components/*.js` | navbar, footer, cookie-consent, daily-checkin, bottom-nav, etc. | Heroes, any static site |
| Mini Games | chicle | `index.html` (inline) | Spin wheel, scratch card, coin catcher games | ftable FTC earning |
| Translation System | chicle | `index.html` (TX object) | 4-language dictionary (HE/EN/AR/RU) with RTL | Any multilingual app |
| Language Context | ExplainIt | `src/lib/language-context.tsx` | React bilingual provider (HE/EN) + RTL toggle | Any React app |
| Error Boundary | ExplainIt | `src/components/ErrorBoundary.tsx` | React error boundary with recovery UI | Any React app |
| Theme System | preprompt-web | `app/page.jsx` | CSS variable dark/light + localStorage persistence | Any web app |
| Version Diff Viewer | preprompt-web | `lib/versions.js` | LCS diff algorithm for text comparison | Code review, prompt iteration |
| Markdown Renderer | preprompt-web, chicle | `lib/` / inline | Regex-based inline markdown → HTML (no deps) | Any app rendering markdown |
| Toast Notifications | ftable, Heroes | `supabaseClient.js`, `utils.js` | Animated toast system | Any web app |

### 2E. Data & Storage

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| SQLite WASM Wrapper | TokenWise | `src/database.ts` | sql.js lazy-load, auto-migration, PRAGMA setup | ZProjectManager, any Node.js app |
| Prisma Singleton | PostPilot, KeyDrop | `src/lib/db.ts` | Single PrismaClient instance with dev reuse | Any Prisma app |
| **DB convention** | PostPilot, KeyDrop | — | SQLite local (`file:./*.db`), Postgres in production; per-project choice recorded in ZProjectManager decisions/patterns | Next.js+Prisma apps |
| JSONL Database | MegaPromptGPT | `megaprompt_local.py` | Append/read JSONL with safe I/O | Lightweight data storage |
| SQLite Connection | clubgg | `db/connection.py` | Python SQLite with WAL, foreign keys, auto-schema | Python data projects |
| Safe File I/O | MegaPromptGPT | `megaprompt_local.py` | Pathlib-based read/write with parent mkdir | Any Python project |
| Atomic JSON Save | ftable-hands | `utils.py` | Write to .tmp then rename (crash-safe) | Any project saving JSON |
| CSV Export | Heroes | `js/utils.js` | `exportToCSV()` with BOM for Hebrew support | Any project needing exports |

### 2F. Video & Media

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| Capture Engine | ExplainIt | `src/lib/capture-engine.ts` | Playwright screenshots + element detection + URL discovery | Auto-generate tutorials |
| Video Producer | ExplainIt | `src/lib/video-producer.ts` | HTML animation videos (no FFmpeg) with zoom/pan/cursor | Promo videos for any project |
| PDF Generator | ExplainIt | `src/lib/pdf-generator.ts` | PDFKit annotated docs + markdown companion | Documentation for any project |
| OCR Pipeline | ftable-hands | `chip_count_ocr.py` | Ticker + overlay parsing, name fuzzy matching | Video text extraction |
| Name Learning | ftable-hands | `name_learning.py` | OCR correction patterns, 3-category classification | Any OCR project |
| Player Photos | ftable-hands | `player_db.py` | Auto-capture player photos from video, caching | Video-based profile generation |
| Video Utilities | ftable-hands | `utils.py` | SafeVideoCapture, ffprobe duration, time formatting | Any video project |
| Cloudflare R2 Upload | Wingman | `photos/r2.service.ts` | S3-compatible upload/delete/presigned URLs | Any file upload system |

### 2G. Communication & Notifications

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| Socket.IO Chat | Wingman | `services/socket.ts` | Real-time messaging with reconnection + exponential backoff | ftable community chat |
| FCM Push Notifications | Wingman | `notification/fcm.service.ts` | Multi-device push with stale token cleanup | Any mobile app |
| Web Push + SW | ftable, Heroes | `sw.js`, `notifications.js` | Service Worker push handling + subscription management | Any web app |
| FTC Reward Toasts | ftable | `js/ftcRewards.js` | Animated reward toast with confetti (80 particles!) | Gamification in any project |
| Social Auto-Post | ftable | `supabase/functions/auto-post-social` | Edge function for automatic social media posting | Connect to PostPilot |

### 2H. Trading Infrastructure

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| Risk Manager | crypto-arb-bot, cryptowhale | `risk/manager.py` | Bankroll limits, drawdown triggers, kill switch, leverage controls | All trading bots |
| Whale Tracker | cryptowhale | `core/whale_tracker.py` | On-chain whale classification + tiered profiles | letsmakebillions |
| Signal Engine | cryptowhale | `core/signal_engine.py` | Multi-signal with freshness decay + alpha lag detection | Any signal-based system |
| Grid Executor | cryptowhale | `core/grid_executor.py` | Adaptive grid orders with partial fills | Grid trading |
| Paper Trader | crypto-arb-bot | `executor/paper_trader.py` | Simulated execution with P&L tracking | Strategy testing |
| Trade Log + Analyzer | crypto-arb-bot | `learner/trade_log.py` | Structured opportunity logging + edge analysis | Any trading bot |
| Shark Council | letsmakebillions | `shark_council.py` | 17-signal ensemble learner with gradient descent | Adaptive signal weighting |
| Kalshi Client | letsmakebillions | `kalshi_client.py` | RSA-authenticated API wrapper (cloud-ready) | Any Kalshi integration |
| Polymarket Client | mypoly | `trade.py` | Unified API wrapper (balance, search, orders) | Any Polymarket bot |
| Fee Calculator | crypto-arb-bot | `risk/fee_calc.py` | Multi-exchange fee computation (maker/taker/triangular) | Any exchange integration |
| Backtest Engine | cryptowhale | `backtest/engine.py` | Historical trade simulation + Sharpe ratio | Strategy validation |
| Monte Carlo Sim | cryptowhale | `analysis/monte_carlo.py` | 1,000-path portfolio resilience testing | Risk analysis |

### 2I. Packaged mini-utils (@royea/*)

| Library | Package | What It Does | Used In Now | Can Use In Next |
|---------|---------|--------------|-------------|------------------|
| url-guard | @royea/url-guard | SSRF-safe URL validation plus DNS rebinding; validateUrl, validateResolvedIp, clampMaxScreens. | ExplainIt (shared-utils), PostPilot (lib/url-validate.ts for future logoUrl/website). | Any API that accepts user URLs. |
| PromptGuard | @royea/prompt-guard | Sanitize user text before LLMs: PII masking and prompt-injection blocking. | Wingman (ai.service), PostPilot (ai-captions), **preprompt-web** (lib/ai.js before OpenAI). | Any app sending user text to an LLM. |
| CoinLedger | @royea/coin-ledger | Virtual currency: credit/debit/balance, idempotency, in-memory and Prisma adapters. | — | Wingman, ftable, chicle, any app with coins. |
| FlushQueue | @royea/flush-queue | Client event buffer, batch POST to endpoint, retry, offline persist. | PostPilot, **KeyDrop** (Prisma AnalyticsEvent), **ExplainIt** (API only, no persistence yet). | Wingman (analytics). |

### 2J. Gamification & Economy

| Library | Source Project | File(s) | What It Does | Can Use In |
|---------|--------------|---------|-------------|------------|
| FTC Coin Economy | ftable | `js/ftcRewards.js` + Edge Functions | Earn/spend coins with dedup, streak bonuses | Heroes tournament rewards |
| Coin Economy Constants | Wingman | `packages/shared/constants.ts` | Structured rewards, daily caps, level tiers | Any gamified app |
| Affiliate System | chicle | `index.html` (inline) | 3-tier referral tracking with commissions | ftable referral program |
| Loyalty Tiers | chicle | `index.html` (inline) | 6 loyalty levels based on spend | ftable player tiers |
| Service Templates | KeyDrop | `src/lib/templates.ts` | 20+ pre-built API service templates (bilingual) | Any credential collection |

---

## 3. CROSS-PROJECT OPPORTUNITIES

### 3A. Quick Wins (copy a file, instant value)

| # | Action | From | To | Effort | Impact |
|---|--------|------|----|--------|--------|
| 1 | Copy ftTracker.js to Heroes | ftable | Heroes | 10 min | Full analytics instantly |
| 2 | Copy errorHandler.js to Heroes | ftable | Heroes | 5 min | Error logging instantly |
| 3 | Upgrade Heroes supabase-config to full supabaseClient.js | ftable | Heroes | 30 min | Auth guards, OAuth, toast, XSS |
| 4 | Copy rate-limit.ts to any new API | KeyDrop/PostPilot | Any | 5 min | DDoS protection |
| 5 | Use TokenWise estimator in ZProjectManager | TokenWise | ZPM | 1 hr | Show AI cost per project |
| 6 | Add FlushQueue to KeyDrop or ExplainIt | FlushQueue | KeyDrop / ExplainIt | 1 hr | Client analytics/events with batch + retry |

### 3B. Medium Effort (adapt + integrate)

| # | Action | From | To | Effort | Impact |
|---|--------|------|----|--------|--------|
| 6 | Connect PostPilot to ftable social posting | PostPilot | ftable | 1 day | Auto-generate tournament/news posts |
| 7 | Add mini-games to ftable FTC | chicle | ftable | 2 days | Spin wheel + scratch card for earning FTC |
| 8 | Add Socket.IO chat to ftable | Wingman | ftable | 2 days | Real-time community chat |
| 9 | Use ExplainIt to generate ftable tutorials | ExplainIt | ftable | 1 day | Auto video guides for club reg, FTC |
| 10 | Deploy Heroes-Hadera to cPanel | Heroes | Production | 1 day | Heroes club goes live |
| 11 | Merge MegaPrompt + preprompt-web | Both | Combined | 2 days | One tool with CLI + web + knowledge base |
| 12 | Connect ftable-hands YouTube upload to ftable | ftable-hands | ftable | 1 day | Auto-publish highlights to site |

### 3C. Big Builds (new shared libraries)

| # | Action | Projects Involved | Effort | Impact |
|---|--------|------------------|--------|--------|
| 13 | Extract shared auth library (`@roy/auth`) | KeyDrop + PostPilot | 3 days | Reusable auth for all future SaaS |
| 14 | Build cross-project dashboard in ZPM | All 17 | 3 days | Visualize synergies, track reuse |
| 15 | Unify trading risk manager | 3 trading bots | 2 days | Single battle-tested risk lib |
| 16 | Build "Project Synergy" page in ZPM | All 17 | 2 days | Interactive map of what connects where |
| 17 | Create ftable-shared package | ftable + Heroes | 2 days | Shared utils, analytics, components |

---

## 4. TECH STACK MATRIX

### Frontend Frameworks
| Stack | Projects |
|-------|----------|
| Vanilla JS + HTML | ftable, Heroes, chicle, clubgg (reports) |
| Next.js (React) | PostPilot, KeyDrop, ExplainIt, preprompt-web |
| React (Electron) | ZProjectManager |
| React Native (Expo) | Wingman, **Caps Poker** |

### Backend / Runtime
| Stack | Projects |
|-------|----------|
| Supabase (PostgreSQL + Edge Functions) | ftable, Heroes, Wingman |
| Prisma + PostgreSQL (Neon) | PostPilot, KeyDrop |
| Python + FastAPI | cryptowhale |
| Python + raw HTTP | letsmakebillions |
| Python + Tkinter | ftable-hands, clubgg |
| NestJS | Wingman (API) |
| Node.js CLI | TokenWise, MegaPromptGPT |
| Electron + SQLite | ZProjectManager |

### AI Integration
| Service | Projects |
|---------|----------|
| Claude API (Anthropic) | PostPilot, Wingman, cryptowhale, letsmakebillions, **Caps Poker (WhatsApp bot)** |
| OpenAI API (Whisper) | preprompt-web, **Caps Poker (WhatsApp audio transcription)** |
| No AI | ftable, Heroes, KeyDrop, TokenWise, chicle, clubgg, ftable-hands, crypto-arb-bot, mypoly |

### Deployment
| Platform | Projects |
|----------|----------|
| Vercel | PostPilot, ExplainIt |
| cPanel (FTP) | ftable, chicle |
| Railway | cryptowhale, letsmakebillions |
| Local only | ZProjectManager, TokenWise, MegaPromptGPT, preprompt-web, ftable-hands, clubgg, crypto-arb-bot, mypoly |
| Not deployed | KeyDrop, Heroes, Wingman |

---

## 5. DEPLOYMENT MAP

### LIVE (9 projects)
- ftable.co.il — cPanel
- heroes.ftable.co.il — cPanel
- caps.ftable.co.il — Vercel (React Native web + iOS TestFlight)
- explainit-one.vercel.app — Vercel
- postpilot.ftable.co.il — Vercel
- 1-2clicks.vercel.app (KeyDrop) — Vercel
- analyzer.ftable.co.il — Vercel
- cryptowhale — Railway
- letsmakebillions — Railway

### READY TO DEPLOY (0 projects)
- All previously pending projects are now live

### LOCAL TOOLS (6 projects)
- ZProjectManager — Electron desktop app
- TokenWise — CLI tool
- MegaPromptGPT — CLI tool
- preprompt-web — local dev server
- ftable-hands — Python desktop scripts
- crypto-arb-bot — local scanner

### PRE-LAUNCH (1 project)
- Wingman — needs 8-12 critical fixes, then TestFlight/Play Store

### DONE / ARCHIVE (2 projects)
- clubgg — settlement analysis complete (R owes A = 61,938)
- mypoly — incomplete setup utility (merged into letsmakebillions)

### DORMANT (1 project)
- chicle — deployed but has 165 audit issues (score 3.2/10)

---

## 6. GITHUB REPOS

All public under github.com/royea-beep:
- PostPilot, ExplainIt, KeyDrop, ZProjectManager, TokenWise
- Wingman, cryptowhale, ftable, letsmakebillions
