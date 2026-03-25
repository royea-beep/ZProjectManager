import * as fs from 'fs';
import { getAll, getOne, runQuery } from './database';
import type { FinalReport } from './shared-memory';

const SKILLS_FILE = 'C:\\Projects\\_SHARED\\memory\\skills.json';

export interface PromptPattern {
  id: string;
  action: string;
  category: string;
  description: string;
  source_project: string;
  source_report_id: string;
  grade_score: number;
  times_reused: number;
  projects_used_in: string[];
  template_snippet: string;
  gems_associated: string[];
  created_at: string;
  last_used_at: string;
}

function genId(): string {
  return 'pat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function upsertPattern(p: PromptPattern): void {
  runQuery(
    `INSERT OR REPLACE INTO prompt_patterns (
      id, action, category, description, source_project, source_report_id, grade_score,
      times_reused, projects_used_in, template_snippet, gems_associated, created_at, last_used_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      p.id, p.action, p.category, p.description, p.source_project, p.source_report_id,
      p.grade_score, p.times_reused, JSON.stringify(p.projects_used_in), p.template_snippet,
      JSON.stringify(p.gems_associated), p.created_at, p.last_used_at,
    ]
  );
}

function rowToPattern(row: Record<string, unknown>): PromptPattern {
  return {
    id: String(row.id ?? ''),
    action: String(row.action ?? ''),
    category: String(row.category ?? ''),
    description: String(row.description ?? ''),
    source_project: String(row.source_project ?? ''),
    source_report_id: String(row.source_report_id ?? ''),
    grade_score: Number(row.grade_score ?? 0),
    times_reused: Number(row.times_reused ?? 1),
    projects_used_in: (() => { try { return JSON.parse(String(row.projects_used_in ?? '[]')); } catch { return []; } })(),
    template_snippet: String(row.template_snippet ?? ''),
    gems_associated: (() => { try { return JSON.parse(String(row.gems_associated ?? '[]')); } catch { return []; } })(),
    created_at: String(row.created_at ?? ''),
    last_used_at: String(row.last_used_at ?? ''),
  };
}

function syncSkillsJson(): void {
  try {
    const rows = getAll('SELECT * FROM prompt_patterns ORDER BY grade_score DESC');
    fs.writeFileSync(SKILLS_FILE, JSON.stringify(rows.map(rowToPattern), null, 2), 'utf-8');
  } catch (e) { console.error('[cross-project-intel] syncSkillsJson:', e); }
}

export function extractPatterns(report: FinalReport): PromptPattern[] {
  if (!report.grade || report.grade.score < 8.0) return [];
  const now = new Date().toISOString();
  const existing = getOne(
    'SELECT * FROM prompt_patterns WHERE action = ? AND category = ?',
    [report.prompt_action, report.prompt_category]
  );

  if (existing) {
    const p = rowToPattern(existing);
    const projectsUsed = p.projects_used_in;
    if (!projectsUsed.includes(report.project)) projectsUsed.push(report.project);
    const gems = [...new Set([...p.gems_associated, ...report.gems_discovered])].slice(0, 10);
    runQuery(
      'UPDATE prompt_patterns SET times_reused = times_reused + 1, projects_used_in = ?, gems_associated = ?, last_used_at = ?, grade_score = MAX(grade_score, ?) WHERE id = ?',
      [JSON.stringify(projectsUsed), JSON.stringify(gems), now, report.grade.score, p.id]
    );
    syncSkillsJson();
    const updated = getOne('SELECT * FROM prompt_patterns WHERE id = ?', [p.id]);
    return updated ? [rowToPattern(updated)] : [];
  } else {
    const gemsSection = report.gems_discovered.length > 0
      ? 'GEMs:\n' + report.gems_discovered.map((g: string) => '- ' + g).join('\n')
      : '';
    const decisionsSection = report.decisions_made.length > 0
      ? 'Key decisions:\n' + report.decisions_made.map((d: string) => '- ' + d).join('\n')
      : '';
    const snippet = [
      '## PROVEN PATTERN: ' + report.prompt_action,
      'Project: ' + report.project + ' | Grade: ' + report.grade.score + '/10',
      'Category: ' + report.prompt_category,
      gemsSection,
      decisionsSection,
    ].filter(Boolean).join('\n');

    const p: PromptPattern = {
      id: genId(),
      action: report.prompt_action,
      category: report.prompt_category,
      description: report.prompt_action + ' on ' + report.project,
      source_project: report.project,
      source_report_id: report.id,
      grade_score: report.grade.score,
      times_reused: 1,
      projects_used_in: [report.project],
      template_snippet: snippet,
      gems_associated: report.gems_discovered.slice(0, 10),
      created_at: now,
      last_used_at: now,
    };
    upsertPattern(p);
    syncSkillsJson();
    return [p];
  }
}

export function suggestPatterns(project: string, category: string, action?: string): PromptPattern[] {
  const rows = action
    ? getAll(
        'SELECT * FROM prompt_patterns WHERE (category = ? OR action = ?) AND source_project != ? AND grade_score >= 8.0 ORDER BY grade_score DESC, times_reused DESC LIMIT 5',
        [category, action, project]
      )
    : getAll(
        'SELECT * FROM prompt_patterns WHERE category = ? AND source_project != ? AND grade_score >= 8.0 ORDER BY grade_score DESC, times_reused DESC LIMIT 5',
        [category, project]
      );
  return rows.map(rowToPattern);
}

export function injectPatterns(gprompt: string, project: string, category: string): string {
  const patterns = suggestPatterns(project, category);
  if (patterns.length === 0) return gprompt;
  const lines = patterns.map(p =>
    '### ' + p.action + ' (grade ' + p.grade_score + '/10, used ' + p.times_reused + 'x on: ' + p.projects_used_in.join(', ') + ')\n' + p.template_snippet
  ).join('\n\n');
  const section = '\n\n## PROVEN PATTERNS FROM OTHER PROJECTS\n' + lines + '\n';
  if (gprompt.includes('## CONSTRAINTS')) {
    return gprompt.replace('## CONSTRAINTS', section + '\n## CONSTRAINTS');
  }
  return gprompt + section;
}

export function getCrossProjectInsights(): {
  mostReusedPatterns: PromptPattern[];
  projectsWithSimilarNeeds: { projectA: string; projectB: string; sharedPatterns: number }[];
  underutilizedPatterns: PromptPattern[];
} {
  const mostReused = getAll('SELECT * FROM prompt_patterns ORDER BY times_reused DESC LIMIT 5').map(rowToPattern);
  const underutilized = getAll(
    'SELECT * FROM prompt_patterns WHERE times_reused = 1 AND grade_score >= 8.0 ORDER BY grade_score DESC LIMIT 5'
  ).map(rowToPattern);
  const rows = getAll('SELECT projects_used_in FROM prompt_patterns WHERE times_reused > 1');
  const pairCounts: Record<string, number> = {};
  for (const row of rows) {
    const projects: string[] = (() => { try { return JSON.parse(String(row.projects_used_in ?? '[]')); } catch { return []; } })();
    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const key = [projects[i], projects[j]].sort().join('|||');
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  }
  const projectsWithSimilarNeeds = Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [projectA, projectB] = key.split('|||');
      return { projectA, projectB, sharedPatterns: count };
    });
  return { mostReusedPatterns: mostReused, projectsWithSimilarNeeds, underutilizedPatterns: underutilized };
}

export function markPatternAsProven(patternId: string, project: string): void {
  const now = new Date().toISOString();
  const row = getOne('SELECT projects_used_in FROM prompt_patterns WHERE id = ?', [patternId]);
  if (!row) return;
  const projects: string[] = (() => { try { return JSON.parse(String(row.projects_used_in ?? '[]')); } catch { return []; } })();
  if (!projects.includes(project)) projects.push(project);
  runQuery(
    'UPDATE prompt_patterns SET times_reused = times_reused + 1, projects_used_in = ?, last_used_at = ? WHERE id = ?',
    [JSON.stringify(projects), now, patternId]
  );
  syncSkillsJson();
}

export function getAllPatterns(): PromptPattern[] {
  return getAll('SELECT * FROM prompt_patterns ORDER BY grade_score DESC, times_reused DESC').map(rowToPattern);
}

export function getPatternCountForProject(project: string, category: string): number {
  const row = getOne(
    'SELECT COUNT(*) as cnt FROM prompt_patterns WHERE (category = ? OR action LIKE ?) AND source_project != ? AND grade_score >= 8.0',
    [category, '%' + category + '%', project]
  );
  return Number(row?.cnt ?? 0);
}
