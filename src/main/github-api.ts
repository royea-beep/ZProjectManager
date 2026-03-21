import { getAll, runQuery, getSetting } from './database';

export interface GitHubRepoData {
  stars: number;
  openIssues: number;
  openPRs: number;
  lastPushAt: string;
  ciStatus: 'passing' | 'failing' | 'pending' | 'unknown';
  defaultBranch: string;
  isPrivate: boolean;
}

export async function fetchRepoData(repoPath: string, token: string): Promise<GitHubRepoData | null> {
  if (!token || !repoPath || !repoPath.includes('/')) return null;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ZProjectManager/1.0',
  };

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${repoPath}`, { headers });
    if (!repoRes.ok) {
      console.warn(`[github-api] Failed to fetch ${repoPath}: ${repoRes.status}`);
      return null;
    }
    const repo = await repoRes.json() as Record<string, unknown>;

    // Open PRs count
    const prsRes = await fetch(`https://api.github.com/repos/${repoPath}/pulls?state=open&per_page=1`, { headers });
    let prCount = 0;
    if (prsRes.ok) {
      const linkHeader = prsRes.headers.get('link') || '';
      const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
      if (lastPageMatch) {
        prCount = parseInt(lastPageMatch[1], 10);
      } else {
        const prs = await prsRes.json() as unknown[];
        prCount = prs.length;
      }
    }

    // Latest CI run status
    const ciRes = await fetch(`https://api.github.com/repos/${repoPath}/actions/runs?per_page=1`, { headers });
    let ciStatus: GitHubRepoData['ciStatus'] = 'unknown';
    if (ciRes.ok) {
      const ci = await ciRes.json() as { workflow_runs?: Array<{ conclusion: string | null; status: string }> };
      const latest = ci.workflow_runs?.[0];
      if (latest) {
        if (latest.conclusion === 'success') ciStatus = 'passing';
        else if (latest.conclusion === 'failure') ciStatus = 'failing';
        else if (latest.status === 'in_progress') ciStatus = 'pending';
      }
    }

    return {
      stars: (repo.stargazers_count as number) || 0,
      openIssues: Math.max(0, ((repo.open_issues_count as number) || 0) - prCount),
      openPRs: prCount,
      lastPushAt: (repo.pushed_at as string) || '',
      ciStatus,
      defaultBranch: (repo.default_branch as string) || 'main',
      isPrivate: (repo.private as boolean) || false,
    };
  } catch (err) {
    console.error(`[github-api] Error fetching ${repoPath}:`, err);
    return null;
  }
}

export async function syncAllProjects(): Promise<{ synced: number; errors: number }> {
  const token = getSetting('github_token');
  if (!token) return { synced: 0, errors: 0 };

  const projects = getAll(
    'SELECT id, name, github_repo FROM projects WHERE github_repo IS NOT NULL AND github_repo != ""'
  ) as Array<{ id: number; name: string; github_repo: string }>;

  if (projects.length === 0) return { synced: 0, errors: 0 };

  let synced = 0;
  let errors = 0;

  // Fetch in chunks of 5 to avoid rate limiting
  for (let i = 0; i < projects.length; i += 5) {
    const chunk = projects.slice(i, i + 5);
    const results = await Promise.all(
      chunk.map(async (p) => ({ id: p.id, name: p.name, data: await fetchRepoData(p.github_repo, token) }))
    );

    for (const { id, name, data } of results) {
      if (data) {
        try {
          runQuery(
            `UPDATE projects SET
              github_stars = ?,
              github_open_prs = ?,
              github_ci_status = ?,
              github_last_push = ?,
              github_synced_at = datetime('now')
            WHERE id = ?`,
            [data.stars, data.openPRs, data.ciStatus, data.lastPushAt, id]
          );
          synced++;
          console.log(`[github-api] Synced ${name}: CI=${data.ciStatus} PRs=${data.openPRs} ⭐${data.stars}`);
        } catch (err) {
          console.error(`[github-api] DB update failed for ${name}:`, err);
          errors++;
        }
      } else {
        errors++;
      }
    }

    // Small delay between chunks
    if (i + 5 < projects.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return { synced, errors };
}
