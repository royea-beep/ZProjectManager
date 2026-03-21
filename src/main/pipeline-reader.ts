import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PIPELINE_DIR = path.join(os.homedir(), 'Desktop', '11STEPS2DONE');
const SESSIONS_LOG = path.join(PIPELINE_DIR, 'sessions_log.jsonl');

export interface MegaPromptData {
  version: number;
  phases: Record<string, {
    best_examples: string[];
    worst_examples: string[];
    pattern_notes: string;
  }>;
  raw_content: string;
  loaded_at: string;
}

export function getLatestMegaPromptsFile(): string | null {
  try {
    const files = fs.readdirSync(PIPELINE_DIR)
      .filter(f => f.startsWith('mega_prompts_v') && f.endsWith('.md'))
      .sort((a, b) => {
        const va = parseInt(a.match(/v(\d+)/)?.[1] || '0');
        const vb = parseInt(b.match(/v(\d+)/)?.[1] || '0');
        return vb - va; // descending — latest first
      });
    return files.length > 0 ? path.join(PIPELINE_DIR, files[0]) : null;
  } catch { return null; }
}

export function loadMegaPrompts(): MegaPromptData | null {
  const filePath = getLatestMegaPromptsFile();
  if (!filePath) return null;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const versionMatch = filePath.match(/v(\d+)/);
    const version = versionMatch ? parseInt(versionMatch[1]) : 0;

    const phases: MegaPromptData['phases'] = {};
    const sections = content.split(/^## /m).filter(Boolean);

    for (const section of sections) {
      const lines = section.split('\n');
      const header = lines[0].trim().toLowerCase();

      const knownPhases = ['dev', 'qa', 'ux', 'publish', 'post', 'arch', 'infra', 'biz', 'idea', 'plan', 'prep', 'marketing'];
      const phase = knownPhases.find(p => header.includes(p));
      if (!phase) continue;

      const best: string[] = [];
      const worst: string[] = [];
      let currentSection = '';

      for (const line of lines.slice(1)) {
        if (line.includes('best') || line.includes('high quality') || line.includes('Q=10') || line.includes('Q=9')) {
          currentSection = 'best';
        } else if (line.includes('worst') || line.includes('low quality') || line.includes('Q=2') || line.includes('Q=3') || line.includes('common issues') || line.includes('avoid')) {
          currentSection = 'worst';
        } else if (line.startsWith('> ') && line.length > 20) {
          const trimmed = line.replace(/^>\s*/, '').trim();
          if (trimmed.length > 10) {
            if (currentSection === 'best') best.push(trimmed.slice(0, 200));
            else if (currentSection === 'worst') worst.push(trimmed.slice(0, 200));
          }
        }
      }

      phases[phase] = {
        best_examples: best.slice(0, 5),
        worst_examples: worst.slice(0, 5),
        pattern_notes: `${best.length} best, ${worst.length} worst from v${version}`,
      };
    }

    return {
      version,
      phases,
      raw_content: content,
      loaded_at: new Date().toISOString(),
    };
  } catch (e) {
    console.error('Failed to load mega prompts:', e);
    return null;
  }
}

export function getSessionStats(): {
  total: number;
  byProject: Record<string, number>;
  byPhase: Record<string, number>;
  avgQuality: number;
  lastUpdated: string;
} | null {
  try {
    if (!fs.existsSync(SESSIONS_LOG)) return null;

    const lines = fs.readFileSync(SESSIONS_LOG, 'utf8').split('\n').filter(Boolean);
    const sessions = lines.map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);

    const byProject: Record<string, number> = {};
    const byPhase: Record<string, number> = {};
    let totalQ = 0;

    for (const s of sessions) {
      byProject[s.project] = (byProject[s.project] || 0) + 1;
      byPhase[s.phase] = (byPhase[s.phase] || 0) + 1;
      totalQ += (s.quality || 5);
    }

    const lastSession = sessions[sessions.length - 1];

    return {
      total: sessions.length,
      byProject,
      byPhase,
      avgQuality: sessions.length > 0 ? Math.round((totalQ / sessions.length) * 10) / 10 : 0,
      lastUpdated: lastSession?.modified || lastSession?.timestamp || 'unknown',
    };
  } catch { return null; }
}

export function runPipeline(): Promise<{ success: boolean; newVersion?: number; error?: string }> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const autoSyncBat = path.join(PIPELINE_DIR, 'auto_sync.bat');

    if (!fs.existsSync(autoSyncBat)) {
      resolve({ success: false, error: 'auto_sync.bat not found at ' + autoSyncBat });
      return;
    }

    exec(`cmd /c "${autoSyncBat}"`, { cwd: PIPELINE_DIR, timeout: 120000 }, (err: any, stdout: string) => {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      const versionMatch = stdout.match(/mega_prompts_v(\d+)\.md/);
      resolve({ success: true, newVersion: versionMatch ? parseInt(versionMatch[1]) : undefined });
    });
  });
}

export function scoreSessionFile(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    let turnCount = 0;
    let errorCount = 0;
    const errorKeywords = ['error', 'wrong', 'not working', 'fix', 'broken', 'שגיאה', 'לא עובד', 'failed', 'failure', 'mistake'];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user' || parsed.type === 'assistant') turnCount++;
        const text = JSON.stringify(parsed).toLowerCase();
        for (const kw of errorKeywords) {
          if (text.includes(kw)) { errorCount++; break; }
        }
      } catch { /* skip */ }
    }

    let score = 10;
    score -= Math.min(4, Math.floor(turnCount / 5));
    score -= Math.min(4, errorCount);
    if (turnCount <= 6 && errorCount === 0) score = Math.min(10, score + 2);

    return Math.max(1, Math.min(10, score));
  } catch { return 5; }
}
