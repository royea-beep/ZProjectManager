# ZProjectManager Sprint 11 — 2026-03-21

## What shipped

| Agent | Status | Notes |
|-------|--------|-------|
| DB v12 migration | ✅ | intelligence_suggestions, cross_project_insights, invoices, notification_log |
| intelligence-engine.ts | ✅ | 7 per-project rules + 4 cross-project checks |
| IPC wiring | ✅ | 10 new handlers: intelligence:run/get-suggestions/dismiss/get-cross-project/dismiss-insight + invoices:create/get/update-status + work-sessions:mark-billed |
| IntelligencePage | ✅ | 2-col layout: project actions (priority color) + cross-project insights. ⚡ Fix generates GPROMPT. Dismiss per item |
| BillingPage | ✅ | Client workspace hours tracking. Log hours (with project select). Unbilled summary ₪. Create invoice → marks billed. Invoice history: draft→sent→paid |
| App routing + nav | ✅ | /intelligence (Alt+I) + /billing (Alt+B) added to sidebar + Routes |
| ProjectDetail widget | ✅ | ProjectIntelligenceWidget inline in Overview tab (top 3 suggestions) |
| MorningBriefing | ✅ | Runs intelligence:run first, shows top 3 suggestions |

## Intelligence Rules
1. CI failing → priority 10
2. Health < 40 → priority 9
3. Live + no MRR → priority 7
4. TestFlight + no session in 7d → priority 6
5. Client unbilled ≥ 4h → priority 8
6. Open PRs > 3 → priority 5
7. No MEMORY.md → priority 4

## Cross-Project Checks
1. Tech stack ≥4 projects → reuse opportunity
2. 3+ projects stale 30d → archive decision
3. 2+ live, ₪0 MRR → revenue cluster warning
4. 3+ projects no MEMORY.md → process warning

## Commit
- 1f956bb feat: Sprint 11 — intelligence engine + billing + cross-project insights

## Build Status
TypeScript: clean | Build: clean (3.47s) | 695 modules
