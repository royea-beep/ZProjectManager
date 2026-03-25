# VAMOS — Brawl Stars UI Redesign + 100 Experts Simulation
**Date:** 2026-03-21 19:15 IST

## FIRST ACTIONS
```
Read MEMORY.md. Iron Rules confirmed.
cd C:/Projects/90soccer
cp this file to docs/prompts/VAMOS-BRAWLSTARS-REDESIGN-2026-03-21-1915.md
```

## PART 1 — Brawl Stars UI Analysis

What makes Brawl Stars UI great:
1. **Bottom nav** — 5 tabs, always visible, icons + labels
2. **Center hero** — ONE big CTA (Play button), nothing competing
3. **Character/mascot** — prominent, animated, interactive
4. **Top bar** — gems + coins + trophies, clean
5. **Mode cards** — horizontal scroll, colorful, distinct visual identity per mode
6. **NO left sidebar** — modes are in bottom nav or swipeable cards
7. **Notification dots** — red badge on modes with new content
8. **Season banner** — top of screen, dismissible

## PART 2 — Redesign Tasks

### Read current HomeScreen structure
```
cat src/components/HomeScreen.tsx | wc -l
cat src/components/HomeScreen.tsx
```

### Fix 1 — Remove left sidebar, move modes to bottom nav
Current: left sidebar with 9 icons (BR/Showdown/Battle/Tourney/Shop/WC/CL/Hourly/Squad/Solo)
Target: Bottom nav with 5 main tabs + "More" menu for secondary modes

```tsx
// Bottom nav tabs:
// 🏠 Home | ⚡ Play | ⚔️ Battle | 🏆 Ranks | 👤 Me
// "Battle" tab opens a modal/sheet with: BR / Showdown / Wager / Gauntlet / Hourly
// "Play" goes directly to daily challenge
```

### Fix 2 — Mode cards horizontal scroll (Brawl Stars style)
Below the PLAY button: horizontal scrolling row of mode cards
Each card: colored background + icon + mode name + status badge (LIVE/HOT/NEW)

```tsx
<div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x">
  <ModeCard mode="battle" color="#e74c3c" label="Battle Royale" status="LIVE" />
  <ModeCard mode="showdown" color="#9b59b6" label="Showdown" status="HOT" />
  <ModeCard mode="wager" color="#f39c12" label="Wager" status="NEW" />
  {/* etc */}
</div>
```

### Fix 3 — Clean top bar (Brawl Stars style)
```tsx
// Left: coins + stars + trophies (compact)
// Center: game logo / season name  
// Right: PRO button + settings
// Remove: "Pitch Invader" text (move to profile)
```

### Fix 4 — Hero section
```tsx
// Center of screen:
// - The Lemon mascot (large, 120px)
// - Speech bubble (above mascot, max 2 lines)
// - TODAY'S CHALLENGE card (below mascot)
// - PLAY button (big, below card)
// Clear empty space around — no clutter
```

### Fix 5 — Notification system
Add red dot badges to mode buttons when:
- New battle available
- Hourly battle starting soon
- Tournament active

---

## PART 3 — 100 Experts Simulation (5 hours)

Write `scripts/expert-simulation.py`:

Simulate these expert personas playing for 5 hours:

**Group A — Mobile Game Industry Leaders (20 people)**
- TheCohen (Israeli mobile game dev, 15 years)
- InDaGame (Game designer, ex-Supercell)
- Sarah Chen (Brawl Stars senior designer)
- Marcus Webb (Clash Royale product lead)
- Yuki Tanaka (Pokémon GO UX)
- ... (15 more mobile game experts)

**Group B — Top 100 Mobile Games Team Leads (30 people)**
- Reps from: Subway Surfers, Temple Run, Among Us, Wordle, Duolingo, FIFA Mobile, eFootball, Score Hero, Top Eleven, Soccer Stars
- Each brings their game's design philosophy

**Group C — Israeli Game Market (25 people)**
- Casual gamers (age 8-14) — football fans
- Competitive players (age 15-25)
- Parents who approve apps

**Group D — Content Creators (15 people)**
- TikTok gaming creators
- YouTube "mobile game" reviewers
- Twitch streamers

**Group E — TheCohen + InDaGame (Special)**
- Deep dive, harsh critics, professional eye

For each persona, simulate:
- Hour 1: First impression, onboarding
- Hour 2: Core loop (daily challenge)
- Hour 3: Explore modes
- Hour 4: Social features (squad, battle)
- Hour 5: Would they come back?

Rate each screen 1-10 with specific feedback.

Output format per expert:
```
## [Expert Name] — [Background]
### Overall: X/10

| Screen | Rating | Comment |
|--------|--------|---------|
| Home | X/10 | "..." |
| Game | X/10 | "..." |
| Battle | X/10 | "..." |
...

### Top 3 Must-Fix:
1. ...
2. ...
3. ...

### What's Brilliant:
1. ...
```

### TheCohen Special Report:
```
## TheCohen — Israeli Mobile Game Veteran
"בתור מישהו שבנה 12 משחקים מובייל..."
[Brutal honest review in Hebrew + English mixed]
```

### InDaGame Special Report:
```
## InDaGame — Ex-Supercell Game Designer  
"Coming from Brawl Stars development..."
[Professional Supercell-style critique]
```

Run simulation:
```
py -3.11 scripts/expert-simulation.py > docs/sessions/EXPERT-SIM-2026-03-21.md
```

---

## PART 4 — Extract Top Issues + Fix

After simulation, extract:
```
grep -A3 "Must-Fix\|CRITICAL\|broken\|0/10\|1/10\|2/10\|3/10" docs/sessions/EXPERT-SIM-2026-03-21.md | head -50
```

Fix the top 5 most-mentioned issues automatically.

---

## DEPLOY
```
npx tsc --noEmit
npx vitest run
npx next build
vercel --prod
git add -A
git commit -m "feat: Brawl Stars UI redesign + expert simulation fixes (v3.5.3)"
git push origin main
```

## DEFINITION OF DONE
- Home looks like Brawl Stars (horizontal mode cards, clean hero, proper nav)
- Expert simulation report saved
- Top issues identified and fixed
- TheCohen + InDaGame reports included
