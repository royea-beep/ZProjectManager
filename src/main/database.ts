import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

let db: SqlJsDatabase;
let dbPath: string;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let savePending = false;
let lastSaveTime: string | null = null;

const CURRENT_SCHEMA_VERSION = 6;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT,
    stage TEXT DEFAULT 'concept',
    status TEXT DEFAULT 'idea',
    priority TEXT DEFAULT 'medium',
    goal TEXT,
    tech_stack TEXT,
    repo_path TEXT,
    repo_url TEXT,
    has_git INTEGER DEFAULT 0,
    monetization_model TEXT,
    main_blocker TEXT,
    next_action TEXT,
    health_score INTEGER DEFAULT 50,
    last_worked_at TEXT,
    launched_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

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
    files_changed TEXT,
    commands_used TEXT,
    prompts_used TEXT,
    mood TEXT,
    duration_minutes INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    related_session_id INTEGER REFERENCES project_sessions(id),
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS project_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    reason TEXT,
    alternatives_considered TEXT,
    outcome TEXT,
    decided_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    command TEXT NOT NULL,
    command_type TEXT DEFAULT 'terminal',
    shell TEXT DEFAULT 'powershell',
    working_dir TEXT,
    auto_run INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    ports_used TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS project_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit TEXT,
    date TEXT DEFAULT (date('now')),
    source TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS learnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    learning TEXT NOT NULL,
    category TEXT,
    impact_score INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cross_project_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    supporting_projects TEXT,
    recommendation TEXT,
    detected_at TEXT DEFAULT (datetime('now')),
    last_validated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_project ON project_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON project_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_metrics_project ON project_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON project_metrics(date);
CREATE INDEX IF NOT EXISTS idx_commands_project ON project_commands(project_id);
CREATE INDEX IF NOT EXISTS idx_learnings_project ON learnings(project_id);

CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_input TEXT NOT NULL,
    parsed_title TEXT NOT NULL,
    parsed_description TEXT,
    matched_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    matched_project_name TEXT,
    suggested_type TEXT,
    suggested_actions TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);

CREATE TABLE IF NOT EXISTS website_design_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    dimension TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'not_assessed',
    is_relevant INTEGER DEFAULT 1,
    notes TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, dimension)
);

CREATE INDEX IF NOT EXISTS idx_design_scores_project ON website_design_scores(project_id);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    project_id INTEGER,
    action TEXT NOT NULL,
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_project ON audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS task_subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON task_subtasks(task_id);

CREATE TABLE IF NOT EXISTS project_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    UNIQUE(project_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_tags_project ON project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON project_tags(tag);

CREATE TABLE IF NOT EXISTS project_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_project ON project_notes(project_id);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
`;

function runMigrations(fromVersion: number): void {
  // Migration 1 -> 2: Add website_design_scores table (already in SCHEMA via CREATE IF NOT EXISTS)
  // Migration 2 -> 3: Add manager-set DB strategy pattern and PostPilot decision (idempotent)
  if (fromVersion < 3) {
    const patternExists = db.exec(
      "SELECT 1 FROM cross_project_patterns WHERE pattern LIKE '%Database strategy for Next.js/Prisma%' LIMIT 1"
    );
    if (patternExists.length === 0 || (patternExists[0]?.values?.length ?? 0) === 0) {
      db.run(
        `INSERT INTO cross_project_patterns (pattern, confidence, supporting_projects, recommendation) VALUES (?, ?, ?, ?)`,
        [
          'Database strategy for Next.js/Prisma apps: SQLite local, Postgres in production',
          0.95,
          '["PostPilot","1-2Clicks"]',
          'Local: provider sqlite, DATABASE_URL=file:./*.db so db push works with no server. Production: switch schema to postgresql and set DATABASE_URL to Neon/Vercel/Supabase. Per-project decisions record which approach each project uses.',
        ]
      );
    }
    const decisionExists = db.exec(
      "SELECT 1 FROM project_decisions d JOIN projects p ON d.project_id = p.id WHERE p.name = 'PostPilot' AND d.decision LIKE '%SQLite for local%' LIMIT 1"
    );
    if (decisionExists.length === 0 || (decisionExists[0]?.values?.length ?? 0) === 0) {
      const pid = db.exec("SELECT id FROM projects WHERE name = 'PostPilot' LIMIT 1");
      const projectId = pid[0]?.values?.[0]?.[0];
      if (projectId != null) {
        db.run(
          `INSERT INTO project_decisions (project_id, decision, reason, alternatives_considered, outcome) VALUES (?, ?, ?, ?, ?)`,
          [
            projectId,
            'Use SQLite for local dev; use Postgres for production when deploying',
            'Minimal local setup (no DB server); production needs scalability and serverless compatibility (e.g. Vercel).',
            'SQLite everywhere; Postgres everywhere; hybrid by environment.',
            'SQLite local works with file:./postpilot.db. When deploying: switch schema provider to postgresql and set DATABASE_URL to hosted Postgres.',
          ]
        );
      }
    }
  }
  // Migration 3 -> 4: app_settings for configurable projects dir
  if (fromVersion < 4) {
    db.run(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT)`);
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)`, ['projects_dir', 'C:\\Projects']);
  }
  // Migration 4 -> 5: set Wingman next_action for TestFlight build 5
  if (fromVersion < 5) {
    db.run(
      `UPDATE projects SET next_action = ?, updated_at = datetime('now') WHERE name = 'Wingman'`,
      ['TestFlight build 5 — add testers & smoke-test']
    );
  }
  // Migration 5 -> 6: session 2026-03-08 learnings (idempotent)
  if (fromVersion < 6) {
    const anchor = db.exec("SELECT 1 FROM learnings WHERE learning LIKE '%PostPilot ftable caption API%' LIMIT 1");
    if (anchor.length === 0 || (anchor[0]?.values?.length ?? 0) === 0) {
      const learnings: [null, string, string, number][] = [
        [null, 'PostPilot ftable caption API: rate-limit and API-key auth so Supabase Edge can call from auto-post-social; keep POSTPILOT_FTABLE_API_KEY in host env and mirror in ftable Edge secrets.', 'technical', 8],
        [null, 'Heroes deploy on Windows: use Git Bash for deploy.sh; FTP_PASS from ftable .env.', 'process', 7],
        [null, 'ZPM: use migrations to set next_action and insert learnings on app startup; avoids manual DB edits.', 'process', 8],
        [null, 'Batch commits across repos: stage only feature files; exclude .claude, local config, data/cache; one logical commit per repo.', 'process', 7],
      ];
      for (const row of learnings) {
        db.run(
          'INSERT INTO learnings (project_id, learning, category, impact_score) VALUES (?, ?, ?, ?)',
          [row[0], row[1], row[2], row[3]]
        );
      }
    }
  }
}

function getSeedSQL(): string {
  const seedPath = path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '../../../'), 'SEED_DATA.sql');
  if (fs.existsSync(seedPath)) {
    return fs.readFileSync(seedPath, 'utf-8');
  }
  return '';
}

function saveDbImmediate(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  savePending = false;
  lastSaveTime = new Date().toISOString();
}

export function getLastSaveTime(): string | null {
  return lastSaveTime;
}

function saveDb(): void {
  savePending = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDbImmediate();
    saveTimer = null;
  }, 100);
}

// Flush pending saves (call before app quit)
export function getDbPath(): string {
  return dbPath;
}

export function flushDb(): void {
  if (savePending) {
    if (saveTimer) clearTimeout(saveTimer);
    saveDbImmediate();
  }
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'data.db');

  const wasmPath = app.isPackaged
    ? path.join(process.resourcesPath, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    : path.join(__dirname, '../../../node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });

  const isNew = !fs.existsSync(dbPath);

  if (isNew) {
    db = new SQL.Database();
  } else {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  }

  db.run('PRAGMA foreign_keys = ON;');
  db.run(SCHEMA);

  // Schema versioning
  db.run('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  const versionResult = db.exec('SELECT version FROM schema_version LIMIT 1');
  const currentVersion = versionResult.length > 0 ? (versionResult[0].values[0][0] as number) : 0;

  if (currentVersion === 0) {
    db.run('INSERT INTO schema_version (version) VALUES (?)', [CURRENT_SCHEMA_VERSION]);
  }

  // Run migrations for existing databases
  if (currentVersion > 0 && currentVersion < CURRENT_SCHEMA_VERSION) {
    runMigrations(currentVersion);
    db.run('UPDATE schema_version SET version = ?', [CURRENT_SCHEMA_VERSION]);
  }

  if (isNew) {
    const seed = getSeedSQL();
    if (seed) {
      try {
        db.exec(seed);
      } catch (err) {
        console.error('Failed to execute seed SQL:', err);
      }
    }
  }

  saveDbImmediate();
}

export function runQuery(sql: string, params: unknown[] = []): void {
  db.run(sql, params as any[]);
  saveDb();
}

export function getAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params as any[]);
  const results: Record<string, unknown>[] = [];
  try {
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Record<string, unknown>);
    }
  } finally {
    stmt.free();
  }
  return results;
}

export function getOne(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const results = getAll(sql, params);
  return results[0];
}

export function getSetting(key: string): string | null {
  const row = getOne('SELECT value FROM app_settings WHERE key = ?', [key]);
  const v = row?.value;
  return v != null ? String(v) : null;
}

export function setSetting(key: string, value: string): void {
  runQuery('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
}

export function runInsert(sql: string, params: unknown[] = []): number {
  db.run(sql, params as any[]);
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveDb();
  return result[0]?.values[0]?.[0] as number;
}
