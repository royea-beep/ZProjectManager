import type { WeeklyDigest } from '../shared/types';

type GetAllFn = (sql: string, params?: unknown[]) => Record<string, unknown>[];
type GetOneFn = (sql: string, params?: unknown[]) => Record<string, unknown> | undefined;

export function generateWeeklyDigest(getAll: GetAllFn, getOne: GetOneFn): WeeklyDigest {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const period = {
    start: weekAgo.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };

  // Sessions from last 7 days, grouped by project
  const sessionRows = getAll(
    `SELECT ps.project_id, p.name, COUNT(*) as session_count
     FROM project_sessions ps
     JOIN projects p ON ps.project_id = p.id
     WHERE ps.session_date >= ?
     GROUP BY ps.project_id
     ORDER BY session_count DESC`,
    [period.start]
  );

  // Tasks completed in last 7 days (completed_at set within range)
  const tasksCompletedByProject = getAll(
    `SELECT pt.project_id, COUNT(*) as cnt
     FROM project_tasks pt
     WHERE pt.completed_at >= ?
     GROUP BY pt.project_id`,
    [period.start]
  );
  const completedMap = new Map(tasksCompletedByProject.map(r => [r.project_id as number, r.cnt as number]));

  // Tasks created in last 7 days
  const tasksCreatedByProject = getAll(
    `SELECT pt.project_id, COUNT(*) as cnt
     FROM project_tasks pt
     WHERE pt.created_at >= ?
     GROUP BY pt.project_id`,
    [period.start]
  );
  const createdMap = new Map(tasksCreatedByProject.map(r => [r.project_id as number, r.cnt as number]));

  const projects_worked = sessionRows.map(r => ({
    id: r.project_id as number,
    name: r.name as string,
    sessions: r.session_count as number,
    tasks_completed: completedMap.get(r.project_id as number) || 0,
    tasks_created: createdMap.get(r.project_id as number) || 0,
  }));

  const total_sessions = projects_worked.reduce((sum, p) => sum + p.sessions, 0);
  const total_tasks_completed = projects_worked.reduce((sum, p) => sum + p.tasks_completed, 0);
  const total_tasks_created = projects_worked.reduce((sum, p) => sum + p.tasks_created, 0);

  // Decisions made in last 7 days
  const decisionsRow = getOne(
    `SELECT COUNT(*) as cnt FROM project_decisions WHERE decided_at >= ?`,
    [period.start]
  );
  const decisions_made = (decisionsRow?.cnt as number) || 0;

  // Learnings added in last 7 days
  const learningsRow = getOne(
    `SELECT COUNT(*) as cnt FROM learnings WHERE created_at >= ?`,
    [period.start]
  );
  const learnings_added = (learningsRow?.cnt as number) || 0;

  // Health score changes from audit_log
  const healthChanges = getAll(
    `SELECT a.project_id, p.name, a.old_value, a.new_value
     FROM audit_log a
     JOIN projects p ON a.project_id = p.id
     WHERE a.field_changed = 'health_score'
       AND a.created_at >= ?
     ORDER BY a.created_at DESC`,
    [period.start]
  );

  // Deduplicate: keep first (most recent) and last (oldest) per project to get net change
  const healthMap = new Map<number, { name: string; first_old: number; last_new: number }>();
  for (const row of healthChanges) {
    const pid = row.project_id as number;
    if (!healthMap.has(pid)) {
      healthMap.set(pid, {
        name: row.name as string,
        first_old: parseInt(row.old_value as string, 10) || 0,
        last_new: parseInt(row.new_value as string, 10) || 0,
      });
    } else {
      // Update the oldest old_value (we iterate newest-first, so keep overwriting first_old)
      healthMap.get(pid)!.first_old = parseInt(row.old_value as string, 10) || 0;
    }
  }

  const health_changes = Array.from(healthMap.entries())
    .map(([id, h]) => ({
      id,
      name: h.name,
      old_score: h.first_old,
      new_score: h.last_new,
    }))
    .filter(h => h.old_score !== h.new_score);

  // Top blockers from active projects
  const blockerRows = getAll(
    `SELECT main_blocker FROM projects
     WHERE main_blocker IS NOT NULL AND main_blocker != ''
       AND status NOT IN ('archived', 'paused')
     ORDER BY
       CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END
     LIMIT 5`
  );
  const top_blockers = blockerRows.map(r => r.main_blocker as string);

  // Streak: consecutive days with at least one session, ending today or yesterday
  const recentDates = getAll(
    `SELECT DISTINCT session_date FROM project_sessions
     WHERE session_date <= ?
     ORDER BY session_date DESC
     LIMIT 60`,
    [period.end]
  );

  let streak_days = 0;
  if (recentDates.length > 0) {
    // Start from today, check if each consecutive day has a session
    const dateSet = new Set(recentDates.map(r => r.session_date as string));
    const checkDate = new Date(now);
    // If today has no session, check from yesterday
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!dateSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    for (let i = 0; i < 60; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        streak_days++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    period,
    projects_worked,
    total_sessions,
    total_tasks_completed,
    total_tasks_created,
    decisions_made,
    learnings_added,
    health_changes,
    top_blockers,
    streak_days,
  };
}
