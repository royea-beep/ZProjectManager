# EXTRACTION DECISIONS LOG
**Date:** 2026-03-09

---

## Decision 1: shared-utils remains the hub
**Status:** CONFIRMED

shared-utils is the right place for generic, cross-cutting utilities. It currently has 11 modules (~914 lines) with zero bloat. Adding resilience was justified because:
- Zero external dependencies
- 3+ TypeScript projects need it
- Generic pattern (not domain-specific)
- < 120 lines

**Rule:** A module joins shared-utils only if it meets ALL 4 criteria above.

---

## Decision 2: FlushQueue stays standalone
**Status:** CONFIRMED

FlushQueue has 3 active consumers and a distinct identity (event buffering). Merging it into shared-utils would:
- Force all shared-utils consumers to get event buffering code
- Lose the clean single-purpose API
- Make versioning harder (FlushQueue changes shouldn't bump shared-utils)

---

## Decision 3: CoinLedger stays standalone
**Status:** CONFIRMED

CoinLedger is domain-specific (virtual currency). It has:
- Its own adapter pattern (memory, Prisma)
- Domain types (wallets, transactions, debit results)
- Optional peer dependency (@prisma/client)

This doesn't belong in a generic utils package.

---

## Decision 4: PromptGuard stays standalone
**Status:** CONFIRMED

Could arguably merge into shared-utils, but:
- Already has 2+ consumers as standalone
- Wingman has a fork that needs consolidation (easier as standalone package)
- LLM sanitization is a specialized concern
- 73 lines — small enough that standalone overhead is minimal

---

## Decision 5: LemonSqueezy payments NOT extracted
**Status:** DEFERRED to project #3

Analysis showed 65 lines of shared code across KeyDrop and PostPilot. The PLANS config (25 lines) is project-specific and will diverge as products evolve. PostPilot already added `getPlanDisplay()` that KeyDrop doesn't have. Extraction overhead (types, imports, parameterization) exceeds benefit at 2 consumers.

**Trigger to revisit:** When a 3rd project needs LS billing.

---

## Decision 6: Gamification engine NOT extracted
**Status:** PREP FIRST (2-3 week effort)

Chicle's gamification code (coins, streaks, games, discounts) is deeply embedded in a single-file SPA. ~450 lines are interleaved with cart logic, payment handlers, and UI state. Extraction requires:
1. Decouple coin state from App component
2. Extract discount calculation from checkout
3. Isolate game components from onWin callbacks
4. Create adapter pattern for persistence

This is a mini-rewrite, not an extraction. Deferring until chicle itself needs refactoring.

---

## Decision 7: Hebrew date utils NOT extracted
**Status:** LEAVE IN PLACE

Only 3 Hebrew projects exist (Heroes-Hadera, ftable, chicle). The functions are 120 lines of pure code that each project can copy if needed. Creating and maintaining a published package for 3 niche consumers creates more overhead than it saves.

**Trigger to revisit:** When a 4th Hebrew project is created.

---

## Decision 8: Style DNA engine NOT extracted
**Status:** LEAVE IN PLACE

PostPilot is the only consumer. The engine is tightly coupled to PostPilot's Prisma schema (StyleProfile table). Extracting would require an adapter pattern for persistence, and no other project has style analysis needs.

**Trigger to revisit:** When KeyDrop or another project adds content style profiling.

---

## Decision 9: CircuitBreaker ported to TypeScript
**Status:** EXECUTED

cryptowhale's Python CircuitBreaker (33 lines) was ported to TypeScript in shared-utils/resilience. Also added `retryWithBackoff()` with exponential backoff + jitter — a pattern missing from the ecosystem. Python version stays in cryptowhale (no TS dependency needed there).
