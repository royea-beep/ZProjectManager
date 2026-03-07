/**
 * Cross-Project Pattern Detection Engine
 *
 * Analyzes all project data (projects, sessions, tasks, learnings, decisions)
 * and detects recurring patterns across the portfolio. Inserts or updates
 * patterns in the cross_project_patterns table.
 */

interface DbHelpers {
  getAll: (sql: string, params?: unknown[]) => Record<string, unknown>[];
  runInsert: (sql: string, params?: unknown[]) => number;
  runQuery: (sql: string, params?: unknown[]) => void;
}

interface DetectedPattern {
  pattern: string;
  confidence: number;
  supporting_projects: string[];
  recommendation: string;
}

// ---- Helper: parse tech_stack field (comma-separated string) into normalized tokens ----
function parseTechStack(techStack: string | null | undefined): string[] {
  if (!techStack) return [];
  return techStack
    .split(/[,+&\/|]/)
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0);
}

// ---- Helper: fuzzy keyword match for blockers ----
const BLOCKER_CATEGORIES: Record<string, string[]> = {
  authentication: ['auth', 'jwt', 'login', 'session', 'token', 'oauth'],
  deployment: ['deploy', 'vercel', 'hosting', 'production', 'build', 'ci/cd', 'ci cd'],
  database: ['database', 'db', 'sqlite', 'postgres', 'prisma', 'migration', 'sql'],
  styling: ['css', 'tailwind', 'style', 'design', 'ui', 'layout', 'responsive'],
  api: ['api', 'endpoint', 'route', 'fetch', 'request', 'cors'],
  testing: ['test', 'testing', 'bug', 'debug', 'error', 'fix'],
  performance: ['performance', 'slow', 'optimize', 'speed', 'cache', 'lazy'],
};

function categorizeBlocker(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(BLOCKER_CATEGORIES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return null;
}

// ---- Pattern Detection Functions ----

function detectSharedTechPatterns(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const projects = db.getAll("SELECT id, name, tech_stack FROM projects WHERE status != 'archived'");

  // Count tech usage across projects
  const techMap: Record<string, string[]> = {};
  for (const p of projects) {
    const techs = parseTechStack(p.tech_stack as string);
    for (const tech of techs) {
      // Normalize common names
      const normalized = tech
        .replace(/next\.?js\s*\d*/i, 'next.js')
        .replace(/react\s*\d*/i, 'react')
        .replace(/tailwind\s*(css)?\s*\d*/i, 'tailwind css')
        .replace(/typescript/i, 'typescript')
        .replace(/prisma\s*\d*/i, 'prisma')
        .replace(/sql\.?js/i, 'sql.js')
        .replace(/electron/i, 'electron')
        .replace(/node\.?js/i, 'node.js');
      if (!techMap[normalized]) techMap[normalized] = [];
      if (!techMap[normalized].includes(p.name as string)) {
        techMap[normalized].push(p.name as string);
      }
    }
  }

  const totalProjects = projects.length || 1;
  for (const [tech, projectNames] of Object.entries(techMap)) {
    if (projectNames.length >= 3) {
      const confidence = Math.min(0.95, 0.5 + (projectNames.length / totalProjects) * 0.5);
      const displayTech = tech.charAt(0).toUpperCase() + tech.slice(1);
      patterns.push({
        pattern: `You consistently choose ${displayTech} — used in ${projectNames.length} projects`,
        confidence: Math.round(confidence * 100) / 100,
        supporting_projects: projectNames,
        recommendation: projectNames.length >= 5
          ? `${displayTech} is your standard. Create a starter template with it pre-configured to save setup time.`
          : `Consider creating a shared ${displayTech} starter template to speed up new projects.`,
      });
    }
  }

  return patterns;
}

function detectCommonBlockers(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Gather blockers from projects and sessions
  const projectBlockers = db.getAll(
    "SELECT name, main_blocker FROM projects WHERE main_blocker IS NOT NULL AND main_blocker != '' AND status != 'archived'"
  );
  const sessionBlockers = db.getAll(`
    SELECT p.name, ps.blockers
    FROM project_sessions ps
    JOIN projects p ON ps.project_id = p.id
    WHERE ps.blockers IS NOT NULL AND ps.blockers != ''
  `);

  // Categorize all blockers
  const categoryMap: Record<string, Set<string>> = {};

  for (const p of projectBlockers) {
    const cat = categorizeBlocker(p.main_blocker as string);
    if (cat) {
      if (!categoryMap[cat]) categoryMap[cat] = new Set();
      categoryMap[cat].add(p.name as string);
    }
  }

  for (const s of sessionBlockers) {
    const cat = categorizeBlocker(s.blockers as string);
    if (cat) {
      if (!categoryMap[cat]) categoryMap[cat] = new Set();
      categoryMap[cat].add(s.name as string);
    }
  }

  const recommendations: Record<string, string> = {
    authentication: 'Authentication is a recurring blocker. Build a shared auth module (JWT + refresh tokens) you can drop into any project.',
    deployment: 'Deployment keeps blocking you. Create a deployment checklist and reusable CI/CD config for your stack.',
    database: 'Database issues recur across projects. Standardize on one DB setup with migration scripts ready to go.',
    styling: 'UI/styling is a common friction point. Build a shared component library or use your Tailwind config across projects.',
    api: 'API integration is a recurring issue. Create a shared API client pattern with error handling built in.',
    testing: 'Bugs and testing block multiple projects. Invest in a testing template or pre-configured test setup.',
    performance: 'Performance comes up as a blocker repeatedly. Add performance budgets and monitoring to your starter template.',
  };

  for (const [category, projectSet] of Object.entries(categoryMap)) {
    const projectNames = Array.from(projectSet);
    if (projectNames.length >= 2) {
      const confidence = Math.min(0.9, 0.4 + projectNames.length * 0.15);
      const displayCat = category.charAt(0).toUpperCase() + category.slice(1);
      patterns.push({
        pattern: `${displayCat} is a recurring blocker across ${projectNames.length} projects`,
        confidence: Math.round(confidence * 100) / 100,
        supporting_projects: projectNames,
        recommendation: recommendations[category] || `${displayCat} keeps causing issues. Consider building a reusable solution.`,
      });
    }
  }

  return patterns;
}

function detectProductivityPatterns(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Most active projects by session count (last 30 days)
  const recentSessions = db.getAll(`
    SELECT p.name, COUNT(*) as session_count
    FROM project_sessions ps
    JOIN projects p ON ps.project_id = p.id
    WHERE ps.session_date >= date('now', '-30 days')
    GROUP BY p.id
    ORDER BY session_count DESC
    LIMIT 5
  `);

  if (recentSessions.length > 0) {
    const top = recentSessions[0];
    const count = top.session_count as number;
    if (count >= 3) {
      patterns.push({
        pattern: `You're most productive on ${top.name} — ${count} sessions in the last 30 days`,
        confidence: Math.min(0.9, 0.5 + count * 0.05),
        supporting_projects: [top.name as string],
        recommendation: count >= 8
          ? `${top.name} has strong momentum. Protect this focus time and avoid context-switching away from it.`
          : `${top.name} is getting consistent attention. Keep the momentum going.`,
      });
    }
  }

  // Projects with most total sessions (all time)
  const allTimeSessions = db.getAll(`
    SELECT p.name, COUNT(*) as session_count
    FROM project_sessions ps
    JOIN projects p ON ps.project_id = p.id
    GROUP BY p.id
    HAVING session_count >= 5
    ORDER BY session_count DESC
  `);

  if (allTimeSessions.length >= 2) {
    const names = allTimeSessions.map(s => s.name as string);
    patterns.push({
      pattern: `Your most-worked projects all-time: ${names.slice(0, 3).join(', ')} (${allTimeSessions.map(s => `${s.session_count} sessions`).slice(0, 3).join(', ')})`,
      confidence: 0.85,
      supporting_projects: names.slice(0, 5),
      recommendation: 'These projects get the most attention. Make sure they align with your highest-priority goals.',
    });
  }

  // Consistency: projects with sessions spread across multiple weeks
  const consistentProjects = db.getAll(`
    SELECT p.name, COUNT(DISTINCT strftime('%W-%Y', ps.session_date)) as unique_weeks,
           COUNT(*) as total_sessions
    FROM project_sessions ps
    JOIN projects p ON ps.project_id = p.id
    WHERE ps.session_date >= date('now', '-60 days')
    GROUP BY p.id
    HAVING unique_weeks >= 3
    ORDER BY unique_weeks DESC
  `);

  if (consistentProjects.length > 0) {
    const names = consistentProjects.map(p => p.name as string);
    patterns.push({
      pattern: `Consistent work pattern: ${names.slice(0, 3).join(', ')} — worked on across ${consistentProjects[0].unique_weeks}+ different weeks`,
      confidence: 0.8,
      supporting_projects: names,
      recommendation: 'Consistent, spread-out work sessions lead to better outcomes than binge coding. Keep this rhythm.',
    });
  }

  return patterns;
}

function detectStaleProjectPatterns(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Find projects that went stale — had activity then stopped
  const staleProjects = db.getAll(`
    SELECT p.name, p.last_worked_at, p.created_at, p.status,
           julianday('now') - julianday(COALESCE(p.last_worked_at, p.created_at)) as days_inactive
    FROM projects p
    WHERE p.status NOT IN ('archived', 'launched')
    AND p.last_worked_at IS NOT NULL
    AND julianday('now') - julianday(p.last_worked_at) > 14
    ORDER BY days_inactive DESC
  `);

  if (staleProjects.length >= 3) {
    // Calculate average stall time
    const daysInactive = staleProjects.map(p => p.days_inactive as number);
    const avgDays = Math.round(daysInactive.reduce((a, b) => a + b, 0) / daysInactive.length);
    const names = staleProjects.map(p => p.name as string);

    patterns.push({
      pattern: `${staleProjects.length} projects have gone stale. Average inactivity: ~${avgDays} days`,
      confidence: Math.min(0.9, 0.5 + staleProjects.length * 0.1),
      supporting_projects: names.slice(0, 6),
      recommendation: avgDays > 30
        ? `Projects tend to stall after ~${Math.round(avgDays / 7)} weeks. Consider shorter MVP cycles (1-2 week sprints) or archive projects you won't return to.`
        : `Several projects lost momentum. Set weekly check-in reminders or reduce your active project count.`,
    });
  }

  // Projects created but never worked on
  const neverWorked = db.getAll(`
    SELECT p.name FROM projects p
    WHERE p.last_worked_at IS NULL AND p.status NOT IN ('archived')
    AND julianday('now') - julianday(p.created_at) > 7
  `);

  if (neverWorked.length >= 2) {
    const names = neverWorked.map(p => p.name as string);
    patterns.push({
      pattern: `${neverWorked.length} projects were created but never worked on`,
      confidence: 0.7,
      supporting_projects: names,
      recommendation: 'You create more projects than you start. Consider a "one in, one out" rule — finish or archive one before starting another.',
    });
  }

  return patterns;
}

function detectTechMigrationPatterns(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Look for migration signals in decisions, learnings, and session notes
  const migrationKeywords = db.getAll(`
    SELECT DISTINCT p.name, d.decision, d.reason
    FROM project_decisions d
    JOIN projects p ON d.project_id = p.id
    WHERE LOWER(d.decision) LIKE '%migrat%'
       OR LOWER(d.decision) LIKE '%switch%'
       OR LOWER(d.decision) LIKE '%replaced%'
       OR LOWER(d.decision) LIKE '%moved from%'
       OR LOWER(d.decision) LIKE '%moved to%'
       OR LOWER(d.reason) LIKE '%migrat%'
  `);

  const migrationLearnings = db.getAll(`
    SELECT DISTINCT p.name, l.learning
    FROM learnings l
    JOIN projects p ON l.project_id = p.id
    WHERE LOWER(l.learning) LIKE '%migrat%'
       OR LOWER(l.learning) LIKE '%switch%from%'
       OR LOWER(l.learning) LIKE '%replaced%with%'
       OR LOWER(l.learning) LIKE '%sqlite%postgres%'
       OR LOWER(l.learning) LIKE '%moved%to%'
  `);

  // Check for SQLite -> Postgres pattern specifically (known from MEMORY.md context)
  const sqliteProjects = db.getAll("SELECT name, tech_stack FROM projects WHERE LOWER(tech_stack) LIKE '%sqlite%'");
  const postgresProjects = db.getAll("SELECT name, tech_stack FROM projects WHERE LOWER(tech_stack) LIKE '%postgres%' OR LOWER(tech_stack) LIKE '%neon%'");

  // Collect all migration-involved projects
  const migrationProjects = new Set<string>();
  for (const r of migrationKeywords) migrationProjects.add(r.name as string);
  for (const r of migrationLearnings) migrationProjects.add(r.name as string);

  // If we have both SQLite and Postgres projects, that's a migration signal
  const sqliteNames = sqliteProjects.map(p => p.name as string);
  const postgresNames = postgresProjects.map(p => p.name as string);
  const bothNames = sqliteNames.filter(n => postgresNames.includes(n) || migrationProjects.has(n));

  if (migrationProjects.size >= 2 || bothNames.length >= 1) {
    const allNames = Array.from(new Set([...migrationProjects, ...bothNames]));
    patterns.push({
      pattern: `Tech migrations detected in ${allNames.length} project(s) — switching technologies mid-project costs time`,
      confidence: Math.min(0.85, 0.5 + allNames.length * 0.15),
      supporting_projects: allNames,
      recommendation: 'You\'ve had to migrate technologies mid-project. Before starting a new project, decide: will this need deployment? If yes, start with Postgres instead of SQLite.',
    });
  }

  // General: if many decisions mention switching
  if (migrationKeywords.length >= 3) {
    const names = Array.from(new Set(migrationKeywords.map(r => r.name as string)));
    patterns.push({
      pattern: `Frequent technology switches: ${migrationKeywords.length} migration decisions logged`,
      confidence: 0.75,
      supporting_projects: names,
      recommendation: 'Multiple tech switches suggest premature technology choices. Spend more time on architecture before coding.',
    });
  }

  return patterns;
}

function detectMonetizationPatterns(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  const projects = db.getAll("SELECT name, status, monetization_model, health_score, launched_at FROM projects WHERE status != 'archived'");

  const withMonetization = projects.filter(p => p.monetization_model && (p.monetization_model as string).trim() !== '');
  const withoutMonetization = projects.filter(p => !p.monetization_model || (p.monetization_model as string).trim() === '');

  const launchedWith = withMonetization.filter(p => p.status === 'launched');
  const launchedWithout = withoutMonetization.filter(p => p.status === 'launched');

  // Compare health scores
  const avgHealthWith = withMonetization.length > 0
    ? withMonetization.reduce((sum, p) => sum + (p.health_score as number), 0) / withMonetization.length
    : 0;
  const avgHealthWithout = withoutMonetization.length > 0
    ? withoutMonetization.reduce((sum, p) => sum + (p.health_score as number), 0) / withoutMonetization.length
    : 0;

  if (withMonetization.length >= 2 && withoutMonetization.length >= 2) {
    if (avgHealthWith > avgHealthWithout + 10) {
      patterns.push({
        pattern: `Projects with monetization plans have higher health (avg ${Math.round(avgHealthWith)}) vs without (avg ${Math.round(avgHealthWithout)})`,
        confidence: 0.7,
        supporting_projects: withMonetization.map(p => p.name as string),
        recommendation: 'Having a monetization plan correlates with better project health. Define how a project makes money before building.',
      });
    } else if (avgHealthWithout > avgHealthWith + 10) {
      patterns.push({
        pattern: `Projects without monetization pressure have higher health (avg ${Math.round(avgHealthWithout)}) vs with monetization (avg ${Math.round(avgHealthWith)})`,
        confidence: 0.6,
        supporting_projects: withoutMonetization.map(p => p.name as string),
        recommendation: 'Monetization pressure may be hurting project health. Consider building for learning/portfolio first, monetize later.',
      });
    }
  }

  // No monetization on any project
  if (withMonetization.length === 0 && projects.length >= 3) {
    patterns.push({
      pattern: `None of your ${projects.length} active projects have a monetization model defined`,
      confidence: 0.65,
      supporting_projects: projects.map(p => p.name as string).slice(0, 5),
      recommendation: 'If any project is meant to generate revenue, define the model early. It shapes architecture decisions.',
    });
  }

  // Launch rate comparison
  if (launchedWith.length > 0 && launchedWithout.length > 0) {
    const launchRateWith = launchedWith.length / withMonetization.length;
    const launchRateWithout = launchedWithout.length / withoutMonetization.length;
    if (Math.abs(launchRateWith - launchRateWithout) > 0.2) {
      const better = launchRateWith > launchRateWithout ? 'with' : 'without';
      patterns.push({
        pattern: `Projects ${better} monetization plans have a higher launch rate`,
        confidence: 0.6,
        supporting_projects: (better === 'with' ? launchedWith : launchedWithout).map(p => p.name as string),
        recommendation: better === 'with'
          ? 'Revenue motivation helps you ship. Keep defining monetization early.'
          : 'You ship faster without monetization pressure. Build first, monetize once validated.',
      });
    }
  }

  return patterns;
}

function detectHealthCorrelations(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  const projects = db.getAll(`
    SELECT p.name, p.health_score, p.status, p.has_git, p.main_blocker,
           p.next_action, p.last_worked_at, p.tech_stack, p.priority
    FROM projects p
    WHERE p.status NOT IN ('archived')
  `);

  if (projects.length < 4) return patterns;

  const healthyProjects = projects.filter(p => (p.health_score as number) >= 70);
  const unhealthyProjects = projects.filter(p => (p.health_score as number) < 40);

  // Factor: git usage
  const gitHealthy = healthyProjects.filter(p => p.has_git === 1).length;
  const gitUnhealthy = unhealthyProjects.filter(p => p.has_git === 1).length;
  if (healthyProjects.length >= 2 && unhealthyProjects.length >= 2) {
    const gitRateHealthy = gitHealthy / healthyProjects.length;
    const gitRateUnhealthy = gitUnhealthy / unhealthyProjects.length;
    if (gitRateHealthy > gitRateUnhealthy + 0.3) {
      patterns.push({
        pattern: `Git-tracked projects tend to be healthier (${Math.round(gitRateHealthy * 100)}% of healthy projects use git vs ${Math.round(gitRateUnhealthy * 100)}% of unhealthy)`,
        confidence: 0.7,
        supporting_projects: healthyProjects.filter(p => p.has_git === 1).map(p => p.name as string),
        recommendation: 'Git usage correlates with project health. Always init git, even for experiments.',
      });
    }
  }

  // Factor: having a clear next_action
  const actionHealthy = healthyProjects.filter(p => p.next_action && (p.next_action as string).trim()).length;
  const actionUnhealthy = unhealthyProjects.filter(p => p.next_action && (p.next_action as string).trim()).length;
  if (healthyProjects.length >= 2 && unhealthyProjects.length >= 2) {
    const actionRateHealthy = actionHealthy / healthyProjects.length;
    const actionRateUnhealthy = actionUnhealthy / unhealthyProjects.length;
    if (actionRateHealthy > actionRateUnhealthy + 0.2) {
      patterns.push({
        pattern: `Projects with a defined next action are healthier (${Math.round(actionRateHealthy * 100)}% of healthy vs ${Math.round(actionRateUnhealthy * 100)}% of unhealthy)`,
        confidence: 0.75,
        supporting_projects: healthyProjects.filter(p => p.next_action && (p.next_action as string).trim()).map(p => p.name as string),
        recommendation: 'Always end a session by writing the next action. It removes decision fatigue when you come back.',
      });
    }
  }

  // Factor: blockers
  const blockedUnhealthy = unhealthyProjects.filter(p => p.main_blocker && (p.main_blocker as string).trim()).length;
  if (unhealthyProjects.length >= 2 && blockedUnhealthy / unhealthyProjects.length > 0.5) {
    patterns.push({
      pattern: `${Math.round((blockedUnhealthy / unhealthyProjects.length) * 100)}% of unhealthy projects have unresolved blockers`,
      confidence: 0.8,
      supporting_projects: unhealthyProjects.filter(p => p.main_blocker && (p.main_blocker as string).trim()).map(p => p.name as string),
      recommendation: 'Blockers kill project health. Resolve or remove them within 48 hours, or pivot the approach.',
    });
  }

  // Factor: priority alignment — are high-priority projects healthier?
  const highPriority = projects.filter(p => p.priority === 'critical' || p.priority === 'high');
  const lowPriority = projects.filter(p => p.priority === 'low');
  if (highPriority.length >= 2 && lowPriority.length >= 2) {
    const avgHighHealth = highPriority.reduce((s, p) => s + (p.health_score as number), 0) / highPriority.length;
    const avgLowHealth = lowPriority.reduce((s, p) => s + (p.health_score as number), 0) / lowPriority.length;
    if (avgLowHealth > avgHighHealth + 15) {
      patterns.push({
        pattern: `Low-priority projects are healthier (avg ${Math.round(avgLowHealth)}) than high-priority ones (avg ${Math.round(avgHighHealth)})`,
        confidence: 0.65,
        supporting_projects: highPriority.map(p => p.name as string),
        recommendation: 'Your high-priority projects may be under-resourced or over-scoped. Reduce scope on critical projects or re-prioritize.',
      });
    }
  }

  return patterns;
}

function detectSessionMoodPatterns(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  const moods = db.getAll(`
    SELECT p.name, ps.mood, COUNT(*) as cnt
    FROM project_sessions ps
    JOIN projects p ON ps.project_id = p.id
    WHERE ps.mood IS NOT NULL AND ps.mood != ''
    GROUP BY p.id, ps.mood
    ORDER BY p.name, cnt DESC
  `);

  if (moods.length === 0) return patterns;

  // Find projects with mostly frustrated/stuck moods
  const projectMoods: Record<string, Record<string, number>> = {};
  for (const m of moods) {
    const name = m.name as string;
    const mood = m.mood as string;
    if (!projectMoods[name]) projectMoods[name] = {};
    projectMoods[name][mood] = m.cnt as number;
  }

  const frustratedProjects: string[] = [];
  const confidentProjects: string[] = [];

  for (const [name, moodCounts] of Object.entries(projectMoods)) {
    const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    const negativeCount = (moodCounts['frustrated'] || 0) + (moodCounts['stuck'] || 0);
    const positiveCount = moodCounts['confident'] || 0;

    if (negativeCount / total > 0.5 && total >= 2) {
      frustratedProjects.push(name);
    }
    if (positiveCount / total > 0.5 && total >= 2) {
      confidentProjects.push(name);
    }
  }

  if (frustratedProjects.length >= 2) {
    patterns.push({
      pattern: `${frustratedProjects.length} projects have mostly frustrated/stuck sessions`,
      confidence: 0.7,
      supporting_projects: frustratedProjects,
      recommendation: 'Frustrated sessions signal scope issues or missing knowledge. Break tasks smaller or seek help earlier.',
    });
  }

  if (confidentProjects.length >= 2) {
    patterns.push({
      pattern: `${confidentProjects.length} projects have mostly confident sessions — your comfort zone`,
      confidence: 0.65,
      supporting_projects: confidentProjects,
      recommendation: 'You feel confident with these projects. Use them as templates for new work in similar domains.',
    });
  }

  return patterns;
}

function detectLaunchVelocityPatterns(db: DbHelpers): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // How long from created_at to launched_at?
  const launched = db.getAll(`
    SELECT name, created_at, launched_at,
           julianday(launched_at) - julianday(created_at) as days_to_launch
    FROM projects
    WHERE launched_at IS NOT NULL AND created_at IS NOT NULL
    ORDER BY days_to_launch ASC
  `);

  if (launched.length >= 2) {
    const days = launched.map(p => p.days_to_launch as number);
    const avgDays = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    const names = launched.map(p => p.name as string);

    patterns.push({
      pattern: `Average time from creation to launch: ~${avgDays} days across ${launched.length} launched projects`,
      confidence: 0.8,
      supporting_projects: names,
      recommendation: avgDays > 30
        ? `${avgDays} days to launch is long. Try setting a 2-week launch deadline for MVPs.`
        : `${avgDays} days to launch is solid. Keep this pace by scoping MVPs tightly.`,
    });

    // Fastest launcher
    const fastest = launched[0];
    if (launched.length >= 3) {
      patterns.push({
        pattern: `Fastest launch: ${fastest.name} in ${Math.round(fastest.days_to_launch as number)} days`,
        confidence: 0.75,
        supporting_projects: [fastest.name as string],
        recommendation: `Study what made ${fastest.name} ship fast. Replicate that approach.`,
      });
    }
  }

  return patterns;
}

// ---- Main Detection Function ----

export function detectPatterns(db: DbHelpers): number {
  const allDetected: DetectedPattern[] = [];

  // Run all detection functions
  allDetected.push(...detectSharedTechPatterns(db));
  allDetected.push(...detectCommonBlockers(db));
  allDetected.push(...detectProductivityPatterns(db));
  allDetected.push(...detectStaleProjectPatterns(db));
  allDetected.push(...detectTechMigrationPatterns(db));
  allDetected.push(...detectMonetizationPatterns(db));
  allDetected.push(...detectHealthCorrelations(db));
  allDetected.push(...detectSessionMoodPatterns(db));
  allDetected.push(...detectLaunchVelocityPatterns(db));

  if (allDetected.length === 0) return 0;

  // Clear old detected patterns and insert fresh ones
  db.runQuery("DELETE FROM cross_project_patterns");

  const now = new Date().toISOString();
  let count = 0;

  for (const p of allDetected) {
    db.runInsert(
      `INSERT INTO cross_project_patterns (pattern, confidence, supporting_projects, recommendation, detected_at, last_validated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [p.pattern, p.confidence, JSON.stringify(p.supporting_projects), p.recommendation, now, now]
    );
    count++;
  }

  return count;
}
