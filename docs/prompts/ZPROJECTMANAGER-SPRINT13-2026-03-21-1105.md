# ZPROJECTMANAGER — SPRINT 13: Context Classification + Conversation Analysis
**Date:** 2026-03-21 | **Time:** 11:05 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 13 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md
git log --oneline -3
npx tsc --noEmit 2>&1 | tail -3
```

---

## CONTEXT

**הבעיה:** כשRoye מדביק output של קלוד בוט לשיחה — המערכת לא יודעת להבדיל בין:
- 🧠 מחשבה מקורית של Roye
- 📋 copy-paste מקלוד בוט

**הפתרון:** context classifier שמנתח את טקסט ההודעה ומסווג אוטומטית.

**למה זה קריטי:** 11STEPS2DONE יכול ללמוד:
- מה Roye באמת רוצה (בלשונו)
- איזה format של bot output גורם ל"כן" מהיר
- מה הפער בין הכוונה לביצוע

---

## AGENT 1 — Context Classifier

### Create `src/main/context-classifier.ts`

```typescript
export type MessageSource = 'roye' | 'bot_output' | 'mixed' | 'unknown'

export interface ClassifiedMessage {
  source: MessageSource
  confidence: number      // 0-1
  botOutputBlocks: string[]    // extracted bot output sections
  royeBlocks: string[]         // extracted roye's own words
  indicators: string[]         // what triggered the classification
}

// Patterns that indicate Claude Bot output
const BOT_OUTPUT_PATTERNS = [
  // Report tables
  /\|\s*#\s*\|\s*Agent\s*\|/i,
  /\|\s*#\s*\|\s*Task\s*\|/i,
  /\|\s*Status\s*\|\s*Notes\s*\|/i,
  // Sprint markers
  /Sprint \d+ (done|complete|shipped)/i,
  /TypeScript:\s*clean/i,
  /Build:\s*clean/i,
  /Pushed:\s*[a-f0-9]{7}/i,
  // MEGA FINAL REPORT
  /MEGA FINAL REPORT/i,
  /FINAL REPORT/i,
  // Code blocks with bash
  /```bash/,
  /```typescript/,
  // Bot-style output
  /✅\s*(Done|Pushed|Shipped|Complete)/i,
  /⎿\s+/,  // Claude Code indentation style
  /● (Bash|Read|Write|Update|Search)\(/,
  // Commit hashes
  /Commit(ted)?:\s*`?[a-f0-9]{7}`?/i,
  /Pushed:\s*`?[a-f0-9]{7}`?/i,
  // Session markers
  /✻ (Cooked|Brewed|Crunched|Worked) for \d+/,
]

// Patterns that indicate Roye's own words (Hebrew or short English decisions)
const ROYE_PATTERNS = [
  // Hebrew text
  /[\u0590-\u05FF]{3,}/,
  // Short direct requests
  /^[א-ת\w\s,!?]{5,60}$/m,
  // Decision markers
  /^(כן|לא|אוקי|מעולה|נכון|תמשיך|שלח|תעשה|בסדר)$/m,
]

export function classifyMessage(text: string): ClassifiedMessage {
  const lines = text.split('\n')
  const indicators: string[] = []
  const botOutputBlocks: string[] = []
  const royeBlocks: string[] = []

  let botScore = 0
  let royeScore = 0

  // Check for bot output patterns
  for (const pattern of BOT_OUTPUT_PATTERNS) {
    if (pattern.test(text)) {
      botScore += 2
      indicators.push(`bot: ${pattern.toString().slice(1, 30)}`)
    }
  }

  // Check for Roye patterns
  for (const pattern of ROYE_PATTERNS) {
    if (pattern.test(text)) {
      royeScore += 1
      indicators.push(`roye: ${pattern.toString().slice(1, 30)}`)
    }
  }

  // Split into blocks: code fences, tables, plain text
  let currentBlock = ''
  let currentType: 'text' | 'code' | 'table' = 'text'

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (currentBlock.trim()) {
        if (currentType === 'code') {
          botOutputBlocks.push(currentBlock.trim())
        } else {
          const isHebrew = /[\u0590-\u05FF]/.test(currentBlock)
          if (isHebrew || currentBlock.length < 100) royeBlocks.push(currentBlock.trim())
          else botOutputBlocks.push(currentBlock.trim())
        }
      }
      currentType = currentType === 'code' ? 'text' : 'code'
      currentBlock = ''
    } else if (line.startsWith('|')) {
      botOutputBlocks.push(line)
      currentType = 'table'
    } else {
      currentBlock += line + '\n'
    }
  }
  if (currentBlock.trim()) {
    const isHebrew = /[\u0590-\u05FF]/.test(currentBlock)
    if (isHebrew) royeBlocks.push(currentBlock.trim())
    else if (botScore > 2) botOutputBlocks.push(currentBlock.trim())
    else royeBlocks.push(currentBlock.trim())
  }

  // Determine source
  const totalScore = botScore + royeScore
  let source: MessageSource = 'unknown'
  let confidence = 0.5

  if (botScore > 5 && royeScore < 2) {
    source = 'bot_output'
    confidence = Math.min(0.95, botScore / 10)
  } else if (royeScore > 2 && botScore < 2) {
    source = 'roye'
    confidence = Math.min(0.9, royeScore / 5)
  } else if (botScore > 2 && royeScore > 1) {
    source = 'mixed'
    confidence = 0.7
  } else if (royeScore > 0) {
    source = 'roye'
    confidence = 0.6
  }

  return { source, confidence, botOutputBlocks, royeBlocks, indicators }
}

// Analyze a full conversation to extract learning signals
export function analyzeConversation(messages: Array<{
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}>): {
  royeRequests: string[]
  botOutputs: string[]
  turnsToBotOutput: number   // avg turns from roye request to bot output
  approvalRate: number       // % of bot outputs followed by short approval
  languageDistribution: { hebrew: number; english: number }
} {
  const royeRequests: string[] = []
  const botOutputs: string[] = []
  let hebrewChars = 0
  let totalChars = 0
  let approvals = 0
  let botOutputCount = 0

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const classified = classifyMessage(msg.content)

    if (msg.role === 'user') {
      if (classified.source === 'bot_output') {
        botOutputs.push(...classified.botOutputBlocks)
        botOutputCount++
        
        // Check if next user message is a short approval
        const nextMsg = messages[i + 2] // skip assistant response
        if (nextMsg && nextMsg.content.length < 50) {
          approvals++
        }
      } else {
        royeRequests.push(...classified.royeBlocks)
      }
    }

    // Count Hebrew
    const hebrew = (msg.content.match(/[\u0590-\u05FF]/g) || []).length
    hebrewChars += hebrew
    totalChars += msg.content.length
  }

  return {
    royeRequests: royeRequests.filter(r => r.length > 5).slice(0, 20),
    botOutputs: botOutputs.filter(b => b.length > 10).slice(0, 20),
    turnsToBotOutput: botOutputCount > 0 ? Math.round(messages.length / botOutputCount) : 0,
    approvalRate: botOutputCount > 0 ? Math.round((approvals / botOutputCount) * 100) : 0,
    languageDistribution: {
      hebrew: Math.round((hebrewChars / totalChars) * 100),
      english: Math.round(((totalChars - hebrewChars) / totalChars) * 100),
    },
  }
}
```

---

## AGENT 2 — Conversation Import Enhancement

### Update `src/main/conversation-importer.ts`

Add context classification to the import process:

```typescript
import { classifyMessage, analyzeConversation } from './context-classifier'

// Enhanced parseClaudeOutput — now classifies each message
export function parseConversationWithClassification(rawText: string): {
  parsed: ParsedClaudeOutput
  analysis: {
    royeRequests: string[]
    botOutputs: string[]
    turnsToBotOutput: number
    approvalRate: number
    qualitySignals: string[]
  }
} {
  // Split into turns if it's a full conversation
  const turns = rawText.split(/\n(?=Human:|Assistant:|Roye:|Bot:)/i)
  
  if (turns.length > 2) {
    // Full conversation — analyze it
    const messages = turns.map(t => {
      const isUser = /^(Human:|Roye:)/i.test(t)
      return {
        role: isUser ? 'user' as const : 'assistant' as const,
        content: t.replace(/^(Human:|Assistant:|Roye:|Bot:)/i, '').trim(),
      }
    })
    
    const analysis = analyzeConversation(messages)
    const parsed = parseClaudeOutput(rawText)
    
    // Quality signals from classification
    const qualitySignals: string[] = []
    if (analysis.approvalRate > 70) qualitySignals.push('High approval rate — clear bot outputs')
    if (analysis.approvalRate < 30) qualitySignals.push('Low approval rate — outputs needed revision')
    if (analysis.turnsToBotOutput < 3) qualitySignals.push('Fast cycle — efficient collaboration')
    if (analysis.turnsToBotOutput > 8) qualitySignals.push('Slow cycle — many iterations needed')
    
    return { parsed, analysis: { ...analysis, qualitySignals } }
  }
  
  // Single output — just parse
  const parsed = parseClaudeOutput(rawText)
  return {
    parsed,
    analysis: {
      royeRequests: [],
      botOutputs: [rawText.slice(0, 200)],
      turnsToBotOutput: 0,
      approvalRate: 0,
      qualitySignals: [],
    },
  }
}

// Feed classifications into 11STEPS2DONE format
export function exportToSessionLog(
  projectName: string,
  phase: string,
  analysis: ReturnType<typeof analyzeConversation>,
  qualityScore?: number
): object {
  const q = qualityScore || Math.min(10, Math.round(analysis.approvalRate / 10))
  
  return {
    project: projectName,
    phase,
    quality: q,
    turn_count: analysis.turnsToBotOutput * 2,
    error_count: analysis.approvalRate < 50 ? 3 : 0,
    roye_request_style: analysis.royeRequests[0]?.slice(0, 100),
    approval_rate: analysis.approvalRate,
    language: analysis.languageDistribution,
    timestamp: new Date().toISOString(),
  }
}
```

### Update `ImportTab` in `ProjectDetail.tsx`:
```tsx
// Show classification results after import:
{result && result.analysis && (
  <div className="mt-3 p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg">
    <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">Classification Analysis</p>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <span className="text-dark-muted">Approval rate: </span>
        <span className="text-dark-text">{result.analysis.approvalRate}%</span>
      </div>
      <div>
        <span className="text-dark-muted">Avg turns: </span>
        <span className="text-dark-text">{result.analysis.turnsToBotOutput}</span>
      </div>
      <div>
        <span className="text-dark-muted">Hebrew: </span>
        <span className="text-dark-text">{result.analysis.languageDistribution?.hebrew}%</span>
      </div>
    </div>
    {result.analysis.qualitySignals?.length > 0 && (
      <div className="mt-2 space-y-0.5">
        {result.analysis.qualitySignals.map((s: string, i: number) => (
          <p key={i} className="text-[10px] text-dark-muted">• {s}</p>
        ))}
      </div>
    )}
  </div>
)}
```

---

## AGENT 3 — ROYE_WORKING_STYLE.md Generator in ZProjectManager

### Add to `prompt-engine.ts`:

```typescript
export function generateWorkingStyleMd(): string {
  // This is the canonical working style guide
  // Generated from ZProjectManager and deployed to all projects
  return fs.readFileSync(
    path.join(__dirname, '../../docs/ROYE_WORKING_STYLE.md'),
    'utf8'
  )
}
```

### Add to Docs tab in ProjectDetail — new doc type:
```tsx
{ id: 'working-style' as const, label: 'ROYE_WORKING_STYLE.md', emoji: '🤝', desc: 'Working style guide — bot reads this on first run of every project' },
```

### Add IPC:
```typescript
ipcMain.handle('docs:generate-working-style', () => {
  // Return canonical working style content
  const content = fs.readFileSync(
    path.join(app.getAppPath(), 'src/main/templates/ROYE_WORKING_STYLE.md'),
    'utf8'
  )
  return content
})
```

### Store template:
Create: `src/main/templates/ROYE_WORKING_STYLE.md`
(copy content from the file we just created)

---

## AGENT 4 — Pipeline Page: Show classification insights

### Update `PipelinePage.tsx` — add new tab: "📋 Conversation"

```tsx
// New tab content: Conversation Analysis
{activeTab === 'conversation' && (
  <div className="space-y-4 max-w-2xl">
    <div className="p-4 bg-dark-bg border border-dark-border rounded-xl">
      <p className="text-xs font-semibold text-dark-text mb-3">🔍 How to classify messages</p>
      <div className="space-y-2">
        {[
          { type: '🧠 Roye', desc: 'Short Hebrew text, decisions, questions from his own thinking', example: '"אני רוצה שהדשבורד יראה workspace filter"' },
          { type: '📋 Bot Output', desc: 'Tables, code blocks, commit hashes, Sprint reports', example: '"Sprint 12 done | TypeScript: clean | Pushed: bcf8833"' },
          { type: '🔀 Mixed', desc: 'Roye adds comment above/below pasted bot output', example: 'Hebrew text + pasted MEGA FINAL REPORT' },
        ].map(item => (
          <div key={item.type} className="p-2 bg-dark-surface border border-dark-border rounded-lg">
            <p className="text-xs font-medium text-dark-text">{item.type}</p>
            <p className="text-[10px] text-dark-muted mt-0.5">{item.desc}</p>
            <p className="text-[10px] font-mono text-dark-muted/60 mt-1 italic">{item.example}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="p-4 bg-dark-bg border border-dark-border rounded-xl">
      <p className="text-xs font-semibold text-dark-text mb-2">📊 Why this matters</p>
      <p className="text-xs text-dark-muted leading-relaxed">
        When the learning system knows which parts are Roye's original requests vs. bot outputs,
        it can learn: what request styles lead to Q=10 sessions, what bot output formats get
        immediate approval, and where the gap between intention and execution appears.
      </p>
    </div>

    {/* Live classifier demo */}
    <div className="p-4 bg-dark-bg border border-dark-border rounded-xl">
      <p className="text-xs font-semibold text-dark-text mb-2">🧪 Test Classifier</p>
      <textarea
        className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text font-mono resize-none focus:outline-none focus:border-accent-blue"
        rows={4}
        placeholder="Paste any message here to classify it..."
        onChange={async (e) => {
          const result = await window.api.invoke('pipeline:classify-message', e.target.value)
          // Show result below
        }}
      />
    </div>
  </div>
)}
```

### Add IPC:
```typescript
import { classifyMessage } from './context-classifier'

ipcMain.handle('pipeline:classify-message', (_e, text: string) => {
  return classifyMessage(text)
})
```

Add to preload.ts:
```typescript
'pipeline:classify-message',
```

---

## AGENT 5 — Deploy ROYE_WORKING_STYLE.md via ZProjectManager

### Add "Deploy to All Projects" button in Docs tab:

```tsx
// In DocsTab, for working-style doc:
{content && activeDoc === 'working-style' && (
  <button
    onClick={async () => {
      // Get all project repo_paths from DB
      const projects = await api.getProjects()
      const paths = projects.filter(p => p.repo_path).map(p => p.repo_path)
      
      const result = await window.api.invoke('docs:deploy-working-style', {
        content,
        projectPaths: paths,
      })
      toast(`Deployed to ${result.deployed}/${paths.length} projects`, 'success')
    }}
    className="text-xs px-3 py-1.5 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 transition-colors"
  >
    🚀 Deploy to All Projects
  </button>
)}
```

### Add IPC for deployment:
```typescript
ipcMain.handle('docs:deploy-working-style', (_e, args: { content: string; projectPaths: string[] }) => {
  const fs = require('fs')
  const path = require('path')
  let deployed = 0

  for (const projectPath of args.projectPaths) {
    try {
      const docsDir = path.join(projectPath, 'docs')
      if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })
      
      fs.writeFileSync(
        path.join(docsDir, 'ROYE_WORKING_STYLE.md'),
        args.content,
        'utf8'
      )
      deployed++
    } catch (e) {
      console.error(`Failed to deploy to ${projectPath}:`, e)
    }
  }

  return { deployed, total: args.projectPaths.length }
})
```

Add to preload.ts:
```typescript
'docs:deploy-working-style',
```

---

## BUILD + COMMIT

```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat: context classifier + conversation analysis + working style deployment"
git push origin master
```

## APPEND TO SESSION FILE
```bash
cat >> C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md << 'EOF'

## Sprint 13 — What shipped

### context-classifier.ts
- classifyMessage(): detects Roye vs bot_output vs mixed with confidence score
- BOT_OUTPUT_PATTERNS: 15 regex patterns (tables, code blocks, commit hashes, Sprint reports)
- ROYE_PATTERNS: Hebrew text, short decisions, direct requests
- analyzeConversation(): full conversation → approval rate, turns, language distribution

### conversation-importer.ts enhancement
- parseConversationWithClassification(): imports + classifies in one step
- exportToSessionLog(): feeds classification into 11STEPS2DONE format
- ImportTab shows: approval rate, avg turns, quality signals

### ROYE_WORKING_STYLE.md
- Canonical guide deployed to all projects
- "Deploy to All Projects" button in Docs tab
- Auto-deploys via IPC to all repo_paths in DB

### Pipeline tab: "Conversation" tab added
- Explains classification types with examples
- Live classifier demo (paste message → see classification)

### Learning loop closes:
Roye writes → classifier knows it's [ROYE]
Roye pastes bot output → classifier knows it's [BOT_OUTPUT]
11STEPS2DONE gets richer training data
Prompts improve more accurately

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | Notes |
|---|-------|--------|-------|
| 1 | context-classifier.ts | ? | 15 bot patterns, classifyMessage(), analyzeConversation() |
| 2 | Conversation import enhancement | ? | Classification + quality signals in ImportTab |
| 3 | ROYE_WORKING_STYLE.md generator | ? | In Docs tab + template |
| 4 | Pipeline "Conversation" tab | ? | Classification guide + live demo |
| 5 | Deploy to all projects | ? | Button in Docs tab + IPC |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
