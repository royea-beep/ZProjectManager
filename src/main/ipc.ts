import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { runQuery, getAll, getOne, runInsert, flushDb, getLastSaveTime } from './database';
import { launchProjectCommand } from './launcher';
import { processIdea, executeIdeaActions } from './idea-engine';
import { IPC_CHANNELS, DESIGN_DIMENSIONS, WEB_RELEVANT_TYPES } from '../shared/constants';

const PROJECTS_DIR = 'C:\\Projects'; // TODO: Make configurable via settings

export function registerIpcHandlers(): void {

  // ---- PROJECTS ----
  ipcMain.handle(IPC_CHANNELS.GET_PROJECTS, () => {
    return getAll(`SELECT * FROM projects ORDER BY
      CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
      last_worked_at DESC`);
  });

  ipcMain.handle(IPC_CHANNELS.GET_PROJECT, (_e, id: number) => {
    return getOne('SELECT * FROM projects WHERE id = ?', [id]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_PROJECT, (_e, data: Record<string, unknown>) => {
    return runInsert(
      `INSERT INTO projects (name, description, type, stage, status, priority, goal, tech_stack, repo_path, repo_url, has_git, monetization_model, main_blocker, next_action, health_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.description, data.type, data.stage, data.status, data.priority, data.goal, data.tech_stack, data.repo_path, data.repo_url, data.has_git, data.monetization_model, data.main_blocker, data.next_action, data.health_score]
    );
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_PROJECT, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED_COLS = new Set([
      'name', 'description', 'type', 'stage', 'status', 'priority', 'goal', 'tech_stack',
      'repo_path', 'repo_url', 'has_git', 'monetization_model', 'main_blocker', 'next_action',
      'health_score', 'last_worked_at', 'launched_at',
    ]);
    const keys = Object.keys(data).filter(k => ALLOWED_COLS.has(k));
    if (keys.length === 0) return getOne('SELECT * FROM projects WHERE id = ?', [id]);
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    runQuery(`UPDATE projects SET ${sets}, updated_at = datetime('now') WHERE id = ?`, [...values, id]);
    return getOne('SELECT * FROM projects WHERE id = ?', [id]);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_PROJECT, (_e, id: number) => {
    runQuery('DELETE FROM projects WHERE id = ?', [id]);
    return true;
  });

  // ---- SESSIONS ----
  ipcMain.handle(IPC_CHANNELS.GET_SESSIONS, (_e, projectId: number) => {
    return getAll('SELECT * FROM project_sessions WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_SESSION, (_e, data: Record<string, unknown>) => {
    const id = runInsert(
      `INSERT INTO project_sessions (project_id, summary, what_done, what_worked, what_failed, blockers, next_step, mood, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.project_id, data.summary, data.what_done, data.what_worked, data.what_failed, data.blockers, data.next_step, data.mood, data.duration_minutes]
    );
    runQuery("UPDATE projects SET last_worked_at = date('now'), updated_at = datetime('now') WHERE id = ?", [data.project_id]);
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.GET_ALL_SESSIONS, () => {
    return getAll('SELECT session_date FROM project_sessions ORDER BY session_date DESC LIMIT 500');
  });

  // ---- TASKS ----
  ipcMain.handle(IPC_CHANNELS.GET_TASKS, (_e, projectId: number) => {
    return getAll(
      `SELECT * FROM project_tasks WHERE project_id = ? ORDER BY
       CASE status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'blocked' THEN 2 WHEN 'done' THEN 3 END,
       created_at DESC`, [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_TASK, (_e, data: Record<string, unknown>) => {
    return runInsert(
      `INSERT INTO project_tasks (project_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.project_id, data.title, data.description, data.status, data.priority, data.due_date]
    );
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_TASK, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED_COLS = new Set(['title', 'description', 'status', 'priority', 'due_date', 'completed_at']);
    const updates = { ...data };
    if (data.status === 'done' && !data.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    const keys = Object.keys(updates).filter(k => ALLOWED_COLS.has(k));
    if (keys.length === 0) return true;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    runQuery(`UPDATE project_tasks SET ${sets} WHERE id = ?`, [...values, id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_TASK, (_e, id: number) => {
    runQuery('DELETE FROM project_tasks WHERE id = ?', [id]);
    return true;
  });

  // ---- COMMANDS ----
  ipcMain.handle(IPC_CHANNELS.GET_COMMANDS, (_e, projectId: number) => {
    return getAll('SELECT * FROM project_commands WHERE project_id = ? ORDER BY order_index', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_COMMAND, (_e, data: Record<string, unknown>) => {
    return runInsert(
      `INSERT INTO project_commands (project_id, label, command, command_type, shell, working_dir, auto_run, order_index, ports_used, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.project_id, data.label, data.command, data.command_type, data.shell, data.working_dir, data.auto_run, data.order_index, data.ports_used, data.notes]
    );
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_COMMAND, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED_COLS = new Set(['label', 'command', 'command_type', 'shell', 'working_dir', 'auto_run', 'order_index', 'ports_used', 'notes']);
    const keys = Object.keys(data).filter(k => ALLOWED_COLS.has(k));
    if (keys.length === 0) return true;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    runQuery(`UPDATE project_commands SET ${sets} WHERE id = ?`, [...values, id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_COMMAND, (_e, id: number) => {
    runQuery('DELETE FROM project_commands WHERE id = ?', [id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.LAUNCH_COMMAND, (_e, commandId: number) => {
    const cmd = getOne('SELECT c.*, p.repo_path FROM project_commands c JOIN projects p ON c.project_id = p.id WHERE c.id = ?', [commandId]);
    if (!cmd) return { ok: false, error: 'Command not found' };
    const workDir = (cmd.working_dir || cmd.repo_path || '.') as string;
    try {
      launchProjectCommand(cmd.command as string, cmd.command_type as string, cmd.shell as string, workDir);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Launch failed' };
    }
  });

  // ---- METRICS ----
  ipcMain.handle(IPC_CHANNELS.GET_METRICS, (_e, projectId: number) => {
    return getAll('SELECT * FROM project_metrics WHERE project_id = ? ORDER BY date DESC', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_METRIC, (_e, data: Record<string, unknown>) => {
    return runInsert(
      `INSERT INTO project_metrics (project_id, metric_name, metric_value, metric_unit, date, source, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.project_id, data.metric_name, data.metric_value, data.metric_unit, data.date, data.source, data.notes]
    );
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_METRIC, (_e, id: number) => {
    runQuery('DELETE FROM project_metrics WHERE id = ?', [id]);
    return true;
  });

  // ---- LEARNINGS ----
  ipcMain.handle(IPC_CHANNELS.GET_LEARNINGS, (_e, projectId: number) => {
    return getAll('SELECT * FROM learnings WHERE project_id = ? ORDER BY impact_score DESC', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.GET_ALL_LEARNINGS, () => {
    return getAll(`
      SELECT l.*, p.name as project_name
      FROM learnings l
      LEFT JOIN projects p ON l.project_id = p.id
      ORDER BY l.impact_score DESC
    `);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_SESSION, (_e, id: number) => {
    runQuery('DELETE FROM project_sessions WHERE id = ?', [id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_LEARNING, (_e, data: Record<string, unknown>) => {
    return runInsert(
      `INSERT INTO learnings (project_id, learning, category, impact_score)
       VALUES (?, ?, ?, ?)`,
      [data.project_id, data.learning, data.category, data.impact_score]
    );
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_LEARNING, (_e, id: number) => {
    runQuery('DELETE FROM learnings WHERE id = ?', [id]);
    return true;
  });

  // ---- PATTERNS ----
  ipcMain.handle(IPC_CHANNELS.GET_PATTERNS, () => {
    return getAll('SELECT * FROM cross_project_patterns ORDER BY confidence DESC');
  });

  // ---- DECISIONS ----
  ipcMain.handle(IPC_CHANNELS.GET_DECISIONS, (_e, projectId: number) => {
    return getAll('SELECT * FROM project_decisions WHERE project_id = ? ORDER BY decided_at DESC', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_DECISION, (_e, data: Record<string, unknown>) => {
    return runInsert(
      `INSERT INTO project_decisions (project_id, decision, reason, alternatives_considered, outcome)
       VALUES (?, ?, ?, ?, ?)`,
      [data.project_id, data.decision, data.reason, data.alternatives_considered, data.outcome]
    );
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_DECISION, (_e, id: number) => {
    runQuery('DELETE FROM project_decisions WHERE id = ?', [id]);
    return true;
  });

  // ---- SYSTEM: Scan C:\Projects for untracked dirs ----
  ipcMain.handle(IPC_CHANNELS.SCAN_PROJECTS_DIR, () => {
    if (!fs.existsSync(PROJECTS_DIR)) return [];

    const existingPaths = getAll('SELECT repo_path FROM projects').map(p => (p.repo_path as string || '').toLowerCase());
    const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => ({
        name: d.name,
        path: path.join(PROJECTS_DIR, d.name),
        hasGit: fs.existsSync(path.join(PROJECTS_DIR, d.name, '.git')),
        hasPackageJson: fs.existsSync(path.join(PROJECTS_DIR, d.name, 'package.json')),
      }))
      .filter(d => !existingPaths.includes(d.path.toLowerCase()));

    return dirs;
  });

  // ---- SYSTEM: AI-like next step suggestions ----
  ipcMain.handle(IPC_CHANNELS.GET_SUGGESTIONS, () => {
    const suggestions: { type: string; message: string; projectId?: number; projectName?: string }[] = [];

    // Stale projects warning
    const stale = getAll(`SELECT id, name, last_worked_at FROM projects
      WHERE status IN ('building','testing') AND last_worked_at IS NOT NULL
      AND julianday('now') - julianday(last_worked_at) > 14
      ORDER BY last_worked_at ASC LIMIT 5`);
    for (const p of stale) {
      const days = Math.floor((Date.now() - new Date(p.last_worked_at as string).getTime()) / 86400000);
      suggestions.push({ type: 'stale', message: `${p.name} hasn't been touched in ${days} days. Resume or archive?`, projectId: p.id as number, projectName: p.name as string });
    }

    // Projects with blockers
    const blocked = getAll(`SELECT id, name, main_blocker FROM projects
      WHERE main_blocker IS NOT NULL AND main_blocker != '' AND status NOT IN ('archived','paused')
      LIMIT 5`);
    for (const p of blocked) {
      suggestions.push({ type: 'blocker', message: `${p.name} is blocked: ${p.main_blocker}`, projectId: p.id as number, projectName: p.name as string });
    }

    // Low health active projects
    const unhealthy = getAll(`SELECT id, name, health_score FROM projects
      WHERE health_score < 40 AND status NOT IN ('archived','paused')
      ORDER BY health_score ASC LIMIT 3`);
    for (const p of unhealthy) {
      suggestions.push({ type: 'health', message: `${p.name} health is ${p.health_score}/100 — needs attention`, projectId: p.id as number, projectName: p.name as string });
    }

    // Projects that should be archived
    const archivable = getAll(`SELECT id, name FROM projects
      WHERE status = 'paused' AND julianday('now') - julianday(COALESCE(last_worked_at, created_at)) > 30
      LIMIT 3`);
    for (const p of archivable) {
      suggestions.push({ type: 'archive', message: `${p.name} has been paused for 30+ days. Consider archiving.`, projectId: p.id as number, projectName: p.name as string });
    }

    // Unresolved session blockers
    const sessionBlockers = getAll(`SELECT ps.blockers, p.name, p.id as project_id
      FROM project_sessions ps
      JOIN projects p ON ps.project_id = p.id
      WHERE ps.blockers IS NOT NULL AND ps.blockers != ''
      AND ps.id = (SELECT MAX(id) FROM project_sessions WHERE project_id = ps.project_id)
      AND p.status NOT IN ('archived','paused')
      LIMIT 3`);
    for (const s of sessionBlockers) {
      suggestions.push({ type: 'session_blocker', message: `Last session on ${s.name} had unresolved blockers: ${s.blockers}`, projectId: s.project_id as number, projectName: s.name as string });
    }

    return suggestions;
  });

  // ---- IDEAS ----
  ipcMain.handle(IPC_CHANNELS.PROCESS_IDEA, (_e, rawInput: string) => {
    return processIdea(rawInput);
  });

  ipcMain.handle(IPC_CHANNELS.GET_IDEAS, () => {
    return getAll("SELECT * FROM ideas ORDER BY created_at DESC LIMIT 50");
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_IDEA, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED_COLS = new Set(['parsed_title', 'parsed_description', 'matched_project_id', 'matched_project_name', 'suggested_type', 'suggested_actions', 'status']);
    const keys = Object.keys(data).filter(k => ALLOWED_COLS.has(k));
    if (keys.length === 0) return true;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    runQuery(`UPDATE ideas SET ${sets} WHERE id = ?`, [...values, id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DISMISS_IDEA, (_e, id: number) => {
    runQuery("UPDATE ideas SET status = 'dismissed' WHERE id = ?", [id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.EXECUTE_IDEA, (_e, id: number) => {
    return executeIdeaActions(id);
  });

  // ---- BACKUP ----
  ipcMain.handle(IPC_CHANNELS.EXPORT_DATABASE, async () => {
    const dbPath = path.join(app.getPath('userData'), 'data.db');
    const result = await dialog.showSaveDialog({
      title: 'Export Database Backup',
      defaultPath: `zpm-backup-${new Date().toISOString().split('T')[0]}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });
    if (result.canceled || !result.filePath) return false;
    try {
      flushDb();
      fs.copyFileSync(dbPath, result.filePath);
      return true;
    } catch {
      return false;
    }
  });

  // ---- LAST SAVE TIME ----
  ipcMain.handle(IPC_CHANNELS.GET_LAST_SAVE_TIME, () => {
    return getLastSaveTime();
  });

  // ---- DESIGN DIMENSIONS ----
  ipcMain.handle(IPC_CHANNELS.GET_DESIGN_SCORES, (_e, projectId: number) => {
    return getAll('SELECT * FROM website_design_scores WHERE project_id = ? ORDER BY dimension', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.UPSERT_DESIGN_SCORE, (_e, data: Record<string, unknown>) => {
    const existing = getOne(
      'SELECT id FROM website_design_scores WHERE project_id = ? AND dimension = ?',
      [data.project_id, data.dimension]
    );
    if (existing) {
      runQuery(
        `UPDATE website_design_scores SET score = ?, status = ?, is_relevant = ?, notes = ?, updated_at = datetime('now')
         WHERE project_id = ? AND dimension = ?`,
        [data.score, data.status, data.is_relevant, data.notes, data.project_id, data.dimension]
      );
      return existing.id;
    } else {
      return runInsert(
        `INSERT INTO website_design_scores (project_id, dimension, score, status, is_relevant, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.project_id, data.dimension, data.score, data.status, data.is_relevant, data.notes]
      );
    }
  });

  ipcMain.handle(IPC_CHANNELS.INIT_DESIGN_SCORES, (_e, projectId: number) => {
    const project = getOne('SELECT type FROM projects WHERE id = ?', [projectId]);
    const isWebRelevant = project && WEB_RELEVANT_TYPES.includes(project.type as string);
    const dimensions = Object.keys(DESIGN_DIMENSIONS);
    for (const dim of dimensions) {
      runQuery(
        `INSERT OR IGNORE INTO website_design_scores (project_id, dimension, score, status, is_relevant, notes)
         VALUES (?, ?, 0, 'not_assessed', ?, NULL)`,
        [projectId, dim, isWebRelevant ? 1 : 0]
      );
    }
    return getAll('SELECT * FROM website_design_scores WHERE project_id = ? ORDER BY dimension', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.GET_ALL_DESIGN_OVERVIEW, () => {
    return getAll(`
      SELECT p.id as project_id, p.name, p.type, p.status,
        COUNT(CASE WHEN d.is_relevant = 1 THEN 1 END) as relevant_count,
        ROUND(AVG(CASE WHEN d.is_relevant = 1 THEN d.score END), 1) as avg_score,
        COUNT(CASE WHEN d.is_relevant = 1 AND d.status = 'needs_work' THEN 1 END) as needs_work_count,
        COUNT(CASE WHEN d.is_relevant = 1 AND d.status = 'excellent' THEN 1 END) as excellent_count
      FROM projects p
      LEFT JOIN website_design_scores d ON p.id = d.project_id
      WHERE p.status NOT IN ('archived')
      GROUP BY p.id
      HAVING relevant_count > 0
      ORDER BY avg_score ASC
    `);
  });
}
