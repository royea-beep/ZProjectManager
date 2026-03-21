# ZProjectManager Sprint 9 — 2026-03-21 09:40

## Learning Source
- ZPROJECTMANAGER-LEARNING-VAMOS-2026-03-21-0935.md
- 42 CAPS sprints + 9Soccer adaptation
- Key insight: MEMORY.md + IRON_RULES.md = difference between sessions that drift and sessions that build

## What shipped

| Agent | Status | Notes |
|-------|--------|-------|
| generateMemoryMd() | ✅ | DB → MEMORY.md (CI, tasks, sessions, blocker, next priority) |
| generateIronRulesMd() | ✅ | Tailored to category (mobile/web-saas/desktop/etc) + stage (live/pre-launch) |
| generatePreLaunchChecklist() | ✅ | Mobile extra + SaaS extra + content + monitoring sections |
| generateVamosSprint() | ✅ | Full VAMOS template: FIRST ACTIONS + agents + deploy + session log |
| "Docs" tab in ProjectDetail | ✅ | 4 doc types, copy button, filename hint |
| VAMOS situational prompts | ✅ | session-start-vamos + end-of-session-vamos |
| IPC wiring | ✅ | docs:generate-* in ipc.ts + preload + api.ts |

## Architecture
```
ProjectDetail → Docs tab → click doc type → IPC → generateXxx() → markdown → copy → paste into project
Situational Prompts → session-start-vamos → bot reads MEMORY.md + IRON_RULES.md → zero drift
```

## Commit
- 574deec feat: Sprint 9 — VAMOS infrastructure generator

## Build Status
TypeScript: clean | Build: clean (1.73s) | 691 modules
