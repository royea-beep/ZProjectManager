import * as fs from 'fs';
import * as path from 'path';

export interface CodeQualityIssue {
  type: 'duplicate' | 'outdated' | 'missing' | 'improvement' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  project: string;
  file: string;
  title: string;
  description: string;
  suggestedFix: string;
  sharedUtilAvailable?: string;
  learnFrom?: string;
}

export interface ProjectQualityReport {
  projectName: string;
  repoPath: string;
  overallScore: number;
  issues: CodeQualityIssue[];
  recommendations: string[];
  usesSharedUtils: boolean;
  missingSharedUtils: string[];
  bestPracticesApplied: string[];
}

export function analyzeProject(
  projectName: string,
  repoPath: string
): ProjectQualityReport {
  const issues: CodeQualityIssue[] = [];
  const recommendations: string[] = [];
  const missingSharedUtils: string[] = [];
  const bestPracticesApplied: string[] = [];

  if (!fs.existsSync(repoPath)) {
    return { projectName, repoPath, overallScore: 0, issues, recommendations, usesSharedUtils: false, missingSharedUtils, bestPracticesApplied };
  }

  const srcPath = path.join(repoPath, 'src');
  if (!fs.existsSync(srcPath)) {
    return { projectName, repoPath, overallScore: 50, issues, recommendations, usesSharedUtils: false, missingSharedUtils, bestPracticesApplied };
  }

  const allFiles = getAllFiles(srcPath, ['.ts', '.tsx']);

  // ── CHECK 1: Does it use shared-utils? ───────────────────────────────────
  const usesSharedUtils = allFiles.some(f => {
    try { return fs.readFileSync(f, 'utf8').includes('@royea/shared-utils'); } catch { return false; }
  });

  if (!usesSharedUtils) {
    issues.push({
      type: 'missing',
      severity: 'medium',
      project: projectName,
      file: 'package.json',
      title: 'Not using shared-utils',
      description: 'This project has local copies of utilities that exist in @royea/shared-utils.',
      suggestedFix: 'npm install @royea/shared-utils && replace local copies with imports',
      sharedUtilAvailable: '@royea/shared-utils',
    });
  } else {
    bestPracticesApplied.push('Uses @royea/shared-utils');
  }

  // ── CHECK 2: Local billing implementation ────────────────────────────────
  const hasBillingLocal = allFiles.some(f =>
    (f.includes('billing') || f.includes('lemonsqueezy') || f.includes('payplus')) &&
    !f.includes('shared-utils')
  );
  const billingUsesShared = allFiles.some(f => {
    try { return fs.readFileSync(f, 'utf8').includes('shared-utils/billing'); } catch { return false; }
  });
  if (hasBillingLocal && !billingUsesShared) {
    missingSharedUtils.push('@royea/billing-provider');
    issues.push({
      type: 'duplicate',
      severity: 'high',
      project: projectName,
      file: 'src/lib/billing.ts',
      title: 'Local billing implementation',
      description: 'Billing logic duplicated locally instead of using shared billing-provider.',
      suggestedFix: "import { createCheckout } from '@royea/shared-utils/billing-provider'",
      sharedUtilAvailable: '@royea/billing-provider',
    });
  }

  // ── CHECK 3: Duplicate Zod schemas ───────────────────────────────────────
  const zodSchemas = allFiles.filter(f => {
    try {
      const content = fs.readFileSync(f, 'utf8');
      return content.includes('z.object') && content.includes('z.string().email');
    } catch { return false; }
  });
  const validatorsUsesShared = allFiles.some(f => {
    try { return fs.readFileSync(f, 'utf8').includes('shared-utils/validators'); } catch { return false; }
  });
  if (zodSchemas.length > 0 && !validatorsUsesShared) {
    missingSharedUtils.push('@royea/validators');
    issues.push({
      type: 'duplicate',
      severity: 'medium',
      project: projectName,
      file: zodSchemas.map(f => path.relative(repoPath, f)).join(', '),
      title: 'Duplicate Zod validation schemas',
      description: `Found ${zodSchemas.length} files with email/login validation. Duplicated across projects.`,
      suggestedFix: "import { loginSchema, registerSchema } from '@royea/shared-utils/validators'",
      sharedUtilAvailable: '@royea/validators',
    });
  }

  // ── CHECK 4: Prisma singleton ─────────────────────────────────────────────
  const prismaSingletons = allFiles.filter(f => {
    try {
      const content = fs.readFileSync(f, 'utf8');
      return content.includes('new PrismaClient') && !content.includes('shared-utils');
    } catch { return false; }
  });
  if (prismaSingletons.length > 1) {
    issues.push({
      type: 'duplicate',
      severity: 'medium',
      project: projectName,
      file: prismaSingletons.map(f => path.basename(f)).join(', '),
      title: 'Multiple Prisma client instances',
      description: `Found ${prismaSingletons.length} Prisma client instantiations. Can cause connection pool issues.`,
      suggestedFix: "import { getPrisma } from '@royea/shared-utils/db-client'",
      sharedUtilAvailable: '@royea/db-client',
    });
  } else if (prismaSingletons.length === 1) {
    bestPracticesApplied.push('Single Prisma instance');
  }

  // ── CHECK 5: AES encryption ───────────────────────────────────────────────
  const cryptoFiles = allFiles.filter(f =>
    (f.includes('crypto') || f.includes('encrypt')) && !f.includes('shared-utils')
  );
  if (cryptoFiles.length > 0) {
    issues.push({
      type: 'duplicate',
      severity: 'high',
      project: projectName,
      file: cryptoFiles.map(f => path.basename(f)).join(', '),
      title: 'Local crypto implementation',
      description: 'AES encryption implemented locally. shared-utils has a tested implementation.',
      suggestedFix: "import { encrypt, decrypt } from '@royea/shared-utils/crypto'",
      sharedUtilAvailable: '@royea/crypto',
    });
  }

  // ── CHECK 6: Missing IRON_RULES.md ───────────────────────────────────────
  if (!fs.existsSync(path.join(repoPath, 'IRON_RULES.md'))) {
    issues.push({
      type: 'missing',
      severity: 'low',
      project: projectName,
      file: 'IRON_RULES.md',
      title: 'Missing IRON_RULES.md',
      description: 'No iron rules file. Claude will not know the constraints for this project.',
      suggestedFix: 'ZProjectManager → Project → Docs tab → Generate IRON_RULES.md',
    });
  } else {
    bestPracticesApplied.push('Has IRON_RULES.md');
  }

  // ── CHECK 7: Missing MEMORY.md ───────────────────────────────────────────
  if (!fs.existsSync(path.join(repoPath, 'MEMORY.md'))) {
    issues.push({
      type: 'missing',
      severity: 'medium',
      project: projectName,
      file: 'MEMORY.md',
      title: 'Missing MEMORY.md',
      description: 'No memory file. Every Claude session starts from zero.',
      suggestedFix: 'ZProjectManager → Project → Docs tab → Generate MEMORY.md',
    });
  } else {
    bestPracticesApplied.push('Has MEMORY.md');
  }

  // ── CHECK 8: Hardcoded credentials ───────────────────────────────────────
  const hardcodedSecrets = allFiles.filter(f => {
    try {
      const content = fs.readFileSync(f, 'utf8');
      return (
        /['"`]sk-[a-zA-Z0-9]{20,}['"`]/.test(content) ||
        /['"`]eyJ[a-zA-Z0-9]{20,}['"`]/.test(content) ||
        /password\s*=\s*['"`][^'"`$]{8,}['"`]/.test(content)
      );
    } catch { return false; }
  });
  if (hardcodedSecrets.length > 0) {
    issues.push({
      type: 'security',
      severity: 'critical',
      project: projectName,
      file: hardcodedSecrets.map(f => path.relative(repoPath, f)).join(', '),
      title: 'Potential hardcoded secrets',
      description: `${hardcodedSecrets.length} files may contain hardcoded credentials.`,
      suggestedFix: 'Move to environment variables immediately',
    });
  }

  // ── CHECK 9: TypeScript any abuse ────────────────────────────────────────
  const anyAbuse = allFiles.filter(f => {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const anyCount = (content.match(/:\s*any\b/g) || []).length;
      return anyCount > 5;
    } catch { return false; }
  });
  if (anyAbuse.length > 3) {
    issues.push({
      type: 'improvement',
      severity: 'low',
      project: projectName,
      file: anyAbuse.slice(0, 3).map(f => path.basename(f)).join(', '),
      title: `TypeScript any overuse (${anyAbuse.length} files)`,
      description: 'Heavy use of "any" type reduces type safety benefits.',
      suggestedFix: 'Replace with proper types or use "unknown" with type guards',
    });
  }

  // ── SCORE ─────────────────────────────────────────────────────────────────
  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === 'critical' ? 25
           : issue.severity === 'high' ? 15
           : issue.severity === 'medium' ? 8 : 3;
  }
  score = Math.max(0, Math.min(100, score));

  if (missingSharedUtils.length > 0) {
    recommendations.push(`Extract to shared-utils: ${missingSharedUtils.join(', ')}`);
  }
  if (!usesSharedUtils) {
    recommendations.push('Connect to @royea/shared-utils to avoid code drift');
  }
  if (issues.filter(i => i.type === 'duplicate').length > 2) {
    recommendations.push('High duplication — consider a 1h dedup sprint');
  }

  return { projectName, repoPath, overallScore: score, issues, recommendations, usesSharedUtils, missingSharedUtils, bestPracticesApplied };
}

function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'dist-electron', 'out', '.turbo', 'build']);

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch { /* permission error */ }

  return files;
}

export function analyzeAllProjects(projects: Array<{ name: string; repo_path: string | null; status: string }>): ProjectQualityReport[] {
  return projects
    .filter(p => p.repo_path && p.status !== 'archived')
    .map(p => analyzeProject(p.name, p.repo_path!))
    .sort((a, b) => a.overallScore - b.overallScore);
}

export function generateSharedUtilsRecs(reports: ProjectQualityReport[]): Array<{
  project: string;
  util: string;
  savesLines: number;
  effort: string;
  priority: number;
}> {
  const recs: Array<{ project: string; util: string; savesLines: number; effort: string; priority: number }> = [];

  for (const report of reports) {
    for (const util of report.missingSharedUtils) {
      const savesLines = util === '@royea/billing-provider' ? 300
                       : util === '@royea/bug-reporter' ? 150
                       : util === '@royea/validators' ? 35
                       : util === '@royea/db-client' ? 15 : 50;

      const effort = savesLines > 200 ? '2h' : savesLines > 80 ? '1h' : '30min';
      const effortHours = effort === '30min' ? 0.5 : effort === '1h' ? 1 : 2;
      const priority = savesLines / effortHours;

      recs.push({ project: report.projectName, util, savesLines, effort, priority });
    }
  }

  return recs.sort((a, b) => b.priority - a.priority);
}
