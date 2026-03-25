# VAMOS 158 — Mascots React DURING Clip + 1v1 ELO Challenge
**Date:** 2026-03-22 10:45 IST

## FIRST ACTIONS
```
Read MEMORY.md. Iron Rules confirmed.
cd C:/Projects/90soccer
cp this file to docs/prompts/VAMOS-158-2026-03-22-1045.md
```

## PART 1 — Mascots React DURING the Clip (InDaGame insight)

### Read NineSecondPlayer + mascot system
```
cat src/components/game/NineSecondPlayer.tsx
cat src/lib/mascot-system.ts | head -60
```

### Add mascot overlay during video playback

The Lemon appears as a small bubble (bottom-left, outside video area) during the 9-second clip:

**Timeline of reactions during clip:**
```
0s → clip starts → Lemon: "👀 תראה היטב!" (speech bubble appears, 2s)
3s → mid-clip → Lemon bounces once (animation only, no text)
7s → "2 שניות!" → Lemon: "🎯 מוכן לשאלות?" (2s)
9s → clip ends → Lemon disappears, questions fade in
```

```tsx
// In NineSecondPlayer.tsx — add timed mascot reactions
const [mascotMessage, setMascotMessage] = useState<string | null>(null)

useEffect(() => {
  if (!isPlaying) return
  
  const t1 = setTimeout(() => setMascotMessage("👀 תראה היטב!"), 0)
  const t2 = setTimeout(() => setMascotMessage(null), 2000)
  const t3 = setTimeout(() => setMascotMessage("🎯 מוכן?"), 7000)
  const t4 = setTimeout(() => setMascotMessage(null), 9000)
  
  return () => [t1, t2, t3, t4].forEach(clearTimeout)
}, [isPlaying])

// Render: small lemon bubble overlay (NOT covering the video)
{mascotMessage && (
  <div className="absolute bottom-4 left-4 flex items-end gap-2 z-10 pointer-events-none">
    <img src="/mascots/mascot_the_lemon.png" className="w-12 h-12" alt="" />
    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-lg max-w-[120px]">
      {mascotMessage}
    </div>
  </div>
)}
```

## PART 2 — 1v1 Direct Challenge + ELO Ranked

### New mode: Timed Duel

Based on #1 wishlist request (15 votes):
```
# Create new page
src/app/duel/page.tsx
```

**Flow:**
1. User opens /duel
2. "Challenge a Friend" → enter friend's username OR share link
3. Both play the SAME daily challenge independently (no real-time needed)
4. After both complete: compare scores + time
5. Winner gets coins + ELO points
6. Loser gets "Rematch?" option

**ELO system:**
```typescript
// src/lib/elo.ts
export function calculateNewElo(playerElo: number, opponentElo: number, won: boolean): number {
  const K = 32
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
  const score = won ? 1 : 0
  return Math.round(playerElo + K * (score - expected))
}
```

**Supabase table:**
```sql
CREATE TABLE IF NOT EXISTS duels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id uuid REFERENCES profiles(id),
  opponent_id uuid REFERENCES profiles(id),
  challenge_id integer,
  challenger_score integer,
  opponent_score integer,
  challenger_time float,
  opponent_time float,
  winner_id uuid,
  status text DEFAULT 'pending', -- pending/active/complete
  created_at timestamptz DEFAULT now()
);
```

**Home mode card:**
```tsx
{ icon: '⚔️', title: '1v1 DUEL', sub: 'Challenge anyone', href: '/duel', badge: 'NEW' }
```

## QUALITY CHECK
```
npx tsc --noEmit
npx next build
vercel --prod
git add -A
git commit -m "feat: VAMOS 158 — mascot reactions during clip + 1v1 duel ELO (v3.7.7)"
git push origin main
```

## SUCCESS CRITERIA
- [ ] The Lemon appears during clip with timed messages
- [ ] /duel page with friend challenge flow
- [ ] ELO system implemented
- [ ] Duel card on home
- [ ] TypeScript: 0 errors

## DEFINITION OF DONE
Mascots feel alive during the clip (InDaGame satisfied)
1v1 Duel mode playable end-to-end
