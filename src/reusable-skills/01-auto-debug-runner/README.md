# Skill 01: AutoDebugRunner

## What It Does
Runs N sequential test steps as TypeScript functions (NOT Playwright/E2E UI).
Each step has a timeout. On fail/crash/timeout: generates an auto-fix prompt
ready to paste into Claude, plus records results to DB.

## Source
`/c/Projects/Caps/utils/auto-debug.ts` (also identical copy in `/c/Projects/90soccer/src/lib/auto-debug.ts`)

## Usage
```ts
import { AutoDebugRunner, DebugStep } from './auto-debug'

const steps: DebugStep[] = [
  { id: 1, name: 'Load homepage', timeout: 5000, action: async () => {
    const res = await fetch('/')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }},
  { id: 2, name: 'Evaluate hand', action: () => {
    const result = evaluateHand(['Ah', 'Kh', 'Qh', 'Jh', 'Th'])
    if (!result) throw new Error('null result')
  }},
]

const runner = new AutoDebugRunner('MyProject', '1.0.0', 'build-42', steps)
const report = await runner.run((step) => console.log(step.stepId, step.status))

if (report.failedAt) {
  console.log(report.autoFixPrompt) // paste this into Claude
}
```

## Key Features
- `Promise.race` timeout per step (default 5000ms)
- Captures `console.error` during each step
- `autoFixPrompt` string = ready-to-paste Claude fix prompt
- Stops on first crash/timeout (fail continues)
- No external dependencies

## Adapt For New Project
1. Change project name/version/build in constructor
2. Define your own DebugStep array
3. Wire `report` to DB + WhatsApp/ntfy
