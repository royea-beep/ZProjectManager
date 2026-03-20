# 9Soccer Master Knowledge
# Last updated: 2026-03-20 VAMOS 114

## IRON RULES (NEVER change):
1. VIDEO_DURATION = 9s
2. Solo/Battle SEPARATE
3. Static export only
4. C14 = draft permanently
5. content_engine = ON
6. Challenge IDs permanent
7. App name = "9Soccer", tagline = "9 seconds. Pure football."
8. NO App Store steps unless Roye says "מכינים לאפ סטור"

## BUNDLE ID TRUTH (confirmed from ASC screenshot 2026-03-20):
- App Bundle:  com.ftable.ninesoccer
- IAP Monthly: com.ftable.ninesoccer.pro_monthly
- IAP Annual:  com.ftable.ninesoccer.pro_annual
- Apple ID:    6760544822  ← CORRECT (was 6760251165, wrong in all files V105-V113)
- ASC URL:     appstoreconnect.apple.com/apps/6760544822
- Supabase:    psxqlmgsifvsmiijkucu

## DB ID GAP:
Content engine: 427-488
Editorial: 489-568 (C427-C506)
Next: 569
ALWAYS: SELECT MAX(id) FROM solo_challenges before insert

## CI PIPELINE LESSONS (learned V97-V114):
1. Split build/distribute into 2 separate workflow files
   ios-testflight.yml → build + upload
   ios-distribute.yml → workflow_run triggered, distributes
2. Never cancel-in-progress on distribute workflow
3. Use PyJWT[crypto] not bare PyJWT (ES256 needs cryptography)
4. Use python3 -m venv before pip (macOS 15 PEP 668)
5. ASC API: no filter[processingState]=VALID (deprecated 2025) → 400 error
6. ASC API: use /v1/builds?filter[app]={APP_ID} — NOT /v1/apps/{id}/builds
   Relationship endpoint does not support sort params → 400 PARAMETER_ERROR
   → fetch builds without filter, check processingState attribute in response
6. Always verify Bundle ID matches ASC before first upload

## KEY PATHS:
- Project:     C:/Projects/90soccer/
- Dashboard:   C:/Projects/9soccer-dashboard/
- Memory:      C:/Users/royea/.claude/projects/C--Projects-90soccer/memory/
- Prompts:     C:/Projects/90soccer/docs/prompts/
               C:/Projects/ZProjectManager/prompts/
- Screenshots: C:/Projects/90soccer/screenshots/asc-ready/ (6 PNGs @ 1320x2868)
- Fastlane:    C:/Projects/90soccer/fastlane/
- ASC tools:   C:/Projects/90soccer/scripts/query-asc.js
               C:/Projects/90soccer/scripts/asc-status.sh

## FINAL CI FIX (V116 — CONFIRMED WORKING):
7. ASC API endpoint: GET /v1/builds?filter[app]={APP_ID}&sort=-uploadedDate&limit=5
   NOT /v1/apps/{id}/builds (relationship endpoint = no sort/filter support → 400)
   This was root cause of ALL PARAMETER_ERROR 400s since V111.
   Build 382 distributed to TestFlight "Friends" group on attempt 1/45 ✅
