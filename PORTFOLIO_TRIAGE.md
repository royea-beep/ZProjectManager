# PORTFOLIO TRIAGE — Project Classification & Investment Strategy
**Date:** 2026-03-09 | **Total Projects:** 26 + 1 standalone file

---

## CLASSIFICATION MATRIX

### Category 1: PROTECT + KEEP INVESTING
*These are the highest-value projects. They deserve active development time.*

| Project | Health | Why Invest | Current Blocker | Next Action |
|---------|--------|-----------|-----------------|-------------|
| **Wingman** | 7/10 | Most ambitious, highest code quality (8/10), real product-market potential, TestFlight active | Possible committed secrets | Security audit → continue TestFlight |
| **PostPilot** | 7/10 | Deployed SaaS, AI + billing working, Style DNA is unique | Base64 media storage, no scheduled posting | Fix media → add scheduled posting |
| **KeyDrop** | 7/10 | Deployed with real encryption + billing, solves real freelancer pain | Naming chaos, Stripe leftover naming | Resolve naming → Product Hunt launch |
| **ExplainIt** | 7/10 | Production SaaS with auth + billing + tests, unique value | Rate limiting removed, file: deps | Re-add rate limiting → market it |
| **ftable** | 7/10 | Production app with real users, comprehensive features | Zip clutter, key duplication | Cleanup → maintain |

### Category 2: FIX + SHIP
*High potential but need specific fixes before they can generate value.*

| Project | Health | What's Missing | Fix Required | Ship Target |
|---------|--------|---------------|-------------|-------------|
| **9soccer** | 5/10 | Fake leaderboard, 1 challenge, no server persistence | Wire real backend + content pipeline | App Store (TestFlight already active) |
| **VenueKit** | 5/10 | Only tested with 1 config, no validation | Add 2nd config + validation + config builder | Sell to poker clubs (₪2,500+/venue) |

### Category 3: EXTRACT UTILITIES FROM IT
*Primary value is in reusable code, not the project itself.*

| Project | Health | What to Extract | Extraction Effort |
|---------|--------|----------------|-------------------|
| **chicle** | 5/10 | Gamification engine (coins, streaks, games, affiliate), 4-language translations | 2 days |
| **Heroes-Hadera** | 6/10 | Hebrew date utils, Supabase OAuth, badge system, content filter | 0.5 day |
| **cryptowhale** | 8/10 | CircuitBreaker, RiskManager, LearningEngine | 0.5 day |
| **letsmakebillions** | 7/10 | MonteCarloSimulator, error tracker, risk manager | 0.5 day |
| **ftable-hands** | 4/10 | live_scorer.html (PWA), OCR name learning, YouTube/Drive managers | 0.5 day |
| **clubgg** | 6/10 | Multi-format Excel parser | 0.5 day |

### Category 4: MERGE INTO ANOTHER PROJECT
*Too small or redundant to exist independently.*

| Project | Health | Merge Into | Rationale |
|---------|--------|-----------|-----------|
| **mypoly** | 2/10 | crypto-arb-bot | 3-file Polymarket client → Clawbot executor module. crypto-arb-bot's Clawbot scanner already monitors Polymarket. |
| **url-guard** | 3/10 | shared-utils | 13 lines of pure re-exports. Zero independent value. `clampMaxScreens` export doesn't even belong. |
| **MegaPromptGPT** | 4/10 | Archive (or preprompt-web) | Only 1 output ever generated. preprompt-web does the same thing with a web UI. |

### Category 5: FREEZE FOR LATER
*Working, no urgent need. Don't invest but don't delete.*

| Project | Health | Current State | Why Freeze |
|---------|--------|--------------|------------|
| **preprompt-web** | 5/10 | Deployed, functional | 90KB monolith, low strategic value. Would need full rebuild to improve. |
| **clubgg** | 6/10 | Internal tool, works | Settlement calculator for a specific club. No growth path. |
| **crypto-arb-bot** | 6/10 | Paper-only scanner, working | No live trading, low priority vs revenue projects. |
| **cryptowhale** | 8/10 | Production, well-tested | Already healthy. Just maintenance when needed. |
| **letsmakebillions** | 7/10 | Production, well-tested | Already healthy. Cleanup web/app.py when time permits. |

### Category 6: ARCHIVE
*No active value. Remove from active workspace.*

| Project | Health | Archive Reason | Action |
|---------|--------|---------------|--------|
| **MegaPromptGPT** | 4/10 | 1 output generated in history. Abandoned. preprompt-web supersedes. | `mv C:\Projects\MegaPromptGPT C:\Projects\_archived\` |
| **CURSOR_MEGA_PROMPT.md** | N/A | One-time prompt file with leaked webhook secrets. Not a project. | Move to private notes, delete from C:\Projects |

### Category 7: MONETIZE ASAP
*Closest to generating revenue. Focus effort here.*

| Project | Revenue Model | Time to First $ | Key Action |
|---------|--------------|-----------------|-----------|
| **SecretSauce** | $29 one-time CLI tool | 1 week | Git init → tests → npm publish → dev community launch |
| **VenueKit** | ₪2,500-5,900/venue | 2 weeks | Add validation → 2nd config → sell to 3 poker clubs |
| **KeyDrop** | $19-49/mo SaaS | 1 week | Fix naming → Product Hunt launch |
| **PostPilot** | $29-79/mo SaaS | 1 week | Add scheduled posting → agency outreach |
| **TokenWise** | Freemium ($29/mo teams) | 2 weeks | VS Code extension → dev community |

### Category 8: PUBLISH AS INFRASTRUCTURE
*Library/utility projects that need formalization.*

| Project | Package Name | Blocker | Publish Effort |
|---------|-------------|---------|----------------|
| **shared-utils** | @royea/shared-utils | Fix barrel + add tests | 1 day |
| **FlushQueue** | @royea/flush-queue | Git init + tests + npm publish | 0.5 day |
| **CoinLedger** | @royea/coin-ledger | Git init + tests + npm publish | 0.5 day |
| **SecretSauce** | @royea/secret-sauce | Git init + tests + npm publish | 1 day |
| **ProjectLearner** | @royea/project-learner | Build system + npm publish | 1 day |
| **PromptGuard** | (merge into shared-utils) | Fix false positives + decide: merge or standalone | 0.5 day |
| **TokenWise** | @royea/tokenwise | Already published v0.4.0 | Fix PRICING only |

---

## INVESTMENT ALLOCATION

If you have 100 units of development time, here's how to allocate:

| Category | Allocation | Projects |
|----------|-----------|----------|
| Security remediation | 10% | chicle, ftable-hands, Wingman, 9soccer |
| Monetizable products | 35% | KeyDrop, PostPilot, VenueKit, SecretSauce |
| Infrastructure/libraries | 20% | shared-utils, FlushQueue, CoinLedger, ProjectLearner |
| Product fixes | 20% | 9soccer, Wingman |
| Maintenance | 10% | ftable, Heroes, cryptowhale |
| Creative upside | 5% | TokenWise extension, ExplainIt extension |

---

## PROJECTS NOT WORTH FURTHER INVESTMENT

| Project | Reason | Keep? |
|---------|--------|-------|
| mypoly | 3 files, no error handling, merge into crypto-arb-bot | Merge then delete |
| MegaPromptGPT | Abandoned (1 output ever), superseded by preprompt-web | Archive |
| url-guard | 13 lines of re-exports | Merge into shared-utils then delete |
| CURSOR_MEGA_PROMPT.md | One-time prompt file with secrets | Delete from Projects |

---

## VISUAL MAP

```
INVEST                              EXTRACT & FREEZE
  |                                      |
  v                                      v
[Wingman]  [PostPilot]  [KeyDrop]    [cryptowhale] [letsmakebillions]
[ExplainIt] [ftable]                 [clubgg] [Heroes] [crypto-arb-bot]
                                     [chicle] [ftable-hands]
  |                                      |
  v                                      v
  SHIP                               ARCHIVE/MERGE
  |                                      |
  v                                      v
[9soccer] [VenueKit]               [MegaPromptGPT] [mypoly] [url-guard]
                                    [CURSOR_MEGA_PROMPT.md]
  |
  v
  PUBLISH (npm)
  |
  v
[shared-utils] [FlushQueue] [CoinLedger] [SecretSauce]
[ProjectLearner] [TokenWise] [PromptGuard]
```
