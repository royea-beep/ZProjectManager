# BIBLE AUDIT — [PROJECT NAME]
## Date: [DATE]
## Auditor: Claude Bot

---

## STEP 0: READ EVERYTHING FIRST
Before scoring anything, run these in order:
1. `find [project-path]/src -name "*.ts" -o -name "*.tsx" | sort | xargs cat`
2. `cat [project-path]/docs/[BIBLE-FILE].md`
3. Only then fill in this template.

---

## SECTION 1: Core Game Loop / Core Flow
**What BIBLE says:** [describe]
**What code does:** [describe]
**Compliance:** [X/10]
**Issues:**
- [ ] [issue 1]
- [ ] [issue 2]

---

## SECTION 2: Onboarding
**What BIBLE says:** [describe]
**What code does:** [describe]
**Compliance:** [X/10]
**Issues:**
- [ ] [issue 1]

---

## SECTION 3: Content System
**What BIBLE says:** [describe]
**What code does:** [describe]
**Compliance:** [X/10]
**Issues:**
- [ ] [issue 1]

---

## SECTION 4: Monetization / Economy
**What BIBLE says:** [describe]
**What code does:** [describe]
**Compliance:** [X/10]
**Issues:**
- [ ] [issue 1]

---

## SECTION 5: Social / Multiplayer
**What BIBLE says:** [describe]
**What code does:** [describe]
**Compliance:** [X/10]
**Issues:**
- [ ] [issue 1]

---

## SECTION 6: Art / Audio / UX
**What BIBLE says:** [describe]
**What code does:** [describe]
**Compliance:** [X/10]
**Issues:**
- [ ] [issue 1]

---

## SECTION 7: Features Built But NOT In BIBLE
List everything found in code that the BIBLE doesn't mention.
These are candidates for removal or retroactive BIBLE entry.

| File | Feature | Action |
|------|---------|--------|
| [file] | [feature] | REMOVE / ADD TO BIBLE |

---

## SECTION 8: Features In BIBLE But NOT Built
List everything the BIBLE specifies that isn't in the code.
These are the priority build items.

| BIBLE Ref | Feature | Priority |
|-----------|---------|----------|
| [section] | [feature] | HIGH/MED/LOW |

---

## SECTION 9: Contradictions
Cases where code does X but BIBLE says Y.

| Code Does | BIBLE Says | Fix |
|-----------|-----------|-----|
| [behavior] | [spec] | [what to change] |

---

## OVERALL SCORE
| Section | Score |
|---------|-------|
| Core Loop | /10 |
| Onboarding | /10 |
| Content | /10 |
| Economy | /10 |
| Social | /10 |
| Art/Audio/UX | /10 |
| **TOTAL** | **/10** |

---

## TOP 10 PRIORITY FIXES
Ranked by impact × ease:

1. [highest priority fix]
2. [second]
3. [third]
...
10. [tenth]

---

## NEXT STEPS
After fixes, re-run audit. Target: 9.5/10 before launch.
