import * as fs from 'fs';
import * as path from 'path';
import { getAll, getOne, runQuery, runInsert } from './database';

interface Suggestion {
  project_id: number;
  suggestion_type: string;
  title: string;
  description: string;
  priority: number;
  action_prompt_id: string | null;
  expires_at: string | null;
}

export function runIntelligenceEngine(): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const tomorrow = new Date(Date.now() + 86400000).toISOString();

  const projects = getAll(`
    SELECT p.*, w.type as ws_type, w.name as ws_name, w.billing_rate
    FROM projects p
    LEFT JOIN workspaces w ON w.id = p.workspace_id
    WHERE p.status NOT IN ('archived', 'idea')
  `, []) as any[];

  for (const p of projects) {
    // RULE 1: CI failing
    if (p.github_ci_status === 'failing') {
      suggestions.push({
        project_id: p.id,
        suggestion_type: 'action_needed',
        title: `CI failing on ${p.name}`,
        description: 'Build is broken. Fix before any other work.',
        priority: 10,
        action_prompt_id: 'fix-bugs',
        expires_at: tomorrow,
      });
    }

    // RULE 2: Health < 40
    if ((p.health_score || 100) < 40) {
      suggestions.push({
        project_id: p.id,
        suggestion_type: 'risk',
        title: `${p.name} health critical: ${p.health_score}/100`,
        description: 'Project health is dangerously low. Run full audit.',
        priority: 9,
        action_prompt_id: 'audit-full',
        expires_at: tomorrow,
      });
    }

    // RULE 3: Live project, no revenue
    if ((p.stage === 'live' || p.stage === 'scaling') && (!p.mrr || p.mrr === 0)) {
      suggestions.push({
        project_id: p.id,
        suggestion_type: 'revenue',
        title: `${p.name} is live but not monetized`,
        description: 'Potential revenue left on the table. Add payment integration.',
        priority: 7,
        action_prompt_id: 'add-payments',
        expires_at: tomorrow,
      });
    }

    // RULE 4: TestFlight, no session in 7+ days
    if (p.stage === 'testflight') {
      const lastSession = getOne(
        'SELECT created_at FROM project_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
        [p.id]
      ) as any;
      if (!lastSession || new Date(lastSession.created_at) < new Date(Date.now() - 7 * 86400000)) {
        suggestions.push({
          project_id: p.id,
          suggestion_type: 'action_needed',
          title: `${p.name} on TestFlight — no activity in 7+ days`,
          description: 'TestFlight build gets stale. Push testers to report or submit to App Store.',
          priority: 6,
          action_prompt_id: 'fix-bugs',
          expires_at: tomorrow,
        });
      }
    }

    // RULE 5: Client project, unbilled hours >= 4
    if (p.ws_type === 'client') {
      const unbilled = getOne(
        'SELECT SUM(hours) as total FROM work_sessions WHERE project_id = ? AND billed = 0',
        [p.id]
      ) as any;
      if ((unbilled?.total || 0) >= 4) {
        const amount = Math.round((unbilled.total || 0) * (p.billing_rate || 200));
        suggestions.push({
          project_id: p.id,
          suggestion_type: 'revenue',
          title: `${p.name}: ₪${amount.toLocaleString()} unbilled (${unbilled.total}h)`,
          description: `${p.billing_rate || 200}₪/h × ${unbilled.total}h = ₪${amount.toLocaleString()} waiting to be invoiced.`,
          priority: 8,
          action_prompt_id: null,
          expires_at: tomorrow,
        });
      }
    }

    // RULE 6: Open PRs > 3
    if ((p.github_open_prs || 0) > 3) {
      suggestions.push({
        project_id: p.id,
        suggestion_type: 'action_needed',
        title: `${p.name}: ${p.github_open_prs} open PRs`,
        description: 'Too many open PRs. Review and merge or close.',
        priority: 5,
        action_prompt_id: 'audit-codebase',
        expires_at: tomorrow,
      });
    }

    // RULE 7: No MEMORY.md
    if (p.repo_path) {
      if (!fs.existsSync(path.join(p.repo_path, 'MEMORY.md'))) {
        suggestions.push({
          project_id: p.id,
          suggestion_type: 'opportunity',
          title: `${p.name}: no MEMORY.md`,
          description: 'Without MEMORY.md, every Claude session starts from zero.',
          priority: 4,
          action_prompt_id: null,
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        });
      }
    }
  }

  // Persist — clear old auto-generated, insert new
  runQuery('DELETE FROM intelligence_suggestions WHERE auto_generated = 1', []);
  for (const s of suggestions) {
    runInsert(
      'INSERT INTO intelligence_suggestions (project_id, suggestion_type, title, description, priority, action_prompt_id, expires_at) VALUES (?,?,?,?,?,?,?)',
      [s.project_id, s.suggestion_type, s.title, s.description, s.priority, s.action_prompt_id, s.expires_at]
    );
  }

  return suggestions;
}

export function runCrossProjectAnalysis(): void {
  const projects = getAll("SELECT * FROM projects WHERE status NOT IN ('archived')", []) as any[];

  runQuery('DELETE FROM cross_project_insights', []);

  const insights: any[] = [];

  // Check 1: Shared tech stack — reuse opportunity
  const stackCounts: Record<string, string[]> = {};
  for (const p of projects) {
    if (!p.tech_stack) continue;
    const techs = p.tech_stack.split(',').map((t: string) => t.trim()).filter(Boolean);
    for (const tech of techs) {
      if (!stackCounts[tech]) stackCounts[tech] = [];
      stackCounts[tech].push(p.name);
    }
  }
  for (const [tech, projs] of Object.entries(stackCounts)) {
    if (projs.length >= 4) {
      insights.push({
        insight_type: 'opportunity',
        title: `${tech} used in ${projs.length} projects — extract shared config?`,
        description: `${projs.slice(0, 4).join(', ')}${projs.length > 4 ? ` +${projs.length - 4}` : ''} all use ${tech}. Shared utilities already in shared-utils.`,
        affected_project_ids: JSON.stringify(projs),
        severity: 'info',
      });
    }
  }

  // Check 2: Multiple stale projects
  const stale = projects.filter(p => {
    if (!p.last_worked_at) return false;
    return new Date(p.last_worked_at) < new Date(Date.now() - 30 * 86400000);
  });
  if (stale.length >= 3) {
    insights.push({
      insight_type: 'portfolio',
      title: `${stale.length} projects not touched in 30+ days`,
      description: `${stale.slice(0, 3).map((p: any) => p.name).join(', ')}${stale.length > 3 ? ` +${stale.length - 3}` : ''} — consider archiving or resuming.`,
      affected_project_ids: JSON.stringify(stale.map((p: any) => p.id)),
      severity: 'info',
    });
  }

  // Check 3: Revenue opportunity — cluster of live, no MRR
  const liveNoRevenue = projects.filter(p =>
    (p.stage === 'live' || p.stage === 'scaling') && (!p.mrr || p.mrr === 0)
  );
  if (liveNoRevenue.length >= 2) {
    insights.push({
      insight_type: 'revenue',
      title: `${liveNoRevenue.length} live products with ₪0 MRR`,
      description: `${liveNoRevenue.map((p: any) => p.name).join(', ')} — all live, none monetized.`,
      affected_project_ids: JSON.stringify(liveNoRevenue.map((p: any) => p.id)),
      severity: 'opportunity',
    });
  }

  // Check 4: Projects missing MEMORY.md
  const noMemory = projects.filter(p => {
    if (!p.repo_path) return false;
    return !fs.existsSync(path.join(p.repo_path, 'MEMORY.md'));
  });
  if (noMemory.length >= 3) {
    insights.push({
      insight_type: 'process',
      title: `${noMemory.length} projects have no MEMORY.md`,
      description: `${noMemory.slice(0, 4).map((p: any) => p.name).join(', ')}${noMemory.length > 4 ? ` +${noMemory.length - 4}` : ''} — each Claude session starts from zero.`,
      affected_project_ids: JSON.stringify(noMemory.map((p: any) => p.id)),
      severity: 'warning',
    });
  }

  for (const i of insights) {
    runInsert(
      'INSERT INTO cross_project_insights (insight_type, title, description, affected_project_ids, severity) VALUES (?,?,?,?,?)',
      [i.insight_type, i.title, i.description, i.affected_project_ids, i.severity]
    );
  }
}
