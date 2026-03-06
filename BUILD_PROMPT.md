# ZProjectManager — Build Prompt for Coding Bot

## What to Build
A desktop app using **Electron + React + SQLite** that serves as a Project Operating System.

## Tech Stack (LOCKED — do not change)
- **Electron** (latest stable) — desktop container
- **React 18** — UI
- **TypeScript** — all code must be TypeScript
- **better-sqlite3** — SQLite database (synchronous, fast, native)
- **Tailwind CSS** — styling
- **electron-builder** — packaging
- **Vite** — bundler for React (fast HMR)

## Project Location
`C:\Projects\ZProjectManager`

## Database
- Schema is defined in `DATABASE_SCHEMA.sql` — implement exactly as specified
- Seed data is in `SEED_DATA.sql` — run on first launch to pre-populate 13 projects
- Database file location: `%APPDATA%/ZProjectManager/data.db` (Windows)
- Auto-run migrations on app start

## Architecture Requirements

### Main Process (src/main/)
- `main.ts` — Electron app lifecycle, window creation, menu
- `database.ts` — SQLite connection, migrations, queries
- `launcher.ts` — Spawn terminals (PowerShell on Windows), open VS Code, open browser URLs
- `ipc.ts` — IPC handlers bridging renderer requests to main process capabilities

### Renderer Process (src/renderer/)
- `App.tsx` — Root component with routing
- `pages/Dashboard.tsx` — All projects at a glance (cards with status, health, last update, next action)
- `pages/ProjectDetail.tsx` — Single project view with tabs: Overview, Memory, Tasks, Launcher, Metrics, Learnings
- `pages/Settings.tsx` — App settings
- `components/` — Reusable UI components
- `hooks/` — Data fetching hooks that call IPC to main process

### Shared (src/shared/)
- `types.ts` — TypeScript interfaces matching DB schema
- `constants.ts` — Status/stage enums, colors, etc.

## UI Requirements
- **Dark mode** by default (dark blue/gray palette)
- **Hebrew + English** ready (RTL support via Tailwind)
- **Responsive** within the Electron window
- Sidebar navigation: Dashboard, All Projects, Learnings, Patterns, Settings
- Project cards show: name, status badge, health score bar, last worked date, next action, quick-launch button
- Project detail page has tab navigation

## Core Features (Phase 1 MVP)

### 1. Dashboard
- Grid of project cards sorted by priority then last_worked_at
- Filter by status (all, building, launched, paused, archived)
- Search by name
- "Stale projects" warning for projects not touched in 14+ days
- Quick stats: total projects, building, launched, paused

### 2. Project Detail — Overview Tab
- Editable fields: name, description, type, stage, status, priority, goal, tech_stack, monetization, blocker, next_action
- Health score slider (0-100)
- Timeline showing key dates (created, last worked, launched)

### 3. Project Detail — Memory Tab
- List of sessions (newest first)
- "New Session" button opens form: summary, what_done, blockers, next_step, mood
- **Session Resume Card** at top: shows last session summary, unresolved blockers, suggested next step
- This is the most important feature — it must be prominent and useful

### 4. Project Detail — Tasks Tab
- Kanban-style or simple list of tasks (todo, in_progress, done, blocked)
- Add/edit/delete tasks
- Link tasks to sessions

### 5. Project Detail — Launcher Tab
- List of saved commands for this project
- "Launch" button per command (spawns terminal in project directory)
- "Launch All Auto-Run" button (runs all commands marked auto_run in order)
- Add/edit/delete commands
- Show ports used

### 6. Project Detail — Metrics Tab
- Add metric entries (name, value, unit, date)
- Simple line chart for metrics over time (use recharts or similar)
- Good for tracking revenue, users, bugs after launch

### 7. Project Detail — Learnings Tab
- List of learnings for this project
- Add new learning with category and impact score
- Also show relevant cross-project patterns

### 8. Learnings Page (global)
- All learnings across all projects
- Filter by category
- Sorted by impact_score

### 9. Patterns Page (global)
- All detected cross-project patterns
- Confidence score, supporting projects, recommendation

## Terminal Launcher Implementation
```typescript
// Use child_process.spawn to open PowerShell
import { spawn } from 'child_process';

function launchCommand(command: string, workingDir: string) {
  spawn('powershell.exe', ['-NoExit', '-Command', command], {
    cwd: workingDir,
    detached: true,
    stdio: 'ignore'
  });
}

// For VS Code
function openVSCode(path: string) {
  spawn('code', [path], { detached: true, stdio: 'ignore' });
}

// For browser
function openBrowser(url: string) {
  spawn('cmd', ['/c', 'start', url], { detached: true, stdio: 'ignore' });
}
```

## What NOT to Build (Phase 1)
- No cloud sync
- No team collaboration
- No AI autonomy / auto-suggestions (Phase 2)
- No import from Git history (Phase 3)
- No Stripe/analytics connectors (Phase 3)
- No complex dashboards with charts everywhere
- No onboarding wizard

## Quality Requirements
- TypeScript strict mode
- All database operations in main process (never in renderer)
- IPC for all data access (renderer -> main -> SQLite -> main -> renderer)
- Proper error handling on all DB operations
- Window state persistence (remember size/position)

## First Run Experience
1. App starts
2. Detects no database file
3. Creates database with schema
4. Runs seed data (13 projects + commands + learnings + patterns)
5. Shows dashboard with all projects pre-populated
6. User can immediately click any project and see its details

## Development Setup
```bash
cd C:\Projects\ZProjectManager
npm init -y
npm install electron electron-builder react react-dom better-sqlite3
npm install -D typescript @types/react @types/react-dom @types/better-sqlite3 vite @vitejs/plugin-react tailwindcss postcss autoprefixer
```
