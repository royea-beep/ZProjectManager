VAMOS ZPM-UPDATE 2026-03-20

## Mission: Update ZProjectManager with full current state of all projects
## Working dir: C:/Projects/ZProjectManager
## Standing Orders: Fix autonomously. Never give user commands.

---

## TASK A — Update MEMORY.md (agent: memory-agent)

A1. Write new C:/Projects/ZProjectManager/MEMORY.md:

```markdown
# Session memory (2026-03-20)

**User preference (always):** Simplest possible manual steps: 1) CLI → 2) API key → 3) Direct link + steps.

**Last session:** Caps Poker b104 — visual theme system Classic/Five-O, orientation picker, Five-O vertical reveal, confetti, WhatsApp bot fully live.

## Active Projects Status

### Caps Poker (NEW — added 2026-03-20)
- v1.9.3 build #104 | TestFlight + caps.ftable.co.il (Vercel) | 115/115 tests
- Features: 4 boards Omaha, vs bot, local TCP multiplayer, Supabase Realtime online, WhatsApp bot (Hebrew, image, audio), visual themes Classic/Five-O, orientation picker, leaderboard
- Pending manual: Twilio webhook URL (30s) + Google OAuth provider in Supabase dashboard
- Stack: React Native + Expo SDK 55 + TypeScript + Zustand + Supabase + Vercel

### Wingman
- React Native dating app, last build TestFlight 1.0.0 (8)
- Status: pre-launch, needs testing

### ftable
- Israeli poker portal LIVE at ftable.co.il
- Task 1 (in_progress/critical): Fix auth guards on admin pages, clean dead code

### Heroes-Hadera
- Deployed to heroes.ftable.co.il
- Task 2 (in_progress/critical): Complete admin tournament management

### KeyDrop, PostPilot, ExplainIt
- All LIVE on Vercel with LemonSqueezy billing

### Trading bots (cryptowhale, letsmakebillions)
- LIVE on Railway

## WhatsApp Bot
- Edge Function v15 LIVE on Supabase gxrpunvhjcrzqnitbqah
- Routes to 8 repos: caps-poker, wingman, keydrop, analyzer, explainit, postpilot, ftable, letsmakebillions
- Hebrew + image (Claude Vision) + audio (OpenAI Whisper)
- OPENAI_API_KEY confirmed set
- Twilio webhook URL: https://gxrpunvhjcrzqnitbqah.supabase.co/functions/v1/whatsapp-bot-handler
```

---

## TASK B — Update PROJECT_EMPIRE.md (agent: empire-agent)

B1. Read C:/Projects/ZProjectManager/PROJECT_EMPIRE.md in full
B2. Update the file:
    - Add Caps Poker to PROJECT REGISTRY under new section "Mobile Games (1 project)"
    - Update status for: Heroes-Hadera (deployed), KeyDrop (live), ExplainIt (live)
    - Update DEPLOYMENT MAP to add caps.ftable.co.il
    - Update date to 2026-03-20 | 18 projects
    - Add to Tech Stack Matrix: Caps Poker under React Native + Expo
    - Add to AI Integration: Caps Poker uses Anthropic Claude API + OpenAI Whisper

---

## TASK C — Check 11 project stages + audit Caps Poker against them (agent: stages-agent)

C1. Read C:/Projects/ZProjectManager/src/shared/types.ts or similar — find the 11 stage definitions
    Also check: src/renderer/*, src/main/*, EXECUTION_STRATEGY.md, PORTFOLIO_TRIAGE.md

C2. If stage definitions are in code — extract the 11 stages and their criteria

C3. Audit Caps Poker against all 11 stages:
    For each stage — is it DONE, IN PROGRESS, or NOT STARTED?
    Be specific about what evidence exists (e.g. "Stage 3: Tests — DONE: 115/115 passing")

C4. Write audit to docs/CAPS-POKER-STAGES-AUDIT-2026-03-20.md

---

## TASK D — Update ZProjectManager DB with latest session (agent: db-agent)

D1. Add session log for today's work to Caps Poker (project id 14):
    Use sql.js pattern from insert_caps.js (already deleted — recreate the pattern)

D2. Mark task 3 (Twilio webhook) as done = it was completed (webhook set in Twilio Console)
    Update: status = 'done', completed_at = '2026-03-20'

D3. Add new tasks:
    - "Test Five-O theme on device" — todo, medium
    - "Test landscape layout on iPhone" — todo, medium  
    - "Test multiplayer HOST+JOIN" — todo, medium
    - "Verify WhatsApp audio transcription end-to-end" — todo, high

D4. Update health_score from 88 to 92 (Twilio done, theme system added)

---

## FINAL STEPS
1. git add -A && git commit -m "chore: add Caps Poker, update PROJECT_EMPIRE, full status refresh 2026-03-20" in ZProjectManager
2. git push origin main (if remote exists)
3. Report: stage audit results for Caps Poker

VAMOS ZPM-UPDATE — END
