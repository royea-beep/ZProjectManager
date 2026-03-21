# 9Soccer Master Knowledge — For Any Future Claude Session
# Last updated: 2026-03-21 | VAMOS 116
# Read this first when resuming 9Soccer work

---

## QUICK IDENTITY

App:       9Soccer — "9 seconds. Pure football."
Bundle ID: com.ftable.ninesoccer     ← confirmed from ASC (NOT ninetysoccer)
Apple ID:  6760544822                ← confirmed from ASC (NOT 6760251165)
Version:   3.3.4 | Build 382 | commit 7efcc88
Supabase:  psxqlmgsifvsmiijkucu
Repo:      royea-beep/9soccer
Stack:     Next.js static export + Supabase + Capacitor 8.2 iOS

---

## CURRENT STATE (as of VAMOS 116)

✅ 568 challenges, 15 solo modes, 209 tests passing
✅ Build 382 in TestFlight "Friends" group (first ever successful distribution)
✅ All CI bugs fixed (8-point checklist complete)
✅ All secrets set (GitHub + Supabase)

Manual still needed in ASC (~20 min):
- Upload 6 screenshots from C:/Projects/90soccer/screenshots/asc-ready/
- Enable TestFlight public link (appstoreconnect.apple.com/apps/6760544822/testflight)
- Set Age Rating 4+

---

## IRON RULES (NEVER break):

1. VIDEO_DURATION = 9s
2. Solo/Battle content SEPARATE
3. Static export only (no SSR)
4. C14 = draft permanently
5. content_engine = ON, DB-backed
6. Challenge IDs permanent (SELECT MAX(id) before inserting — gap at 427-488)
7. App name = "9Soccer", tagline = "9 seconds. Pure football."
8. NO App Store submission unless Roye says "מכינים לאפ סטור"

---

## CI PIPELINE — ALL 8 FIXES REQUIRED:

1. python3 -m venv before pip (macOS 15 PEP 668)
2. PyJWT[crypto] not bare PyJWT (ES256 needs cryptography)
3. No cancel-in-progress on distribute workflow
4. Separate ios-distribute.yml triggered by workflow_run
5. /v1/builds?filter[app]= NOT /v1/apps/{id}/builds (relationship endpoint = 400)
6. No filter[processingState]=VALID (deprecated ~2025 = 400)
7. Verify Bundle ID from ASC before first build
8. Apple ID from ASC App Information page (not assumed)

---

## KEY PATHS:

Project:     C:/Projects/90soccer/
Dashboard:   C:/Projects/9soccer-dashboard/
Memory:      C:/Users/royea/.claude/projects/C--Projects-90soccer/memory/
Prompts:     C:/Projects/90soccer/docs/prompts/
             C:/Projects/ZProjectManager/prompts/
Screenshots: C:/Projects/90soccer/screenshots/asc-ready/
Skills:      C:/Projects/ZProjectManager/skills/

---

## MEMORY INDEX:

MEMORY.md              — Current state + sprint log (read first)
BUGS_AND_FIXES.md      — 16 bugs with root cause + fix + commit
SESSION_LOG_2026-03-20 — Full VAMOS 107-116 journey
ios-learnings.md       — iOS CI, ASC API, Capacitor rules
MASTER_KNOWLEDGE.md    — This doc (local version)
GEMS_AND_UTILS.md      — 8 reusable patterns with code
LIBRARIES_USED.md      — Every library with version + gotchas
WORKFLOW_GUIDE.md      — VAMOS methodology + communication rules
VAMOS_MEGA_PROMPT_TEMPLATE.md — Template + lessons

---

## HOW WE WORK (VAMOS cycle):

1. Roye (Hebrew) → Claude analyzes
2. Claude writes .md MEGA PROMPT (English, downloadable file)
3. Roye drags to Claude Bot
4. Bot archives + runs 4-5 parallel agents autonomously
5. Bot returns output → Roye pastes to Claude
6. Claude updates memory + prepares next sprint

Prompt files: {Project}_VAMOS{N}_{YYYY-MM-DD}_{HH-MM}.md
Archive both: docs/prompts/ AND ZProjectManager/prompts/

---

## NEXT SPRINT: VAMOS 117

Goal: Enable TestFlight public link + send invites + handle first bug reports
