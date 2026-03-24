# 9Soccer — Master Knowledge Base (Updated)
**Created:** 2026-03-23 | **Updated:** 2026-03-24 Sprint D
**For:** Claude Bot, Future Claude sessions, Roye

---

## 📊 CURRENT METRICS (2026-03-24)

| Metric | Value |
|--------|-------|
| Version Web | v4.0.7 |
| Version iOS | v4.0.4 (build ~580) |
| Game Score | ~9.7/10 |
| UX Score | 8.91/10 |
| D30 Retention | 71.1% |
| NPS | +68 |
| K-factor | 0.48 (Penalty Shootout) |
| Challenges | 628 |
| Questions | 14,800+ |
| Languages | 8 (he/ar/en/es/pt/fr/de/it) |
| Modes Active | 22 |
| Daily Roulette Pool | 14 modes |
| Days to WC 2026 | 78 |
| App Store Feature Probability | 78% |

---

## 🎮 ALL 22 GAME MODES

### Fixed Daily (always shown):
| Mode | Route | Score |
|------|-------|-------|
| ⚔️ Battle Royale | /battle-royale | 9.2 |
| ⚽ Daily Challenge | /solo | 9.5 |

### Rotating Pool (14 modes, 3 shown daily):
| Mode | Route | Score | Notes |
|------|-------|-------|-------|
| ⚡ 1v1 Duel ELO | /duel | 9.0 | WhatsApp challenges |
| 🏅 Tournament | /tournament | 8.8 | 8-player bracket |
| 💜 Showdown | /showdown | 8.3 | Solo survival |
| 💰 Wager | /wager | 7.6 | 13+ age gate |
| 📸 Photo Round | /photo-round | 9.0 | 14 players incl. Arab |
| ⚔️ Versus | /versus | 7.8 | Head to head |
| 💀 Elimination | /elimination | 8.2 | One wrong = out |
| ⚽ Penalty Shootout | /penalty-shootout | 9.0 | 5v5 WhatsApp async |
| 🔍 DNA Detective | /dna-detective | 9.0 | WHO AM I? 50 players |
| 🐐 GOAT Debate | /goat-debate | 9.1 | Messi vs CR7, Arabic ✅ |
| ⚡ 5-Second Blitz | /blitz | 9.1 | TikTok-ready 60s |
| 🌙 Gulf Stars | /gulf-stars | 9.2 | Arabic market, 400M fans |
| 🏆 WC Predictor | /wc-predictor | 9.4 | Locks June 11 2026 |

### Always Available (not in roulette):
Weekend Tournament, WC Hub, Match Day, Friend Challenge, Squad, CL Qualifier, Season Pass, vs Bot, Solo/Tour

### Archived:
Memory Match, Flashback, Prediction, DNA Detective (old), Creatures, Hourly Battle (biding time)

---

## 🗓️ DAILY ROULETTE SYSTEM

```typescript
// src/lib/daily-roulette.ts
FIXED_MODES = ['battle-royale', 'daily-challenge']  // always shown
ROTATING_POOL = [  // 3 chosen daily by seeded date shuffle
  'duel', 'tournament', 'showdown', 'wager',
  'photo-round', 'versus', 'elimination', 'penalty-shootout',
  'dna-detective', 'goat-debate', 'blitz', 'gulf-stars', 'wc-predictor'
]
// Rotates at midnight IST (21:00 UTC)
// Same 3 for all users on same day (date seed)
```

---

## 📱 iOS BUILD SYSTEM

```yaml
# Build number: run_number + 500
# Version: manually bumped (was stuck on 3.3.4 — now 4.0.x)
# CI: .github/workflows/ios.yml
# Auto-distribute: adds every build to Friends group + sends notification email
# Public TestFlight link: https://testflight.apple.com/join/ZrnsQbQd
# Bundle: com.ftable.ninesoccer | Apple Team: 3K9KJNGL9U
# Server URL: https://9soccer.ftable.co.il (loads web from Vercel)
```

---

## 🔧 CRITICAL FIXES LEARNED (Session 2026-03-24)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| TestFlight not notifying | No `notify_external_testers` in CI | Copied WINGMAN pipeline approach |
| Build number = Unix timestamp | ios.yml used `date +%s` | Fixed to `run_number + 500` |
| Version stuck at 3.3.4 | app.json never updated | Updated all: package.json + Info.plist + pbxproj |
| TestFlight shows old build | Friends group had build 338 | Expired 127 old builds, Friends = only latest |
| iOS shows old screens | cap sync not run before build | Always: `next build → cap copy ios → cap sync ios` |

---

## 🗄️ SUPABASE TABLES (new this session)

```sql
-- penalty_shootouts: 5v5 async WhatsApp game
-- goat_votes: Messi vs CR7 vote counter
-- wc_predictions: WC 2026 bracket predictions (locks June 11)
-- wc_group_stats: view showing % picks per team per group
```

---

## 🌍 SOCIAL MEDIA SIMULATION RESULTS

**Panel:** גיא לוי, Messi10Goals, FootballQuizKing, TikTokSportz,
ילד כדורגל, WC2026Hype, FootballMom, دحومي فيفا, CristianoFanEdit, FootballDataNerd

| Rank | Mode | Viral Score | TikTok |
|------|------|-------------|--------|
| #1 | Battle Royale | 9.3 | 8.8 |
| #2 | Photo Round | 9.2 | 8.0 |
| #3 | GOAT Debate | 9.5 | 9.2 |
| #4 | Blitz | 8.8 | 9.5 |
| #5 | Penalty Shootout | 9.4 | 7.5 |

**Pitch sentence:** *"9Soccer is the only football trivia app built for TikTok, WhatsApp, and 400M Arab fans — launching 90 days before WC 2026."*

---

## 🔜 PENDING ITEMS

| Priority | Item | Who |
|----------|------|-----|
| 🔴 | Twilio trust-hub → Primary Customer Profile | Roye |
| 🔴 | Verify ftable.aa gets "available to test" email | Auto (next build) |
| 🟡 | YouTube video_urls challenges 609-628 | Roye |
| 🟡 | Manager Mode + Transfer Rumor Quiz (VAMOS 186) | Bot |
| 🟡 | Xcode 26 upgrade (deadline April 28) | Bot |
| 🟡 | Google Drive pipeline (608 clips) | Needs gdrive JSON |
| 🟢 | First 10 real testers (family/friends WhatsApp) | Roye |
| 🟢 | Android beta | Not started |
| ⛔ | App Store / IAP / money | NOT until 1000 testers |
