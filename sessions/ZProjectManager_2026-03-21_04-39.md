# ZProjectManager — Sprint 1: GitHub API + Revenue Page
## Date: 2026-03-21 | Start: 04:39

## GOAL
1. GitHub API live integration (stars, open PRs, CI status, last push)
2. Revenue / Monetization tracking page
3. Real github_repo values seeded for all projects
4. DB migration v7

## CHANGES LOG

### Files Created
- src/main/github-api.ts — GitHub API module (fetch + cache)
- src/renderer/pages/RevenuePage.tsx — Revenue dashboard page

### Files Modified
- src/main/database.ts — migration v7 (github columns + revenue columns + revenue_entries table)
- src/shared/types.ts — Project interface extended (github + revenue fields), RevenueEntry type added
- src/shared/constants.ts — IPC channels added (github:*, revenue:*)
- src/main/ipc.ts — github:* and revenue:* handlers, ALLOWED_COLS updated
- src/main/main.ts — auto-sync GitHub on startup (30s delay)
- src/main/preload.ts — new channels added to ALLOWED_CHANNELS
- src/renderer/services/api.ts — github and revenue API functions
- src/renderer/components/ProjectCard.tsx — GitHub badges (CI, PRs, stars, last push)
- src/renderer/pages/SettingsPage.tsx — GitHub token input + sync button
- src/renderer/App.tsx — /revenue route + nav item

## STATUS
- TypeScript: TBD
- Build: TBD
