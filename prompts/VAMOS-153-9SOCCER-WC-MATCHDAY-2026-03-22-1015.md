# VAMOS 153 — WC Push Countdown + Live Match-Day Mode + Responsive Fixes
**Date:** 2026-03-22 10:15 IST

## FIRST ACTIONS
```
Read MEMORY.md. Iron Rules confirmed.
cd C:/Projects/90soccer
cp this file to docs/prompts/VAMOS-153-2026-03-22-1015.md
```

## PART 1 — WC Countdown Push Notifications

Add scheduled WC milestone pushes to the hourly cron:
```
cat src/app/api/cron/hourly-push/route.ts
```

Add these milestones:
```typescript
const WC_START = new Date('2026-06-11T19:00:00Z') // WC 2026 kickoff
const daysUntil = Math.ceil((WC_START.getTime() - Date.now()) / 86400000)

const wcMilestones: Record<number, { title: string; body: string }> = {
  60: { title: '⏳ 60 Days to World Cup!', body: 'Train daily on 9Soccer — be ready when it counts 🏆' },
  30: { title: '🔥 One Month to WC 2026!', body: 'The World Cup is almost here. Are you ready? ⚽' },
  14: { title: '📅 Two weeks to kickoff!', body: 'WC 2026 starts June 11. Play today to sharpen your knowledge!' },
  7:  { title: '🚨 ONE WEEK to WC 2026!', body: 'USA · Canada · Mexico. The party starts in 7 days 🎉' },
  3:  { title: '⚡ 3 days to kickoff!', body: 'Last chance to train. WC 2026 is HERE 🏆⚽' },
  1:  { title: '🌍 TOMORROW: World Cup 2026!', body: '9Soccer is ready. Are you? Play the WC Challenge now!' },
  0:  { title: '🏆 IT\'S WORLD CUP DAY!', body: 'The 2026 World Cup starts TODAY. Play the live match quiz NOW! ⚽🔴' },
}

if (wcMilestones[daysUntil]) {
  await sendPushToAllUsers(wcMilestones[daysUntil])
}
```

## PART 2 — Live Match-Day Mode (WC 2026)

Create `/match-day` page for WC:
```
# New page: src/app/match-day/page.tsx
```

Logic:
- Before WC (now → June 10): show "Match Day is coming" with countdown
- During WC match (June 11+): show LIVE quiz for today's match
- Post-match: show results + "How well did you predict?"

Match schedule data:
```typescript
// src/lib/wc-schedule.ts
export const WC_MATCHES = [
  { date: '2026-06-11', home: 'Mexico', away: 'USA', group: 'A', kickoff: '19:00 EDT' },
  { date: '2026-06-12', home: 'Argentina', away: 'Morocco', group: 'B', kickoff: '15:00 EDT' },
  // ... (add first 10 matches with real WC 2026 schedule if known, otherwise use placeholder)
]
```

Match-day quiz format:
```tsx
// During match: 5 prediction questions
// "Who will score first?"
// "Will there be a red card?"  
// "Final score prediction?"
// "Who's Man of the Match?"
// "Total goals: Over/Under 2.5?"
// → Reveal after match ends → award coins for correct predictions
```

Add to home mode cards:
```tsx
{ 
  icon: '🔴', 
  title: 'MATCH DAY', 
  sub: matchToday ? `${today.home} vs ${today.away}` : `Next: ${nextMatch}`,
  badge: matchToday ? 'LIVE' : null,
  href: '/match-day'
}
```

## PART 3 — Fix Responsive Issues from VAMOS 152 Audit

Read the responsive audit results:
```
grep -A3 "⚠️\|❌\|FAIL\|overflow\|overlap" docs/sessions/BRAWL-STARS-SIM-V2-2026-03-22.md | head -50
```

Fix every ⚠️ and ❌ found in the audit.

Common fixes:
```css
/* Samsung S23 Ultra (480px) — wide phone */
@media (max-width: 480px) {
  .mode-cards { gap: 0.5rem; }
  .play-button { font-size: 1.2rem; }
}

/* iPad (744px+) — tablet layout */
@media (min-width: 744px) {
  .home-container { max-width: 600px; margin: 0 auto; }
}
```

## QUALITY CHECK
```
npx tsc --noEmit
npx vitest run
npx next build
vercel --prod
git add -A
git commit -m "feat: VAMOS 153 — WC countdown push + Match Day mode + responsive fixes (v3.7.3)"
git push origin main
```

## SUCCESS CRITERIA
- [ ] WC milestone pushes scheduled (60/30/14/7/3/1/0 days)
- [ ] /match-day page exists with pre-WC countdown
- [ ] Match Day mode card on home
- [ ] All responsive ⚠️ issues fixed
- [ ] TypeScript: 0 errors

## DEFINITION OF DONE
9Soccer is ready to be THE game of WC 2026
