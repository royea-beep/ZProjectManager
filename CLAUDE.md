# ZProjectManager — Project Operating System

## What This Is
A desktop app (Electron + React + SQLite) that manages all projects in C:\Projects.
It tracks every project, remembers work sessions, launches dev environments, shows next steps, and learns patterns.

## Tech Stack
- **Electron** — desktop container (terminals, file access, system commands)
- **React 18** — UI framework
- **SQLite** (via sql.js) — local database
- **Tailwind CSS** — styling
- **TypeScript** — type safety

## Architecture
```
ZProjectManager/
├── src/
│   ├── main/           # Electron main process (Node.js)
│   │   ├── main.ts     # App entry, window management
│   │   ├── database.ts # SQLite connection + migrations
│   │   ├── launcher.ts # Terminal/process launcher
│   │   └── ipc.ts      # IPC handlers (main <-> renderer)
│   ├── renderer/       # React app (browser context)
│   │   ├── App.tsx
│   │   ├── pages/      # Dashboard, ProjectDetail, Settings
│   │   ├── components/ # ProjectCard, SessionLog, LaunchButton, etc.
│   │   ├── hooks/      # useProjects, useSessions, useMetrics
│   │   └── services/   # API calls to main process via IPC
│   └── shared/         # Types, constants shared between main/renderer
├── database/
│   └── migrations/     # SQL migration files
├── package.json
├── electron-builder.yml
└── tsconfig.json
```

## Database Tables
- projects — master registry
- project_sessions — work session logs
- project_tasks — per-project tasks
- project_decisions — decision log
- project_commands — launch profiles
- project_metrics — business/post-launch metrics
- learnings — lessons learned
- cross_project_patterns — pattern intelligence

## Key Rules
- Hebrew + English support (RTL-aware)
- Dark mode default
- All data local (SQLite file)
- Must feel faster than not using it
- Launch profiles open real terminals (PowerShell on Windows)
- Session resume: show last session summary when opening a project

## Agent / Manager Workflow
- **If the task needs something only the user can provide** (API key, OAuth connection, account signup, secret): give a **CLI command** or **link** (e.g. “Run: …” or “Open: …”) so they can do that step; don’t block the rest of the work.
- **If no secret or external account is needed:** go ahead and do it (implement, fix, refactor).
- **Use agents and tools whenever they help** (subagents, terminal, search, etc.).

## Manager Decisions (database & conventions)
- **Database strategy for Next.js + Prisma apps (e.g. PostPilot, KeyDrop):** Use **SQLite for local dev** (zero setup, `DATABASE_URL="file:./dev.db"` or `file:./postpilot.db`). Use **Postgres for production** when deploying (Vercel/Neon/Supabase). Per project we can choose: SQLite-only, Postgres-only, or this hybrid; the system records the choice in project decisions and cross-project patterns so the same approach can be reused or adjusted per project.

## Development
- `npm run dev` — start Electron in dev mode
- `npm run build` — build for production
- Database auto-migrates on startup

## MVP Features (Phase 1)
1. Project CRUD (create, edit, archive)
2. Status/stage tracking
3. Session memory logging
4. Terminal launcher per project
5. Dashboard with all projects at a glance
6. Next-step suggestions (basic)

## Pre-Populated Data
On first run, seed the database with all 13 existing projects from C:\Projects.
Use the project registry data from the audit (March 6, 2026).
