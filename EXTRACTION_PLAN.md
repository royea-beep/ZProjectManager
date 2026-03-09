# EXTRACTION PLAN — Reusable Utilities & Shared Leverage
**Date:** 2026-03-09 | **Priority:** Wave 3 (after security + stabilization)

---

## EXTRACTION OVERVIEW

7 priority extractions identified from the audit. Goal: reduce duplication, create publishable npm packages, build a shared foundation layer.

---

## Extraction 1: LemonSqueezy Payments → shared-utils/payments
**Priority:** #1 | **Effort:** 4 hours | **Impact:** HIGH

**Source Files:**
- `C:\Projects\KeyDrop\src\lib\payments.ts`
- `C:\Projects\PostPilot\src\lib\payments.ts`

**What It Does:**
- Create LemonSqueezy checkout URLs
- Verify webhook HMAC signatures (timing-safe)
- Check subscription status and plan limits
- Display plan info safely (without exposing variant IDs)

**Extraction Steps:**
1. Diff KeyDrop and PostPilot payments.ts to identify shared interface
2. Create `C:\Projects\shared-utils\src\payments\index.ts`
3. Parameterize plan configs (pass as options, not hardcoded)
4. Export: `createCheckout()`, `verifyWebhook()`, `getSubscriptionStatus()`, `getPlanDisplay()`, `PlanConfig` type
5. Update KeyDrop and PostPilot to import from `@royea/shared-utils/payments`
6. Add tests for webhook verification and plan resolution

**Target Users:** KeyDrop, PostPilot, ExplainIt, VenueKit, any future SaaS

**Shared Interface (draft):**
```typescript
interface PlanConfig {
  name: string;
  variantId: string;
  limits: Record<string, number>;
  price: { amount: number; currency: string; period: string };
}

interface PaymentModule {
  createCheckout(variantId: string, userId: string, email: string): Promise<string>;
  verifyWebhook(payload: string, signature: string, secret: string): boolean;
  getSubscription(customerId: string): Promise<SubscriptionInfo>;
  getPlanDisplay(plans: PlanConfig[]): SafePlanDisplay[];
}
```

---

## Extraction 2: Edge Rate Limiter → shared-utils/rate-limit (upgrade)
**Priority:** #2 | **Effort:** 2 hours | **Impact:** HIGH

**Source:** `C:\Projects\PostPilot\src\lib\edge-rate-limit.ts`

**What It Does:**
- Edge-runtime-compatible rate limiting (no Node.js APIs)
- Per-route rule configuration
- Sliding window algorithm

**Extraction Steps:**
1. Read PostPilot's edge-rate-limit.ts
2. Compare with existing shared-utils rate-limit module
3. Either upgrade existing module or add as `rate-limit-edge.ts` variant
4. Export both memory-based (Node) and edge-compatible versions

**Target Users:** All Next.js projects deployed to Vercel Edge

---

## Extraction 3: CircuitBreaker → shared-utils/resilience
**Priority:** #3 | **Effort:** 2 hours | **Impact:** MEDIUM

**Source:** cryptowhale `core/` (Python → rewrite in TypeScript)

**What It Does:**
- Monitors API call failures
- Opens circuit after N failures in time window
- Half-open state for recovery testing
- Configurable thresholds and timeouts

**Extraction Steps:**
1. Read cryptowhale's CircuitBreaker implementation
2. Port to TypeScript for the shared-utils ecosystem
3. Create `C:\Projects\shared-utils\src\resilience\index.ts`
4. Export: `CircuitBreaker` class, `CircuitState` enum

**Note:** Python version stays in cryptowhale/letsmakebillions. TypeScript version for web projects.

**Target Users:** Any project calling external APIs (ExplainIt, PostPilot, KeyDrop)

---

## Extraction 4: Gamification Engine → @royea/gamification
**Priority:** #4 | **Effort:** 2 days | **Impact:** HIGH

**Source:** chicle `index.html` (embedded in 260KB SPA)

**What It Includes:**
- Virtual coins (earn, spend, balance tracking)
- Streak system (daily check-in, streak counter, streak rewards)
- Mini-games (spin wheel, scratch card)
- Achievement badges
- Affiliate/referral tracking
- Leaderboard

**Extraction Steps:**
1. Identify all gamification-related useState hooks and functions in chicle
2. Extract into modular TypeScript files:
   - `coins.ts` — earn/spend/balance
   - `streaks.ts` — daily check-in, streak tracking
   - `games.ts` — spin wheel, scratch card logic
   - `badges.ts` — achievement definitions and tracking
   - `affiliate.ts` — referral link generation and tracking
   - `leaderboard.ts` — ranking computation
3. Create `C:\Projects\gamification\` as new npm package
4. Add React hooks: `useCoins()`, `useStreak()`, `useBadges()`
5. Add persistence adapter (localStorage default, Supabase optional)
6. Wire CoinLedger as the underlying coin storage

**Target Users:** ftable, 90soccer, Heroes-Hadera, Wingman

**Depends On:** CoinLedger published first (Extraction 4 uses it as storage backend)

---

## Extraction 5: live_scorer.html → Standalone PWA
**Priority:** #5 | **Effort:** 2 hours | **Impact:** MEDIUM

**Source:** `C:\Projects\ftable-hands\live_scorer.html`

**What It Does:**
- Offline-capable tournament scoring app
- Mobile-optimized UI
- Zero dependencies (single HTML file)

**Extraction Steps:**
1. Copy `live_scorer.html` to a new mini-project or deploy directly
2. Add PWA manifest + service worker (if not already present)
3. Deploy to ftable.co.il/scorer/ or separate domain
4. Optional: add GitHub Pages deployment

**Target Users:** Poker clubs, sports league organizers, gaming events

---

## Extraction 6: Hebrew Date Utils → @royea/hebrew-date
**Priority:** #6 | **Effort:** 3 hours | **Impact:** LOW-MEDIUM

**Source:** `C:\Projects\Heroes-Hadera\js\utils.js`

**What It Includes:**
- Hebrew month/day names
- Hebrew date formatting (יום שני, 9 במרץ 2026)
- Countdown timers with Hebrew labels
- Currency formatting (₪)
- HTML escaping

**Extraction Steps:**
1. Extract Hebrew-specific functions from utils.js
2. Create TypeScript package with proper types
3. Publish as `@royea/hebrew-date`

**Target Users:** Heroes-Hadera, ftable, chicle, 90soccer, any Hebrew project

---

## Extraction 7: Style DNA Engine → @royea/style-dna
**Priority:** #7 | **Effort:** 4 hours | **Impact:** MEDIUM

**Source:** `C:\Projects\PostPilot\src\lib\style-engine.ts`

**What It Does:**
- Analyzes content history to build brand voice profile
- Detects: tone, emoji style, hashtag patterns, caption length, vocabulary
- Generates style constraints for AI caption generation

**Extraction Steps:**
1. Read style-engine.ts
2. Extract into standalone npm package
3. Remove PostPilot-specific dependencies
4. Add generic `analyzeContent(posts: string[]): StyleProfile` API

**Target Users:** PostPilot (stays as primary consumer), potential standalone product

---

## PACKAGES TO PUBLISH (npm)

After extractions, the following should be published:

| Package | Source | Status | Blocker |
|---------|--------|--------|---------|
| `@royea/shared-utils` | shared-utils/ | **Barrel fixed + resilience added** (2d35b46) | Tests |
| `@royea/flush-queue` | FlushQueue/ | **Git init + npm prep done** (153626e) | Tests → publish |
| `@royea/coin-ledger` | CoinLedger/ | **Git init + npm prep done** (5c99367) | Tests → publish |
| `@royea/secret-sauce` | SecretSauce/ | **Git init done** | Tests → publish |
| `@royea/project-learner` | ProjectLearner/ | Has code, needs build system | Build script |
| `@royea/tokenwise` | TokenWise/ | **Already published** v0.4.0 | Fix PRICING duplication |
| `@royea/prompt-guard` | PromptGuard/ | **Git init + npm prep done** (84e58a9) | Tests → publish |

---

## PROJECT MERGES

| Source | Target | What Moves | What Gets Deleted |
|--------|--------|-----------|-------------------|
| url-guard | shared-utils | Nothing (already a re-export) | Entire url-guard/ folder |
| mypoly | crypto-arb-bot | `trade.py`, `setup_api.py` → `executor/polymarket.py` | Entire mypoly/ folder |
| MegaPromptGPT | _archived/ | Nothing (archive as-is) | Removed from active projects |
