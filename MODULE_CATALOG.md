# MODULE CATALOG — Roy's Package Ecosystem
**Updated:** 2026-03-09

---

## @royea/shared-utils
**Location:** `C:\Projects\shared-utils` | **Version:** 1.0.0 | **npm:** Not yet

| Module | Import Path | Lines | Dependencies | Description |
|--------|-------------|-------|-------------|-------------|
| errors | `@royea/shared-utils/errors` | 119 | None | Global error handler (Supabase, HTTP, callback modes) |
| content-filter | `@royea/shared-utils/content-filter` | ~80 | None | Content validation and sanitization |
| rate-limit | `@royea/shared-utils/rate-limit` | 97 | None | In-memory rate limiter with pre-configured profiles |
| analytics | `@royea/shared-utils/analytics` | ~60 | None | Event tracking (initTracker, track) |
| auth | `@royea/shared-utils/auth` | ~100 | bcryptjs, jsonwebtoken | Password hashing, JWT access/refresh tokens |
| crypto | `@royea/shared-utils/crypto` | ~80 | None (Node crypto) | AES-256-GCM encrypt/decrypt |
| i18n | `@royea/shared-utils/i18n` | ~120 | React | LanguageProvider, useLanguage (HE/EN RTL) |
| validate-url | `@royea/shared-utils/validate-url` | ~40 | None | URL validation with SSRF protection |
| resilience | `@royea/shared-utils/resilience` | 118 | None | CircuitBreaker + retryWithBackoff |
| auth-context | `@royea/shared-utils/auth-context` | ~60 | React | React auth context provider |
| auth-guard | `@royea/shared-utils/auth-guard` | ~40 | Next.js | Next.js route guard middleware |

**Total:** ~914 lines across 11 modules

---

## @royea/flush-queue
**Location:** `C:\Projects\FlushQueue` | **Version:** 1.0.0 | **npm:** Ready to publish

| Export | Type | Description |
|--------|------|-------------|
| `createFlushQueue(config)` | Function | Create event buffer instance |
| `QueueEvent` | Type | Event shape (id, type, payload, timestamp) |
| `StorageAdapter` | Type | Pluggable storage (localStorage default, MMKV for RN) |
| `FlushQueueConfig` | Type | Configuration (endpoint, batchSize, flushIntervalMs) |

**Lines:** 153 | **Deps:** Zero | **Consumers:** ExplainIt, KeyDrop, PostPilot

---

## @royea/coin-ledger
**Location:** `C:\Projects\CoinLedger` | **Version:** 1.0.0 | **npm:** Ready to publish

| Export | Import Path | Type | Description |
|--------|-------------|------|-------------|
| `credit()` | `@royea/coin-ledger` | Function | Add coins to wallet |
| `debit()` | `@royea/coin-ledger` | Function | Subtract coins (fails if insufficient) |
| `getBalance()` | `@royea/coin-ledger` | Function | Get current balance |
| `getWallet()` | `@royea/coin-ledger` | Function | Get full wallet record |
| Types | `@royea/coin-ledger/types` | Interfaces | LedgerWallet, LedgerTransaction, LedgerAdapter |
| MemoryAdapter | `@royea/coin-ledger/adapters/memory` | Class | In-memory adapter (tests/demos) |

**Lines:** 371 | **Deps:** None (Prisma optional peer) | **Consumers:** Ready for Wingman, ftable, chicle

---

## @royea/prompt-guard
**Location:** `C:\Projects\PromptGuard` | **Version:** 1.0.0 | **npm:** Ready to publish

| Export | Type | Description |
|--------|------|-------------|
| `sanitizeForLlm(text, options?)` | Function | Mask PII + block prompt injection |
| `SanitizeOptions` | Interface | Config (maskPii, blockInjection, maxLength) |

**Lines:** 73 | **Deps:** Zero | **Consumers:** PostPilot, preprompt-web (+ Wingman fork to consolidate)

---

## @royea/secret-sauce
**Location:** `C:\Projects\SecretSauce` | **Version:** 0.1.0 | **npm:** Needs tests first

| Export | Type | Description |
|--------|------|-------------|
| `scan(dir)` | Function | Scan codebase for business logic patterns |
| `rate(findings)` | Function | Rate uniqueness (1-5 stars) |
| `protect(findings)` | Function | Suggest protection levels |
| `formatReport()` | Function | Generate formatted report |
| CLI binary | `secret-sauce` | CLI tool for terminal use |

**Lines:** 1,012 | **Deps:** Zero | **Consumers:** None yet (standalone tool)

---

## @royea/tokenwise
**Location:** `C:\Projects\TokenWise` | **Version:** 0.4.0 | **npm:** Published

| Export | Type | Description |
|--------|------|-------------|
| `estimateCost()` | Function | Estimate LLM API cost |
| `TokenBadge` | Component | React badge showing cost |
| Dashboard | Web UI | Live cost dashboard |

**Lines:** ~800 | **Deps:** React (optional) | **Published:** Yes

---

## Python Modules (not npm)

| Module | Location | What It Does |
|--------|----------|-------------|
| CircuitBreaker | `cryptowhale/runner.py:59` | API failure circuit breaker (TS port in shared-utils) |
| RiskManager | `cryptowhale/runner.py` | Position sizing + risk limits |
| MonteCarloSimulator | `letsmakebillions/` | Strategy backtesting simulation |
| Multi-format Excel parser | `clubgg/` | ClubGG settlement calculations |
