import * as fs from 'fs';
import * as path from 'path';
import { runQuery, getAll, getOne } from './database';

const SHARED_MEMORY_ROOT = 'C:\Projects\_SHARED\memory';
const REPORTS_DIR = path.join(SHARED_MEMORY_ROOT, 'reports');
const INDEX_FILE = path.join(SHARED_MEMORY_ROOT, 'index.json');

export interface TaskResult {
  number: number;
  description: string;
  status: 'completed' | 'failed' | 'skipped' | 'partial';
  notes?: string;
}

export interface PromptGrade {
  score: number;
  efficiency: number;
  accuracy: number;
  completeness: number;
  reusability: number;
  calculated_at: string;
}

export interface FinalReport {
  id: string;
  project: string;
  timestamp: string;
  duration_minutes: number;
  sprint: string;
  terminal: string;
  prompt_file: string;
  prompt_category: string;
  prompt_action: string;
  prompt_hebrew_input: string;
  tasks: TaskResult[];
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  bot_questions_asked: number;
  errors_encountered: number;
  rollbacks_needed: number;
  files_changed: number;
  lines_added: number;
  lines_removed: number;
  gems_discovered: string[];
  blockers_hit: string[];
  decisions_made: string[];
  commit_hash: string;
  commit_message: string;
  branch: string;
  grade?: PromptGrade;
}

function ensureDirs(project: string): void {
  const projectDir = path.join(REPORTS_DIR, project.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
}

function getProjectDir(project: string): string {
  return path.join(REPORTS_DIR, project.toLowerCase().replace(/\s+/g, '-'));
}

function saveJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function genId(): string {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

function upsertReportToDb(report: FinalReport): void {
  const g = report.grade;
  runQuery(
    `INSERT OR REPLACE INTO final_reports (
      id, project, timestamp, duration_minutes, sprint, terminal,
      prompt_file, prompt_category, prompt_action, prompt_hebrew_input,
      total_tasks, completed_tasks, failed_tasks,
      bot_questions_asked, errors_encountered, rollbacks_needed,
      files_changed, lines_added, lines_removed,
      gems_discovered, blockers_hit, decisions_made,
      commit_hash, commit_message, branch,
      grade_score, grade_efficiency, grade_accuracy, grade_completeness, grade_reusability, grade_calculated_at,
      raw_json
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      report.id, report.project, report.timestamp, report.duration_minutes,
      report.sprint, report.terminal, report.prompt_file, report.prompt_category,
      report.prompt_action, report.prompt_hebrew_input,
      report.total_tasks, report.completed_tasks, report.failed_tasks,
      report.bot_questions_asked, report.errors_encountered, report.rollbacks_needed,
      report.files_changed, report.lines_added, report.lines_removed,
      JSON.stringify(report.gems_discovered), JSON.stringify(report.blockers_hit),
      JSON.stringify(report.decisions_made),
      report.commit_hash, report.commit_message, report.branch,
      g?.score ?? null, g?.efficiency ?? null, g?.accuracy ?? null,
      g?.completeness ?? null, g?.reusability ?? null, g?.calculated_at ?? null,
      JSON.stringify(report),
    ]
  );
}

export function saveFinalReport(report: FinalReport): FinalReport {
  if (!report.id) report.id = genId();
  if (!report.timestamp) report.timestamp = new Date().toISOString();
  ensureDirs(report.project);
  const ts = report.timestamp.slice(0, 16).replace(/:/g, '-').replace('T', '_');
  const action = (report.prompt_action || 'general').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const filePath = path.join(getProjectDir(report.project), ts + '_' + action + '.json');
  saveJson(filePath, report);
  upsertReportToDb(report);
  rebuildIndex();
  return report;
}

export function getLatestReport(project: string): FinalReport | null {
  const row = getOne('SELECT raw_json FROM final_reports WHERE project = ? ORDER BY timestamp DESC LIMIT 1', [project]);
  if (!row?.raw_json) return null;
  try { return JSON.parse(row.raw_json as string) as FinalReport; } catch { return null; }
}

export function getProjectReports(project: string): FinalReport[] {
  const rows = getAll('SELECT raw_json FROM final_reports WHERE project = ? ORDER BY timestamp DESC', [project]);
  return rows.flatMap(r => { try { return [JSON.parse(r.raw_json as string) as FinalReport]; } catch { return []; } });
}

export function searchReports(query: string): FinalReport[] {
  const q = '%' + query + '%';
  const rows = getAll(
    'SELECT raw_json FROM final_reports WHERE project LIKE ? OR prompt_action LIKE ? OR prompt_category LIKE ? OR prompt_hebrew_input LIKE ? OR commit_message LIKE ? ORDER BY timestamp DESC LIMIT 50',
    [q, q, q, q, q]
  );
  return rows.flatMap(r => { try { return [JSON.parse(r.raw_json as string) as FinalReport]; } catch { return []; } });
}

export function getReportsByCategory(category: string, action?: string): FinalReport[] {
  const rows = action
    ? getAll('SELECT raw_json FROM final_reports WHERE prompt_category = ? AND prompt_action = ? ORDER BY timestamp DESC', [category, action])
    : getAll('SELECT raw_json FROM final_reports WHERE prompt_category = ? ORDER BY timestamp DESC', [category]);
  return rows.flatMap(r => { try { return [JSON.parse(r.raw_json as string) as FinalReport]; } catch { return []; } });
}

export function getAllReports(limit = 100): FinalReport[] {
  const rows = getAll('SELECT raw_json FROM final_reports ORDER BY timestamp DESC LIMIT ?', [limit]);
  return rows.flatMap(r => { try { return [JSON.parse(r.raw_json as string) as FinalReport]; } catch { return []; } });
}

export function rebuildIndex(): void {
  try {
    const rows = getAll('SELECT id, project, timestamp, prompt_category, prompt_action, grade_score FROM final_reports ORDER BY timestamp DESC');
    const projects: Record<string, unknown[]> = {};
    for (const row of rows) {
      const proj = String(row.project || 'unknown');
      if (!projects[proj]) projects[proj] = [];
      projects[proj].push({ id: row.id, timestamp: row.timestamp, category: row.prompt_category, action: row.prompt_action, grade: row.grade_score });
    }
    saveJson(INDEX_FILE, { updated_at: new Date().toISOString(), projects });
  } catch (e) { console.error('[shared-memory] rebuildIndex:', e); }
}

export function parseAndSaveRawReport(text: string): FinalReport | null {
  try {
    const json = JSON.parse(text) as FinalReport;
    if (!json.project || !json.prompt_action) return null;
    return saveFinalReport(json);
  } catch { return null; }
}

export function getReportStats(): { totalReports: number; projectCount: number; avgGrade: number } {
  const row = getOne('SELECT COUNT(*) as total, COUNT(DISTINCT project) as projects, AVG(grade_score) as avg_grade FROM final_reports');
  return {
    totalReports: Number(row?.total ?? 0),
    projectCount: Number(row?.projects ?? 0),
    avgGrade: Math.round(Number(row?.avg_grade ?? 0) * 10) / 10,
  };
}
