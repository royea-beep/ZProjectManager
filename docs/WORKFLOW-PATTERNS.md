# Workflow Patterns — Reverse Engineered from 48H Marathon

## Pattern 1: The Triangle
```
Roye (Hebrew, decisions) → Strategic AI (plans, MEGA PROMPTs in English)
                                    ↓
                              Claude Bot (executes)
                                    ↓
                              MEGA FINAL REPORT
                                    ↓
                        Roye pastes → Strategic AI → next prompt
```

## Pattern 2: MEGA PROMPT Structure
```
# PROJECT — TASK
Date | Time | Previous commit
## CONTEXT (2-3 sentences)
## LOCKED DECISIONS
## STEP 0 — READ FIRST (mandatory!)
## TASK
  ### AGENT 1-N (parallel when possible)
  ### FINAL — BUILD + DEPLOY
## CONSTRAINTS
## DEFINITION OF DONE (numbered checkboxes)
## MEGA FINAL REPORT (MANDATORY — table format)
Yes, allow all edits in components
```

## Pattern 3: Wave Execution
Split large work into waves. Each wave = 2 parallel agents.
Wave N+1 starts when Wave N ships.

## Pattern 4: Expert Panel Simulation
Create virtual experts (Brawl Stars designer, Fall Guys designer, etc.)
Each rates the system 1-10 in their domain.
Use disagreements to find real issues.

## Pattern 5: User Simulation
15 fake testers + 5 fake YouTubers = realistic feedback.
Run BEFORE building fixes → build only what simulation says matters.

## Pattern 6: Golden Prompt
"אתה המנהל של כל התתי מנהלים — תתייעץ איתם ותציג 10 דברים הבאים."
Brings deep expert-panel results. Roye approved (⭐).

## Pattern 7: Bible-First Development
1. Read ALL code + design docs
2. Write BIBLE (what exists vs what's planned)
3. Only then write code
4. If it's not in the BIBLE — don't build it

## Pattern 8: Crash Evidence Loop
```
Crash → CrashBoundary (JS) or DirtyShutdown (native)
  → Screenshots + step log + error
  → DB (crash_reports + debug_sessions)
  → Alert (WhatsApp/ntfy with CR-XXXX code)
  → Layer 4: Claude API auto-fix → GitHub commit → CI deploy
  → Max 3 attempts → escalate to human
```

## Pattern 9: Reply-Routed Crash Threading
Each crash gets CR-XXXX code.
WhatsApp reply "תתקן" → Edge Function finds specific crash → returns fix prompt.
Multiple crashes batched in 10s window.

## Pattern 10: Responsive-First Layout
One `responsive.ts` file: scale(), verticalScale(), moderateScale().
Base design: iPhone 14 Pro (393×852).
Zero hardcoded pixels anywhere.
