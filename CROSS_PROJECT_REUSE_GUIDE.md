# Cross-Project Reuse Guide
# Last updated: 2026-03-21
# How to reuse patterns from 9Soccer in any new project

---

## SKILL 1: iOS TestFlight CI/CD Pipeline
Location: skills/ios-ci/
What: Complete GitHub Actions pipeline — build, sign, upload, distribute to TestFlight
Time to set up: ~2 hours (mostly secrets setup)

Steps:
1. Copy ios-testflight.template.yml → .github/workflows/ios-testflight.yml
2. Copy ios-distribute.template.yml → .github/workflows/ios-distribute.yml
3. Set 6 GitHub secrets (see README)
4. Verify Bundle ID in Xcode matches ASC App Information page
5. Verify Apple ID from ASC App Information page (numeric ID)
6. Push → watch it go

Common mistakes (see README for full 8-point checklist):
- Using /v1/apps/{id}/builds instead of /v1/builds?filter[app]= → 400 errors
- bare PyJWT instead of PyJWT[crypto] → ES256 fails
- No venv on macOS 15 → pip blocked by PEP 668

---

## SKILL 2: BugReporter (Video → AI → GitHub Issue)
Location: skills/bug-reporter/
What: In-app bug reporting for testers
Time to set up: ~1 hour

Steps:
1. Create bug_reports table in Supabase
2. Create bug-report-videos storage bucket
3. Deploy analyze-bug-report Edge Function
4. Set ANTHROPIC_API_KEY + GITHUB_TOKEN in Supabase secrets
5. Add BugReportContent.tsx component to app
6. Gate with feature flag (bug_reporter = true) so only testers see it

Key gotcha: iOS doesn't support getDisplayMedia.
Use 3-level cascade: screen → camera → audio (see README)

---

## SKILL 3: ASC API Integration
Location: skills/asc-api/
What: Query App Store Connect programmatically
Time to set up: 30 minutes

Use cases:
- Verify bundle ID before build
- Poll for build to become VALID
- Add builds to TestFlight groups
- Query IAP product IDs

Critical: Use /v1/builds?filter[app]= not /v1/apps/{id}/builds
Template: query-asc.template.js (ready to run with env vars)

---

## SKILL 4: VAMOS Sprint Methodology
Location: skills/vamos-methodology/
What: How to run fast parallel-agent sprints with Claude

Core idea: Write prompt as .md file → Claude Bot runs 4-5 parallel agents → archive everything

Template:
  You are a {VERY SPECIFIC EXPERT ROLE}.
  Auto-approve everything. Never ask {USER}. Fix autonomously.
  Archive this prompt first, then run all tasks.
  ## PARALLEL — N agents simultaneously.
  ## TASK A / B / C / D — [independent tasks]
  ## TASK E — Pipeline (tsc + test + build + git + memory)

---

## REUSABLE CODE PATTERNS

### FCM Push via Google Service Account:
No separate FCM key needed. GOOGLE_SERVICE_ACCOUNT_JSON works.
Pattern in: 9Soccer supabase/functions/_shared/fcm-auth.ts

### Content Engine (DB-backed daily rotation):
Deterministic rotation: Math.floor(epochDay % challenges.length)
Exact-date override for special days
Status lifecycle: active → draft → retired
Pattern in: 9Soccer src/lib/content-repository.ts

### Season Pass / XP with DB sync:
Always sync localStorage XP to DB via RPC call
Pattern in: 9Soccer src/lib/economy.ts

### Next.js Static Export for iOS:
output: 'export' + turbopack.root = __dirname
RevenueCat key in vercel.json env block (not just dashboard)
isNativeApp() gate for IAP
Pattern in: 9Soccer next.config.ts + vercel.json

---

## PROJECTS USING THESE PATTERNS:

| Pattern         | 9Soccer | Caps | PostPilot | Wingman | analyzer |
|----------------|---------|------|-----------|---------|----------|
| VAMOS sprints  | ✅      | ✅   | ✅        | ✅      | ✅       |
| iOS CI/CD      | ✅      | ✅   | -         | -       | -        |
| BugReporter    | ✅      | ✅   | ✅        | ✅      | ✅       |
| Supabase       | ✅      | ✅   | ✅        | ✅      | ✅       |
| SecretSauce    | ✅      | ✅   | ✅        | ✅      | ✅       |
