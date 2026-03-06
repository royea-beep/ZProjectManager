# ZProjectManager — Project Operating System

## What This Is
A desktop app (Electron + React + SQLite) that manages all projects in C:\Projects.
It tracks every project, remembers work sessions, launches dev environments, shows next steps, and learns patterns.

## Tech Stack
- **Electron** — desktop container (terminals, file access, system commands)
- **React 18** — UI framework
- **SQLite** (via better-sqlite3) — local database
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
