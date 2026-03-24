# Marathon Learnings: March 22-24, 2026
## 48 Hours, ~40 Sessions, 3 Projects, ~30 Commits

---

## WHAT HAPPENED (Timeline)

### Day 1 — March 22 (18 sessions, 9Soccer only)
- Score: 6.2 → 9.3
- Built: 18 DNA Mashers, 9 Creatures×3 stages (27 SVGs), 54 DNA questions
- Character naming algorithm (6-player DNA fusion → name)
- Simulation: 10,000 respondents rated names
- 4 expert audit rounds
- Prestige system (Bronze→Diamond)
- WC 2026 content (48 nations)
- TestFlight v3.4.6 push

### Day 2 — March 23 (~20 sessions, all 3 projects)
- Video pipeline: 666 challenges 100% video
- Live Triggers: ScoreBat → challenge ≤5min
- Tournament: League→Top64→Final8
- User Simulation: 15 kids + 5 YouTubers
- Sprint B (viral): win fanfare, quiz share card, calendar
- Sprint C (content): 50 LATAM/MENA, dynamic lang/dir
- TestFlight standardization: all 3 projects
- Auto-debug: built + replicated to all 3
- QA Pipeline (BIBLE compliance): all 3
- Crash evidence (dashcam + DB logging): all 3
- WhatsApp crash threading (CR codes): Caps
- Layer 4 auto-fix loop: Claude API → GitHub commit → auto-deploy
- Wingman fetch freeze fix
- Caps responsive layout
- Real crash found + fixed by the system (Board.tsx hooks error)

### Day 3 — March 24 (ongoing)
- Bible audit: full checklist, creature removal, Player Quiz
- Wave 1: Video Layer Skill System + DNA Sync + Art Pipeline
- Wave 2: Mascot Voices + Background Music
- Bible compliance: 7.8 → 9.5/10
- Email management: Isracard clearing for Analyzer

---

## STRATEGIC FINDINGS

### 1. "Build the BIBLE first, then build the code"
The Game Bible was created on Day 1 by reading ALL code first. Without it,
we built creatures that were never planned. With it, everything aligns.
**Lesson: Every project needs a BIBLE before coding starts.**

### 2. "Audit before conclusions"
Multiple times Claude Bot reported features as "working" that weren't.
The verification step (actually running the code, checking DB, testing alerts)
caught 100% of false positives.
**Lesson: "Deployed" ≠ "Working". Always verify end-to-end.**

### 3. "The debug system that breaks the app"
Crash evidence code (react-native-view-shot import) crashed Caps.
Debug tools must NEVER break the app. Every import wrapped in try/catch.
**Lesson: Debug code is more dangerous than feature code.**

### 4. "WhatsApp is useless without content"
Crash alerts arrived but were EMPTY. Three separate fixes needed:
short message, ntfy backup, DB storage with fix prompt.
**Lesson: Notifications without actionable content = noise.**

### 5. "Creatures were never in the Bible"
5,574 lines of creature code built and deployed — all invented by Claude.
Roye asked 300 times to remove them. The Player Personality Quiz was the
correct onboarding per the design documents.
**Lesson: ONLY build what the design doc says. Nothing invented.**

### 6. "Parallel agents = 4x speed"
Wave 1 ran Agent A (Video Skills) + Agent B (DNA/Art) simultaneously.
Both completed in ~2 hours instead of ~8 sequential.
**Lesson: Always split into parallel agents when tasks are independent.**

### 7. "The Layer 4 auto-fix loop works"
Crash → DB → Edge Function → Claude API generates fix → GitHub commit → CI deploys.
Tested: Claude correctly refused to fake a fix for a non-existent bug.
**Lesson: AI can fix its own code, with guardrails (max 3 attempts).**

### 8. "Native crashes need different evidence"
JS CrashBoundary doesn't catch iOS process kills (dirty-shutdown).
Solution: continuous DB logging + detect on relaunch.
**Lesson: Two crash types need two evidence systems.**

### 9. "Test suites had bugs, not the game"
Caps auto-debug: 2 of 7 steps failed — both were test bugs (wrong Omaha
rules in test, wrong expected card count). Game code was correct.
**Lesson: Debug your tests, not just your code.**

### 10. "Responsive = calculated, never hardcoded"
scale()/verticalScale()/moderateScale() based on iPhone 14 Pro base (393px).
Zero hardcoded pixel values. Cards match slots exactly.
**Lesson: One responsive.ts file eliminates all layout bugs.**
