import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { runQuery, getAll, getOne, runInsert, flushDb, getLastSaveTime, getDbPath, getSetting, setSetting } from './database';
import { launchProjectCommand, launchTerminalCommand, openVSCode } from './launcher';
import { processIdea, executeIdeaActions } from './idea-engine';
import { IPC_CHANNELS, DESIGN_DIMENSIONS, WEB_RELEVANT_TYPES } from '../shared/constants';
import { isTokenWiseAvailable, getTokenWiseOverview, getProjectCost } from './tokenwise-reader';
import { detectSessionFromGit, getProjectGitStatus, calculateAutoHealth, fetchRecentCommits } from './session-intelligence';
import { detectPatterns } from './pattern-detector';
import { runBackup, getBackupList, getLastBackupTime, restoreBackup, startAutoBackup, getBackupDir_public } from './auto-backup';
import { generateWeeklyDigest } from './digest';
import { generateMegaPrompt } from './prompt-engine';
import { ACTION_GROUPS, ACTION_LABELS } from '../shared/prompt-templates';
import type { PromptAction } from '../shared/prompt-templates';

const DEFAULT_PROJECTS_DIR = 'C:\\Projects';
function getProjectsDir(): string {
  return getSetting('projects_dir') || DEFAULT_PROJECTS_DIR;
}

function logAudit(entityType: string, entityId: number, projectId: number | null, action: string, field?: string | null, oldValue?: unknown, newValue?: unknown) {
  runInsert(
    'INSERT INTO audit_log (entity_type, entity_id, project_id, action, field_changed, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [entityType, entityId, projectId, action, field || null, oldValue != null ? String(oldValue) : null, newValue != null ? String(newValue) : null]
  );
}

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
      'github_repo', 'mrr', 'arr', 'revenue_model', 'paying_customers', 'revenue_notes', 'category',
    ]);
    const keys = Object.keys(data).filter(k => ALLOWED_COLS.has(k));
    if (keys.length === 0) return getOne('SELECT * FROM projects WHERE id = ?', [id]);
    // Audit: capture old values before update
    const oldProject = getOne('SELECT * FROM projects WHERE id = ?', [id]) as Record<string, unknown> | null;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    runQuery(`UPDATE projects SET ${sets}, updated_at = datetime('now') WHERE id = ?`, [...values, id]);
    // Log each changed field
    if (oldProject) {
      for (const k of keys) {
        if (String(oldProject[k] ?? '') !== String(data[k] ?? '')) {
          logAudit('project', id, id, 'update', k, oldProject[k], data[k]);
        }
      }
    }
    return getOne('SELECT * FROM projects WHERE id = ?', [id]);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_PROJECT, (_e, id: number) => {
    logAudit('project', id, id, 'delete', null, getOne('SELECT name FROM projects WHERE id = ?', [id])?.name, null);
    runQuery('DELETE FROM projects WHERE id = ?', [id]);
    return true;
  });

  // ---- SESSIONS ----
  ipcMain.handle(IPC_CHANNELS.GET_SESSIONS, (_e, projectId: number) => {
    return getAll('SELECT * FROM project_sessions WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_SESSION, (_e, data: Record<string, unknown>) => {
    const id = runInsert(
      `INSERT INTO project_sessions (project_id, summary, what_done, what_worked, what_failed, blockers, next_step, mood, duration_minutes, files_changed, commands_used, prompts_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.project_id, data.summary, data.what_done, data.what_worked, data.what_failed, data.blockers, data.next_step, data.mood, data.duration_minutes, data.files_changed ?? null, data.commands_used ?? null, data.prompts_used ?? null]
    );
    runQuery("UPDATE projects SET last_worked_at = date('now'), updated_at = datetime('now') WHERE id = ?", [data.project_id]);
    logAudit('session', id, data.project_id as number, 'create', 'summary', null, data.summary);
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_SESSION, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED = new Set(['summary', 'what_done', 'what_worked', 'what_failed', 'blockers', 'next_step', 'mood', 'duration_minutes', 'files_changed', 'commands_used', 'prompts_used']);
    const entries = Object.entries(data).filter(([k]) => ALLOWED.has(k));
    if (entries.length === 0) return false;
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    const vals = entries.map(([, v]) => v ?? null);
    runQuery(`UPDATE project_sessions SET ${sets} WHERE id = ?`, [...vals, id]);
    return true;
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
    const id = runInsert(
      `INSERT INTO project_tasks (project_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.project_id, data.title, data.description ?? null, data.status, data.priority, data.due_date ?? null]
    );
    logAudit('task', id, data.project_id as number, 'create', 'title', null, data.title);
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_TASK, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED_COLS = new Set(['title', 'description', 'status', 'priority', 'due_date', 'completed_at']);
    const oldTask = getOne('SELECT * FROM project_tasks WHERE id = ?', [id]) as Record<string, unknown> | null;
    const updates = { ...data };
    if (data.status === 'done' && !data.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    const keys = Object.keys(updates).filter(k => ALLOWED_COLS.has(k));
    if (keys.length === 0) return true;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    runQuery(`UPDATE project_tasks SET ${sets} WHERE id = ?`, [...values, id]);
    // Audit log
    if (oldTask) {
      for (const k of keys) {
        if (String(oldTask[k] ?? '') !== String(updates[k] ?? '')) {
          logAudit('task', id, oldTask.project_id as number, 'update', k, oldTask[k], updates[k]);
        }
      }
    }
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_TASK, (_e, id: number) => {
    const t = getOne('SELECT project_id, title FROM project_tasks WHERE id = ?', [id]) as Record<string, unknown> | null;
    if (t) logAudit('task', id, t.project_id as number, 'delete', 'title', t.title, null);
    runQuery('DELETE FROM project_tasks WHERE id = ?', [id]);
    return true;
  });

  // ---- SUBTASKS ----
  ipcMain.handle(IPC_CHANNELS.GET_SUBTASKS, (_e, taskId: number) => {
    return getAll('SELECT * FROM task_subtasks WHERE task_id = ? ORDER BY order_index', [taskId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_SUBTASK, (_e, data: Record<string, unknown>) => {
    const id = runInsert(
      'INSERT INTO task_subtasks (task_id, title, order_index) VALUES (?, ?, ?)',
      [data.task_id, data.title, data.order_index ?? 0]
    );
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_SUBTASK, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED_COLS = new Set(['title', 'done']);
    const keys = Object.keys(data).filter(k => ALLOWED_COLS.has(k));
    if (keys.length === 0) return true;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    runQuery(`UPDATE task_subtasks SET ${sets} WHERE id = ?`, [...values, id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_SUBTASK, (_e, id: number) => {
    runQuery('DELETE FROM task_subtasks WHERE id = ?', [id]);
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
    const c = getOne('SELECT project_id, label FROM project_commands WHERE id = ?', [id]) as Record<string, unknown> | null;
    if (c) logAudit('command', id, c.project_id as number, 'delete', 'label', c.label, null);
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

  ipcMain.handle(IPC_CHANNELS.UPDATE_METRIC, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED_COLS = new Set(['metric_name', 'metric_value', 'metric_unit', 'date', 'source', 'notes']);
    const keys = Object.keys(data).filter(k => ALLOWED_COLS.has(k));
    if (keys.length === 0) return true;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    runQuery(`UPDATE project_metrics SET ${sets} WHERE id = ?`, [...values, id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_METRIC, (_e, id: number) => {
    const m = getOne('SELECT project_id, metric_name FROM project_metrics WHERE id = ?', [id]) as Record<string, unknown> | null;
    if (m) logAudit('metric', id, m.project_id as number, 'delete', 'metric_name', m.metric_name, null);
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
    const s = getOne('SELECT project_id, summary FROM project_sessions WHERE id = ?', [id]) as Record<string, unknown> | null;
    if (s) logAudit('session', id, s.project_id as number, 'delete', 'summary', s.summary, null);
    runQuery('DELETE FROM project_sessions WHERE id = ?', [id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_LEARNING, (_e, data: Record<string, unknown>) => {
    const id = runInsert(
      `INSERT INTO learnings (project_id, learning, category, impact_score)
       VALUES (?, ?, ?, ?)`,
      [data.project_id, data.learning, data.category, data.impact_score]
    );
    logAudit('learning', id, data.project_id as number, 'create', 'learning', null, data.learning);
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_LEARNING, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED = new Set(['learning', 'category', 'impact_score']);
    const entries = Object.entries(data).filter(([k]) => ALLOWED.has(k));
    if (entries.length === 0) return false;
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    const vals = entries.map(([, v]) => v ?? null);
    runQuery(`UPDATE learnings SET ${sets} WHERE id = ?`, [...vals, id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_LEARNING, (_e, id: number) => {
    const l = getOne('SELECT project_id, learning FROM learnings WHERE id = ?', [id]) as Record<string, unknown> | null;
    if (l) logAudit('learning', id, l.project_id as number, 'delete', 'learning', l.learning, null);
    runQuery('DELETE FROM learnings WHERE id = ?', [id]);
    return true;
  });

  // ---- PATTERNS ----
  ipcMain.handle(IPC_CHANNELS.GET_PATTERNS, () => {
    return getAll('SELECT * FROM cross_project_patterns ORDER BY confidence DESC');
  });

  ipcMain.handle(IPC_CHANNELS.DETECT_PATTERNS, () => {
    return detectPatterns({ getAll, runInsert, runQuery });
  });

  // ---- DECISIONS ----
  ipcMain.handle(IPC_CHANNELS.GET_DECISIONS, (_e, projectId: number) => {
    return getAll('SELECT * FROM project_decisions WHERE project_id = ? ORDER BY decided_at DESC', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_DECISION, (_e, data: Record<string, unknown>) => {
    const id = runInsert(
      `INSERT INTO project_decisions (project_id, decision, reason, alternatives_considered, outcome)
       VALUES (?, ?, ?, ?, ?)`,
      [data.project_id, data.decision, data.reason, data.alternatives_considered, data.outcome]
    );
    logAudit('decision', id, data.project_id as number, 'create', 'decision', null, data.decision);
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_DECISION, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED = new Set(['decision', 'reason', 'alternatives_considered', 'outcome']);
    const oldDec = getOne('SELECT * FROM project_decisions WHERE id = ?', [id]) as Record<string, unknown> | null;
    const entries = Object.entries(data).filter(([k]) => ALLOWED.has(k));
    if (entries.length === 0) return false;
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    const vals = entries.map(([, v]) => v ?? null);
    runQuery(`UPDATE project_decisions SET ${sets} WHERE id = ?`, [...vals, id]);
    if (oldDec) {
      for (const [k, v] of entries) {
        if (String(oldDec[k] ?? '') !== String(v ?? '')) {
          logAudit('decision', id, oldDec.project_id as number, 'update', k, oldDec[k], v);
        }
      }
    }
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_DECISION, (_e, id: number) => {
    const d = getOne('SELECT project_id, decision FROM project_decisions WHERE id = ?', [id]) as Record<string, unknown> | null;
    if (d) logAudit('decision', id, d.project_id as number, 'delete', 'decision', d.decision, null);
    runQuery('DELETE FROM project_decisions WHERE id = ?', [id]);
    return true;
  });

  // ---- QUICK ACTIONS: Open terminal / VS Code in project folder ----
  ipcMain.handle(IPC_CHANNELS.OPEN_TERMINAL, (_e, repoPath: string) => {
    launchTerminalCommand('cd .', repoPath, 'powershell');
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_VSCODE, (_e, repoPath: string) => {
    openVSCode(repoPath);
    return { ok: true };
  });

  // ---- SYSTEM: Scan C:\Projects for untracked dirs ----
  ipcMain.handle(IPC_CHANNELS.SCAN_PROJECTS_DIR, () => {
    const projectsDir = getProjectsDir();
    if (!fs.existsSync(projectsDir)) return [];

    const existingPaths = getAll('SELECT repo_path FROM projects').map(p => (p.repo_path as string || '').toLowerCase());
    const dirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => ({
        name: d.name,
        path: path.join(projectsDir, d.name),
        hasGit: fs.existsSync(path.join(projectsDir, d.name, '.git')),
        hasPackageJson: fs.existsSync(path.join(projectsDir, d.name, 'package.json')),
      }))
      .filter(d => !existingPaths.includes(d.path.toLowerCase()));

    return dirs;
  });

  ipcMain.handle(IPC_CHANNELS.GET_APP_SETTING, (_e, key: string) => getSetting(key));
  ipcMain.handle(IPC_CHANNELS.SET_APP_SETTING, (_e, key: string, value: string) => {
    setSetting(key, value);
  });

  // ---- SYSTEM: AI-like next step suggestions ----
  ipcMain.handle(IPC_CHANNELS.GET_SUGGESTIONS, () => {
    const suggestions: { type: string; message: string; action?: string; projectId?: number; projectName?: string; repoPath?: string }[] = [];

    // Stale projects warning
    const stale = getAll(`SELECT id, name, last_worked_at, next_action, repo_path FROM projects
      WHERE status IN ('building','testing') AND last_worked_at IS NOT NULL
      AND julianday('now') - julianday(last_worked_at) > 14
      ORDER BY last_worked_at ASC LIMIT 5`);
    for (const p of stale) {
      const days = Math.floor((Date.now() - new Date(p.last_worked_at as string).getTime()) / 86400000);
      suggestions.push({
        type: 'stale',
        message: `${p.name} hasn't been touched in ${days} days`,
        action: p.next_action ? `Next step: ${p.next_action}` : 'Open it and decide: resume or archive?',
        projectId: p.id as number, projectName: p.name as string, repoPath: p.repo_path as string
      });
    }

    // Projects with blockers — show next_action so user knows what to DO
    const blocked = getAll(`SELECT id, name, main_blocker, next_action, repo_path FROM projects
      WHERE main_blocker IS NOT NULL AND main_blocker != '' AND status NOT IN ('archived','paused')
      LIMIT 5`);
    for (const p of blocked) {
      suggestions.push({
        type: 'blocker',
        message: `${p.name} is blocked: ${p.main_blocker}`,
        action: p.next_action ? `Do this: ${p.next_action}` : 'Open the project and define a next action to unblock it',
        projectId: p.id as number, projectName: p.name as string, repoPath: p.repo_path as string
      });
    }

    // Low health active projects
    const unhealthy = getAll(`SELECT id, name, health_score, next_action, main_blocker, repo_path FROM projects
      WHERE health_score < 40 AND status NOT IN ('archived','paused')
      ORDER BY health_score ASC LIMIT 3`);
    for (const p of unhealthy) {
      const hint = p.next_action || p.main_blocker || 'Review the project and update its status';
      suggestions.push({
        type: 'health',
        message: `${p.name} health is ${p.health_score}/100`,
        action: `Fix: ${hint}`,
        projectId: p.id as number, projectName: p.name as string, repoPath: p.repo_path as string
      });
    }

    // Projects that should be archived
    const archivable = getAll(`SELECT id, name, repo_path FROM projects
      WHERE status = 'paused' AND julianday('now') - julianday(COALESCE(last_worked_at, created_at)) > 30
      LIMIT 3`);
    for (const p of archivable) {
      suggestions.push({
        type: 'archive',
        message: `${p.name} has been paused for 30+ days`,
        action: 'Archive it to clean up your dashboard, or resume if still relevant',
        projectId: p.id as number, projectName: p.name as string, repoPath: p.repo_path as string
      });
    }

    // Unresolved session blockers
    const sessionBlockers = getAll(`SELECT ps.blockers, p.name, p.id as project_id, p.next_action, p.repo_path
      FROM project_sessions ps
      JOIN projects p ON ps.project_id = p.id
      WHERE ps.blockers IS NOT NULL AND ps.blockers != ''
      AND ps.id = (SELECT MAX(id) FROM project_sessions WHERE project_id = ps.project_id)
      AND p.status NOT IN ('archived','paused')
      LIMIT 3`);
    for (const s of sessionBlockers) {
      suggestions.push({
        type: 'session_blocker',
        message: `${s.name} has unresolved blockers: ${s.blockers}`,
        action: s.next_action ? `Next step: ${s.next_action}` : 'Open the project and resolve the blockers from last session',
        projectId: s.project_id as number, projectName: s.name as string, repoPath: s.repo_path as string
      });
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

  // ---- EXPORT PROJECT REPORT ----
  ipcMain.handle(IPC_CHANNELS.EXPORT_PROJECT_REPORT, async (_e, projectId: number, dateRange?: '7' | '30' | 'all') => {
    const project = getOne('SELECT * FROM projects WHERE id = ?', [projectId]) as Record<string, unknown> | null;
    if (!project) return false;

    const range = dateRange === '7' || dateRange === '30' ? dateRange : 'all';
    const sessionsQuery = range === '7'
      ? "SELECT * FROM project_sessions WHERE project_id = ? AND (created_at >= datetime('now', '-7 days') OR session_date >= date('now', '-7 days')) ORDER BY created_at DESC LIMIT 100"
      : range === '30'
        ? "SELECT * FROM project_sessions WHERE project_id = ? AND (created_at >= datetime('now', '-30 days') OR session_date >= date('now', '-30 days')) ORDER BY created_at DESC LIMIT 100"
        : 'SELECT * FROM project_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 10';
    const sessions = getAll(sessionsQuery, [projectId]);
    const tasks = getAll(`SELECT * FROM project_tasks WHERE project_id = ? ORDER BY
      CASE status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'blocked' THEN 2 WHEN 'done' THEN 3 END,
      created_at DESC`, [projectId]);
    const decisions = getAll('SELECT * FROM project_decisions WHERE project_id = ? ORDER BY decided_at DESC', [projectId]);
    const learnings = getAll('SELECT * FROM learnings WHERE project_id = ? ORDER BY impact_score DESC', [projectId]);
    const metrics = getAll('SELECT * FROM project_metrics WHERE project_id = ? ORDER BY date DESC', [projectId]);
    const commands = getAll('SELECT * FROM project_commands WHERE project_id = ? ORDER BY order_index', [projectId]);
    const designScores = getAll('SELECT * FROM website_design_scores WHERE project_id = ? AND is_relevant = 1 ORDER BY dimension', [projectId]);

    const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const projectName = esc(project.name);

    const statusColorMap: Record<string, string> = { idea: '#8892a8', planning: '#a855f7', building: '#3b82f6', testing: '#eab308', launched: '#22c55e', paused: '#f97316', archived: '#6b7280' };
    const priorityColorMap: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#8892a8' };
    const taskStatusColorMap: Record<string, string> = { todo: '#8892a8', in_progress: '#3b82f6', blocked: '#ef4444', done: '#22c55e' };

    const makeBadge = (text: string, color: string) =>
      `<span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;background:${color}22;color:${color};border:1px solid ${color}44;">${esc(text)}</span>`;

    // Build sections
    let sectionsHtml = '';

    // -- Goal, Tech Stack, Monetization
    const infoItems: string[] = [];
    if (project.goal) infoItems.push(`<div style="margin-bottom:12px;"><span style="color:#8892a8;font-size:13px;">Goal</span><p style="margin:4px 0 0;font-size:14px;">${esc(project.goal)}</p></div>`);
    if (project.tech_stack) infoItems.push(`<div style="margin-bottom:12px;"><span style="color:#8892a8;font-size:13px;">Tech Stack</span><p style="margin:4px 0 0;font-size:14px;">${esc(project.tech_stack)}</p></div>`);
    if (project.monetization_model) infoItems.push(`<div style="margin-bottom:12px;"><span style="color:#8892a8;font-size:13px;">Monetization</span><p style="margin:4px 0 0;font-size:14px;">${esc(project.monetization_model)}</p></div>`);
    if (project.main_blocker) infoItems.push(`<div style="margin-bottom:12px;"><span style="color:#ef4444;font-size:13px;">Blocker</span><p style="margin:4px 0 0;font-size:14px;">${esc(project.main_blocker)}</p></div>`);
    if (project.next_action) infoItems.push(`<div style="margin-bottom:12px;"><span style="color:#22c55e;font-size:13px;">Next Action</span><p style="margin:4px 0 0;font-size:14px;">${esc(project.next_action)}</p></div>`);
    if (infoItems.length > 0) {
      sectionsHtml += `<div class="card">${infoItems.join('')}</div>`;
    }

    // -- Health Score
    const health = Number(project.health_score) || 0;
    const healthColor = health >= 70 ? '#22c55e' : health >= 40 ? '#eab308' : '#ef4444';
    sectionsHtml += `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h2 class="section-title" style="margin:0;">Health Score</h2>
          <span style="font-size:20px;font-weight:700;color:${healthColor};">${health}/100</span>
        </div>
        <div style="width:100%;height:8px;background:#1a1a2e;border-radius:4px;overflow:hidden;">
          <div style="width:${health}%;height:100%;background:${healthColor};border-radius:4px;"></div>
        </div>
      </div>`;

    // -- Sessions
    if (sessions.length > 0) {
      let sessionRows = '';
      for (const s of sessions) {
        const mood = s.mood ? ` &mdash; ${esc(s.mood)}` : '';
        const duration = s.duration_minutes ? ` (${s.duration_minutes} min)` : '';
        sessionRows += `
          <div style="padding:12px 0;border-bottom:1px solid #1a1a2e;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;color:#a78bfa;">${esc(s.session_date || s.created_at)}${duration}</span>
              <span style="font-size:12px;color:#8892a8;">${mood}</span>
            </div>
            ${s.summary ? `<p style="font-size:14px;margin:4px 0;">${esc(s.summary)}</p>` : ''}
            ${s.what_done ? `<p style="font-size:13px;color:#8892a8;margin:2px 0;"><strong>Done:</strong> ${esc(s.what_done)}</p>` : ''}
            ${s.blockers ? `<p style="font-size:13px;color:#ef4444;margin:2px 0;"><strong>Blockers:</strong> ${esc(s.blockers)}</p>` : ''}
            ${s.next_step ? `<p style="font-size:13px;color:#22c55e;margin:2px 0;"><strong>Next:</strong> ${esc(s.next_step)}</p>` : ''}
          </div>`;
      }
      sectionsHtml += `
        <div class="card">
          <h2 class="section-title">Recent Sessions (${sessions.length})</h2>
          ${sessionRows}
        </div>`;
    }

    // -- Tasks (kanban-like)
    if (tasks.length > 0) {
      const groups: Record<string, typeof tasks> = { todo: [], in_progress: [], blocked: [], done: [] };
      for (const t of tasks) {
        const st = (t.status as string) || 'todo';
        if (!groups[st]) groups[st] = [];
        groups[st].push(t);
      }
      let kanbanHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">';
      for (const [status, items] of Object.entries(groups)) {
        if (items.length === 0) continue;
        const col = taskStatusColorMap[status] || '#8892a8';
        const label = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
        let taskCards = '';
        for (const t of items) {
          taskCards += `<div style="background:#0a0a0f;border:1px solid #1a1a2e;border-radius:6px;padding:8px 10px;margin-bottom:6px;font-size:13px;">${esc(t.title)}${t.priority ? ` <span style="color:${priorityColorMap[t.priority as string] || '#8892a8'};font-size:11px;">[${esc(t.priority)}]</span>` : ''}</div>`;
        }
        kanbanHtml += `
          <div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${col};display:inline-block;"></span>
              <span style="font-size:13px;font-weight:600;">${label}</span>
              <span style="font-size:12px;color:#8892a8;">(${items.length})</span>
            </div>
            ${taskCards}
          </div>`;
      }
      kanbanHtml += '</div>';
      sectionsHtml += `<div class="card"><h2 class="section-title">Tasks (${tasks.length})</h2>${kanbanHtml}</div>`;
    }

    // -- Decisions
    if (decisions.length > 0) {
      let decRows = '';
      for (const d of decisions) {
        decRows += `
          <div style="padding:10px 0;border-bottom:1px solid #1a1a2e;">
            <p style="font-size:14px;font-weight:600;margin:0 0 4px;">${esc(d.decision)}</p>
            ${d.reason ? `<p style="font-size:13px;color:#8892a8;margin:2px 0;"><strong>Reason:</strong> ${esc(d.reason)}</p>` : ''}
            ${d.alternatives_considered ? `<p style="font-size:13px;color:#8892a8;margin:2px 0;"><strong>Alternatives:</strong> ${esc(d.alternatives_considered)}</p>` : ''}
            ${d.outcome ? `<p style="font-size:13px;color:#a78bfa;margin:2px 0;"><strong>Outcome:</strong> ${esc(d.outcome)}</p>` : ''}
            <span style="font-size:11px;color:#555;">${esc(d.decided_at || d.created_at)}</span>
          </div>`;
      }
      sectionsHtml += `<div class="card"><h2 class="section-title">Decisions (${decisions.length})</h2>${decRows}</div>`;
    }

    // -- Learnings
    if (learnings.length > 0) {
      let learnRows = '';
      for (const l of learnings) {
        const impact = Number(l.impact_score) || 0;
        const impactColor = impact >= 8 ? '#22c55e' : impact >= 5 ? '#eab308' : '#8892a8';
        learnRows += `
          <div style="padding:8px 0;border-bottom:1px solid #1a1a2e;display:flex;align-items:flex-start;gap:10px;">
            <span style="min-width:32px;text-align:center;font-size:13px;font-weight:700;color:${impactColor};padding-top:2px;">${impact}/10</span>
            <div>
              <p style="font-size:14px;margin:0;">${esc(l.learning)}</p>
              ${l.category ? `<span style="font-size:11px;color:#8892a8;">${esc(l.category)}</span>` : ''}
            </div>
          </div>`;
      }
      sectionsHtml += `<div class="card"><h2 class="section-title">Learnings (${learnings.length})</h2>${learnRows}</div>`;
    }

    // -- Metrics
    if (metrics.length > 0) {
      let metricRows = '';
      for (const m of metrics) {
        metricRows += `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1a1a2e;">
            <div>
              <span style="font-size:14px;font-weight:600;">${esc(m.metric_name)}</span>
              ${m.notes ? `<span style="font-size:12px;color:#8892a8;margin-left:8px;">${esc(m.notes)}</span>` : ''}
            </div>
            <div style="text-align:right;">
              <span style="font-size:16px;font-weight:700;color:#a78bfa;">${esc(m.metric_value)}</span>
              ${m.metric_unit ? `<span style="font-size:12px;color:#8892a8;margin-left:4px;">${esc(m.metric_unit)}</span>` : ''}
              <div style="font-size:11px;color:#555;">${esc(m.date)}</div>
            </div>
          </div>`;
      }
      sectionsHtml += `<div class="card"><h2 class="section-title">Metrics (${metrics.length})</h2>${metricRows}</div>`;
    }

    // -- Commands
    if (commands.length > 0) {
      let cmdRows = '';
      for (const c of commands) {
        cmdRows += `
          <div style="padding:6px 0;border-bottom:1px solid #1a1a2e;display:flex;align-items:center;gap:10px;">
            <span style="font-size:13px;font-weight:600;min-width:100px;">${esc(c.label)}</span>
            <code style="font-size:12px;color:#a78bfa;background:#0a0a0f;padding:2px 8px;border-radius:4px;border:1px solid #1a1a2e;">${esc(c.command)}</code>
            <span style="font-size:11px;color:#8892a8;">${esc(c.command_type)}</span>
          </div>`;
      }
      sectionsHtml += `<div class="card"><h2 class="section-title">Launch Commands</h2>${cmdRows}</div>`;
    }

    // -- Design Scores
    if (designScores.length > 0) {
      let designRows = '';
      for (const ds of designScores) {
        const score = Number(ds.score) || 0;
        const dsColor = score >= 8 ? '#22c55e' : score >= 5 ? '#eab308' : '#ef4444';
        designRows += `
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #1a1a2e;">
            <span style="min-width:36px;font-size:14px;font-weight:700;color:${dsColor};">${score}/10</span>
            <span style="font-size:13px;">${esc((ds.dimension as string).replace(/_/g, ' '))}</span>
            ${ds.status ? `<span style="font-size:11px;color:#8892a8;margin-left:auto;">${esc(ds.status)}</span>` : ''}
          </div>`;
      }
      sectionsHtml += `<div class="card"><h2 class="section-title">Design Scores</h2>${designRows}</div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${projectName} — Project Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0f; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 40px 20px; }
  .container { max-width: 800px; margin: 0 auto; }
  .header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #1a1a2e; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 12px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .meta { font-size: 13px; color: #8892a8; }
  .card { background: #12121e; border: 1px solid #1a1a2e; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
  .section-title { font-size: 16px; font-weight: 700; margin-bottom: 14px; color: #e2e8f0; }
  .footer { text-align: center; padding-top: 32px; border-top: 1px solid #1a1a2e; margin-top: 32px; }
  .footer p { font-size: 12px; color: #555; }
  code { font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; }
  p { margin: 0; }
  @media print { body { background: #fff; color: #111; } .card { background: #f8f8f8; border-color: #ddd; } }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${projectName}</h1>
    <div class="badges">
      ${makeBadge(String(project.status || 'unknown'), statusColorMap[project.status as string] || '#8892a8')}
      ${makeBadge(String(project.priority || 'medium'), priorityColorMap[project.priority as string] || '#8892a8')}
      ${project.type ? makeBadge(String(project.type), '#3b82f6') : ''}
      ${project.stage ? makeBadge(String(project.stage), '#a855f7') : ''}
    </div>
    <div class="meta">
      ${project.description ? `<p>${esc(project.description)}</p>` : ''}
      ${project.repo_url ? `<p style="margin-top:4px;">Repo: ${esc(project.repo_url)}</p>` : ''}
      ${project.last_worked_at ? `<p style="margin-top:4px;">Last worked: ${esc(project.last_worked_at)}</p>` : ''}
    </div>
  </div>

  ${sectionsHtml}

  <div class="footer">
    <p>Generated by ZProjectManager on ${timestamp}</p>
  </div>
</div>
</body>
</html>`;

    const saveResult = await dialog.showSaveDialog({
      title: 'Export Project Report',
      defaultPath: `${(project.name as string).replace(/[^a-zA-Z0-9_-]/g, '_')}-report-${new Date().toISOString().split('T')[0]}.html`,
      filters: [{ name: 'HTML Files', extensions: ['html'] }],
    });
    if (saveResult.canceled || !saveResult.filePath) return false;
    try {
      fs.writeFileSync(saveResult.filePath, html, 'utf-8');
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

  // ---- TOKENWISE INTEGRATION ----
  ipcMain.handle(IPC_CHANNELS.TOKENWISE_AVAILABLE, () => {
    return isTokenWiseAvailable();
  });

  ipcMain.handle(IPC_CHANNELS.TOKENWISE_OVERVIEW, async () => {
    return await getTokenWiseOverview();
  });

  ipcMain.handle(IPC_CHANNELS.TOKENWISE_PROJECT_COST, async (_e, repoPath: string) => {
    return await getProjectCost(repoPath);
  });

  // ---- SESSION INTELLIGENCE ----
  ipcMain.handle(IPC_CHANNELS.DETECT_SESSION, (_e, repoPath: string, sinceDate?: string) => {
    return detectSessionFromGit(repoPath, sinceDate);
  });

  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, (_e, repoPath: string) => {
    return getProjectGitStatus(repoPath);
  });

  ipcMain.handle(IPC_CHANNELS.RECENT_COMMITS, (_e, repoPath: string, limit?: number) => {
    return fetchRecentCommits(repoPath, limit || 10);
  });

  ipcMain.handle(IPC_CHANNELS.AUTO_HEALTH, async (_e, projectId: number) => {
    const project = getOne('SELECT * FROM projects WHERE id = ?', [projectId]) as Record<string, unknown> | null;
    if (!project) return null;
    const openTasks = (getOne('SELECT COUNT(*) as c FROM project_tasks WHERE project_id = ? AND status != ?', [projectId, 'done']) as Record<string, unknown>)?.c as number || 0;
    const doneTasks = (getOne('SELECT COUNT(*) as c FROM project_tasks WHERE project_id = ? AND status = ?', [projectId, 'done']) as Record<string, unknown>)?.c as number || 0;
    const score = await calculateAutoHealth(project.repo_path as string | null, {
      status: project.status as string,
      main_blocker: project.main_blocker as string | null,
      last_worked_at: project.last_worked_at as string | null,
      open_tasks: openTasks,
      done_tasks: doneTasks,
    });
    // Auto-update the health score
    runQuery('UPDATE projects SET health_score = ? WHERE id = ?', [score, projectId]);
    return score;
  });

  // ---- AUDIT TRAIL ----
  ipcMain.handle(IPC_CHANNELS.GET_AUDIT_LOG, (_e, limit: number = 50) => {
    return getAll(`
      SELECT a.*, p.name as project_name
      FROM audit_log a
      LEFT JOIN projects p ON a.project_id = p.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [limit]);
  });

  ipcMain.handle(IPC_CHANNELS.GET_PROJECT_AUDIT_LOG, (_e, projectId: number, limit: number = 30) => {
    return getAll(`
      SELECT * FROM audit_log
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [projectId, limit]);
  });

  // ---- GLOBAL SEARCH ----
  ipcMain.handle(IPC_CHANNELS.GLOBAL_SEARCH, (_e, query: string) => {
    const q = `%${query}%`;
    const results: { type: string; id: number; projectId: number | null; title: string; subtitle: string }[] = [];

    // Search projects
    const projects = getAll('SELECT id, name, description, goal FROM projects WHERE name LIKE ? OR description LIKE ? OR goal LIKE ? LIMIT 5', [q, q, q]);
    for (const p of projects) results.push({ type: 'project', id: p.id as number, projectId: p.id as number, title: p.name as string, subtitle: (p.description || p.goal || '') as string });

    // Search tasks
    const tasks = getAll('SELECT t.id, t.title, t.description, t.project_id, p.name as project_name FROM project_tasks t JOIN projects p ON t.project_id = p.id WHERE t.title LIKE ? OR t.description LIKE ? LIMIT 5', [q, q]);
    for (const t of tasks) results.push({ type: 'task', id: t.id as number, projectId: t.project_id as number, title: t.title as string, subtitle: `Task in ${t.project_name}` });

    // Search sessions
    const sessions = getAll('SELECT s.id, s.summary, s.what_done, s.project_id, p.name as project_name FROM project_sessions s JOIN projects p ON s.project_id = p.id WHERE s.summary LIKE ? OR s.what_done LIKE ? LIMIT 5', [q, q]);
    for (const s of sessions) results.push({ type: 'session', id: s.id as number, projectId: s.project_id as number, title: (s.summary || 'Session') as string, subtitle: `Session in ${s.project_name}` });

    // Search decisions
    const decisions = getAll('SELECT d.id, d.decision, d.reason, d.project_id, p.name as project_name FROM project_decisions d JOIN projects p ON d.project_id = p.id WHERE d.decision LIKE ? OR d.reason LIKE ? LIMIT 5', [q, q]);
    for (const d of decisions) results.push({ type: 'decision', id: d.id as number, projectId: d.project_id as number, title: (d.decision || '') as string, subtitle: `Decision in ${d.project_name}` });

    // Search learnings
    const learnings = getAll('SELECT l.id, l.learning, l.project_id, p.name as project_name FROM learnings l LEFT JOIN projects p ON l.project_id = p.id WHERE l.learning LIKE ? LIMIT 5', [q]);
    for (const l of learnings) results.push({ type: 'learning', id: l.id as number, projectId: l.project_id as number | null, title: (l.learning || '') as string, subtitle: l.project_name ? `Learning from ${l.project_name}` : 'Cross-project learning' });

    return results;
  });

  // ---- WEEKLY DIGEST ----
  ipcMain.handle(IPC_CHANNELS.GET_WEEKLY_DIGEST, () => {
    return generateWeeklyDigest(getAll, getOne);
  });

  // ---- AUTO BACKUP ----
  ipcMain.handle(IPC_CHANNELS.RUN_BACKUP, () => {
    return runBackup();
  });

  ipcMain.handle(IPC_CHANNELS.GET_BACKUP_LIST, () => {
    return getBackupList();
  });

  ipcMain.handle(IPC_CHANNELS.GET_LAST_BACKUP_TIME, () => {
    return getLastBackupTime();
  });

  ipcMain.handle(IPC_CHANNELS.RESTORE_BACKUP, (_e, backupName: string) => {
    return restoreBackup(backupName);
  });

  ipcMain.handle(IPC_CHANNELS.SET_BACKUP_INTERVAL, (_e, hours: number) => {
    startAutoBackup(hours);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.GET_BACKUP_DIR, () => {
    return getBackupDir_public();
  });

  // ---- DATA STATS ----
  ipcMain.handle(IPC_CHANNELS.GET_DATA_STATS, () => {
    const stats: Record<string, number> = {};
    stats.projects = (getOne('SELECT COUNT(*) as c FROM projects') as any)?.c || 0;
    stats.sessions = (getOne('SELECT COUNT(*) as c FROM project_sessions') as any)?.c || 0;
    stats.tasks_open = (getOne("SELECT COUNT(*) as c FROM project_tasks WHERE status != 'done'") as any)?.c || 0;
    stats.tasks_done = (getOne("SELECT COUNT(*) as c FROM project_tasks WHERE status = 'done'") as any)?.c || 0;
    stats.decisions = (getOne('SELECT COUNT(*) as c FROM project_decisions') as any)?.c || 0;
    stats.learnings = (getOne('SELECT COUNT(*) as c FROM learnings') as any)?.c || 0;
    stats.audit_entries = (getOne('SELECT COUNT(*) as c FROM audit_log') as any)?.c || 0;
    stats.patterns = (getOne('SELECT COUNT(*) as c FROM cross_project_patterns') as any)?.c || 0;
    return stats;
  });

  // ---- CLEAR AUDIT LOG ----
  ipcMain.handle(IPC_CHANNELS.CLEAR_AUDIT_LOG, () => {
    runQuery('DELETE FROM audit_log');
    return true;
  });

  // ---- DATABASE PATH ----
  ipcMain.handle(IPC_CHANNELS.GET_DB_PATH, () => {
    return getDbPath();
  });

  // ---- TAGS ----
  ipcMain.handle(IPC_CHANNELS.GET_TAGS, (_e, projectId: number) => {
    return getAll('SELECT * FROM project_tags WHERE project_id = ? ORDER BY tag', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.ADD_TAG, (_e, data: Record<string, unknown>) => {
    const id = runInsert(
      'INSERT OR IGNORE INTO project_tags (project_id, tag, color) VALUES (?, ?, ?)',
      [data.project_id, data.tag, data.color || '#3b82f6']
    );
    logAudit('tag', id, data.project_id as number, 'create', 'tag', null, data.tag);
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.REMOVE_TAG, (_e, id: number) => {
    const tag = getOne('SELECT * FROM project_tags WHERE id = ?', [id]) as Record<string, unknown> | undefined;
    if (tag) logAudit('tag', id, tag.project_id as number, 'delete', 'tag', tag.tag, null);
    runQuery('DELETE FROM project_tags WHERE id = ?', [id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.GET_ALL_TAGS, () => {
    return getAll('SELECT DISTINCT tag, color FROM project_tags ORDER BY tag');
  });

  // ---- NOTES ----
  ipcMain.handle(IPC_CHANNELS.GET_NOTES, (_e, projectId: number) => {
    return getAll('SELECT * FROM project_notes WHERE project_id = ? ORDER BY pinned DESC, updated_at DESC', [projectId]);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_NOTE, (_e, data: Record<string, unknown>) => {
    const id = runInsert(
      'INSERT INTO project_notes (project_id, content, pinned) VALUES (?, ?, ?)',
      [data.project_id, data.content, data.pinned || 0]
    );
    logAudit('note', id, data.project_id as number, 'create', null, null, (data.content as string)?.substring(0, 100));
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_NOTE, (_e, id: number, data: Record<string, unknown>) => {
    const ALLOWED = new Set(['content', 'pinned']);
    const entries = Object.entries(data).filter(([k]) => ALLOWED.has(k));
    if (entries.length === 0) return false;
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    const vals = entries.map(([, v]) => v ?? null);
    runQuery(`UPDATE project_notes SET ${sets}, updated_at = datetime('now') WHERE id = ?`, [...vals, id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_NOTE, (_e, id: number) => {
    const note = getOne('SELECT * FROM project_notes WHERE id = ?', [id]) as Record<string, unknown> | undefined;
    if (note) logAudit('note', id, note.project_id as number, 'delete', null, (note.content as string)?.substring(0, 100), null);
    runQuery('DELETE FROM project_notes WHERE id = ?', [id]);
    return true;
  });

  // ---- KANBAN ----
  ipcMain.handle(IPC_CHANNELS.GET_KANBAN_TASKS, () => {
    return getAll(`SELECT t.*, p.name as project_name,
      (SELECT COUNT(*) FROM task_subtasks WHERE task_id = t.id) as subtask_total,
      (SELECT COUNT(*) FROM task_subtasks WHERE task_id = t.id AND done = 1) as subtask_done
      FROM project_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.status != 'done' OR t.completed_at > datetime('now', '-7 days')
      ORDER BY CASE t.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, t.created_at DESC`);
  });

  ipcMain.handle(IPC_CHANNELS.MOVE_KANBAN_TASK, (_e, taskId: number, newStatus: string) => {
    const old = getOne('SELECT status, project_id FROM project_tasks WHERE id = ?', [taskId]) as Record<string, unknown> | undefined;
    if (newStatus === 'done') {
      runQuery("UPDATE project_tasks SET status = ?, completed_at = datetime('now') WHERE id = ?", [newStatus, taskId]);
    } else {
      runQuery('UPDATE project_tasks SET status = ?, completed_at = NULL WHERE id = ?', [newStatus, taskId]);
    }
    if (old) logAudit('task', taskId, old.project_id as number, 'update', 'status', old.status, newStatus);
    return true;
  });

  // ---- NOTIFICATIONS ----
  ipcMain.handle(IPC_CHANNELS.GET_NOTIFICATIONS, () => {
    const notifications: { id: string; type: string; title: string; message: string; projectId?: number; projectName?: string; priority: string }[] = [];
    // Stale projects (not worked on in 14+ days, not archived/paused)
    const stale = getAll(`SELECT id, name, last_worked_at FROM projects
      WHERE status NOT IN ('archived','paused','launched')
      AND (last_worked_at IS NULL OR last_worked_at < date('now', '-14 days'))`) as Record<string, unknown>[];
    for (const p of stale) {
      notifications.push({ id: `stale-${p.id}`, type: 'stale', title: 'Stale Project', message: `${p.name} hasn't been worked on recently`, projectId: p.id as number, projectName: p.name as string, priority: 'medium' });
    }
    // Overdue tasks
    const overdue = getAll(`SELECT t.id, t.title, t.due_date, p.name as project_name, t.project_id FROM project_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date < date('now')`) as Record<string, unknown>[];
    for (const t of overdue) {
      notifications.push({ id: `overdue-${t.id}`, type: 'overdue', title: 'Overdue Task', message: `"${t.title}" in ${t.project_name} was due ${t.due_date}`, projectId: t.project_id as number, projectName: t.project_name as string, priority: 'high' });
    }
    // Low health projects
    const lowHealth = getAll(`SELECT id, name, health_score FROM projects WHERE health_score < 30 AND status NOT IN ('archived','paused')`) as Record<string, unknown>[];
    for (const p of lowHealth) {
      notifications.push({ id: `health-${p.id}`, type: 'health', title: 'Low Health', message: `${p.name} health is ${p.health_score}%`, projectId: p.id as number, projectName: p.name as string, priority: 'medium' });
    }
    // Blocked tasks
    const blocked = getAll(`SELECT t.id, t.title, p.name as project_name, t.project_id FROM project_tasks t
      JOIN projects p ON t.project_id = p.id WHERE t.status = 'blocked'`) as Record<string, unknown>[];
    for (const t of blocked) {
      notifications.push({ id: `blocked-${t.id}`, type: 'blocked', title: 'Blocked Task', message: `"${t.title}" in ${t.project_name} is blocked`, projectId: t.project_id as number, projectName: t.project_name as string, priority: 'high' });
    }
    return notifications;
  });

  ipcMain.handle(IPC_CHANNELS.DISMISS_NOTIFICATION, (_e, _notifId: string) => {
    // Notifications are computed dynamically, dismissals are client-side (localStorage)
    return true;
  });

  // ---- BATCH ENDPOINTS ----
  ipcMain.handle(IPC_CHANNELS.BATCH_TASK_PROGRESS, () => {
    // Single query to get task progress for ALL projects
    const rows = getAll(`
      SELECT project_id,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        COUNT(*) as total
      FROM project_tasks
      GROUP BY project_id
    `) as { project_id: number; done: number; total: number }[];
    const map: Record<number, { done: number; total: number }> = {};
    for (const r of rows) {
      map[r.project_id] = { done: r.done, total: r.total };
    }
    return map;
  });

  ipcMain.handle(IPC_CHANNELS.BATCH_GIT_STATUS, async (_e, projects: { id: number; repo_path: string }[]) => {
    // Run git status for multiple projects in parallel
    const results: Record<number, boolean | null> = {};
    await Promise.all(projects.map(async (p) => {
      const gs = await getProjectGitStatus(p.repo_path);
      results[p.id] = gs ? (gs.uncommitted === 0 && gs.untracked === 0) : null;
    }));
    return results;
  });

  // ---- GITHUB API ----
  ipcMain.handle(IPC_CHANNELS.GITHUB_SYNC_ALL, async () => {
    const { syncAllProjects } = await import('./github-api');
    const result = await syncAllProjects();
    return result;
  });

  ipcMain.handle(IPC_CHANNELS.GITHUB_SET_TOKEN, (_e, token: string) => {
    setSetting('github_token', token || '');
    return { ok: true };
  });

  // ---- REVENUE ----
  ipcMain.handle(IPC_CHANNELS.REVENUE_GET_ALL, () => {
    return getAll(`
      SELECT re.*, p.name as project_name
      FROM revenue_entries re
      JOIN projects p ON re.project_id = p.id
      ORDER BY re.date DESC, re.created_at DESC
    `);
  });

  ipcMain.handle(IPC_CHANNELS.REVENUE_CREATE_ENTRY, (_e, data: { project_id: number; amount: number; type: string; date?: string; notes?: string }) => {
    return runInsert(
      `INSERT INTO revenue_entries (project_id, amount, type, date, notes) VALUES (?, ?, ?, ?, ?)`,
      [data.project_id, data.amount, data.type, data.date || new Date().toISOString().slice(0, 10), data.notes || null]
    );
  });

  ipcMain.handle(IPC_CHANNELS.REVENUE_DELETE_ENTRY, (_e, id: number) => {
    runQuery('DELETE FROM revenue_entries WHERE id = ?', [id]);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.REVENUE_UPDATE_PROJECT, (_e, id: number, data: { mrr?: number; arr?: number; revenue_model?: string; paying_customers?: number; revenue_notes?: string }) => {
    const allowed = new Set(['mrr', 'arr', 'revenue_model', 'paying_customers', 'revenue_notes']);
    const keys = Object.keys(data).filter(k => allowed.has(k));
    if (keys.length === 0) return false;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => (data as Record<string, unknown>)[k]);
    runQuery(`UPDATE projects SET ${sets}, updated_at = datetime('now') WHERE id = ?`, [...values, id]);
    return true;
  });

  // ---- PROMPT ENGINE ----
  ipcMain.handle(IPC_CHANNELS.PROMPTS_GENERATE, (_e, args: { projectId: number; action: PromptAction; extraContext?: string }) => {
    const proj = getOne('SELECT * FROM projects WHERE id = ?', [args.projectId]);
    if (!proj) return '';

    const decisions = getAll(
      'SELECT decision, reason FROM project_decisions WHERE project_id = ? ORDER BY decided_at DESC LIMIT 8',
      [args.projectId]
    ) as { decision: string; reason: string | null }[];

    const tasks = getAll(
      `SELECT title, priority, status FROM project_tasks WHERE project_id = ? AND status != 'done' ORDER BY
        CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END LIMIT 5`,
      [args.projectId]
    ) as { title: string; priority: string; status: string }[];

    const sessions = getAll(
      'SELECT summary, session_date FROM project_sessions WHERE project_id = ? ORDER BY session_date DESC LIMIT 3',
      [args.projectId]
    ) as { summary: string | null; session_date: string }[];

    // Parse tech_stack — stored as JSON string or comma-separated
    let techStack: string[] = [];
    try {
      techStack = JSON.parse(proj.tech_stack as string || '[]');
    } catch {
      techStack = String(proj.tech_stack || '').split(',').map(s => s.trim()).filter(Boolean);
    }

    const projectData = {
      id: proj.id as number,
      name: proj.name as string,
      description: proj.description as string | null,
      repo_path: proj.repo_path as string | null,
      status: proj.status as string,
      stage: proj.stage as string,
      health_score: proj.health_score as number,
      tech_stack: techStack,
      github_repo: proj.github_repo as string | null,
      github_ci_status: proj.github_ci_status as string | null,
      github_open_prs: proj.github_open_prs as number | null,
      revenue_model: proj.revenue_model as string | null,
      mrr: proj.mrr as number | null,
      main_blocker: proj.main_blocker as string | null,
      next_action: proj.next_action as string | null,
      category: proj.category as string | null,
      decisions,
      tasks,
      sessions,
    };

    return generateMegaPrompt(projectData, args.action, args.extraContext);
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS_GET_ACTIONS, () => {
    return { groups: ACTION_GROUPS, labels: ACTION_LABELS };
  });
}
