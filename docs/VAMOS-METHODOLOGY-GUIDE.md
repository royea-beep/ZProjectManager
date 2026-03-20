# VAMOS Methodology — Complete Guide
**Version:** 2.0 | **Date:** 2026-03-20

---

## What is VAMOS?
VAMOS = **V**ertical **A**utonomous **M**ulti-agent **O**rchestration **S**ystem

A prompt methodology for running Claude Code (claude.ai) with 5+ parallel agents on complex multi-task sprints.

---

## Core Principles
1. **PARALLEL AGENTS** — always 5+ agents minimum for any sprint
2. **AUTONOMOUS** — "Fix autonomously. Never give user commands."
3. **STANDING ORDERS** — read at top of every prompt
4. **MEMORY FIRST** — always "Read MEMORY.md" as first agent step
5. **VALIDATE ALWAYS** — `npx tsc --noEmit` + `npx jest --silent` before every deploy

---

## Prompt Structure

```
VAMOS [PROJECT] [TASK] v[VERSION]-b[BUILD] [YYYY-MM-DD-HHMM]

## Current state: v[X.X.X] build #[NN] | commit [hash]
Read MEMORY.md. Iron Rules confirmed.
Standing Orders: Fix autonomously. Never give user commands.

---

## TASK A — [Name] (agent: [name]-agent)
A1. [step]
A2. [step]

## TASK B — [Name] (agent: [name]-agent)
B1. [step]
B2. [step]

## FINAL STEPS
1. npx tsc --noEmit — 0 errors required
2. npx jest --silent — all tests must pass
3. [deploy command]
4. git add -A && git commit -m "[type]: [description] [v1.x.x-bNNN]"
5. git push origin main
6. Update MEMORY.md
7. Report: table of what changed
```

---

## File Naming Convention
```
vamos-[project]-[task]-v[version]-b[build]-YYYY-MM-DD-HHMM.md
```
**Examples:**
- `vamos-caps-mega-bug-fix-v1.9.3-b93-2026-03-19-1800.md`
- `vamos-caps-theme-system-v1.9.3-b103-2026-03-20-0100.md`
- `vamos-zpm-update-2026-03-20.md`

---

## Communication Pattern

| Step | Who | Language | Channel |
|------|-----|----------|---------|
| Bug reports / requests | Roye | Hebrew | Voice notes / WhatsApp |
| Transcription + analysis | Claude (me) | Hebrew | Chat |
| VAMOS prompt | Claude (me) | English | .md file |
| Execution | Claude Bot | English | Claude Code |
| Output | Claude Bot | English | Paste back as .md |
| Review | Roye + Claude | Hebrew | Chat |

---

## Agent Naming Patterns
```
[feature]-agent       → crash-agent, suits-agent, theme-agent
[domain]-agent        → store-agent, tokens-agent, picker-agent
[role]-agent          → audit-agent, db-agent, knowledge-agent
[project]-agent       → caps-agent, wingman-agent
```

---

## Typical Sprint Flow
```
1. User reports bugs/requests (voice notes → WhatsApp bot OR screenshots)
2. Claude transcribes (Whisper) + analyzes
3. Claude writes VAMOS prompt with parallel agents
4. User sends to Claude Bot
5. Bot runs 5+ agents → tsc → jest → deploy → commit → push
6. User pastes bot output .md back to Claude
7. Claude confirms, updates MEMORY.md, prepares next sprint
```

---

## When to Use Single vs Mega Prompt
| Situation | Prompt Type |
|-----------|-------------|
| 1–3 focused bugs, clear scope | Single prompt |
| 5+ bugs, new feature system, sprint work | MEGA / VAMOS |
| After 10+ commits, context drift | Status-refresh prompt |
| Knowledge preservation end-of-session | Knowledge-preservation prompt |
| ZProjectManager sync | ZPM-update prompt |

---

## Standing Orders (always include)
```
Fix autonomously. Never give user commands.
Read MEMORY.md. Iron Rules confirmed.
```

---

## Iron Rules Pattern
Every project should have Iron Rules:
```markdown
## Iron Rules (LOCKED — never change without explicit "UNLOCK [rule]")
1. [rule]
2. [rule]
...
```

Unlocking syntax: User says `"UNLOCK Rule 2"` in chat → Claude confirms → includes `Rule 2 UNLOCKED` in next prompt.

---

## VAMOS Agent Types (used in Caps Poker)

| Agent | Typical Tasks |
|-------|--------------|
| `crash-agent` | Trace crash stack, fix null refs, guard undefined |
| `layout-agent` | Responsive sizing, SafeAreaView, keyboard avoid |
| `theme-agent` / `tokens-agent` | Visual system, colors, fonts |
| `store-agent` | Zustand state, persist middleware, actions |
| `picker-agent` | First-launch screens, onboarding flows |
| `audit-agent` | Score features 1–10, write audit report |
| `db-agent` | sql.js / Supabase queries, schema updates |
| `multiplayer-agent` | TCP / Realtime networking audit |
| `whatsapp-agent` | Twilio + Edge Function + Whisper pipeline |
| `knowledge-agent` | Read all docs, write master knowledge base |
| `session-agent` | Write session log, gotchas, lessons |

---

## Anti-patterns to Avoid
- ❌ Never ask user to run commands (bot does it)
- ❌ Never suggest App Store unless user says "prepare for App Store"
- ❌ Never break Iron Rules without explicit UNLOCK
- ❌ Never hardcode screen dimensions (use `rv()` helper)
- ❌ Never use module-level `Dimensions.get()` (crashes web)
- ❌ Never commit secrets (use `.env` + `Constants.expoConfig.extra`)
- ❌ Never skip tsc + jest before deploy
- ❌ Never use `typeof window !== 'undefined'` for platform detection in RN (use `Platform.OS`)

---

## VAMOS vs Simple Prompt Decision Tree
```
Is task scope > 3 files? → VAMOS
Are there 5+ independent subtasks? → VAMOS
Does task need QA + deploy + commit? → VAMOS
Is it a knowledge sync or audit? → VAMOS
Otherwise → Single focused prompt
```

---

## Real Session Stats (Caps Poker 2026-03-18 to 2026-03-20)
- **Builds shipped:** b88 → b104 (17 builds in 3 sessions)
- **Commits:** 30+ commits, 0 production regressions
- **Tests maintained:** 115/115 throughout
- **TypeScript errors:** 0 throughout
- **Agents run:** ~50+ parallel agent invocations
- **Key wins:** WhatsApp bot, theme system, orientation picker, Five-O layout, confetti
