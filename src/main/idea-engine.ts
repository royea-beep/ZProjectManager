import { getAll, getOne, runInsert, runQuery } from './database';

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  type: string | null;
  status: string;
  tech_stack: string | null;
  next_action: string | null;
  main_blocker: string | null;
  goal: string | null;
}

interface ActionItem {
  type: 'task' | 'project' | 'next_action' | 'decision' | 'learning' | 'blocker_clear';
  title: string;
  description?: string;
  project_id?: number;
  priority?: string;
}

interface ProcessResult {
  idea: Record<string, unknown>;
  actions: ActionItem[];
  confidence: number;
  reasoning: string;
}

// Keywords that hint at what kind of action this is
const ACTION_KEYWORDS = {
  task: ['add', 'create', 'build', 'implement', 'fix', 'update', 'change', 'make', 'write', 'setup', 'configure', 'deploy', 'test', 'refactor', 'design', 'integrate'],
  blocker_clear: ['solved', 'fixed', 'resolved', 'figured out', 'unblocked', 'working now', 'done with'],
  learning: ['learned', 'realized', 'discovered', 'turns out', 'lesson', 'insight', 'note to self', 'remember that', 'important:'],
  decision: ['decided', 'going with', 'choosing', 'switching to', 'will use', 'dropping', 'picking', 'instead of'],
  next_action: ['next', 'should', 'need to', 'must', 'priority', 'focus on', 'start with', 'tomorrow', 'later'],
  project: ['new project', 'new app', 'new idea', 'want to build', 'startup idea', 'could make', 'what if'],
};

const PRIORITY_KEYWORDS: Record<string, string[]> = {
  critical: ['urgent', 'asap', 'critical', 'emergency', 'immediately', 'now', 'breaking', 'crashed'],
  high: ['important', 'high priority', 'soon', 'this week', 'need', 'must'],
  low: ['maybe', 'someday', 'nice to have', 'low priority', 'eventually', 'when i have time'],
};

const TECH_KEYWORDS: Record<string, string[]> = {
  'web-app': ['website', 'web app', 'frontend', 'landing page', 'dashboard', 'portal'],
  'mobile-app': ['mobile', 'app', 'ios', 'android', 'react native', 'expo'],
  'trading-bot': ['bot', 'trading', 'crypto', 'arbitrage', 'signals', 'whale'],
  'cli-tool': ['cli', 'command line', 'script', 'automation', 'tool'],
  'saas': ['saas', 'subscription', 'platform', 'service', 'api'],
  'desktop-app': ['desktop', 'electron', 'native'],
};

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s,.!?;:]+/).filter(Boolean);
}

function matchScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
}

function findBestProject(text: string, projects: ProjectRow[]): { project: ProjectRow | null; score: number } {
  const lower = text.toLowerCase();
  const tokens = tokenize(text);
  let best: ProjectRow | null = null;
  let bestScore = 0;

  for (const p of projects) {
    let score = 0;

    // Direct name mention (strongest signal)
    if (lower.includes(p.name.toLowerCase())) {
      score += 10;
    }

    // Token overlap with name
    const nameTokens = tokenize(p.name);
    for (const nt of nameTokens) {
      if (tokens.includes(nt) && nt.length > 2) score += 3;
    }

    // Tech stack overlap
    if (p.tech_stack) {
      try {
        const techs = JSON.parse(p.tech_stack) as string[];
        for (const t of techs) {
          if (lower.includes(t.toLowerCase())) score += 2;
        }
      } catch { /* ignore */ }
    }

    // Description keyword overlap
    if (p.description) {
      const descTokens = tokenize(p.description);
      for (const dt of descTokens) {
        if (dt.length > 4 && tokens.includes(dt)) score += 1;
      }
    }

    // Goal overlap
    if (p.goal) {
      const goalTokens = tokenize(p.goal);
      for (const gt of goalTokens) {
        if (gt.length > 4 && tokens.includes(gt)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return { project: bestScore >= 3 ? best : null, score: bestScore };
}

function detectActionType(text: string): { type: ActionItem['type']; confidence: number } {
  let bestType: ActionItem['type'] = 'task';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(ACTION_KEYWORDS)) {
    const score = matchScore(text, keywords);
    if (score > bestScore) {
      bestScore = score;
      bestType = type as ActionItem['type'];
    }
  }

  return { type: bestType, confidence: Math.min(bestScore / 3, 1) };
}

function detectPriority(text: string): string {
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (matchScore(text, keywords) > 0) return priority;
  }
  return 'medium';
}

function detectProjectType(text: string): string {
  let best = 'web-app';
  let bestScore = 0;
  for (const [type, keywords] of Object.entries(TECH_KEYWORDS)) {
    const score = matchScore(text, keywords);
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return best;
}

function extractTitle(text: string): string {
  // Take first sentence or first 80 chars
  const firstSentence = text.split(/[.!?\n]/)[0].trim();
  if (firstSentence.length <= 80) return firstSentence;
  return firstSentence.substring(0, 77) + '...';
}

function buildActions(text: string, actionType: ActionItem['type'], matchedProject: ProjectRow | null, priority: string): ActionItem[] {
  const actions: ActionItem[] = [];
  const title = extractTitle(text);

  switch (actionType) {
    case 'project': {
      actions.push({
        type: 'project',
        title: title,
        description: text,
        priority,
      });
      // Also create an initial task for the new project
      actions.push({
        type: 'task',
        title: 'Define MVP scope and requirements',
        description: `Initial planning for: ${title}`,
        priority: 'high',
      });
      break;
    }
    case 'blocker_clear': {
      if (matchedProject) {
        actions.push({
          type: 'blocker_clear',
          title: `Clear blocker on ${matchedProject.name}`,
          description: text,
          project_id: matchedProject.id,
        });
        // Also log as a learning
        actions.push({
          type: 'learning',
          title: `Resolved: ${title}`,
          description: text,
          project_id: matchedProject.id,
        });
      }
      break;
    }
    case 'learning': {
      actions.push({
        type: 'learning',
        title: title,
        description: text,
        project_id: matchedProject?.id,
      });
      break;
    }
    case 'decision': {
      actions.push({
        type: 'decision',
        title: title,
        description: text,
        project_id: matchedProject?.id,
      });
      break;
    }
    case 'next_action': {
      if (matchedProject) {
        actions.push({
          type: 'next_action',
          title: title,
          project_id: matchedProject.id,
          priority,
        });
      }
      // Always create a task too
      actions.push({
        type: 'task',
        title: title,
        description: text !== title ? text : undefined,
        project_id: matchedProject?.id,
        priority,
      });
      break;
    }
    case 'task':
    default: {
      // Check if the text contains multiple lines — each could be a task
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 1 && lines.every(l => l.length < 120)) {
        // Multiple short lines = multiple tasks
        for (const line of lines) {
          actions.push({
            type: 'task',
            title: line.replace(/^[-*•]\s*/, ''),
            project_id: matchedProject?.id,
            priority,
          });
        }
      } else {
        actions.push({
          type: 'task',
          title: title,
          description: text !== title ? text : undefined,
          project_id: matchedProject?.id,
          priority,
        });
      }
      break;
    }
  }

  return actions;
}

export function processIdea(rawInput: string): ProcessResult {
  const projects = getAll("SELECT id, name, description, type, status, tech_stack, next_action, main_blocker, goal FROM projects WHERE status NOT IN ('archived')") as unknown as ProjectRow[];

  const { type: actionType, confidence: actionConf } = detectActionType(rawInput);
  const { project: matchedProject, score: matchScore_ } = findBestProject(rawInput, projects);
  const priority = detectPriority(rawInput);
  const projectType = detectProjectType(rawInput);

  const actions = buildActions(rawInput, actionType, matchedProject, priority);
  const title = extractTitle(rawInput);

  // Build reasoning
  const reasons: string[] = [];
  if (matchedProject) {
    reasons.push(`Matched to project "${matchedProject.name}" (score: ${matchScore_})`);
  } else {
    reasons.push('No existing project matched');
  }
  reasons.push(`Detected as: ${actionType}`);
  reasons.push(`Priority: ${priority}`);
  if (actionType === 'project') {
    reasons.push(`Suggested type: ${projectType}`);
  }
  reasons.push(`Will create ${actions.length} action(s)`);

  const confidence = Math.min((actionConf + (matchScore_ > 0 ? 0.3 : 0)) / 1.3, 1);

  // Save to DB
  const ideaId = runInsert(
    `INSERT INTO ideas (raw_input, parsed_title, parsed_description, matched_project_id, matched_project_name, suggested_type, suggested_actions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [rawInput, title, rawInput !== title ? rawInput : null, matchedProject?.id ?? null, matchedProject?.name ?? null, actionType === 'project' ? projectType : actionType, JSON.stringify(actions)]
  );

  const idea = getOne('SELECT * FROM ideas WHERE id = ?', [ideaId])!;

  return {
    idea,
    actions,
    confidence,
    reasoning: reasons.join('. '),
  };
}

export function executeIdeaActions(ideaId: number): { executed: number; results: string[] } {
  const idea = getOne('SELECT * FROM ideas WHERE id = ?', [ideaId]) as Record<string, unknown> | undefined;
  if (!idea) return { executed: 0, results: ['Idea not found'] };

  const actions: ActionItem[] = JSON.parse(idea.suggested_actions as string);
  const results: string[] = [];
  let executed = 0;
  let newProjectId: number | null = null;

  for (const action of actions) {
    const projectId = action.project_id ?? newProjectId ?? (idea.matched_project_id as number | null);

    switch (action.type) {
      case 'project': {
        newProjectId = runInsert(
          `INSERT INTO projects (name, description, type, stage, status, priority, goal, health_score)
           VALUES (?, ?, ?, 'concept', 'idea', ?, ?, 50)`,
          [action.title, action.description ?? null, 'web-app', action.priority ?? 'medium', action.description ?? null]
        );
        results.push(`Created project: ${action.title}`);
        executed++;
        break;
      }
      case 'task': {
        if (projectId) {
          runInsert(
            `INSERT INTO project_tasks (project_id, title, description, status, priority)
             VALUES (?, ?, ?, 'todo', ?)`,
            [projectId, action.title, action.description ?? null, action.priority ?? 'medium']
          );
          results.push(`Task added: ${action.title}`);
          executed++;
        } else {
          results.push(`Skipped task (no project): ${action.title}`);
        }
        break;
      }
      case 'next_action': {
        if (projectId) {
          runQuery("UPDATE projects SET next_action = ?, updated_at = datetime('now') WHERE id = ?",
            [action.title, projectId]);
          results.push(`Set next action: ${action.title}`);
          executed++;
        }
        break;
      }
      case 'blocker_clear': {
        if (projectId) {
          runQuery("UPDATE projects SET main_blocker = NULL, updated_at = datetime('now') WHERE id = ?",
            [projectId]);
          results.push(`Cleared blocker on project`);
          executed++;
        }
        break;
      }
      case 'learning': {
        runInsert(
          `INSERT INTO learnings (project_id, learning, category, impact_score)
           VALUES (?, ?, 'process', 5)`,
          [projectId ?? null, action.title]
        );
        results.push(`Learning saved: ${action.title}`);
        executed++;
        break;
      }
      case 'decision': {
        if (projectId) {
          runInsert(
            `INSERT INTO project_decisions (project_id, decision, reason)
             VALUES (?, ?, ?)`,
            [projectId, action.title, action.description ?? null]
          );
          results.push(`Decision logged: ${action.title}`);
          executed++;
        }
        break;
      }
    }
  }

  runQuery("UPDATE ideas SET status = 'executed' WHERE id = ?", [ideaId]);

  return { executed, results };
}
