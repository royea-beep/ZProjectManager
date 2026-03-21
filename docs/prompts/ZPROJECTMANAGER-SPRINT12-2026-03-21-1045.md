# ZPROJECTMANAGER — SPRINT 12: Integrate 11STEPS2DONE Learning Pipeline
**Date:** 2026-03-21 | **Time:** 10:45 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 12 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md
git log --oneline -3
npx tsc --noEmit 2>&1 | tail -3

# Read the pipeline files we need to integrate
cat "C:/Users/royea/Desktop/11STEPS2DONE/mega_prompts_v8.md"
cat "C:/Users/royea/Desktop/11STEPS2DONE/watcher.py"
cat "C:/Users/royea/Desktop/11STEPS2DONE/learner.py"
ls "C:/Users/royea/Desktop/11STEPS2DONE/"
```

---

## CONTEXT

`11STEPS2DONE` is a learning pipeline that:
1. Scans all Claude Code sessions (~/.claude/projects/**/*.jsonl)
2. Scores each session Q=1-10 (short + clean = 10, long + errors = 2)
3. Extracts best/worst examples per phase (dev, qa, ux, post, publish)
4. Generates `mega_prompts_v8.md` — the distilled knowledge from 3,203 sessions

**Key finding from v8:** Best prompts have `## CONTEXT` + `## TASK` + numbered steps + working directory + explicit file paths. This is exactly the VAMOS format.

**Goal of this sprint:**
- ZProjectManager reads `mega_prompts_v8.md` → uses it as prompt quality baseline
- ZProjectManager triggers the pipeline after sessions
- Pipeline feeds quality scores back into ZProjectManager's prompt_usage table
- The two systems become ONE learning loop

---

## AGENT 1 — Read and parse mega_prompts_v8.md

### Create `src/main/pipeline-reader.ts`

```typescript
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const PIPELINE_DIR = path.join(os.homedir(), 'Desktop', '11STEPS2DONE')
const SESSIONS_LOG = path.join(PIPELINE_DIR, 'sessions_log.jsonl')

export interface SessionEntry {
  session_id: string
  project: string
  phase: string
  quality: number
  turn_count: number
  error_count: number
  timestamp: string
  file_path: string
}

export interface MegaPromptData {
  version: number
  phases: Record<string, {
    best_examples: string[]
    worst_examples: string[]
    pattern_notes: string
  }>
  raw_content: string
  loaded_at: string
}

export function getLatestMegaPromptsFile(): string | null {
  try {
    const files = fs.readdirSync(PIPELINE_DIR)
      .filter(f => f.startsWith('mega_prompts_v') && f.endsWith('.md'))
      .sort((a, b) => {
        const va = parseInt(a.match(/v(\d+)/)?.[1] || '0')
        const vb = parseInt(b.match(/v(\d+)/)?.[1] || '0')
        return vb - va // descending — latest first
      })
    return files.length > 0 ? path.join(PIPELINE_DIR, files[0]) : null
  } catch { return null }
}

export function loadMegaPrompts(): MegaPromptData | null {
  const filePath = getLatestMegaPromptsFile()
  if (!filePath) return null

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const versionMatch = filePath.match(/v(\d+)/)
    const version = versionMatch ? parseInt(versionMatch[1]) : 0

    // Parse phases from markdown structure
    const phases: MegaPromptData['phases'] = {}
    const sections = content.split(/^## /m).filter(Boolean)

    for (const section of sections) {
      const lines = section.split('\n')
      const header = lines[0].trim().toLowerCase()
      
      // Detect phase names
      const knownPhases = ['dev', 'qa', 'ux', 'publish', 'post', 'arch', 'infra']
      const phase = knownPhases.find(p => header.includes(p))
      if (!phase) continue

      const best: string[] = []
      const worst: string[] = []
      let currentSection = ''

      for (const line of lines.slice(1)) {
        if (line.includes('best') || line.includes('high quality') || line.includes('Q=10') || line.includes('Q=9')) {
          currentSection = 'best'
        } else if (line.includes('worst') || line.includes('low quality') || line.includes('Q=2') || line.includes('Q=3')) {
          currentSection = 'worst'
        } else if (line.startsWith('```') || line.startsWith('#')) {
          // Extract example content
          const trimmed = line.replace(/^[`#\s]+/, '').trim()
          if (trimmed.length > 20) {
            if (currentSection === 'best') best.push(trimmed)
            else if (currentSection === 'worst') worst.push(trimmed)
          }
        }
      }

      phases[phase] = {
        best_examples: best.slice(0, 5),
        worst_examples: worst.slice(0, 5),
        pattern_notes: `${best.length} best examples, ${worst.length} worst examples from ${versionMatch?.[0]}`,
      }
    }

    return {
      version,
      phases,
      raw_content: content,
      loaded_at: new Date().toISOString(),
    }
  } catch (e) {
    console.error('Failed to load mega prompts:', e)
    return null
  }
}

export function getSessionStats(): {
  total: number
  byProject: Record<string, number>
  byPhase: Record<string, number>
  avgQuality: number
  lastUpdated: string
} | null {
  try {
    if (!fs.existsSync(SESSIONS_LOG)) return null
    
    const lines = fs.readFileSync(SESSIONS_LOG, 'utf8').split('\n').filter(Boolean)
    const sessions = lines.map(l => {
      try { return JSON.parse(l) } catch { return null }
    }).filter(Boolean)

    const byProject: Record<string, number> = {}
    const byPhase: Record<string, number> = {}
    let totalQ = 0

    for (const s of sessions) {
      byProject[s.project] = (byProject[s.project] || 0) + 1
      byPhase[s.phase] = (byPhase[s.phase] || 0) + 1
      totalQ += (s.quality || 5)
    }

    return {
      total: sessions.length,
      byProject,
      byPhase,
      avgQuality: Math.round((totalQ / sessions.length) * 10) / 10,
      lastUpdated: sessions[sessions.length - 1]?.timestamp || 'unknown',
    }
  } catch { return null }
}

export function runPipeline(): Promise<{ success: boolean; newVersion?: number; error?: string }> {
  return new Promise((resolve) => {
    const { exec } = require('child_process')
    const autoSyncBat = path.join(PIPELINE_DIR, 'auto_sync.bat')
    
    if (!fs.existsSync(autoSyncBat)) {
      resolve({ success: false, error: 'auto_sync.bat not found' })
      return
    }

    exec(`cmd /c "${autoSyncBat}"`, { cwd: PIPELINE_DIR }, (err: any, stdout: string, stderr: string) => {
      if (err) {
        resolve({ success: false, error: err.message })
        return
      }
      // Find the new version number from output
      const versionMatch = stdout.match(/mega_prompts_v(\d+)\.md/)
      resolve({ success: true, newVersion: versionMatch ? parseInt(versionMatch[1]) : undefined })
    })
  })
}

// Extract quality score from a Claude Code session file
export function scoreSessionFile(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter(Boolean)
    
    let turnCount = 0
    let errorCount = 0
    const errorKeywords = ['error', 'wrong', 'not working', 'fix', 'broken', 'שגיאה', 'לא עובד', 'failed', 'failure', 'mistake']

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        if (parsed.type === 'user' || parsed.type === 'assistant') turnCount++
        const text = JSON.stringify(parsed).toLowerCase()
        for (const kw of errorKeywords) {
          if (text.includes(kw)) { errorCount++; break }
        }
      } catch { /* skip */ }
    }

    let score = 10
    score -= Math.min(4, Math.floor(turnCount / 5))
    score -= Math.min(4, errorCount)
    if (turnCount <= 6 && errorCount === 0) score = Math.min(10, score + 2)

    return Math.max(1, Math.min(10, score))
  } catch { return 5 }
}
```

---

## AGENT 2 — DB: Store pipeline data in ZProjectManager

### Add to `database.ts` migration v13:
```sql
-- Pipeline integration
CREATE TABLE IF NOT EXISTS pipeline_sessions (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  phase TEXT NOT NULL,
  quality INTEGER NOT NULL,
  turn_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  file_path TEXT,
  imported_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pipeline_project ON pipeline_sessions(project);
CREATE INDEX IF NOT EXISTS idx_pipeline_quality ON pipeline_sessions(quality);

-- Mega prompts versions
CREATE TABLE IF NOT EXISTS mega_prompt_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER UNIQUE NOT NULL,
  file_path TEXT,
  total_sessions INTEGER,
  avg_quality REAL,
  phases_json TEXT,
  raw_content TEXT,
  loaded_at TEXT DEFAULT (datetime('now'))
);

-- App settings for pipeline
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('pipeline_last_run', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('pipeline_dir', 'C:/Users/royea/Desktop/11STEPS2DONE');
```

### Add IPC handlers in `ipc.ts`:
```typescript
import {
  loadMegaPrompts, getSessionStats, runPipeline,
  getLatestMegaPromptsFile, scoreSessionFile
} from './pipeline-reader'

// Load latest mega_prompts into DB
ipcMain.handle('pipeline:load-mega-prompts', () => {
  const data = loadMegaPrompts()
  if (!data) return { error: 'mega_prompts not found' }

  // Cache in DB
  db.prepare(`
    INSERT OR REPLACE INTO mega_prompt_versions (version, file_path, phases_json, raw_content, loaded_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(data.version, getLatestMegaPromptsFile(), JSON.stringify(data.phases), data.raw_content)

  return data
})

// Get session stats from sessions_log.jsonl
ipcMain.handle('pipeline:get-stats', () => {
  return getSessionStats()
})

// Trigger auto_sync.bat (run pipeline)
ipcMain.handle('pipeline:run', async () => {
  const result = await runPipeline()
  if (result.success) {
    db.prepare("UPDATE app_settings SET value = datetime('now') WHERE key = 'pipeline_last_run'").run()
  }
  return result
})

// Get latest mega_prompts content (raw)
ipcMain.handle('pipeline:get-latest-content', () => {
  const row = db.prepare('SELECT * FROM mega_prompt_versions ORDER BY version DESC LIMIT 1').get() as any
  return row || null
})

// Get quality insights: which project/phase has best prompts
ipcMain.handle('pipeline:get-quality-insights', () => {
  const stats = getSessionStats()
  if (!stats) return null

  const data = loadMegaPrompts()
  
  return {
    stats,
    topPhases: Object.entries(stats.byPhase || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    topProjects: Object.entries(stats.byProject || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    megaPromptsVersion: data?.version,
    pipelineDir: db.prepare("SELECT value FROM app_settings WHERE key = 'pipeline_dir'").get() as any,
    lastRun: db.prepare("SELECT value FROM app_settings WHERE key = 'pipeline_last_run'").get() as any,
  }
})

// Inject pipeline best-practices into a GPROMPT
ipcMain.handle('pipeline:enhance-prompt', (_e, args: { prompt: string; phase: string }) => {
  const row = db.prepare('SELECT phases_json FROM mega_prompt_versions ORDER BY version DESC LIMIT 1').get() as any
  if (!row?.phases_json) return args.prompt

  try {
    const phases = JSON.parse(row.phases_json)
    const phaseData = phases[args.phase] || phases['dev']
    if (!phaseData?.best_examples?.length) return args.prompt

    // Inject a "learned pattern" note at the top of the prompt
    const patternNote = `## LEARNED FROM ${phaseData.pattern_notes}
Best performing prompts for ${args.phase} phase always include:
- Working directory specified
- File paths to read first
- Numbered task steps
- Explicit definition of done
`
    return patternNote + '\n' + args.prompt
  } catch { return args.prompt }
})
```

Add to `preload.ts`:
```typescript
'pipeline:load-mega-prompts', 'pipeline:get-stats', 'pipeline:run',
'pipeline:get-latest-content', 'pipeline:get-quality-insights', 'pipeline:enhance-prompt',
```

---

## AGENT 3 — Pipeline Page in ZProjectManager

### Create `src/renderer/pages/PipelinePage.tsx`

```tsx
import React, { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'

interface PipelineStats {
  total: number
  byProject: Record<string, number>
  byPhase: Record<string, number>
  avgQuality: number
  lastUpdated: string
}

const QUALITY_COLOR = (q: number) =>
  q >= 8 ? '#22c55e' : q >= 6 ? '#f59e0b' : '#ef4444'

const PHASE_EMOJI: Record<string, string> = {
  dev: '💻', qa: '🧪', ux: '🎨', publish: '🚀', post: '📝', arch: '🏗️', infra: '⚙️'
}

export default function PipelinePage() {
  const { toast } = useToast()
  const [insights, setInsights] = useState<any>(null)
  const [megaContent, setMegaContent] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'insights'>('overview')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [ins, content] = await Promise.all([
      window.api.invoke('pipeline:get-quality-insights'),
      window.api.invoke('pipeline:get-latest-content'),
    ])
    setInsights(ins)
    setMegaContent(content)
  }

  const runPipeline = async () => {
    setRunning(true)
    const result = await window.api.invoke('pipeline:run')
    if (result.success) {
      toast(`Pipeline ran — mega_prompts_v${result.newVersion || '?'} generated`, 'success')
      // Reload mega prompts into DB
      await window.api.invoke('pipeline:load-mega-prompts')
      await loadAll()
    } else {
      toast(`Pipeline error: ${result.error}`, 'error')
    }
    setRunning(false)
  }

  const loadMegaPrompts = async () => {
    const result = await window.api.invoke('pipeline:load-mega-prompts')
    if (result?.error) toast(result.error, 'error')
    else { toast(`Loaded mega_prompts_v${result.version}`, 'success'); await loadAll() }
  }

  const stats: PipelineStats | undefined = insights?.stats

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-dark-text">📊 Learning Pipeline</h2>
          <p className="text-xs text-dark-muted mt-0.5">
            11STEPS2DONE · {stats?.total?.toLocaleString() || '—'} sessions · avg Q={stats?.avgQuality || '—'}
            {insights?.megaPromptsVersion && <span className="ml-2">· mega_prompts_v{insights.megaPromptsVersion}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadMegaPrompts}
            className="text-xs px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-dark-text hover:border-accent-blue/40 transition-colors"
          >
            📥 Load v{(insights?.megaPromptsVersion || 0) + 1}
          </button>
          <button
            onClick={runPipeline}
            disabled={running}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors disabled:opacity-50"
          >
            {running ? '⏳ Running...' : '▶️ Run Pipeline'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-border pb-3">
        {(['overview', 'content', 'insights'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-accent-blue/15 text-accent-blue'
                : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'content' ? '📄 mega_prompts' : '💡 Insights'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-2 gap-6">
          {/* Stats cards */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Sessions', value: stats.total.toLocaleString() },
                { label: 'Avg Quality', value: `Q=${stats.avgQuality}` },
                { label: 'Prompts Version', value: `v${insights?.megaPromptsVersion || '?'}` },
              ].map(card => (
                <div key={card.label} className="bg-dark-bg border border-dark-border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-dark-text">{card.value}</p>
                  <p className="text-[10px] text-dark-muted mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            {/* By phase */}
            <div>
              <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">Sessions by Phase</p>
              <div className="space-y-1.5">
                {Object.entries(stats.byPhase || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([phase, count]) => {
                    const max = Math.max(...Object.values(stats.byPhase))
                    const pct = Math.round((count / max) * 100)
                    return (
                      <div key={phase} className="flex items-center gap-3">
                        <span className="text-xs w-16 text-dark-muted">
                          {PHASE_EMOJI[phase] || '📋'} {phase}
                        </span>
                        <div className="flex-1 bg-dark-bg rounded-full h-1.5">
                          <div className="bg-accent-blue h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-dark-text w-16 text-right">{count.toLocaleString()}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* By project */}
          <div>
            <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">Sessions by Project</p>
            <div className="space-y-1.5">
              {Object.entries(stats.byProject || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([project, count]) => {
                  const max = Math.max(...Object.values(stats.byProject))
                  const pct = Math.round((count / max) * 100)
                  return (
                    <div key={project} className="flex items-center gap-3">
                      <span className="text-xs w-24 text-dark-muted truncate">{project}</span>
                      <div className="flex-1 bg-dark-bg rounded-full h-1.5">
                        <div className="bg-accent-green h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-dark-text w-12 text-right">{count}</span>
                    </div>
                  )
                })}
            </div>

            {/* Pipeline path */}
            <div className="mt-4 p-3 bg-dark-bg border border-dark-border rounded-xl">
              <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-1">Pipeline</p>
              <p className="text-xs font-mono text-dark-text/70">C:/Users/royea/Desktop/11STEPS2DONE/</p>
              <p className="text-[10px] text-dark-muted mt-1">
                Runs daily at 09:00 via Task Scheduler
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content tab — raw mega_prompts */}
      {activeTab === 'content' && (
        <div>
          {megaContent ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-dark-muted">
                  mega_prompts_v{megaContent.version} · loaded {new Date(megaContent.loaded_at).toLocaleString('he-IL')}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(megaContent.raw_content)}
                  className="text-xs text-accent-blue hover:underline"
                >
                  Copy all
                </button>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4 text-xs font-mono text-dark-text/80 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[60vh]">
                {megaContent.raw_content}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm text-dark-text mb-2">mega_prompts not loaded yet</p>
              <button onClick={loadMegaPrompts} className="text-xs px-4 py-2 rounded-lg bg-accent-blue/15 text-accent-blue">
                Load from Pipeline
              </button>
            </div>
          )}
        </div>
      )}

      {/* Insights tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4 max-w-2xl">
          <div className="p-4 bg-accent-green/5 border border-accent-green/20 rounded-xl">
            <p className="text-xs font-semibold text-accent-green mb-2">✅ What works (from 3,203 sessions)</p>
            <ul className="space-y-1">
              {[
                'Always specify working directory (cd C:/Projects/X)',
                'List files to read first (cat MEMORY.md, cat file.ts)',
                'Numbered task steps with clear agent separation',
                'Explicit SUCCESS CRITERIA with checkboxes',
                'End with: tsc → build → git push → update MEMORY.md',
                'Short prompts ≤ 6 turns score Q=10 vs Q=2 for 30-turn loops',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-dark-text">• {tip}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-red-400/5 border border-red-400/20 rounded-xl">
            <p className="text-xs font-semibold text-red-400 mb-2">❌ What fails (from low-Q sessions)</p>
            <ul className="space-y-1">
              {[
                'Vague single-line requests ("fix the bug")',
                'Multi-project mixed tasks in one prompt',
                'No working directory specified',
                'No files to read — bot guesses structure',
                'Missing definition of done',
                'No error handling instructions',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-dark-text">• {tip}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-xl">
            <p className="text-xs font-semibold text-accent-blue mb-2">🔄 How this feeds ZProjectManager</p>
            <p className="text-xs text-dark-text leading-relaxed">
              Every GPROMPT generated by ZProjectManager is based on the patterns learned from {stats?.total?.toLocaleString() || '3,203'} real sessions.
              The pipeline runs daily at 09:00, updates mega_prompts_vN.md, and ZProjectManager loads it automatically.
              The "best practices" in every prompt you generate are not invented — they're extracted from what actually worked.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## AGENT 4 — Auto-load pipeline on startup + daily check

### In `main.ts`, after app ready:
```typescript
// Auto-load latest mega_prompts into DB on startup
setTimeout(async () => {
  try {
    const { loadMegaPrompts, getLatestMegaPromptsFile } = require('./pipeline-reader')
    const currentFile = getLatestMegaPromptsFile()
    if (!currentFile) return

    // Check if we already loaded this version
    const fileName = path.basename(currentFile)
    const versionMatch = fileName.match(/v(\d+)/)
    if (!versionMatch) return
    const version = parseInt(versionMatch[1])

    const existing = db.prepare('SELECT version FROM mega_prompt_versions WHERE version = ?').get(version)
    if (!existing) {
      // New version available — load it
      const data = loadMegaPrompts()
      if (data) {
        db.prepare(`
          INSERT OR REPLACE INTO mega_prompt_versions (version, file_path, phases_json, raw_content, loaded_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).run(data.version, currentFile, JSON.stringify(data.phases), data.raw_content)
        console.log(`Loaded mega_prompts_v${data.version} from pipeline`)
      }
    }
  } catch (e) {
    console.error('Pipeline auto-load error:', e)
  }
}, 8000) // 8s after startup
```

### In `generateMegaPrompt` IPC handler — enhance with pipeline patterns:
```typescript
// After generating prompt, enhance with pipeline best practices:
const enhanced = await ipcMain.invoke('pipeline:enhance-prompt', {
  prompt,
  phase: 'dev' // detect from action type
})
return enhanced
```

---

## AGENT 5 — Wire to App.tsx + sidebar

```tsx
import PipelinePage from './pages/PipelinePage'

// Add to navItems:
{ path: '/pipeline', label: 'Pipeline', icon: '📊' },

// Add shortcut:
{ key: 'p', alt: true, description: 'Learning Pipeline', action: 'nav:/pipeline' },

// Add route:
<Route path="/pipeline" element={<PipelinePage />} />
```

### Also: show pipeline status in Morning Briefing:
```tsx
// In MorningBriefing, add pipeline section:
const pipelineInsights = await window.api.invoke('pipeline:get-quality-insights')
// Show: "Pipeline: mega_prompts_v8 loaded · 3,203 sessions · avg Q=5.4"
```

---

## BUILD + COMMIT

```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat: integrate 11STEPS2DONE pipeline — mega_prompts + session quality + pipeline page"
git push origin master
```

## APPEND TO SESSION FILE
```bash
cat >> C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md << 'EOF'

## Sprint 12 — What shipped

### pipeline-reader.ts
- loadMegaPrompts(): reads latest mega_prompts_vN.md → parses phases → caches in DB
- getSessionStats(): reads sessions_log.jsonl → 3,203 sessions stats
- runPipeline(): triggers auto_sync.bat → new version generated
- scoreSessionFile(): Q score formula (same as 11STEPS2DONE)

### DB v13
- pipeline_sessions table
- mega_prompt_versions table (stores raw content)
- pipeline_last_run setting

### PipelinePage
- 3 tabs: Overview (charts by phase/project), Content (raw mega_prompts), Insights (what works/fails)
- "Run Pipeline" button → triggers auto_sync.bat
- "Load v{N}" button → imports latest mega_prompts into DB

### Auto-load on startup
8s after app ready → checks if new mega_prompts version exists → loads if yes

### GPROMPT enhancement
Every generated prompt can be enhanced with pipeline best practices (from real session data)

### Key insight from v8 data
Best prompts: working dir + file paths + numbered steps + success criteria = Q=10
Worst prompts: vague + no context + no file paths = Q=2
This IS the VAMOS format — empirically proven on 3,203 sessions

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | Notes |
|---|-------|--------|-------|
| 1 | pipeline-reader.ts | ? | 6 functions, parses mega_prompts + scores sessions |
| 2 | DB v13 + IPC | ? | 2 new tables, 6 handlers |
| 3 | PipelinePage | ? | 3 tabs, run pipeline, load prompts |
| 4 | Auto-load on startup | ? | Detects new version, loads silently |
| 5 | App routing + sidebar | ? | /pipeline + Alt+P |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
