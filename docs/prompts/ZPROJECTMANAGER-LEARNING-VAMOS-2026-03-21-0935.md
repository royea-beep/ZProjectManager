# ZPROJECTMANAGER — LEARNING: VAMOS Methodology from 9Soccer/CAPS
**Date:** 2026-03-21 | **Time:** 09:35 IST
**Source:** 42 CAPS sprints + 9Soccer adaptation
**Purpose:** הזנת הלמידה הזאת ל-ZProjectManager prompt templates

---

## מה למדנו מהתהליך המורכב

### 1. מה הצליח ב-CAPS שחסר בפרויקטים אחרים

| מה יש ב-CAPS | למה זה עבד | מה ZProjectManager צריך לשאול |
|---|---|---|
| `MEMORY.md` בכל session | הבוט לא "שוכח" בין sessions | "האם קיים MEMORY.md בפרויקט?" |
| `IRON_RULES.md` | חוקים שלא נשברים | "מה ה-Iron Rules של הפרויקט?" |
| `docs/sessions/` | תיעוד מלא של כל session | "האם יש session logs?" |
| `credentialsSource: remote` | אף פעם לא נגע בcerts ידנית | "האם ה-certs מנוהלים remotely?" |
| Build number tracking | תמיד יודעים מה deployed | "מה ה-build number הנוכחי?" |
| Pre-launch checklist | אין surprises לפני launch | "האם עברנו pre-launch checklist?" |

### 2. Iron Rules — מה שלא נשבר אף פעם

**הדפוס:** כל פרויקט צריך **Iron Rules משלו**, לא כללים גנריים.

```
9Soccer Iron Rules:
1. NEVER push to TestFlight ללא "אשר" מ-Roye
2. NEVER מחק קבצים — העבר ל-_archive/ בלבד
3. NEVER גע ב-p12/cert ידנית — EAS remote בלבד
4. ALWAYS tsc + vitest לפני deploy
5. ALWAYS session-summary + MEMORY.md בסוף session
```

**למה זה חשוב ל-GPROMPT:**
כש-Iron Rules כתובים בקובץ — הבוט קורא אותם ב-FIRST ACTIONS.
כשהם לא כתובים — הבוט מנחש מה מותר ומה אסור.

### 3. MEMORY.md — למה זה קריטי

**הבעיה בלי MEMORY.md:**
כל session מתחיל מאפס. הבוט לא יודע:
- מה ה-version הנוכחי
- מה ה-build number
- מה ה-known issues
- מה ה-cert status
- מה הושלם ב-session הקודם

**עם MEMORY.md:**
הבוט קורא 30 שניות → יודע הכל → ממשיך בדיוק מאיפה עצרנו.

### 4. Session Logs — הנתון הכי יקר

כל session log מכיל:
- מה הושלם ✅
- מה ה-build/version
- מה הבא

**אחרי 42 sessions של CAPS** = 42 session logs = מאגר ידע שמלמד:
- כמה זמן לוקח כל סוג משימה
- אילו בעיות חוזרות
- מה עבד, מה לא

**זה בדיוק מה ש-ZProjectManager צריך לנתח.**

### 5. מה היה מורכב בתהליך 9Soccer

מה שקרה:
- Apple ביטלה cert → crisis
- provisioning profile פג → crisis
- שינוי שם repository → 38+ קבצים לשנות
- folder name מקומי עדיין 90soccer → צריך לשנות

**הלמידה:**
בעיות cert, שינויי שם, ו-provisioning — כולן בגלל שהמידע לא היה כתוב ומנוהל מרכזית.

אם MEMORY.md היה קיים עם:
```
Cert expires: 2027-03-17
EAS credentialsSource: remote
Bundle ID: com.ftable.ninesoccer
```
— הcrisis לא היה קורה כי הבוט לא היה צריך לנחש.

---

## מה ZProjectManager צריך להוסיף

### א. MEMORY.md Generator
כפתור "Generate MEMORY.md" בכל פרויקט → יוצר קובץ מסודר מה-DB.

**Template:**
```markdown
# [ProjectName] MEMORY
**Version:** [version] | **Build:** b[buildNum] | **Date:** [today IST]

## Stack
[auto from parameters]

## CI Status
[auto from GitHub API]

## Cert Info (mobile only)
[if Capacitor/Expo]

## Last Session
[from session logs]

## Known Issues
[from tasks with status=blocked]

## Next Priority
[top task by priority]
```

### ב. IRON_RULES.md Generator
Per-project Iron Rules שהבוט חייב לקרוא ב-FIRST ACTIONS.

**Iron Rules שקיימים בכל פרויקט (universal):**
```
1. NEVER delete files — move to _archive/
2. NEVER give Roye commands to run — fix autonomously
3. ALWAYS tsc --noEmit before commit
4. ALWAYS end session with session-summary + MEMORY.md update
5. ALL timestamps = Israel time (UTC+3, IST)
6. ALL prompt files = .md with date+time IST in filename
```

**Iron Rules per category:**

Mobile (Capacitor):
```
- NEVER push to TestFlight without explicit "אשר" from Roye
- NEVER touch p12/cert manually — EAS remote ONLY
- iOS build number = EAS autoIncrement — never manual
- Deploy = EAS (iOS) + Vercel (web) — never manual Xcode
```

Mobile (Expo):
```
- Submit profile = 'preview' NEVER 'ci'
- EAS credentialsSource: remote (never local)
- Bump version in app.json (NOT manually)
```

Database:
```
- NEVER prisma db push if unknown tables exist
- ALWAYS ALTER TABLE, NEVER DROP/TRUNCATE
- ALWAYS check row count before migration
- ALWAYS backup before destructive migration
```

### ג. Pre-Launch Checklist per category

**Mobile (Capacitor/Expo):**
```
Technical:
- [ ] TypeScript: 0 errors
- [ ] Tests: all passing
- [ ] Lighthouse: Performance >85, A11y >90, SEO >90
- [ ] Push notifications: end-to-end tested
- [ ] Cert: valid + not expiring within 90 days
- [ ] Build number: correct (EAS autoIncrement)

Content:
- [ ] App Store screenshots: 6 sizes for 6.9" iPhone
- [ ] Privacy policy URL: live
- [ ] Support URL: live
- [ ] Age rating: correct
- [ ] Keywords: optimized
- [ ] Description: reviewed

Distribution:
- [ ] TestFlight: tested by real users (minimum 3)
- [ ] Crash-free rate: >99%
- [ ] All game modes tested on physical device
```

**Web SaaS:**
```
Technical:
- [ ] TypeScript: 0 errors
- [ ] Build: clean
- [ ] All env vars set in Vercel
- [ ] Rate limiting on auth routes
- [ ] RLS enabled on all Supabase tables
- [ ] /api/status returns 200
- [ ] robots.txt + sitemap
- [ ] Security headers

Business:
- [ ] Payment processor wired (Payplus)
- [ ] Email notifications working
- [ ] Error monitoring (Sentry/log-error)
- [ ] Analytics wired
```

### ד. Sprint Template — VAMOS Style

כל sprint שנוצר צריך להיות בפורמט:

```markdown
# VAMOS MEGA PROMPT — [Sprint Name]
**Version:** vX.X | **Build:** bNNN | **Date:** YYYY-MM-DD-HHMM IST

## ROLE
[Specific expert role for this project]

## FIRST ACTIONS
Read MEMORY.md at [project_path]/MEMORY.md. Confirm Iron Rules.
Create session file: docs/sessions/SESSION-[YYYY-MM-DD-HHMM].md
cp this prompt to docs/prompts/

## CONTEXT
[מה קרה, מה נשבר, evidence — מה הביא אותנו לsprimt הזה]

## MISSION
### Agent 1 — [name]
[task]
### Agent 2 — [name]
[task]
### Agent 3 — Deploy
tsc --noEmit → [tests] → build → deploy → git push

## SUCCESS CRITERIA
- [ ] TypeScript: 0 errors
- [ ] Tests: all passing
- [ ] [specific criteria for this sprint]

## ON COMPLETION
Update MEMORY.md → write session-summary → push → report

## MANUAL_TASKS
[ריק — הבוט עושה הכל. אם יש כאן משהו — זו כשל בתכנון]
```

---

## Sprint שצריך לבנות ב-ZProjectManager

### Sprint 9 — VAMOS Infrastructure Generator

**מה יבנה:**
1. "Generate MEMORY.md" button בכל פרויקט
2. "Generate IRON_RULES.md" button בכל פרויקט  
3. Pre-launch checklist per category (שאלות עם checkbox)
4. VAMOS sprint template כ-action חדש ב-PromptEngine
5. הוספת `docs/sessions/` ו-`docs/prompts/` לparameters extractor

**למה זה חשוב:**
בלי MEMORY.md + IRON_RULES.md — כל session מתחיל מאפס.
עם MEMORY.md + IRON_RULES.md — כל session ממשיך בדיוק מאיפה עצרנו.

---

## לוגיקת ה-GPROMPT המלאה (מעודכן)

```
GPROMPT = 
  FIRST ACTIONS (קרא MEMORY.md + אשר Iron Rules)
  + PROJECT PARAMETERS (auto-extracted)
  + STAGE-SPECIFIC checklist
  + CATEGORY-SPECIFIC rules
  + TASK (ספציפי)
  + SUCCESS CRITERIA (ניתן לבדיקה)
  + ON COMPLETION (עדכן MEMORY.md + session log)
```

**זה ה-format שסוגר את כל הפינות.**
