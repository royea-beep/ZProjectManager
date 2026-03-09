# MIGRATION QUEUE — Pending Import Migrations
**Updated:** 2026-03-09

---

## READY TO MIGRATE (after npm publish)

### M1: PostPilot → use shared-utils/rate-limit
- **Current:** `src/lib/edge-rate-limit.ts` (27 lines, no cleanup, memory leak risk)
- **Target:** `import { checkRateLimit, API_READ_LIMIT } from '@royea/shared-utils/rate-limit'`
- **Effort:** 10 min
- **Risk:** None (drop-in replacement with better API)
- **Files to change:** `src/middleware.ts`, delete `src/lib/edge-rate-limit.ts`

### M2: PostPilot, KeyDrop, ExplainIt → use shared-utils/resilience
- **Current:** No resilience patterns; bare try/catch on API calls
- **Target:** Wrap external API calls with `CircuitBreaker` and/or `retryWithBackoff()`
- **Effort:** 30 min per project
- **Risk:** Low (additive wrapper, existing behavior preserved on success)
- **Priority targets:**
  - PostPilot: Anthropic API calls in `ai-captions.ts`
  - KeyDrop: LemonSqueezy API calls
  - ExplainIt: Anthropic API calls

### M3: Wingman → consolidate PromptGuard fork
- **Current:** `packages/prompt-guard/` in Wingman monorepo (forked copy)
- **Target:** `npm install @royea/prompt-guard` → update imports
- **Effort:** 15 min
- **Risk:** Low (verify fork hasn't diverged)
- **Blocker:** Publish @royea/prompt-guard to npm first

### M4: ExplainIt, KeyDrop, PostPilot → use npm @royea/flush-queue
- **Current:** Each project has a local copy of FlushQueue code
- **Target:** `npm install @royea/flush-queue` → update imports
- **Effort:** 10 min per project
- **Risk:** None
- **Blocker:** Publish @royea/flush-queue to npm first

---

## FUTURE MIGRATIONS (not yet ready)

### F1: LemonSqueezy payments extraction
- **When:** 3rd project needs LS billing
- **What:** Extract shared `createCheckout`, `verifyWebhook`, `cancelSub` to shared-utils/payments
- **Projects:** KeyDrop, PostPilot, + future SaaS

### F2: Gamification engine extraction
- **When:** Chicle is refactored OR a 2nd project needs gamification
- **What:** Extract coins, streaks, games, badges from chicle SPA to @royea/gamification
- **Projects:** chicle → ftable, 90soccer, Wingman

### F3: Hebrew date utils extraction
- **When:** A 4th Hebrew project is created
- **What:** Extract `formatDateHebrew`, `formatCurrency` from Heroes-Hadera
- **Projects:** Heroes-Hadera, ftable, chicle

---

## TRACKING

| Migration | Status | Date | Notes |
|-----------|--------|------|-------|
| M1 | PENDING | — | PostPilot rate-limit → shared-utils |
| M2 | PENDING | — | Resilience wrappers for 3 projects |
| M3 | PENDING | — | Wingman PromptGuard consolidation |
| M4 | PENDING | — | FlushQueue npm migration |
| F1 | FUTURE | — | LS payments (at project #3) |
| F2 | FUTURE | — | Gamification engine |
| F3 | FUTURE | — | Hebrew date utils |
