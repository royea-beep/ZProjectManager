# 9Soccer Workflow Learnings — Sprint D (2026-03-24)

## Key discoveries:
1. iOS TestFlight: need `notify_external_testers:true` — copy WINGMAN pipeline
2. Build numbers: use `run_number + 500`, never `date +%s`
3. iOS version: update package.json + Info.plist + pbxproj ALL at once
4. TestFlight Friends group: CI must auto-add every build (see ios.yml)
5. Capacitor: ALWAYS run `next build → cap copy ios → cap sync ios` before iOS build
6. Arab market: GOAT Debate got 9.8 Arab score — Arabic content = massive
7. TikTok modes: Blitz (9.5 clip score) — 60 seconds = perfect TikTok length
8. WC countdown: 78 days = high urgency content hook
9. Expired 127 old builds from TestFlight — keep only latest in groups

## New IRON RULE added:
- iOS build MUST: next build → cap sync → commit → push
- CI MUST: add build to Friends group + notify testers
- NEVER let cap sync skip — results in old screens in app

## Social media sim insight:
- Arab market = biggest untapped audience (400M fans, 0 competitors)
- Gulf Stars Challenge filled the gap
- GOAT Debate = most viral content (every fan has an opinion)
- 5-Second Blitz = TikTok format (60 seconds, shareable result)

## GEMs saved this sprint:
- `gems/gem-twilio-lib.ts` — SMS + WhatsApp + push fallback
- `gems/gem-daily-roulette.ts` — seeded date shuffle, 14-mode pool
- `gems/gem-penalty-shootout.ts` — 5v5 async game pattern
- `gems/gem-i18n-8-languages.ts` — 8-language system (he/ar/en/es/pt/fr/de/it)

## New modes built (Sprint D):
| Mode | Score | Arab | Key pattern |
|------|-------|------|-------------|
| GOAT Debate | 9.1 | 9.8 | Vote counter + VIEW for totals |
| 5-Second Blitz | 9.1 | 8.5 | Speed bonus, TikTok 60s share |
| Gulf Stars Challenge | 9.2 | 9.9 | Trilingual questions, auto-RTL |
| WC 2026 Predictor | 9.4 | 9.5 | jsonb predictions, lock date |
