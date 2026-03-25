# VAMOS — Full Game Modes Audit: Play + Rate + Decide
**Date:** 2026-03-21 19:50 IST

## FIRST ACTIONS
```
Read MEMORY.md. Iron Rules confirmed.
cd C:/Projects/90soccer
cp this file to docs/prompts/VAMOS-MODES-AUDIT-2026-03-21-1950.md
```

## MISSION
Read the FULL code of every game mode.
For each mode, act as:
1. A 12-year-old Israeli football fan
2. A product manager with 10 years mobile games
3. TheCohen (brutal Israeli critic)

Rate each mode and give a clear verdict:
✅ KEEP AS IS | 🔧 UPGRADE | ❌ REMOVE | 🔄 MERGE WITH OTHER MODE

---

## MODES TO AUDIT (read each fully)

### 1. Daily Challenge (Solo)
```
cat src/app/solo/page.tsx 2>/dev/null || cat src/app/play/page.tsx 2>/dev/null
cat src/components/game/NineSecondPlayer.tsx | head -60
cat src/components/game/QuestionsScreen.tsx 2>/dev/null | head -60
cat src/components/game/GameCompleteScreen.tsx | head -60
```

### 2. Battle Royale
```
cat src/app/battle-royale/page.tsx | head -80
```

### 3. Showdown
```
cat src/app/showdown/page.tsx | head -80
```

### 4. Wager / High Stakes
```
cat src/app/wager/page.tsx | head -80
```

### 5. Daily Gauntlet
```
cat src/app/daily-gauntlet/page.tsx | head -80
```

### 6. Hourly Battle
```
cat src/app/hourly/page.tsx | head -80
```

### 7. Tournament
```
cat src/app/tournament/page.tsx | head -80
```

### 8. CL Qualifier
```
cat src/app/cl-qualifier/page.tsx | head -80
```

### 9. World Cup Mode
```
cat src/app/world-cup/page.tsx | head -80
```

### 10. vs Bot
```
grep -rn "vs.*bot\|vsBot\|VsBot\|bot.*mode" src/ --include="*.tsx" -l | grep -v node_modules
cat src/app/vs-bot/page.tsx 2>/dev/null | head -60
```

### 11. Squad
```
cat src/app/squad/page.tsx | head -80
```

### 12. Speed Mode / Elimination
```
cat src/app/speed/page.tsx 2>/dev/null | head -60
cat src/app/elimination/page.tsx 2>/dev/null | head -60
```

---

## OUTPUT FORMAT — For each mode:

```
## [MODE NAME] — /route

### What it is (1 sentence)
### How it plays (3 bullets)
### What's broken or missing

| Reviewer | Rating | Comment |
|----------|--------|---------|
| 12-year-old | X/10 | "..." |
| Product Manager | X/10 | "..." |
| TheCohen | X/10 | "ב..." |

### VERDICT: ✅ KEEP / 🔧 UPGRADE / ❌ REMOVE / 🔄 MERGE
### If UPGRADE: top 3 specific improvements
### If REMOVE: why + what replaces it
### If MERGE: with which mode
```

---

## FINAL SUMMARY TABLE

```
| Mode | Rating | Verdict | Priority |
|------|--------|---------|---------|
| Daily Challenge | X/10 | ✅ | — |
| Battle Royale | X/10 | 🔧 | HIGH |
...
```

**Overall question: Does 9Soccer have TOO MANY modes?**
Brawl Stars has ~15 modes. We have 12. But are they all distinct enough?
Recommend: ideal number of modes for our audience (Israeli kids 10-16).

---

## SAVE REPORT
```
# Write full report
cat > docs/sessions/GAME-MODES-AUDIT-2026-03-21.md << 'REPORT'
[full report here]
REPORT

git add docs/sessions/GAME-MODES-AUDIT-2026-03-21.md
git commit -m "docs: full game modes audit — keep/upgrade/remove decisions"
git push origin main
```

## DEFINITION OF DONE
- Every mode rated 1-10
- Clear KEEP/UPGRADE/REMOVE verdict for each
- Priority order for next sprints
- Saved to docs/sessions/
