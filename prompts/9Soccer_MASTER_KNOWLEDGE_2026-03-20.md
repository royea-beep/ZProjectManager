# MASTER KNOWLEDGE SAVE — 9Soccer Session
# Date: 2026-03-20 | Claude + Roye
# This file captures everything worth preserving

---

## 1. PROJECT STATE (as of VAMOS 114)

```
App:        9Soccer — Football Trivia ("9 seconds. Pure football.")
Bundle ID:  com.ftable.ninesoccer          ← CONFIRMED from ASC screenshot
Apple ID:   6760544822                     ← CORRECTED (was 6760251165, wrong)
ASC URL:    appstoreconnect.apple.com/apps/6760544822
Version:    3.3.4 | Build auto-incremented by CI
Commit:     c13f9a2
Stack:      Next.js static export + Supabase + Capacitor/iOS
```

### Iron Rules (NEVER change):
1. VIDEO_DURATION = 9 seconds
2. Solo/Battle content SEPARATE
3. Static export only (no SSR)
4. C14 stays draft permanently
5. content_engine = ON, DB-backed
6. Challenge IDs permanent (always check MAX(id))
7. App name = "9Soccer", tagline = "9 seconds. Pure football."
8. NO App Store submission steps unless Roye says "מכינים לאפ סטור"

---

## 2. CRITICAL BUGS FOUND & FIXED (this session)

### CI Pipeline (most important fixes):
| Bug | Root Cause | Fix | Commit |
|-----|-----------|-----|--------|
| TestFlight never distributed | `cancel-in-progress: true` killed 40min poll | Split into 2 workflows | 9901ee2 |
| Still cancelling | GitHub cancels whole run | Moved distribute to separate `ios-distribute.yml` triggered by `workflow_run` | 7aedeb7 |
| pip3 fails | macOS 15 enforces PEP 668 | python3 -m venv before pip | 6f36800 |
| PyJWT ES256 fails | bare PyJWT missing crypto | PyJWT[crypto] | dd90503 |
| ASC API 400 | `filter[processingState]=VALID` deprecated in 2025 | removed filter, check attribute in response | 32f25fd |
| Apple ID wrong | 6760251165 used everywhere | corrected to 6760544822 | c13f9a2 |
| IAP IDs wrong | V105 "fix" changed to ninetysoccer | reverted to ninesoccer | c13f9a2 |

### App Bugs Fixed:
| Bug | Fix | Sprint |
|-----|-----|--------|
| OnboardingFlow dead code | Wired into page.tsx | V98/V100 |
| PlayerQuiz never shown | Connected to OnboardingFlow | V100 |
| Season XP localStorage only | Added DB sync (sync_season_xp RPC) | V98 |
| SeasonPassStrip wrong milestones | Fixed to use actual data | V98 |
| DailySkillQuiz invalid families | power/defense/momentum → valid families | V101 |
| Fake player counts in ModesHub | Removed all random number generation | V101 |
| BugReporter iOS screen capture fails | 3-level cascade: screen→camera→audio | V108 |
| Game crashes on null questions | Added null guards | V99 |
| sync_season_xp never fired | Promise.resolve bug fixed | V99 |
| /support page 404 | Added force-static export directive | V111 |

---

## 3. ARCHITECTURE DECISIONS LOCKED

```
- Static export: next.config.ts output: 'export'
- DB: Supabase (project: psxqlmgsifvsmiijkucu)
- iOS: Capacitor shell → web app
- CI: GitHub Actions → macos-latest → xcrun altool upload
- Distribution: separate ios-distribute.yml triggered by workflow_run
- TestFlight: auto-distributes to beta groups via ASC API
- Screenshots: GitHub Actions + iOS Simulator (xcrun simctl)
- Secrets: ALL in GitHub Actions secrets (14 confirmed)
```

---

## 4. SUPABASE SECRETS (all confirmed set)
```
ANTHROPIC_API_KEY       ✅ (for analyze-bug-report Edge Function)
GITHUB_TOKEN            ✅ (for BugReporter → GitHub Issues)
GOOGLE_SERVICE_ACCOUNT_JSON ✅ (FCM fallback for push notifications)
SUPABASE_ANON_KEY       ✅
SUPABASE_DB_URL         ✅
SUPABASE_SERVICE_ROLE_KEY ✅
SUPABASE_URL            ✅
```

---

## 5. GITHUB SECRETS (all confirmed set)
```
ASC_API_KEY_ID          ✅
ASC_API_KEY_ISSUER_ID   ✅
ASC_API_KEY_P8          ✅
DISTRIBUTION_CERT_P12   ✅
DISTRIBUTION_P12_PASSWORD ✅
PROVISIONING_PROFILE    ✅
```

---

## 6. KEY FILES & LOCATIONS
```
Main project:     C:/Projects/90soccer/
Dashboard:        C:/Projects/9soccer-dashboard/
Memory files:     C:/Users/royea/.claude/projects/C--Projects-90soccer/memory/
Prompt archive:   C:/Projects/90soccer/docs/prompts/
                  C:/Projects/ZProjectManager/prompts/
TestFlight docs:  C:/Projects/90soccer/docs/testflight/
Screenshots:      C:/Projects/90soccer/screenshots/asc-ready/ (6 PNGs @ 1320x2868)
Fastlane:         C:/Projects/90soccer/fastlane/
ASC query tool:   C:/Projects/90soccer/scripts/query-asc.js
ASC status tool:  C:/Projects/90soccer/scripts/asc-status.sh
```

---

## 7. DB SCHEMA — CRITICAL TABLES
```sql
-- Content
solo_challenges (id, slug, status, title, match_desc, competition,
                 year, teaser, fallback_text, video_url,
                 difficulty_tier, is_active, source)
solo_challenge_questions (challenge_id, level, position, text,
                          options ARRAY, correct_index)

-- Players
profiles (id, season_xp, season_level, active_character,
          daily_streak_count, notif_daily, notif_streak,
          notif_weekly, fcm_token, referral_code,
          referral_count, referral_coins_earned)

-- QA
bug_reports (id, tester_name, video_url, language, status,
             severity, ai_summary, ai_steps, ai_screen,
             github_issue_url, vamos_sprint)

-- System
feature_flags (key, enabled)
```

### DB ID Gap (IMPORTANT):
```
Content engine occupied IDs: 427-488
Editorial C427-C436: IDs 489-498
Editorial C437-C446: IDs 499-508
Editorial C447-C456: IDs 509-518
Editorial C457-C466: IDs 519-528
Editorial C467-C476: IDs 529-538
Editorial C477-C486: IDs 539-548
Editorial C487-C496: IDs 549-558
Editorial C497-C506: IDs 559-568
Next editorial ID: 569
ALWAYS run SELECT MAX(id) FROM solo_challenges before inserting!
```

---

## 8. WORKFLOW — HOW ROYE & CLAUDE WORK
(Reverse engineered from this session)

### The Triangle:
```
Roye (decides direction)
  ↕ Hebrew
Claude (strategic brain, writes prompts)
  ↕ English (always in files)
Claude Bot (executor, runs code)
```

### The VAMOS Cycle:
```
1. Roye says "כן" or describes a problem
2. Claude analyzes, asks 1 question max if needed
3. Claude creates MEGA PROMPT in a .md file
   - Filename: {Project}_VAMOS{N}_{YYYY-MM-DD}_{HH-MM}.md
   - Output to: /mnt/user-data/outputs/
4. Roye downloads file → drags to Claude Bot
5. Bot runs 4-5 parallel agents
6. Bot archives prompt to:
   - C:/Projects/90soccer/docs/prompts/
   - C:/Projects/ZProjectManager/prompts/
7. Bot pastes output back to Roye → Roye pastes here
8. Claude summarizes, updates memory, prepares next
```

### Prompt Structure (every VAMOS):
```markdown
# VAMOS {N} — {Project}: {Goal}
# Generated: {date} {time}
# Project: {name} | Commit: {hash} | v{version}

You are a {specific role} expert.
Auto-approve everything. Never ask Roye. Fix autonomously.
Archive this prompt first, then run all tasks.

## FIRST ACTION — Archive:
[archive commands to both locations]

## PARALLEL — {N} agents simultaneously.

## TASK A — {name}
Agent role: {specific expert role with depth}
[steps A1-A5]

## TASK E — Pipeline + Report
[tsc + test + build + git + MEMORY update]

## FINAL REPORT FORMAT:
[structured output format]
```

### Communication Rules:
- **Roye → Claude**: Hebrew, high-level direction
- **Claude → Bot**: English, always in .md files
- **Bot → Roye**: Hebrew summary tables
- **Auto-approve**: Bot never asks Roye for confirmation
- **Archive first**: Every prompt saved before execution
- **One question max**: Claude asks max 1 clarifying question
- **Think ahead**: Claude always suggests next step
- **Files not chat**: Prompts delivered as downloadable files

### Claude's Behavior Rules:
```
✅ Always: Think like PM, not passive responder
✅ Always: Determine next necessary steps
✅ Always: Save prompts to both archive locations
✅ Always: Update MEMORY.md after each sprint
✅ Always: Use specific expert role in prompt
✅ Always: 4-5 parallel agents
❌ Never: Suggest App Store submission unless Roye says "מכינים לאפ סטור"
❌ Never: Ask for confirmation on technical decisions
❌ Never: Put prompts in chat — always as .md files
❌ Never: Merge Solo/Battle content
❌ Never: Change VIDEO_DURATION from 9s
```

---

## 9. REUSABLE SKILLS FOR OTHER PROJECTS

### iOS CI/CD Pipeline (Reusable):
```yaml
# Key lessons learned:
# 1. Split build + distribute into separate workflow files
#    ios-testflight.yml → builds + uploads
#    ios-distribute.yml → triggered by workflow_run, distributes
# 2. Never use cancel-in-progress: true if distribute step > 10min
# 3. Use PyJWT[crypto] not bare PyJWT (ES256 needs cryptography)
# 4. Use python3 -m venv before pip (macOS 15 PEP 668)
# 5. ASC API: don't use filter[processingState]=VALID (deprecated 2025)
# 6. ASC API: check attribute in response instead of filter
# 7. Build number: always auto-increment from github.run_number
# 8. Always verify Bundle ID matches ASC before first upload
```

### Supabase Edge Functions:
```typescript
// FCM Push Notifications — fallback pattern
// GOOGLE_SERVICE_ACCOUNT_JSON can serve as FCM credential
// Extract project_id from JSON automatically
// Use getFcmCredentials() helper — checks FCM_SERVICE_ACCOUNT first,
// then GOOGLE_SERVICE_ACCOUNT_JSON as fallback

// Bug Reporter Pattern
// Video → Supabase Storage → Claude API → GitHub Issue
// Always cascade: screen→camera→audio (iOS doesn't support screen capture)
// Use runtime MIME detection for webm/mp4 iOS compatibility
```

### Content Engine Pattern:
```typescript
// Always DB-backed with TS fallback
// Deterministic rotation using epoch-based modulo
// Exact-date override for special days
// Status lifecycle: active → draft → retired
// IDs are permanent — never reassign
```

### VAMOS Sprint Pattern:
```
5 parallel agents = 4 feature agents + 1 pipeline agent
Pipeline agent always waits for others then:
  npx tsc --noEmit
  npm test
  npm run build
  git add -A + commit + push
  npx cap sync ios
  Update MEMORY.md
```

---

## 10. GEMS & UTILS

### ASC Query Tool (C:/Projects/90soccer/scripts/query-asc.js):
```javascript
// Queries App Store Connect API
// Shows: Bundle ID, app name, IAP products + status
// Requires: ASC_API_KEY_ID, ASC_API_KEY_ISSUER_ID, ASC_KEY_P8 in env
// Use in CI to verify before every build
```

### BugReporter Flow:
```
🐛 button (TestFlight only, via bug_reporter feature flag)
→ MediaRecorder cascade (screen → camera → audio)
→ Supabase Storage (bucket: bug-report-videos)
→ analyze-bug-report Edge Function
→ Claude API (HE/EN/ES multilingual)
→ GitHub Issue auto-created
→ Dashboard /bugs page
→ Assign to VAMOS sprint
```

### FastLane Setup (C:/Projects/90soccer/fastlane/):
```ruby
# Fastfile with lanes:
# upload_screenshots — drag & drop to ASC
# upload_metadata — update app description
# Note: fastlane cannot run on Windows
# Run from macOS or GitHub Actions macos runner
```

### Screenshot Workflow:
```yaml
# .github/workflows/screenshots.yml
# Runs on macos-latest
# Boots iPhone 16 Pro Max simulator
# Takes 6 screenshots via xcrun simctl
# Uploads as GitHub Actions artifacts
# Output: 1320x2868 PNG files
```

---

## 11. LIBRARIES USED

```json
{
  "frontend": {
    "next.js": "static export, no SSR",
    "tailwind": "core utility classes only",
    "capacitor": "iOS shell, screen orientation, app review",
    "revenuecat": "IAP (iOS only), purchases-capacitor@12.2.2"
  },
  "backend": {
    "supabase": "DB + Auth + Storage + Edge Functions + Realtime",
    "pg_cron": "scheduled jobs (push notifications, cleanup)",
    "deno": "Edge Function runtime"
  },
  "testing": {
    "vitest": "209 tests, 16 files",
    "playwright": "screenshots (available locally)"
  },
  "ci": {
    "github-actions": "macos-latest for iOS builds",
    "fastlane": "metadata/screenshot upload (macOS only)",
    "xcrun-altool": "IPA upload to ASC",
    "PyJWT[crypto]": "ASC API JWT generation (ES256)"
  }
}
```

---

## 12. VAMOS SPRINT INDEX (V85-V114)

| Sprint | Commit | Key Deliverable |
|--------|--------|-----------------|
| V85 | 333686c | DNA Quiz, C387-396, BottomDock |
| V86 | a4758ac | Sound signature, C397-406 |
| V87 | c02bb6e | Push notif v2, C407-416 |
| V88 | d72a1ff | Season Pass v2, C417-426 |
| V89 | 3492762 | Pro Stats, C427-436, Replay Mode |
| V90 | dd0c953 | Battle Royale leaderboard, C437-446 |
| V91 | f57e01c | App Store prep, C447-456 |
| V92 | 5ee19b6 | Daily Streak mode, C457-466 |
| V93 | 9aec1ef | v3.3.0, Daily Streak LIVE, C467-476 |
| V94 | e169368 | Flashback mode, C477-486 |
| V95 | 126dd54 | YouTube 100%, C487-496 |
| V96 | ee95784 | Photo Round (15th mode), C497-506 FINAL |
| V97 | ff75797 | BugReporter system complete |
| V98 | 7be6d14 | OnboardingFlow wired, Season XP DB, v3.3.1 |
| V99 | 86cbe29 | Crash fixes, 209 tests, bot polish |
| V100 | 07342a8 | PlayerQuiz wired to OnboardingFlow |
| V101 | a8beb39 | Full audit fixes, v3.3.2 |
| V102 | 42209b9 | TestFlight welcome, screenshots CI, v3.3.3 |
| V103 | 67a3b1f | Visual polish pass |
| V104 | 928a650 | Screenshot GitHub Actions workflow |
| V105 | dccf84f | IAP fix (wrong — later reverted), v3.3.4 |
| V106 | dd90503 | CI fix PyJWT[crypto], screenshots verified |
| V107 | 653c582 | Fastlane setup |
| V108 | 0b02046 | BugReporter iOS fallback, CI poll 40min |
| V109 | b1ae3a1 | RevenueCat env, E2E error handling |
| V110 | 012cba7 | CI cancel-in-progress fix |
| V111 | 06a7963 | ios-distribute.yml separate workflow |
| V112 | 32f25fd | ASC API 400 fix, validate-app added |
| V113 | 698b984 | ASC query script, bundle ID confirmed |
| V114 | c13f9a2 | Apple ID + IAP IDs corrected |

---

## 13. NEXT ACTIONS (VAMOS 115)
```
1. Verify build 377+ arrived in TestFlight
2. Get public TestFlight link from ASC
3. Send invite to testers using INVITE_TEMPLATE.md
4. Wait for bug reports via BugReporter
5. VAMOS 116 = first real debug sprint
```

---
END MASTER KNOWLEDGE SAVE
Generated: 2026-03-20
