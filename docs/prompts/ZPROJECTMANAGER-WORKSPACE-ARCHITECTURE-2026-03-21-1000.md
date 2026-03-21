# ZPROJECTMANAGER — WORKSPACE ARCHITECTURE
**Date:** 2026-03-21 | **Time:** 10:00 IST
**מסמך:** אסטרטגיה לפני Sprint 10

---

## 3 סוגי Workspace

```
┌─────────────────────────────────────────────────────────┐
│  MINE                                                    │
│  הפרויקטים שלי בלבד                                     │
│  29 פרויקטים, כל ה-context, כל ה-credentials            │
│  גישה מלאה לכל                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CLIENT                                                  │
│  פרויקטים שאני עושה עבור לקוח                           │
│  הלקוח רואה רק את הפרויקטים שלו                         │
│  אני רואה הכל                                           │
│  billing נפרד per client                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  PARTNERSHIP                                             │
│  פרויקטים שאני עושה עם שותף                             │
│  שניים רואים הכל                                        │
│  החלטות משותפות                                         │
│  tasks מחולקים                                          │
└─────────────────────────────────────────────────────────┘
```

---

## מה זה אומר ב-DB

### טבלת workspaces:
```sql
CREATE TABLE workspaces (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,                    -- "שלי" / "לקוח: אבי" / "שותפות: דביר"
  type TEXT NOT NULL CHECK(type IN ('mine', 'client', 'partnership')),
  color TEXT DEFAULT '#22c55e',          -- צבע לזיהוי ויזואלי מהיר
  emoji TEXT DEFAULT '🏢',
  client_name TEXT,                      -- אם type='client'
  partner_name TEXT,                     -- אם type='partnership'
  billing_rate INTEGER,                  -- ₪ per hour (אם client)
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- כל פרויקט שייך ל-workspace
ALTER TABLE projects ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id);
```

### Seed data:
```sql
INSERT INTO workspaces (id, name, type, color, emoji) VALUES
  (1, 'שלי', 'mine', '#22c55e', '🏠'),
  (2, 'לקוחות', 'client', '#3b82f6', '💼'),
  (3, 'שותפויות', 'partnership', '#f59e0b', '🤝');
```

---

## מה זה משנה ב-UI

### Sidebar — workspace switcher בראש:
```
🏠 שלי (23 projects)
💼 לקוחות (4 projects)  
🤝 שותפויות (2 projects)
─────────────────
+ Add workspace
```

### כל מקום שמראה פרויקטים — מסונן לפי workspace נוכחי.

### Portfolio page — workspace tabs בראש:
```
[🏠 שלי] [💼 לקוחות] [🤝 שותפויות] [כולם]
```

### Dashboard — מראה רק workspace פעיל.

---

## מה שונה per workspace type

### MINE (שלי)
- גישה מלאה לכל
- כל הCredentials מוצגים
- כל הprompts זמינים
- Revenue tracking אישי

### CLIENT (לקוח)
- Hours tracking — כמה שעות עבדתי על הלקוח הזה
- Billing summary — ₪ שהרוויחתי ממנו
- Client notes — מה הלקוח רוצה, העדפות
- Deliverables tracking — מה הבטחתי, מה סיפקתי
- לא מראה credentials אישיים
- GPROMPT מותאם: "פרויקט לקוח — הלקוח לא רוצה לשלם על ניסויים, בנה נכון בפעם הראשונה"

### PARTNERSHIP (שותפות)
- Shared tasks — tasks מסומנים "שלי" / "של השותף"
- Decision log — מי החליט מה
- Equity/split tracking (אם רלוונטי)
- GPROMPT מותאם: "פרויקט שותפות — כל שינוי ארכיטקטורלי דורש אישור משני הצדדים"

---

## Morning Briefing — per workspace

כשפותחים ZProjectManager בבוקר:

```
🌅 בוקר טוב, רויא — 09:00 IST

🏠 שלי (23 projects)
  🔴 9Soccer CI failing — fix now
  🟡 Wingman: 2 open PRs
  🟢 PostPilot: deployed ✅

💼 לקוחות (4 projects)
  ⏰ VenueKit: לקוח: Tzach — ממתין לPayplus keys (3 ימים)
  📋 Analyzer: 2 deliverables due this week

🤝 שותפויות (2 projects)
  💬 Heroes-Hadera: שותף השאיר comment ב-task
```

---

## Revenue — per workspace

**שלי:**
```
MRR Portfolio: ₪X
הכי קרוב לrevenue: VenueKit
```

**לקוחות:**
```
Client: Tzach — 14h worked — ₪2,800 billed
Client: Daniel — 8h worked — ₪1,600 billed
Total receivable: ₪4,400
```

**שותפויות:**
```
Heroes-Hadera — split 50/50
Revenue to date: ₪0
My share: ₪0
```

---

## GPROMPT per workspace type

כל GPROMPT שנוצר מתווסף לו block:

**Client project:**
```
## WORKSPACE: CLIENT — Tzach
- This is client work — build correctly the first time
- No experimental features without client approval
- Track time: log hours after this session
- Deliverable: [what was promised]
- Client preference: [notes]
```

**Partnership project:**
```
## WORKSPACE: PARTNERSHIP — with [partner]
- Architectural changes require both partners to approve
- Add partner as reviewer on all major decisions
- Document decisions in Decision log
- Tasks split: mine = [X], partner = [Y]
```

---

## Sprint 10 — מה לבנות

### AGENT 1 — DB migration
- טבלת workspaces
- ALTER TABLE projects ADD COLUMN workspace_id
- Seed: 3 workspaces ברירת מחדל
- Migration all existing projects → workspace 1 (mine)

### AGENT 2 — Workspace switcher UI
- Sidebar: workspace list עם badge count
- Click → switch active workspace → כל views מתעדכנים
- "+ Add workspace" modal (name, type, color, emoji)
- Active workspace stored in app_settings

### AGENT 3 — Portfolio + Dashboard — workspace filter
- Portfolio: tabs per workspace
- Dashboard: filter by active workspace
- Project cards: colored dot = workspace color

### AGENT 4 — Client workspace features
- Hours tracking widget בProjectDetail
- Billing summary בRevenuePage per client
- Deliverables tab בProjectDetail

### AGENT 5 — Partnership features
- "Assigned to" field על tasks (me / partner / both)
- Partnership notes בProjectDetail
- Decision log aware of partnership context

### AGENT 6 — GPROMPT workspace injection
- בgenerateMegaPrompt: בדוק workspace type → הוסף block מתאים
- Client → add client context block
- Partnership → add partnership rules block

### AGENT 7 — Morning Briefing
- Component: `MorningBriefing.tsx`
- מראה: per workspace — CI status, open PRs, pending tasks
- Auto-shows on app open if last open > 4 hours ago
- Dismissable, stores dismiss time in app_settings
