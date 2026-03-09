# SHARED ARCHITECTURE PLAN
**Date:** 2026-03-09 | **Status:** Active

---

## Architecture Decision: Hub + Satellites

```
@royea/shared-utils (HUB)          STANDALONE PACKAGES (SATELLITES)
├── errors/                        @royea/flush-queue (event buffering)
├── content-filter/                @royea/coin-ledger (virtual currency)
├── rate-limit/                    @royea/prompt-guard (LLM sanitization)
├── analytics/                     @royea/secret-sauce (business logic scanner)
├── auth/                          @royea/tokenwise (already published v0.4.0)
├── auth-context (React)           @royea/project-learner (future)
├── auth-guard/
├── crypto/                        PYTHON PACKAGES (not npm)
├── i18n/                          cryptowhale (CircuitBreaker stays in Python)
├── validate-url/                  letsmakebillions (MonteCarloSimulator)
└── resilience/ ← NEW
```

## Why This Split

**shared-utils** contains generic, cross-cutting utilities that any TypeScript project might need:
- Error handling, rate limiting, crypto, auth, content filtering, URL validation, resilience

**Standalone packages** contain domain-specific logic with their own identity:
- FlushQueue: client-side event buffering (3 active consumers)
- CoinLedger: virtual currency with adapter pattern (domain-specific)
- PromptGuard: LLM input sanitization (specialized concern)
- SecretSauce: CLI tool for business logic scanning (completely different tool)
- TokenWise: AI cost estimation (already published)

## Decision Criteria

A module goes in **shared-utils** if:
1. It's a generic utility (not domain-specific)
2. It has no runtime dependencies beyond shared-utils' existing deps
3. Multiple project types can use it (Next.js, Electron, vanilla Node)
4. It's < 200 lines

A module becomes a **standalone package** if:
1. It has its own CLI or distinct identity
2. It has domain-specific types (wallets, events, prompts)
3. It already has 2+ active consumers as standalone
4. It needs different peer dependencies

## Package Status

| Package | Version | npm Published | Build | Tests | Consumers |
|---------|---------|---------------|-------|-------|-----------|
| @royea/shared-utils | 1.0.0 | No | Yes | No | 8+ projects |
| @royea/flush-queue | 1.0.0 | No | Yes | No | ExplainIt, KeyDrop, PostPilot |
| @royea/coin-ledger | 1.0.0 | No | Yes | No | 0 (ready for Wingman, ftable) |
| @royea/prompt-guard | 1.0.0 | No | Yes | No | PostPilot, preprompt-web |
| @royea/secret-sauce | 0.1.0 | No | Yes | No | 0 (CLI tool) |
| @royea/tokenwise | 0.4.0 | **Yes** | Yes | Yes | External users |

## Publish Order

1. **@royea/flush-queue** — highest leverage (3 active consumers copying code)
2. **@royea/prompt-guard** — security utility, consolidate Wingman fork
3. **@royea/shared-utils** — foundation for everything else
4. **@royea/coin-ledger** — deploy to first consumer, then publish
5. **@royea/secret-sauce** — needs tests first, then dev community launch

## NOT Extracting (with reasons)

| Candidate | Reason |
|-----------|--------|
| LemonSqueezy payments | Only 2 consumers, 65 shared lines. Extract at project #3. |
| Gamification engine | 450 lines deeply embedded in chicle SPA. Needs 2-3 week rewrite. |
| Style DNA engine | 1 consumer (PostPilot), tightly coupled to Prisma schema. |
| Hebrew date utils | 3 Hebrew projects, low compound leverage vs portfolio size. |
| Edge rate limiter | shared-utils already has a superior version. Just import it. |
