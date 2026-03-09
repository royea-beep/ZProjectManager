# EXTRACTION EXECUTION LOG
**Date:** 2026-03-09 | **Mode:** EXTRACTION MODE

---

## EXECUTED EXTRACTIONS (4 repos, 4 commits)

### E3: CircuitBreaker → shared-utils/resilience
- **Commit:** `2d35b46` (shared-utils)
- **Source:** `C:\Projects\cryptowhale\runner.py` lines 59-91 (Python)
- **Target:** `C:\Projects\shared-utils\src\resilience\index.ts`
- **What:** Ported 33-line Python CircuitBreaker to TypeScript, added `retryWithBackoff()` with exponential backoff + jitter
- **Exports:** `CircuitBreaker` class, `CircuitState` type, `retryWithBackoff()`, `CircuitBreakerConfig`, `RetryConfig`
- **Why now:** 3+ TypeScript projects (PostPilot, KeyDrop, ExplainIt) call external APIs with no resilience pattern. Fills a real gap.
- **Risk:** Zero — additive module, no existing code modified beyond barrel export
- **Verification:** `npx tsc --noEmit` passes clean

### NPM Publish Prep: FlushQueue
- **Commit:** `153626e` (FlushQueue)
- **Change:** Added `exports` map, `files` field, `author`, `repository`, `keywords`, `prepublishOnly` script
- **Ready for:** `npm publish` (needs `npm run build` first)

### NPM Publish Prep: PromptGuard
- **Commit:** `84e58a9` (PromptGuard)
- **Change:** Same npm publish prep as FlushQueue
- **Ready for:** `npm publish`

### NPM Publish Prep: CoinLedger
- **Commit:** `5c99367` (CoinLedger)
- **Change:** Added sub-path exports (`./types`, `./adapters/memory`), `files`, `author`, `repository`, `keywords`
- **Ready for:** `npm publish`

---

## CANDIDATES ASSESSED & DEFERRED

| Candidate | Verdict | Rationale |
|-----------|---------|-----------|
| LemonSqueezy Payments | NOT NOW | 65 shared lines across 2 projects. Extraction overhead > benefit. Revisit at project #3. |
| Edge Rate Limiter | MERGE INTO EXISTING | PostPilot should import `@royea/shared-utils/rate-limit` instead of its 27-line local copy. 10-min refactor. |
| Gamification Engine | PREP FIRST | 450 lines deeply embedded in chicle SPA (coins, streaks, games, discounts all interleaved). Requires 2-3 week decoupling effort. |
| Hebrew Date Utils | LEAVE IN PLACE | Only 3 Hebrew projects need it. 120 lines of pure functions. Low compound leverage. |
| Style DNA Engine | LEAVE IN PLACE | 1 consumer (PostPilot), tightly coupled to Prisma schema. Premature extraction. |
| live_scorer PWA | LEAVE IN PLACE | Single HTML file, already works. Just deploy it, don't extract it. |
| SecretSauce | NPM PREP DONE (prior session) | Already has git repo. Needs tests before npm publish. |

---

## SUMMARY

- **New module created:** shared-utils/resilience (CircuitBreaker + retryWithBackoff)
- **Libraries prepped for npm:** 3 (FlushQueue, PromptGuard, CoinLedger)
- **Repos touched:** 4 (shared-utils, FlushQueue, PromptGuard, CoinLedger)
- **Total commits:** 4
- **Candidates assessed:** 11
- **Candidates deferred:** 7 (with documented reasons)
- **Signal-to-noise:** High — only extracted what creates real compound value
