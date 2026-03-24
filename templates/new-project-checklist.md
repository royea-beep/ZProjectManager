# New Project Setup Checklist
## Copy this when starting any new ftable.co.il project

### Day 1 — Foundation
- [ ] Create BIBLE / design doc FIRST
- [ ] Set up Supabase project
- [ ] Set up Vercel deployment
- [ ] Set up GitHub repo with CI
- [ ] Add to cPanel DNS (API automated)
- [ ] Wire Bug Reporter V3
- [ ] Add version badge to all screens
- [ ] Create MEMORY.md + IRON_RULES.md

### Day 2 — Debug Infrastructure
- [ ] Copy AutoDebugRunner from shared-utils
- [ ] Define project-specific test steps
- [ ] Wire CrashBoundary (web) or CrashBoundary (RN)
- [ ] Create crash_reports + debug_sessions tables
- [ ] Create debug-screenshots bucket
- [ ] Wire ntfy alerts (project-name-debug-roye)
- [ ] Test: trigger crash → alert arrives with content

### Day 3 — Build Features
- [ ] Follow BIBLE — nothing invented
- [ ] Parallel agents for independent tasks
- [ ] User simulation before declaring "done"
- [ ] Responsive layout from day 1

### TestFlight (if mobile)
- [ ] Expo → EAS template (Wingman-style)
- [ ] Capacitor → xcodebuild template (9Soccer-style)
- [ ] Apple API key: WTWALQMG5N
- [ ] Daily cron or push-triggered

### Deployment
- [ ] vercel.json configured
- [ ] Environment variables set
- [ ] DNS subdomain via cPanel API
- [ ] Sentry wired
