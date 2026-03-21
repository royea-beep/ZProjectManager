import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

let db: SqlJsDatabase;
let dbPath: string;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let savePending = false;
let lastSaveTime: string | null = null;

const CURRENT_SCHEMA_VERSION = 15;

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
  // Migration 10 -> 11: workspaces + work_sessions
  if (fromVersion < 11) {
    db.run(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'mine',
        color TEXT DEFAULT '#22c55e',
        emoji TEXT DEFAULT '🏠',
        client_name TEXT,
        partner_name TEXT,
        billing_rate INTEGER DEFAULT 0,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`INSERT OR IGNORE INTO workspaces (id, name, type, color, emoji) VALUES (1, 'שלי', 'mine', '#22c55e', '🏠')`);
    db.run(`INSERT OR IGNORE INTO workspaces (id, name, type, color, emoji) VALUES (2, 'לקוחות', 'client', '#3b82f6', '💼')`);
    db.run(`INSERT OR IGNORE INTO workspaces (id, name, type, color, emoji) VALUES (3, 'שותפויות', 'partnership', '#f59e0b', '🤝')`);

    try { db.run('ALTER TABLE projects ADD COLUMN workspace_id INTEGER DEFAULT 1'); } catch { /* exists */ }
    db.run('UPDATE projects SET workspace_id = 1 WHERE workspace_id IS NULL');

    db.run(`
      CREATE TABLE IF NOT EXISTS work_sessions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        workspace_id INTEGER REFERENCES workspaces(id),
        hours REAL NOT NULL,
        description TEXT,
        billed INTEGER DEFAULT 0,
        date TEXT DEFAULT (date('now')),
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_work_sessions_project ON work_sessions(project_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_work_sessions_workspace ON work_sessions(workspace_id)`);

    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('active_workspace_id', '0')`);
  }

  // Migration 11 -> 12: intelligence + billing tables
  if (fromVersion < 12) {
    db.run(`
      CREATE TABLE IF NOT EXISTS intelligence_suggestions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        suggestion_type TEXT NOT NULL CHECK(suggestion_type IN (
          'action_needed','opportunity','risk','cross_project','revenue'
        )),
        title TEXT NOT NULL,
        description TEXT,
        priority INTEGER DEFAULT 5 CHECK(priority BETWEEN 1 AND 10),
        action_prompt_id TEXT,
        dismissed INTEGER DEFAULT 0,
        auto_generated INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS cross_project_insights (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        insight_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        affected_project_ids TEXT,
        severity TEXT DEFAULT 'info' CHECK(severity IN ('critical','warning','info','opportunity')),
        auto_fix_available INTEGER DEFAULT 0,
        dismissed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
        invoice_number TEXT NOT NULL,
        client_name TEXT NOT NULL,
        total_hours REAL NOT NULL,
        billing_rate INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        currency TEXT DEFAULT 'ILS',
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','cancelled')),
        line_items TEXT NOT NULL,
        notes TEXT,
        issued_at TEXT DEFAULT (datetime('now')),
        due_at TEXT,
        paid_at TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS notification_log (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  // Migration 12 -> 13: pipeline integration tables
  if (fromVersion < 13) {
    db.run(`
      CREATE TABLE IF NOT EXISTS pipeline_sessions (
        id TEXT PRIMARY KEY,
        project TEXT NOT NULL,
        phase TEXT NOT NULL,
        quality INTEGER NOT NULL,
        turn_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        file_path TEXT,
        imported_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pipeline_project ON pipeline_sessions(project)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pipeline_quality ON pipeline_sessions(quality)`);

    db.run(`
      CREATE TABLE IF NOT EXISTS mega_prompt_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER UNIQUE NOT NULL,
        file_path TEXT,
        total_sessions INTEGER,
        avg_quality REAL,
        phases_json TEXT,
        raw_content TEXT,
        loaded_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('pipeline_last_run', '')`);
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('pipeline_dir', 'C:/Users/royea/Desktop/11STEPS2DONE')`);
  }

  // Migration 13 -> 14: fix_cycle_times + partnership task fields + weekly digest settings
  if (fromVersion < 14) {
    db.run(`
      CREATE TABLE IF NOT EXISTS fix_cycle_times (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        bug_report_id TEXT,
        project_name TEXT,
        severity TEXT,
        reported_at TEXT,
        approved_at TEXT,
        committed_at TEXT,
        cycle_time_minutes INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    try { db.run(`ALTER TABLE project_tasks ADD COLUMN assigned_to TEXT DEFAULT 'me' CHECK(assigned_to IN ('me', 'partner', 'both'))`); } catch { /* exists */ }
    try { db.run(`ALTER TABLE project_tasks ADD COLUMN waiting_since TEXT`); } catch { /* exists */ }

    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('ntfy_topic', '9soccer-bugs-roye')`);
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('last_weekly_digest', '')`);
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('weekly_digest_content', '')`);
  }

  // Migration 14 -> 15: expert_panel_results + API key settings
  if (fromVersion < 15) {
    db.run(`
      CREATE TABLE IF NOT EXISTS expert_panel_results (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        task_description TEXT NOT NULL,
        result_json TEXT NOT NULL,
        consensus_score REAL,
        expert_count INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_expert_panel_project ON expert_panel_results(project_id, created_at DESC)`);

    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('anthropic_api_key', '')`);
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('expert_panel_enabled', 'true')`);
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('expert_panel_count', '5')`);
  }

  // Migration 9 -> 10: project_parameters + golden_prompts tables
  if (fromVersion < 10) {
    db.run(`
      CREATE TABLE IF NOT EXISTS project_parameters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        value TEXT,
        is_auto_extracted INTEGER DEFAULT 1,
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(project_id, key)
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_params_project ON project_parameters(project_id)`);

    db.run(`
      CREATE TABLE IF NOT EXISTS golden_prompts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        project_name TEXT,
        prompt_text TEXT NOT NULL,
        prompt_type TEXT NOT NULL,
        prompt_id TEXT,
        project_stage TEXT,
        project_category TEXT,
        action_type TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_golden_project ON golden_prompts(project_id)`);
  }

  // Migration 8 -> 9: prompt_usage table for learning which prompts work best
  if (fromVersion < 9) {
    db.run(`
      CREATE TABLE IF NOT EXISTS prompt_usage (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        prompt_type TEXT NOT NULL,
        prompt_id TEXT NOT NULL,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        outcome TEXT CHECK(outcome IN ('success','partial','failure','unknown')) DEFAULT 'unknown',
        notes TEXT,
        used_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_prompt_usage_project ON prompt_usage(project_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt ON prompt_usage(prompt_id)`);
  }

  // Migration 7 -> 8: category column + prompt category seeds
  if (fromVersion < 8) {
    try { db.run("ALTER TABLE projects ADD COLUMN category TEXT DEFAULT 'web-saas'"); } catch { /* exists */ }

    // Seed categories based on known project names
    const categorySeeds: Array<[string, string]> = [
      ['9Soccer', 'game'],
      ['90Soccer', 'game'],
      ['Caps', 'mobile-app'],
      ['Wingman', 'mobile-app'],
      ['PostPilot', 'web-saas'],
      ['KeyDrop', 'web-saas'],
      ['analyzer', 'ai-tool'],
      ['Analyzer', 'ai-tool'],
      ['ExplainIt', 'ai-tool'],
      ['VenueKit', 'web-saas'],
      ['TokenWise', 'internal-tool'],
      ['ZProjectManager', 'desktop-app'],
      ['ftable', 'internal-tool'],
      ['Heroes', 'internal-tool'],
      ['clubgg', 'internal-tool'],
      ['ftable-hands', 'ai-tool'],
    ];
    for (const [nameFragment, category] of categorySeeds) {
      try {
        db.run(
          `UPDATE projects SET category = ? WHERE name LIKE ? AND (category IS NULL OR category = 'web-saas')`,
          [category, `%${nameFragment}%`]
        );
      } catch { /* ignore */ }
    }
  }

  // Migration 6 -> 7: GitHub API columns + revenue columns + revenue_entries table + github_repo seeds
  if (fromVersion < 7) {
    // Add GitHub columns to projects (try/catch each since sql.js doesn't support IF NOT EXISTS for ALTER)
    const githubCols = [
      'ALTER TABLE projects ADD COLUMN github_repo TEXT',
      'ALTER TABLE projects ADD COLUMN github_stars INTEGER DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN github_open_prs INTEGER DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN github_ci_status TEXT DEFAULT \'unknown\'',
      'ALTER TABLE projects ADD COLUMN github_last_push TEXT',
      'ALTER TABLE projects ADD COLUMN github_synced_at TEXT',
    ];
    for (const sql of githubCols) {
      try { db.run(sql); } catch { /* column already exists */ }
    }

    // Add revenue columns to projects
    const revenueCols = [
      'ALTER TABLE projects ADD COLUMN mrr INTEGER DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN arr INTEGER DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN revenue_model TEXT DEFAULT \'pre-revenue\'',
      'ALTER TABLE projects ADD COLUMN paying_customers INTEGER DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN revenue_notes TEXT',
    ];
    for (const sql of revenueCols) {
      try { db.run(sql); } catch { /* column already exists */ }
    }

    // Create revenue_entries table
    db.run(`CREATE TABLE IF NOT EXISTS revenue_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('mrr','one-time','refund')),
      date TEXT NOT NULL DEFAULT (date('now')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_revenue_project ON revenue_entries(project_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_entries(date)`);

    // Settings: github_token + github_username
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('github_token', '')`);
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('github_username', 'royea-beep')`);

    // Seed real github_repo values for known projects
    const repoMap: Array<[string, string]> = [
      ['9Soccer', 'royea-beep/90Soccer-Mascots'],
      ['90Soccer', 'royea-beep/90Soccer-Mascots'],
      ['Caps', 'royea-beep/Caps'],
      ['Wingman', 'royea-beep/Wingman'],
      ['PostPilot', 'royea-beep/PostPilot'],
      ['KeyDrop', 'royea-beep/KeyDrop'],
      ['ExplainIt', 'royea-beep/ExplainIt'],
      ['analyzer', 'royea-beep/analyzer-standalone'],
      ['Analyzer', 'royea-beep/analyzer-standalone'],
      ['VenueKit', 'royea-beep/VenueKit'],
      ['TokenWise', 'royea-beep/TokenWise'],
      ['Heroes', 'royea-beep/Heroes-Hadera'],
      ['ZProjectManager', 'royea-beep/ZProjectManager'],
      ['ftable', 'royea-beep/ftable'],
    ];
    for (const [nameFragment, repo] of repoMap) {
      try {
        db.run(
          `UPDATE projects SET github_repo = ? WHERE name LIKE ? AND (github_repo IS NULL OR github_repo = '')`,
          [repo, `%${nameFragment}%`]
        );
      } catch { /* ignore */ }
    }

    // Seed revenue_model for known live projects
    const revenueModels: Array<[string, string, number, number]> = [
      ['ftable', 'subscription', 0, 0],
      ['analyzer', 'subscription', 0, 0],
      ['PostPilot', 'subscription', 0, 0],
      ['KeyDrop', 'subscription', 0, 0],
      ['ExplainIt', 'subscription', 0, 0],
    ];
    for (const [nameFragment, model, mrr, customers] of revenueModels) {
      try {
        db.run(
          `UPDATE projects SET revenue_model = ?, mrr = ?, paying_customers = ? WHERE name LIKE ? AND revenue_model IS NULL`,
          [model, mrr, customers, `%${nameFragment}%`]
        );
      } catch { /* ignore */ }
    }
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
  // Prefer app root (package.json dir) so seed is found in dev and packaged app
  const appRoot = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const seedPath = path.join(appRoot, 'SEED_DATA.sql');
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
    db.run('INSERT INTO schema_version (version) VALUES (?)', [0]);
  }

  // Seed new DB first so projects exist before migrations (e.g. migration 5 updates Wingman)
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

  // Run migrations (including for new DBs so migration 6 learnings get inserted)
  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    runMigrations(currentVersion);
    db.run('UPDATE schema_version SET version = ?', [CURRENT_SCHEMA_VERSION]);
  } else if (currentVersion === CURRENT_SCHEMA_VERSION) {
    // One-time backfill: if DB is at v6 but missing migration 6 learnings (e.g. was created before fix), insert them
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

  // Audit log TTL: clean entries older than 90 days
  try {
    const before = db.exec("SELECT COUNT(*) as c FROM audit_log WHERE created_at < datetime('now', '-90 days')");
    const count = (before[0]?.values?.[0]?.[0] as number) || 0;
    if (count > 0) {
      db.run("DELETE FROM audit_log WHERE created_at < datetime('now', '-90 days')");
      console.log(`[database] Cleaned ${count} audit log entries older than 90 days`);
    }
  } catch (e) {
    console.error('[database] Audit log cleanup failed:', e);
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
