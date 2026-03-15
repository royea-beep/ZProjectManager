/**
 * Session Intelligence — Auto-detect what happened in a project
 * Reads git history, file changes, and generates session data automatically.
 * PostPilot-inspired: AI-like summaries from real data.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execFileAsync = promisify(execFile);

export interface DetectedSession {
  files_changed: string[];
  commands_used: string[];
  git_summary: string;
  suggested_summary: string;
  suggested_what_done: string;
  duration_estimate: number | null;
  commits: { hash: string; message: string; date: string }[];
}

/**
 * Detect what happened in a project based on git history
 */
export async function detectSessionFromGit(repoPath: string, sinceDate?: string): Promise<DetectedSession | null> {
  if (!fs.existsSync(path.join(repoPath, '.git'))) return null;

  try {
    const since = sinceDate || getLastWeekDate();
    const commitLog = await gitSafe(
      ['log', `--since=${since}`, '--pretty=format:%h|||%s|||%ai', '--no-merges'],
      repoPath
    );
    const commits = commitLog
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, message, date] = line.split('|||');
        return { hash: hash?.trim() || '', message: message?.trim() || '', date: date?.trim() || '' };
      });

    if (commits.length === 0) return null;

    // Get files changed
    const diffStat = await gitSafe(
      ['diff', '--stat', `HEAD~${Math.min(commits.length, 20)}..HEAD`, '--name-only'],
      repoPath
    );
    const files_changed = diffStat.split('\n').filter(Boolean).slice(0, 50);

    // Get diff summary (insertions/deletions)
    const shortstat = await gitSafe(
      ['diff', '--shortstat', `HEAD~${Math.min(commits.length, 20)}..HEAD`],
      repoPath
    );

    // Build summary from commit messages
    const commitMessages = commits.map(c => c.message);
    const suggested_summary = buildSummary(commitMessages);
    const suggested_what_done = commitMessages.map(m => `- ${m}`).join('\n');

    // Estimate duration from commit timestamps
    const duration_estimate = estimateDuration(commits);

    const git_summary = `${commits.length} commits, ${files_changed.length} files changed. ${shortstat.trim()}`;

    return {
      files_changed,
      commands_used: detectCommandsUsed(files_changed),
      git_summary,
      suggested_summary,
      suggested_what_done,
      duration_estimate,
      commits,
    };
  } catch (e) {
    console.error('[session-intelligence] Error:', e);
    return null;
  }
}

/**
 * Get the current git status of a project (uncommitted changes)
 */
export async function getProjectGitStatus(repoPath: string): Promise<{
  branch: string;
  uncommitted: number;
  untracked: number;
  ahead: number;
  behind: number;
} | null> {
  if (!fs.existsSync(path.join(repoPath, '.git'))) return null;

  try {
    const branch = (await gitSafe(['branch', '--show-current'], repoPath)).trim();
    const status = await gitSafe(['status', '--porcelain'], repoPath);
    const lines = status.split('\n').filter(Boolean);
    const uncommitted = lines.filter(l => !l.startsWith('??')).length;
    const untracked = lines.filter(l => l.startsWith('??')).length;

    // Ahead/behind
    let ahead = 0, behind = 0;
    try {
      const ab = (await gitSafe(['rev-list', '--left-right', '--count', 'HEAD...@{u}'], repoPath)).trim();
      const [a, b] = ab.split(/\s+/);
      ahead = parseInt(a) || 0;
      behind = parseInt(b) || 0;
    } catch { /* no upstream */ }

    return { branch, uncommitted, untracked, ahead, behind };
  } catch {
    return null;
  }
}

/**
 * Auto-detect health score based on project state
 */
export async function calculateAutoHealth(repoPath: string | null, data: {
  status: string;
  main_blocker: string | null;
  last_worked_at: string | null;
  open_tasks: number;
  done_tasks: number;
}): Promise<number> {
  let score = 50;

  // Status-based
  if (data.status === 'launched') score += 15;
  else if (data.status === 'building') score += 5;
  else if (data.status === 'paused') score -= 20;
  else if (data.status === 'archived') return 0;

  // Blocker penalty
  if (data.main_blocker) score -= 15;

  // Recency
  if (data.last_worked_at) {
    const days = Math.floor((Date.now() - new Date(data.last_worked_at).getTime()) / 86400000);
    if (days <= 1) score += 20;
    else if (days <= 7) score += 10;
    else if (days <= 14) score += 0;
    else if (days <= 30) score -= 10;
    else score -= 25;
  } else {
    score -= 15;
  }

  // Task completion ratio
  const total = data.open_tasks + data.done_tasks;
  if (total > 0) {
    const ratio = data.done_tasks / total;
    score += Math.round(ratio * 15);
  }

  // Git health
  if (repoPath) {
    const gitStatus = await getProjectGitStatus(repoPath);
    if (gitStatus) {
      if (gitStatus.uncommitted > 10) score -= 5;
      if (gitStatus.behind > 5) score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Fetch recent commits for a project (lightweight — just last N commits)
 */
export async function fetchRecentCommits(repoPath: string, limit = 10): Promise<
  { hash: string; message: string; date: string; author: string }[]
> {
  if (!fs.existsSync(path.join(repoPath, '.git'))) return [];

  try {
    const log = await gitSafe(
      ['log', `-${limit}`, '--pretty=format:%h|||%s|||%ai|||%an', '--no-merges'],
      repoPath,
    );
    return log
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, message, date, author] = line.split('|||');
        return {
          hash: hash?.trim() || '',
          message: message?.trim() || '',
          date: date?.trim() || '',
          author: author?.trim() || '',
        };
      });
  } catch {
    return [];
  }
}

// ---- Helpers ----

async function gitSafe(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      timeout: 10000,
    });
    return stdout;
  } catch {
    return '';
  }
}

function getLastWeekDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

function buildSummary(messages: string[]): string {
  if (messages.length === 0) return '';
  if (messages.length === 1) return messages[0];

  // Group by prefix (feat:, fix:, etc.)
  const groups: Record<string, string[]> = {};
  for (const msg of messages) {
    const match = msg.match(/^(\w+)[\s(:]/);
    const prefix = match ? match[1].toLowerCase() : 'other';
    (groups[prefix] ??= []).push(msg);
  }

  const parts: string[] = [];
  const prefixLabels: Record<string, string> = {
    feat: 'New features', fix: 'Bug fixes', refactor: 'Refactoring',
    docs: 'Documentation', test: 'Testing', chore: 'Maintenance',
  };
  for (const [prefix, msgs] of Object.entries(groups)) {
    const label = prefixLabels[prefix] || `${prefix}`;
    parts.push(`${label}: ${msgs.length} change${msgs.length > 1 ? 's' : ''}`);
  }
  return parts.join('. ') + `. Total: ${messages.length} commits.`;
}

function estimateDuration(commits: { date: string }[]): number | null {
  if (commits.length < 2) return null;
  const dates = commits.map(c => new Date(c.date).getTime()).sort();
  const diffMs = dates[dates.length - 1] - dates[0];
  return Math.max(15, Math.round(diffMs / 60000));
}

function detectCommandsUsed(files: string[]): string[] {
  const commands = new Set<string>();
  for (const f of files) {
    if (f.endsWith('package.json') || f.endsWith('package-lock.json')) commands.add('npm install');
    if (f.endsWith('.prisma')) commands.add('npx prisma generate');
    if (f.includes('migration')) commands.add('npx prisma migrate');
    if (f.endsWith('.test.ts') || f.endsWith('.test.tsx') || f.endsWith('.spec.ts')) commands.add('npm test');
    if (f.endsWith('Dockerfile') || f.endsWith('docker-compose.yml')) commands.add('docker');
  }
  return Array.from(commands);
}
