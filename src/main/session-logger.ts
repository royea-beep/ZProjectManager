import * as fs from 'fs';
import * as path from 'path';

export type SessionType = 'strategic' | 'execution' | 'combined';

export interface SessionEntry {
  timestamp: string;
  type: SessionType;
  projectName: string;
  projectPath: string;
  summary: string;
  decisions: string[];
  filesChanged: string[];
  whatWorked: string;
  whatDidntWork: string;
  nextStep: string;
  promptUsed?: string;
  rawLog?: string;
}

export interface SessionPatterns {
  totalSessions: number;
  mostCommonBlockers: string[];
  mostProductiveHour: string;
  promptsWithBestOutcomes: string[];
  recommendations: string[];
}

export function saveSessionLog(entry: SessionEntry): string {
  const dir = path.join(entry.projectPath, 'sessions');
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* exists */ }

  const ts = entry.timestamp.slice(0, 16).replace('T', '_').replace(':', '-');
  const filename = `${entry.projectName}_${ts}.md`;
  const filepath = path.join(dir, filename);

  const content = `# ${entry.projectName} — ${entry.type} session — ${entry.timestamp}

## Summary
${entry.summary}

## Decisions Made (LOCKED)
${entry.decisions.length ? entry.decisions.map(d => `- ${d}`).join('\n') : '(none)'}

## Files Changed
${entry.filesChanged.length ? entry.filesChanged.map(f => `- ${f}`).join('\n') : '(none)'}

## What Worked
${entry.whatWorked || '(not recorded)'}

## What Didn't Work
${entry.whatDidntWork || '(none)'}

## Next Session Starts At
${entry.nextStep || '(not recorded)'}
${entry.promptUsed ? `\n## Prompt Used\n\`\`\`\n${entry.promptUsed.slice(0, 500)}...\n\`\`\`` : ''}
`;

  fs.writeFileSync(filepath, content, 'utf8');
  return filepath;
}

export function readAllSessionLogs(projectPath: string): SessionEntry[] {
  const dir = path.join(projectPath, 'sessions');
  if (!fs.existsSync(dir)) return [];

  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && f !== 'INDEX.md')
      .map(f => parseSessionLog(fs.readFileSync(path.join(dir, f), 'utf8'), f, projectPath))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  } catch {
    return [];
  }
}

function parseSessionLog(raw: string, filename: string, projectPath: string): SessionEntry {
  const lines = raw.split('\n');

  const sectionContent = (header: string): string => {
    const idx = lines.findIndex(l => l.startsWith(`## ${header}`));
    if (idx === -1) return '';
    const end = lines.findIndex((l, i) => i > idx && l.startsWith('## '));
    const slice = end === -1 ? lines.slice(idx + 1) : lines.slice(idx + 1, end);
    return slice.filter(l => l.trim()).join('\n').trim();
  };

  const bulletList = (header: string): string[] =>
    sectionContent(header)
      .split('\n')
      .filter(l => l.startsWith('- '))
      .map(l => l.slice(2).trim())
      .filter(Boolean);

  // Parse timestamp from filename: ProjectName_2026-03-21_14-30.md
  const match = filename.match(/(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})/);
  const timestamp = match
    ? `${match[1]}T${match[2].replace('-', ':')}:00`
    : new Date().toISOString();

  const projectName = filename.split('_')[0];

  return {
    timestamp,
    type: 'execution',
    projectName,
    projectPath,
    summary: sectionContent('Summary'),
    decisions: bulletList('Decisions Made (LOCKED)'),
    filesChanged: bulletList('Files Changed'),
    whatWorked: sectionContent("What Worked"),
    whatDidntWork: sectionContent("What Didn't Work"),
    nextStep: sectionContent('Next Session Starts At'),
    rawLog: raw,
  };
}

export function analyzeSessionPatterns(sessions: SessionEntry[]): SessionPatterns {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      mostCommonBlockers: [],
      mostProductiveHour: 'N/A',
      promptsWithBestOutcomes: [],
      recommendations: ['No sessions logged yet — start a session to build patterns'],
    };
  }

  // Extract blockers from "What Didn't Work"
  const blockers = sessions
    .map(s => s.whatDidntWork)
    .filter(s => s && s !== '(none)' && s !== '(not recorded)');

  // Count hour of day from timestamps
  const hours = sessions
    .map(s => parseInt(s.timestamp.slice(11, 13)))
    .filter(h => !isNaN(h));

  const hourCounts: Record<number, number> = {};
  for (const h of hours) { hourCounts[h] = (hourCounts[h] || 0) + 1; }
  const peakHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0];

  const recommendations: string[] = [];
  if (sessions.length >= 5) {
    const recentSessions = sessions.slice(-5);
    const withBlockers = recentSessions.filter(s => s.whatDidntWork && s.whatDidntWork !== '(none)').length;
    if (withBlockers >= 3) {
      recommendations.push('High blocker rate in recent sessions — consider shorter tasks');
    }
  }
  if (peakHour) {
    recommendations.push(`Most productive time: ${peakHour[0]}:00 (${peakHour[1]} sessions)`);
  }
  if (blockers.length > 0) {
    recommendations.push(`Most common issue type: ${blockers[0].slice(0, 60)}`);
  }

  return {
    totalSessions: sessions.length,
    mostCommonBlockers: [...new Set(blockers)].slice(0, 5),
    mostProductiveHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
    promptsWithBestOutcomes: [],
    recommendations,
  };
}
