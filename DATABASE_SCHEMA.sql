-- ZProjectManager Database Schema
-- SQLite via better-sqlite3

-- ============================================
-- CORE: Projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT, -- 'web-app', 'mobile-app', 'desktop-app', 'trading-bot', 'cli-tool', 'saas', 'platform'
    stage TEXT DEFAULT 'concept', -- concept, research, architecture, setup, development, content_assets, launch_prep, live_optimization
    status TEXT DEFAULT 'idea', -- idea, planning, building, testing, launched, paused, archived
    priority TEXT DEFAULT 'medium', -- critical, high, medium, low
    goal TEXT,
    tech_stack TEXT, -- JSON array of techs
    repo_path TEXT, -- local folder path
    repo_url TEXT, -- remote git URL
    has_git INTEGER DEFAULT 0,
    monetization_model TEXT,
    main_blocker TEXT,
    next_action TEXT,
    health_score INTEGER DEFAULT 50, -- 0-100
    last_worked_at TEXT, -- ISO date
    launched_at TEXT, -- ISO date
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- MEMORY: Session Logs
-- ============================================
CREATE TABLE IF NOT EXISTS project_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_date TEXT DEFAULT (date('now')),
    summary TEXT,
    what_done TEXT,
    what_worked TEXT,
    what_failed TEXT,
    blockers TEXT,
    next_step TEXT,
    files_changed TEXT, -- JSON array
    commands_used TEXT, -- JSON array
    prompts_used TEXT, -- JSON array
    mood TEXT, -- confident, neutral, frustrated, stuck
    duration_minutes INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- TASKS: Per-Project
-- ============================================
CREATE TABLE IF NOT EXISTS project_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- todo, in_progress, done, blocked
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    related_session_id INTEGER REFERENCES project_sessions(id),
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

-- ============================================
-- DECISIONS: Decision Log
-- ============================================
CREATE TABLE IF NOT EXISTS project_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    reason TEXT,
    alternatives_considered TEXT,
    outcome TEXT, -- good, bad, neutral, unknown
    decided_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- LAUNCHER: Commands & Profiles
-- ============================================
CREATE TABLE IF NOT EXISTS project_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- 'Start Dev Server', 'Open VS Code', 'Run Backend'
    command TEXT NOT NULL,
    command_type TEXT DEFAULT 'terminal', -- terminal, vscode, browser, script
    shell TEXT DEFAULT 'powershell', -- powershell, bash, cmd
    working_dir TEXT, -- override project path
    auto_run INTEGER DEFAULT 0, -- run on project open?
    order_index INTEGER DEFAULT 0,
    ports_used TEXT, -- JSON array of port numbers
    notes TEXT
);

-- ============================================
-- METRICS: Business & Post-Launch
-- ============================================
CREATE TABLE IF NOT EXISTS project_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL, -- revenue, users, conversions, bugs, traffic, etc.
    metric_value REAL NOT NULL,
    metric_unit TEXT, -- NIS, USD, count, percent
    date TEXT DEFAULT (date('now')),
    source TEXT, -- manual, stripe, analytics, etc.
    notes TEXT
);

-- ============================================
-- LEARNINGS: Per-Project Lessons
-- ============================================
CREATE TABLE IF NOT EXISTS learnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, -- NULL = cross-project
    learning TEXT NOT NULL,
    category TEXT, -- technical, business, process, personal
    impact_score INTEGER DEFAULT 5, -- 1-10
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INTELLIGENCE: Cross-Project Patterns
-- ============================================
CREATE TABLE IF NOT EXISTS cross_project_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL,
    confidence REAL DEFAULT 0.5, -- 0.0 - 1.0
    supporting_projects TEXT, -- JSON array of project IDs
    recommendation TEXT,
    detected_at TEXT DEFAULT (datetime('now')),
    last_validated_at TEXT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sessions_project ON project_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON project_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_metrics_project ON project_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON project_metrics(date);
CREATE INDEX IF NOT EXISTS idx_commands_project ON project_commands(project_id);
CREATE INDEX IF NOT EXISTS idx_learnings_project ON learnings(project_id);
