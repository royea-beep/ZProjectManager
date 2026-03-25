import * as fs from 'fs';
import * as path from 'path';
import { getOne, getAll } from './database';
import { saveFinalReport, rebuildIndex } from './shared-memory';
import { gradePrompt } from './prompt-grading';
import { extractPatterns } from './cross-project-intel';
import type { FinalReport, TaskResult } from './shared-memory';

// ── Types ──────────────────────────────────────────────────────────────────────────

export interface RawSession {
  filepath: string;
  project: string;
  content: string;
  date: string;
  type: 'final-report' | 'session-log' | 'sprint-summary' | 'unknown';
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: { file: string; error: string }[];
  avgGrade: number;
  patternsExtracted: number;
}

// ── Project scan roots ─────────────────────────────────────────────────────────

const SESSION_ROOTS: { dir: string; project: string }[] = [
  { dir: 'C:/Projects/90soccer/docs/sessions', project: '9soccer' },
  { dir: 'C:/Projects/Caps/sessions', project: 'caps' },
  { dir: 'C:/Projects/Wingman/sessions', project: 'wingman' },
  { dir: 'C:/Projects/Wingman/docs/sessions', project: 'wingman' },
  { dir: 'C:/Projects/ZProjectManager/sessions', project: 'zprojectmanager' },
  { dir: 'C:/Projects/analyzer-standalone/sessions', project: 'analyzer' },
  { dir: 'C:/Projects/PostPilot/sessions', project: 'postpilot' },
  { dir: 'C:/Projects/clubgg/sessions', project: 'clubgg' },
];

const GIT_ROOTS: { dir: string; project: string }[] = [
  { dir: 'C:/Projects/90soccer', project: '9soccer' },
  { dir: 'C:/Projects/Caps', project: 'caps' },
  { dir: 'C:/Projects/Wingman', project: 'wingman' },
  { dir: 'C:/Projects/ZProjectManager', project: 'zprojectmanager' },
  { dir: 'C:/Projects/PostPilot', project: 'postpilot' },
  { dir: 'C:/Projects/analyzer-standalone', project: 'analyzer' },
];

// ── Filename parser ──────────────────────────────────────────────────────────────────

export function parseFilename(filename: string): Partial<FinalReport> {
  const base = path.basename(filename, path.extname(filename));
  const result: Partial<FinalReport> = {};

  // ZProjectManager_2026-03-21_05-07 → date + project
  const zpmMatch = base.match(/ZProjectManager[_-](\d{4}-\d{2}-\d{2})[_-](\d{2}[-:]?\d{2})/i);
  if (zpmMatch) {
    const time = zpmMatch[2].replace('-', ':');
    result.timestamp = zpmMatch[1] + 'T' + time + ':00.000Z';
    result.project = 'zprojectmanager';
  }

  // SESSION-2026-03-22-0825-character-system
  const sessionMatch = base.match(/SESSION[_-](\d{4}-\d{2}-\d{2})[_-](\d{4})[_-]?(.+)?/i);
  if (sessionMatch) {
    const hh = sessionMatch[2].slice(0, 2);
    const mm = sessionMatch[2].slice(2, 4);
    result.timestamp = sessionMatch[1] + 'T' + hh + ':' + mm + ':00.000Z';
    const actionRaw = (sessionMatch[3] || '').replace(/[_-]+/g, '-').toLowerCase().replace(/^-+|-+$/g, '');
    if (actionRaw) result.prompt_action = actionRaw;
  }

  // 2026-03-23 (Wingman date only)
  const dateOnly = base.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnly) {
    result.timestamp = dateOnly[1] + 'T10:00:00.000Z';
  }

  // DAY1-2026-03-22, DAY2-2026-03-23
  const dayMatch = base.match(/DAY(\d+)[_-](\d{4}-\d{2}-\d{2})/i);
  if (dayMatch) {
    result.timestamp = dayMatch[2] + 'T08:00:00.000Z';
    result.sprint = 'Day ' + dayMatch[1];
  }

  // SPRINT references: SPRINT-D-2026-03-24 or Sprint-C
  const sprintMatch = base.match(/SPRINT[_-]([A-Z\d]+)/i);
  if (sprintMatch) result.sprint = 'Sprint ' + sprintMatch[1].toUpperCase();

  // Fallback: extract any date pattern
  if (!result.timestamp) {
    const anyDate = base.match(/(\d{4}-\d{2}-\d{2})/);
    if (anyDate) result.timestamp = anyDate[1] + 'T12:00:00.000Z';
  }

  if (!result.timestamp) {
    result.timestamp = new Date().toISOString();
  }

  return result;
}

// ── Content parsers ────────────────────────────────────────────────────────────────────

export function parseStatusTable(content: string): TaskResult[] {
  const tasks: TaskResult[] = [];

  // Format A: markdown table rows | # | desc | status |
  const tableRows = content.match(/\|\s*\d+\s*\|[^|]+\|[^|]+\|[^|]*\|?/g) || [];
  for (const row of tableRows) {
    const cols = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;
    const num = parseInt(cols[0]);
    if (isNaN(num)) continue;
    const desc = cols.slice(1, -1).join(' — ');
    const statusCol = cols[cols.length - 1];
    let status: TaskResult['status'] = 'skipped';
    if (statusCol.includes('✅')) status = 'completed';
    else if (statusCol.includes('🚨')) status = 'failed';
    else if (statusCol.includes('⚠')) status = 'partial';
    else if (statusCol.toLowerCase().includes('done') || statusCol.toLowerCase().includes('shipped')) status = 'completed';
    tasks.push({ number: num, description: desc, status });
  }

  // Format B: Agent sections ## Agent X — Title ✅/🚨
  if (tasks.length === 0) {
    const agentSections = content.match(/##\s+(?:Agent\s+\d+|Step\s+\d+|[A-Z][A-Za-z\s]+)\s*[—–-]\s*([^\n]+)/g) || [];
    let n = 1;
    for (const section of agentSections) {
      const hasCheck = section.includes('✅');
      const hasFail = section.includes('🚨');
      const hasWarn = section.includes('⚠');
      const descMatch = section.match(/##\s+(.+)/);
      const desc = (descMatch?.[1] || section).replace(/[✅🚨⚠]/g, '').trim();
      tasks.push({
        number: n++,
        description: desc,
        status: hasFail ? 'failed' : hasWarn ? 'partial' : hasCheck ? 'completed' : 'skipped',
      });
    }
  }

  // Format C: checkbox list
  if (tasks.length === 0) {
    const checkboxes = content.match(/^[-*]\s+\[([xX ])\]\s+(.+)$/gm) || [];
    let n = 1;
    for (const cb of checkboxes) {
      const m = cb.match(/\[([xX ])\]\s+(.+)/);
      if (!m) continue;
      tasks.push({
        number: n++,
        description: m[2].trim(),
        status: m[1].trim().toLowerCase() === 'x' ? 'completed' : 'skipped',
      });
    }
  }

  // Format D: inline status markers (TypeScript: clean ✅)
  if (tasks.length === 0) {
    const inlineChecks = content.match(/([A-Za-z][A-Za-z\s]+):\s*(?:clean\s*)?[✅🚨]/g) || [];
    let n = 1;
    for (const c of inlineChecks) {
      tasks.push({
        number: n++,
        description: c.replace(/[✅🚨]/, '').trim(),
        status: c.includes('✅') ? 'completed' : 'failed',
      });
    }
  }

  return tasks;
}

export function extractCommitHash(content: string): string | null {
  // **Commit:** abc1234
  const m1 = content.match(/\*\*Commit[^\*]*\*\*:?\s*([a-f0-9]{7,40})/i);
  if (m1) return m1[1].slice(0, 7);
  // Committed: abc1234
  const m2 = content.match(/Committed?:?\s*([a-f0-9]{7,12})\b/i);
  if (m2) return m2[1];
  // - commit: abc1234
  const m3 = content.match(/commit[:\s]+([a-f0-9]{7,12})\b/i);
  if (m3) return m3[1];
  return null;
}

export function extractGems(content: string): string[] {
  const gems: string[] = [];
  // Lines starting with ✨ or containing "GEM"
const gemLines = content.match(/(?:^|\n)[✨🌟]\s*(.+)/gu) || [];
  for (const g of gemLines.slice(0, 5)) {
    gems.push(g.replace(/^[\n\u2728\u{1F31F}\s]+/u, '').trim());
  }
  // Lines with "key learning" or "lesson"
  const lessonLines = content.match(/(?:key learning|lesson|pattern|gem):\s*(.+)/gi) || [];
  for (const l of lessonLines.slice(0, 3)) {
    const text = l.replace(/^(?:key learning|lesson|pattern|gem):\s*/i, '').trim();
    if (text.length > 10) gems.push(text);
  }
  return [...new Set(gems)].slice(0, 8);
}

// ── Classify session type ──────────────────────────────────────────────────────────────

function classifyType(content: string, filename: string): RawSession['type'] {
  const lower = filename.toLowerCase();
  if (content.includes('| # |') && (content.includes('✅') || content.includes('🚨'))) return 'final-report';
  if (lower.includes('sprint') || lower.includes('day') && lower.includes('202')) return 'sprint-summary';
  if (lower.includes('session') || lower.includes('audit') || lower.includes('sim')) return 'session-log';
  return 'unknown';
}

// ── Derive project from directory path ────────────────────────────────────────────────

function projectFromPath(filepath: string, rootProject: string): string {
  return rootProject;
}

// ── Infer category from action + project ──────────────────────────────────────────────────────

function inferCategory(action: string, project: string): string {
  const a = action.toLowerCase();
  if (a.includes('security') || a.includes('rls') || a.includes('audit')) return 'security';
  if (a.includes('test') || a.includes('ci') || a.includes('flight')) return 'devops';
  if (a.includes('feature') || a.includes('game') || a.includes('mode')) return 'game-dev';
  if (a.includes('fix') || a.includes('bug') || a.includes('debug')) return 'bug-fix';
  if (a.includes('deploy') || a.includes('release') || a.includes('launch')) return 'deployment';
  if (a.includes('sprint') || a.includes('session')) return 'sprint';
  if (a.includes('auth') || a.includes('billing') || a.includes('payment')) return 'billing';
  if (a.includes('ui') || a.includes('design') || a.includes('style')) return 'design';
  if (a.includes('perf') || a.includes('optim') || a.includes('speed')) return 'performance';
  if (project === 'zprojectmanager') return 'project-management';
  if (project === 'wingman') return 'mobile-app';
  if (project === 'caps') return 'mobile-app';
  if (project === '9soccer' || project === '90soccer') return 'game-dev';
  return 'general';
}

// ── Parse a single session file ──────────────────────────────────────────────────────────────────

export function parseSessionToReport(session: RawSession): FinalReport {
  const content = session.content;
  const meta = parseFilename(session.filepath);
  const tasks = parseStatusTable(content);
  const commitHash = extractCommitHash(content) || '';
  const gems = extractGems(content);

  // Count tasks
  const completed = tasks.filter(t => t.status === 'completed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const total = tasks.length || 1; // minimum 1 to avoid div/0

  // Extract commit message from content
  const commitMsgMatch = content.match(/feat:|fix:|chore:|refactor:|docs:.*$/m);
  const commitMessage = commitMsgMatch ? commitMsgMatch[0].slice(0, 100) : '';

  // Extract errors count
  const errorCount = (content.match(/error|🚨|failed|crash/gi) || []).length;
  const errorsEncountered = Math.min(Math.floor(errorCount / 3), 5); // normalize

  // Files changed
  const filesMatch = content.match(/(\d+)\s+files?\s+changed/i);
  const linesAddMatch = content.match(/(\d+)\s+insertion/i);
  const linesRemMatch = content.match(/(\d+)\s+deletion/i);

  // Sprint detection
  const sprintMatch = content.match(/Sprint\s+([A-Z0-9]+)/i);
  const sprint = meta.sprint || (sprintMatch ? 'Sprint ' + sprintMatch[1] : '');

  // Terminal
  const terminal = session.project.toUpperCase();

  // Category + action
  const filenameAction = meta.prompt_action || path.basename(session.filepath, '.md').toLowerCase().replace(/session-\d{4}-\d{2}-\d{2}-\d{4}-?/, '').replace(/^zprojectmanager[-_]\d{4}-\d{2}-\d{2}[-_][\d-]+[-_]?/, '') || 'session';
  const category = inferCategory(filenameAction, session.project);

  const report: FinalReport = {
    id: session.project + '_' + (meta.timestamp || new Date().toISOString()).slice(0, 16).replace(/[:\-T]/g, '') + '_' + Math.random().toString(36).slice(2, 6),
    project: session.project,
    timestamp: meta.timestamp || new Date().toISOString(),
    duration_minutes: 60, // default estimate
    sprint,
    terminal,
    prompt_file: path.basename(session.filepath),
    prompt_category: category,
    prompt_action: filenameAction.slice(0, 60),
    prompt_hebrew_input: '',
    tasks,
    total_tasks: total,
    completed_tasks: completed || (tasks.length === 0 ? 1 : completed),
    failed_tasks: failed,
    bot_questions_asked: 0,
    errors_encountered: errorsEncountered,
    rollbacks_needed: 0,
    files_changed: filesMatch ? parseInt(filesMatch[1]) : 0,
    lines_added: linesAddMatch ? parseInt(linesAddMatch[1]) : 0,
    lines_removed: linesRemMatch ? parseInt(linesRemMatch[1]) : 0,
    gems_discovered: gems,
    blockers_hit: [],
    decisions_made: [],
    commit_hash: commitHash,
    commit_message: commitMessage,
    branch: 'master',
  };

  // If no tasks were found, assume 1 task completed (session exists = something shipped)
  if (report.total_tasks === 0) {
    report.total_tasks = 1;
    report.completed_tasks = 1;
  }

  return report;
}

// ── Discover all session files ─────────────────────────────────────────────────────────────────

export function discoverSessions(): RawSession[] {
  const sessions: RawSession[] = [];

  for (const root of SESSION_ROOTS) {
    if (!fs.existsSync(root.dir)) continue;
    let files: string[];
    try { files = fs.readdirSync(root.dir); } catch { continue; }

    for (const file of files) {
      if (!file.endsWith('.md') && !file.endsWith('.json')) continue;
      if (file === 'README.md' || file.toLowerCase() === 'index.md') continue;
      const filepath = path.join(root.dir, file);
      try {
        const content = fs.readFileSync(filepath, 'utf-8');
        if (content.length < 50) continue; // skip empty files
        sessions.push({
          filepath,
          project: root.project,
          content,
          date: new Date().toISOString(),
          type: classifyType(content, file),
        });
      } catch { continue; }
    }
  }

  return sessions;
}

// ── Duplicate detection ──────────────────────────────────────────────────────────────────────────────

function isDuplicate(report: FinalReport): boolean {
  const existing = getOne(
    'SELECT id FROM final_reports WHERE project = ? AND prompt_file = ?',
    [report.project, report.prompt_file]
  );
  return !!existing;
}

// ── Git history import ─────────────────────────────────────────────────────────────────────────────

function runGitLog(repoDir: string): string[] {
  try {
    const { execSync } = require('child_process') as typeof import('child_process');
    const output = execSync(
      'git log --format="%H|%s|%aI" --since="2026-01-01"',
      { cwd: repoDir, encoding: 'utf8', timeout: 5000 }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

export function importFromGitHistory(): FinalReport[] {
  const reports: FinalReport[] = [];

  for (const root of GIT_ROOTS) {
    if (!fs.existsSync(root.dir)) continue;
    const lines = runGitLog(root.dir);
    if (lines.length === 0) continue;

    // Group commits by sprint/day
    const significantCommits = lines.filter(l => {
      const msg = l.split('|')[1] || '';
      return /^(feat|fix|refactor|chore):/i.test(msg) || /sprint|vamos|session/i.test(msg);
    });

    // Create one report per batch of 5 significant commits (or per sprint mention)
    let batch: string[] = [];
    const batches: string[][] = [];
    for (const line of significantCommits.slice(0, 50)) {
      batch.push(line);
      if (batch.length >= 5) { batches.push([...batch]); batch = []; }
    }
    if (batch.length > 0) batches.push(batch);

    for (const b of batches) {
      const firstLine = b[0].split('|');
      const lastLine = b[b.length - 1].split('|');
      const hash = firstLine[0]?.slice(0, 7) || '';
      const message = firstLine[1] || '';
      const dateStr = firstLine[2] || new Date().toISOString();

      const tasks: TaskResult[] = b.map((line, i) => {
        const parts = line.split('|');
        const msg = parts[1] || '';
        return {
          number: i + 1,
          description: msg.slice(0, 80),
          status: msg.startsWith('fix:') ? 'completed' : msg.startsWith('feat:') ? 'completed' : 'completed',
        };
      });

      const action = message.replace(/^(feat|fix|refactor|chore|docs):\s*/i, '').slice(0, 60).replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
      const category = inferCategory(action, root.project);

      const report: FinalReport = {
        id: root.project + '_git_' + hash + '_' + Math.random().toString(36).slice(2, 5),
        project: root.project,
        timestamp: dateStr,
        duration_minutes: 45,
        sprint: '',
        terminal: root.project.toUpperCase() + '_GIT',
        prompt_file: 'git_batch_' + hash + '.auto',
        prompt_category: category,
        prompt_action: action.slice(0, 60) || 'git-commit-batch',
        prompt_hebrew_input: '',
        tasks,
        total_tasks: tasks.length,
        completed_tasks: tasks.length,
        failed_tasks: 0,
        bot_questions_asked: 0,
        errors_encountered: 0,
        rollbacks_needed: 0,
        files_changed: 0,
        lines_added: 0,
        lines_removed: 0,
        gems_discovered: [],
        blockers_hit: [],
        decisions_made: [],
        commit_hash: hash,
        commit_message: message.slice(0, 100),
        branch: 'master',
      };
      reports.push(report);
    }
  }

  return reports;
}

// ── Grade all ungraded ──────────────────────────────────────────────────────────────────────────────

export function gradeAllUngraded(): { graded: number; avgScore: number } {
  const rows = getAll('SELECT raw_json FROM final_reports WHERE grade_score IS NULL');
  let graded = 0;
  let totalScore = 0;

  for (const row of rows) {
    try {
      const report = JSON.parse(row.raw_json as string) as FinalReport;
      const grade = gradePrompt(report);
      const withGrade = { ...report, grade };
      saveFinalReport(withGrade);
      try { extractPatterns(withGrade); } catch {}
      graded++;
      totalScore += grade.score;
    } catch { continue; }
  }

  return { graded, avgScore: graded > 0 ? Math.round((totalScore / graded) * 10) / 10 : 0 };
}

export function extractInitialPatterns(): { extracted: number } {
  const rows = getAll('SELECT raw_json FROM final_reports WHERE grade_score >= 8.0');
  let extracted = 0;
  for (const row of rows) {
    try {
      const report = JSON.parse(row.raw_json as string) as FinalReport;
      if (!report.grade) continue;
      const patterns = extractPatterns(report);
      extracted += patterns.length;
    } catch { continue; }
  }
  return { extracted };
}

// ── Main import function ─────────────────────────────────────────────────────────────────────────────

export function importAllSessions(): ImportResult {
  const sessions = discoverSessions();
  const result: ImportResult = {
    total: sessions.length,
    imported: 0,
    skipped: 0,
    errors: [],
    avgGrade: 0,
    patternsExtracted: 0,
  };

  for (const session of sessions) {
    try {
      const report = parseSessionToReport(session);
      if (isDuplicate(report)) {
        result.skipped++;
        continue;
      }
      const grade = gradePrompt(report);
      const withGrade = { ...report, grade };
      saveFinalReport(withGrade);
      result.imported++;
    } catch (err: unknown) {
      result.errors.push({ file: session.filepath, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Also import from git if fewer than 5 sessions found
  if (sessions.length < 5) {
    const gitReports = importFromGitHistory();
    for (const gitReport of gitReports) {
      try {
        if (isDuplicate(gitReport)) { result.skipped++; continue; }
        const grade = gradePrompt(gitReport);
        const withGrade = { ...gitReport, grade };
        saveFinalReport(withGrade);
        result.imported++;
        result.total++;
      } catch (err: unknown) {
        result.errors.push({ file: gitReport.prompt_file, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  rebuildIndex();

  // Grade all + extract patterns
  const gradeResult = gradeAllUngraded();
  const patternResult = extractInitialPatterns();
  result.patternsExtracted = patternResult.extracted;

  // Compute avg grade from DB
  const { getOne: g } = require('./database') as typeof import('./database');
  const avgRow = g('SELECT AVG(grade_score) as avg FROM final_reports WHERE grade_score IS NOT NULL');
  result.avgGrade = Math.round(Number(avgRow?.avg ?? 0) * 10) / 10;

  return result;
}


export function getImportStats(): {
  totalSessions: number;
  byProject: Record<string, number>;
  gradeDistribution: { excellent: number; good: number; mediocre: number; poor: number };
  topReports: Array<{ project: string; action: string; score: number }>;
  bottomReports: Array<{ project: string; action: string; score: number }>;
} {
  const { getAll: ga } = require('./database') as typeof import('./database');
  const byProjectRows = ga('SELECT project, COUNT(*) as cnt FROM final_reports GROUP BY project');
  const byProject: Record<string, number> = {};
  for (const r of byProjectRows) byProject[String(r.project)] = Number(r.cnt);
  const total = Object.values(byProject).reduce((a, b) => a + b, 0);
  const dist = {
    excellent: Number((ga('SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 9')[0]?.c) ?? 0),
    good: Number((ga('SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 7 AND grade_score < 9')[0]?.c) ?? 0),
    mediocre: Number((ga('SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 5 AND grade_score < 7')[0]?.c) ?? 0),
    poor: Number((ga('SELECT COUNT(*) as c FROM final_reports WHERE grade_score < 5 AND grade_score IS NOT NULL')[0]?.c) ?? 0),
  };
  const topRows = ga('SELECT project, prompt_action, grade_score FROM final_reports WHERE grade_score IS NOT NULL ORDER BY grade_score DESC LIMIT 3');
  const bottomRows = ga('SELECT project, prompt_action, grade_score FROM final_reports WHERE grade_score IS NOT NULL ORDER BY grade_score ASC LIMIT 3');
  return {
    totalSessions: total,
    byProject,
    gradeDistribution: dist,
    topReports: topRows.map(r => ({ project: String(r.project), action: String(r.prompt_action), score: Number(r.grade_score) })),
    bottomReports: bottomRows.map(r => ({ project: String(r.project), action: String(r.prompt_action), score: Number(r.grade_score) })),
  };
}
