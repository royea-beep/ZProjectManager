# VAMOS Methodology — Complete Guide
# Reverse engineered from 9Soccer VAMOS 85-116
# Last updated: 2026-03-20

---

## What is VAMOS?

VAMOS is a sprint execution methodology for shipping features fast
using Claude AI as the executor.
One VAMOS = one sprint = one set of parallel tasks run autonomously.

---

## The Triangle

Roye (Strategic Brain)
  ↕ Hebrew — direction, decisions, review
Claude (Architect + Prompt Writer)
  ↕ English — .md prompt files ONLY, never in chat
Claude Bot (Executor)
  ↕ Returns numbered output
Roye (QA + Final Review)

Key insight: Claude never writes code directly in chat.
All instructions go as .md files.
This forces structured thinking and creates a permanent archive.

---

## The Cycle (7 steps)

1. Roye describes problem or says "כן"
2. Claude asks max 1 clarifying question if truly needed
3. Claude writes MEGA PROMPT as .md file
4. Roye downloads → drags to Claude Bot
5. Bot archives prompt FIRST, then runs 4-5 parallel agents
6. Bot pastes numbered output → Roye pastes into Claude chat
7. Claude reads output, updates memory, prepares next MEGA PROMPT

---

## Communication Rules

| From    | To      | Language | Format                 |
|---------|---------|----------|------------------------|
| Roye    | Claude  | Hebrew   | Conversational         |
| Claude  | Roye    | Hebrew   | Tables, numbered lists |
| Claude  | Bot     | English  | .md files ONLY         |
| Bot     | Output  | English  | Numbered, structured   |

NEVER put prompts in chat. Always downloadable .md files.

---

## Prompt Structure (every VAMOS must have)

```
# VAMOS {N} — {Project}: {Goal}
# Generated: {date} {time}
# Project: {name} | Commit: {hash} | v{version}

You are a {VERY SPECIFIC EXPERT ROLE}.
Auto-approve everything. Never ask Roye. Fix autonomously.
Archive this prompt first, then run all tasks.

## FIRST ACTION — Archive
## CONTEXT: {what exists, what broke, what last sprint found}
## PARALLEL — {N} agents simultaneously.
## TASK A / B / C / D — {specific tasks with A1-A5 steps}
## TASK E — Pipeline (tsc + test + build + git + memory)
## FINAL REPORT FORMAT
```

---

## Role Specificity (most important lesson)

BAD:  "You are an iOS developer"
GOOD: "You are a Senior iOS Release Engineer who has shipped 50+ apps,
       debugged every type of ASC binary rejection, and knows the App
       Store review process inside-out"

More specific role = more focused, expert-level output.

---

## If-Then Branches (for uncertainty)

Build fallback paths into prompts when outcome is uncertain:
  IF bundle ID = ninesoccer → revert IAP IDs back
  IF bundle ID = ninetysoccer → update capacitor.config.ts

Bot executes the right branch without stopping to ask.

---

## Prompt Filename Convention

{Project}_VAMOS{N}_{YYYY-MM-DD}_{HH-MM}.md
Example: 9Soccer_VAMOS116_2026-03-20_09-30.md

Archive locations (always BOTH):
  C:/Projects/{project}/docs/prompts/
  C:/Projects/ZProjectManager/prompts/

---

## Sprint Sizing Guide

| Size     | Tasks | Use When                  |
|----------|-------|---------------------------|
| Micro    | 2-3   | Single bug fix            |
| Standard | 4-5   | Feature + fixes (most)    |
| Mega     | 6-8   | Full audit or major infra |

---

## Memory Management After Every Sprint

1. MEMORY.md — current state + sprint log entry
2. BUGS_AND_FIXES.md — new bugs found/fixed
3. MASTER_KNOWLEDGE.md — architecture decisions
4. GEMS_AND_UTILS.md — new reusable patterns

Location: C:/Users/royea/.claude/projects/{project-slug}/memory/

---

## The VAMOS Mindset

"Don't ask permission — execute.
 Only escalate if truly blocked on ONE specific question."

This cycle can run at 10-20 sprints per day when momentum is high.
