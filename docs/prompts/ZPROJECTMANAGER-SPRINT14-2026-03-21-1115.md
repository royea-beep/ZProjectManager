# ZPROJECTMANAGER — SPRINT 14: Request Parser
**Date:** 2026-03-21 | **Time:** 11:15 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 14 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md
git log --oneline -3
npx tsc --noEmit 2>&1 | tail -3
```

---

## CONTEXT

הבעיה: כשRoye כותב הרבה או לא ממש מסודר — Strategic AI מבצע חלק מהדברים ומפספס אחרים.

הפתרון: Request Parser שמחלץ כל action item מטקסט חופשי, ממספר אותם, ומאפשר לRoye לאשר שהכל תפוס לפני שמתחילים.

---

## AGENT 1 — Request Extractor

### Create `src/main/request-extractor.ts`

```typescript
export interface ExtractedRequest {
  id: number
  text: string
  priority: 'high' | 'medium' | 'low'
  project?: string          // detected project name
  actionType?: string       // detected action type
  confidence: number        // how confident we are this is a real request
  isConfirmed: boolean      // user confirmed it
  isCompleted: boolean
}

// Action verbs that signal a request
const ACTION_VERBS = [
  // Hebrew
  'תעשה', 'תוסיף', 'תתקן', 'תבנה', 'תיצור', 'תשנה', 'תסיר', 'תעדכן',
  'תבדוק', 'תשלח', 'תפתח', 'תסגור', 'תחבר', 'תנתק', 'תכתוב', 'תקרא',
  'אני רוצה', 'צריך', 'חסר', 'צריכים', 'נצטרך',
  // English
  'add', 'fix', 'build', 'create', 'update', 'remove', 'connect',
  'deploy', 'generate', 'implement', 'integrate', 'wire', 'make',
  'need', 'want', 'should', 'must',
]

// Project name detection
const PROJECT_KEYWORDS: Record<string, string[]> = {
  '9soccer': ['9soccer', '9Soccer', 'soccer', 'football', 'כדורגל'],
  'caps': ['caps', 'Caps', 'poker', 'פוקר'],
  'wingman': ['wingman', 'Wingman', 'דייטינג', 'dating'],
  'postpilot': ['postpilot', 'PostPilot', 'instagram', 'תזמון'],
  'keydrop': ['keydrop', 'KeyDrop', 'keys', 'מפתחות'],
  'venuekit': ['venuekit', 'VenueKit', 'venue', 'אולם'],
  'analyzer': ['analyzer', 'Analyzer'],
  'explainit': ['explainit', 'ExplainIt'],
  'zprojectmanager': ['zprojectmanager', 'ZProjectManager', 'zpm'],
}

export function extractRequests(text: string): ExtractedRequest[] {
  const requests: ExtractedRequest[] = []
  let id = 1

  // Strategy 1: Numbered/bulleted lists
  const listItems = text.match(/(?:^|\n)\s*(?:\d+[.)]\s*|[-•*]\s*|📋\s*)(.+?)(?=\n\s*(?:\d+[.)]\s*|[-•*]\s*)|$)/gs)
  if (listItems && listItems.length > 1) {
    for (const item of listItems) {
      const clean = item.replace(/^\s*(?:\d+[.)]\s*|[-•*]\s*|📋\s*)/, '').trim()
      if (clean.length < 5) continue
      requests.push({
        id: id++,
        text: clean,
        priority: detectPriority(clean),
        project: detectProject(clean),
        actionType: detectActionType(clean),
        confidence: 0.9,
        isConfirmed: false,
        isCompleted: false,
      })
    }
  }

  // Strategy 2: Sentences with action verbs
  if (requests.length === 0 || requests.length < 2) {
    const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 10)
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      const hasActionVerb = ACTION_VERBS.some(v => lowerSentence.includes(v.toLowerCase()))
      
      if (hasActionVerb && !requests.some(r => r.text === sentence)) {
        requests.push({
          id: id++,
          text: sentence,
          priority: detectPriority(sentence),
          project: detectProject(sentence),
          actionType: detectActionType(sentence),
          confidence: 0.6,
          isConfirmed: false,
          isCompleted: false,
        })
      }
    }
  }

  // Strategy 3: Paragraphs (each paragraph = one request if long text)
  if (requests.length === 0) {
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20)
    for (const para of paragraphs) {
      requests.push({
        id: id++,
        text: para.slice(0, 200),
        priority: 'medium',
        project: detectProject(para),
        actionType: detectActionType(para),
        confidence: 0.4,
        isConfirmed: false,
        isCompleted: false,
      })
    }
  }

  return requests.filter(r => r.confidence > 0.3)
}

function detectPriority(text: string): 'high' | 'medium' | 'low' {
  const t = text.toLowerCase()
  if (t.includes('דחוף') || t.includes('urgent') || t.includes('critical') || t.includes('crash') || t.includes('broken')) return 'high'
  if (t.includes('אחר כך') || t.includes('later') || t.includes('eventually') || t.includes('nice to have')) return 'low'
  return 'medium'
}

function detectProject(text: string): string | undefined {
  for (const [project, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
      return project
    }
  }
  return undefined
}

function detectActionType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('fix') || t.includes('תתקן') || t.includes('bug') || t.includes('error')) return 'fix-bugs'
  if (t.includes('add') || t.includes('תוסיף') || t.includes('feature')) return 'add-feature'
  if (t.includes('deploy') || t.includes('תפרוס') || t.includes('vercel')) return 'deploy-vercel'
  if (t.includes('audit') || t.includes('אודיט') || t.includes('בדוק')) return 'audit-codebase'
  if (t.includes('database') || t.includes('supabase') || t.includes('migration')) return 'add-database'
  return 'add-feature'
}

// Generate confirmation message for Strategic AI to send
export function generateConfirmationMessage(requests: ExtractedRequest[]): string {
  const lines = [`הבנתי **${requests.length} דברים לעשות:**\n`]
  
  for (const req of requests) {
    const priority = req.priority === 'high' ? '🔴' : req.priority === 'low' ? '🟡' : '🔵'
    const project = req.project ? ` (${req.project})` : ''
    lines.push(`${req.id}. ${priority} ${req.text}${project}`)
  }
  
  lines.push(`\nמתחיל עם פריט 1. אם חסר משהו — תגיד לפני שאשלח לבוט.`)
  
  return lines.join('\n')
}
```

---

## AGENT 2 — Request Parser UI

### Create `src/renderer/components/RequestParser.tsx`

This is a floating panel that appears when a long/complex message is detected.

```tsx
import React, { useState } from 'react'
import type { ExtractedRequest } from '../../main/request-extractor'

interface Props {
  requests: ExtractedRequest[]
  onConfirm: (confirmed: ExtractedRequest[]) => void
  onDismiss: () => void
}

export default function RequestParser({ requests, onConfirm, onDismiss }: Props) {
  const [items, setItems] = useState(requests.map(r => ({ ...r, isConfirmed: true })))
  const [newItem, setNewItem] = useState('')

  const toggle = (id: number) => {
    setItems(prev => prev.map(r => r.id === id ? { ...r, isConfirmed: !r.isConfirmed } : r))
  }

  const addItem = () => {
    if (!newItem.trim()) return
    setItems(prev => [...prev, {
      id: prev.length + 1,
      text: newItem.trim(),
      priority: 'medium',
      confidence: 1.0,
      isConfirmed: true,
      isCompleted: false,
    }])
    setNewItem('')
  }

  const confirmed = items.filter(r => r.isConfirmed)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center pb-6 px-4">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <div>
            <h3 className="text-sm font-bold text-dark-text">
              📋 זיהיתי {items.length} בקשות
            </h3>
            <p className="text-[10px] text-dark-muted mt-0.5">
              בדוק שהכל כאן לפני שמתחילים. הסר מה שלא רלוונטי.
            </p>
          </div>
          <button onClick={onDismiss} className="text-dark-muted hover:text-dark-text text-lg">✕</button>
        </div>

        {/* Request list */}
        <div className="max-h-72 overflow-y-auto p-3 space-y-2">
          {items.map(req => (
            <div
              key={req.id}
              onClick={() => toggle(req.id)}
              className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                req.isConfirmed
                  ? 'border-accent-blue/30 bg-accent-blue/5'
                  : 'border-dark-border bg-dark-bg opacity-40'
              }`}
            >
              {/* Checkbox */}
              <div className={`w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                req.isConfirmed ? 'border-accent-blue bg-accent-blue' : 'border-dark-muted'
              }`}>
                {req.isConfirmed && <span className="text-white text-[9px]">✓</span>}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-dark-muted">{req.id}.</span>
                  {req.priority === 'high' && <span className="text-[9px] px-1 rounded bg-red-400/15 text-red-400">דחוף</span>}
                  {req.project && <span className="text-[9px] px-1 rounded bg-dark-hover text-dark-muted">{req.project}</span>}
                </div>
                <p className="text-xs text-dark-text leading-relaxed">{req.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add missing item */}
        <div className="p-3 border-t border-dark-border">
          <div className="flex gap-2 mb-3">
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="הוסף דבר שחסר..."
              className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text placeholder-dark-muted/50 focus:outline-none focus:border-accent-blue"
            />
            <button
              onClick={addItem}
              disabled={!newItem.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-text disabled:opacity-30"
            >
              + הוסף
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-dark-muted flex-1">
              {confirmed.length} מאושר{confirmed.length !== 1 ? 'ים' : ''}
            </span>
            <button onClick={onDismiss} className="text-xs px-3 py-1.5 text-dark-muted hover:text-dark-text">
              ביטול
            </button>
            <button
              onClick={() => onConfirm(confirmed)}
              disabled={confirmed.length === 0}
              className="text-xs px-4 py-1.5 rounded-lg bg-accent-green text-white font-semibold disabled:opacity-40 hover:bg-accent-green/80 transition-colors"
            >
              ✅ התחל ({confirmed.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## AGENT 3 — Wire to IPC + App

### Add IPC in `ipc.ts`:
```typescript
import { extractRequests, generateConfirmationMessage } from './request-extractor'

ipcMain.handle('requests:parse', (_e, text: string) => {
  const requests = extractRequests(text)
  const confirmation = generateConfirmationMessage(requests)
  return { requests, confirmation }
})

ipcMain.handle('requests:save', (_e, args: {
  projectId: number
  requests: any[]
  sourceText: string
}) => {
  // Save confirmed requests as tasks in ZProjectManager
  const now = new Date().toISOString()
  for (const req of args.requests) {
    if (!req.isConfirmed) continue
    runInsert(
      'INSERT INTO project_tasks (project_id, title, status, priority, created_at) VALUES (?,?,?,?,?)',
      [args.projectId, req.text, 'todo', req.priority, now]
    )
  }
  return { saved: args.requests.filter(r => r.isConfirmed).length }
})
```

Add to preload.ts:
```typescript
'requests:parse', 'requests:save',
```

### Add to `Dashboard.tsx` — "Parse Request" input:

```tsx
// Add "Quick Request Parser" section to Dashboard:
const [parseInput, setParseInput] = useState('')
const [parsedRequests, setParsedRequests] = useState(null)

const parseRequest = async () => {
  if (!parseInput.trim()) return
  const result = await window.api.invoke('requests:parse', parseInput)
  setParsedRequests(result.requests)
  // Show RequestParser modal
}

// In JSX, add below the project list:
<div className="mt-6 border-t border-dark-border pt-4">
  <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">📋 Parse Requests</p>
  <div className="flex gap-2">
    <textarea
      value={parseInput}
      onChange={e => setParseInput(e.target.value)}
      placeholder="הדבק כאן הודעה ארוכה עם מספר בקשות — אני אחלץ ואמספר אותן..."
      rows={3}
      className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-dark-text placeholder-dark-muted/40 focus:outline-none focus:border-accent-blue resize-none"
    />
    <button
      onClick={parseRequest}
      disabled={!parseInput.trim()}
      className="text-xs px-4 rounded-xl bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors disabled:opacity-40 shrink-0"
    >
      📋 Parse
    </button>
  </div>
</div>

{parsedRequests && (
  <RequestParser
    requests={parsedRequests}
    onConfirm={(confirmed) => {
      // Save to tasks + generate combined GPROMPT
      setParsedRequests(null)
      setParseInput('')
    }}
    onDismiss={() => setParsedRequests(null)}
  />
)}
```

---

## AGENT 4 — Update ROYE_WORKING_STYLE.md with protocol

Add to the working style template:

```markdown
## Request Protocol — Never Miss a Request

### When Roye writes multiple requests:
Strategic AI ALWAYS starts with:
"הבנתי X דברים לעשות:
1. [item]
2. [item]
...
מתחיל עם 1. אם חסר משהו — תגיד."

### Roye shorthand:
Use 📋 to signal a complete task list:
\`\`\`
📋
- first thing
- second thing
- third thing
\`\`\`
📋 = "this is a complete list — do not skip any item"

### ZProjectManager Request Parser:
Paste any long message → extracts + numbers all requests → confirm before starting
```

Update the template file:
```bash
# Append to template
cat >> "C:/Projects/ZProjectManager/src/main/templates/ROYE_WORKING_STYLE.md" << 'EOF'

---

## Request Protocol — Never Miss a Request

### When Roye writes multiple requests (Strategic AI rule):
ALWAYS start response with:
```
הבנתי X דברים לעשות:
1. [item 1]
2. [item 2]
...
מתחיל עם 1. אם חסר משהו — תגיד.
```

### Roye shorthand:
📋 at the start = complete task list, do not skip any item

### ZProjectManager Request Parser:
Dashboard → "Parse Requests" → paste long message → confirm all items → execute
EOF
```

---

## BUILD + COMMIT

```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat: request parser — extract all action items from long messages"
git push origin master
```

## FINAL REPORT

| # | Agent | Status | Notes |
|---|-------|--------|-------|
| 1 | request-extractor.ts | ? | extractRequests() + generateConfirmationMessage() |
| 2 | RequestParser UI | ? | Checkbox list, add missing, confirm all |
| 3 | IPC + Dashboard | ? | requests:parse/save + input in Dashboard |
| 4 | Working style update | ? | Protocol added to template |

TypeScript: clean? | Build: clean?

Yes, allow all edits in components
