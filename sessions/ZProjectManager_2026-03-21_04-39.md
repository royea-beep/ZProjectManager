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
- TypeScript: ✅ zero errors (npx tsc --noEmit)
- Build: ✅ clean 1.73s (682 modules)
- Commit: a9d6ee3

## WHAT'S WIRED
1. github-api.ts: fetchRepoData() + syncAllProjects() — uses getSetting('github_token'), getAll(), runQuery()
2. DB migration v7: github_* columns + revenue columns + revenue_entries table + github_repo seeds for 14 projects
3. IPC: github:syncAll, github:setToken, revenue:getAll, revenue:createEntry, revenue:deleteEntry, revenue:updateProject
4. Preload: all 4 new channels whitelisted
5. ProjectCard: CI badge (green/red/yellow), PR count, stars, last push time — only shown if github_repo set
6. SettingsPage: GitHub token input (password type), Save + Sync Now buttons, scopes guidance
7. RevenuePage: MRR/ARR/Customers/LiveProjects KPIs, project table (click to edit MRR/customers/model), Closest-to-revenue ranked list, revenue log with delete, Add Entry modal
8. App.tsx: /revenue route + Revenue nav item (replaces Learnings icon), Alt+3 shortcut
9. main.ts: auto-sync GitHub 30s after startup

## NEXT SESSION STARTS WITH
- Set GitHub token in Settings → Sync Now → verify badges appear on cards
- Enter actual MRR values for any paying projects in Revenue page
- Push to GitHub remote
