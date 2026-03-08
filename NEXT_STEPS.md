# Next Steps — 20-Item List (March 2026)

## Done in ZPM (this session)

- **16) SynergyPage:** Marked Heroes ftTracker, errorHandler, Supabase upgrade, and TokenWise in ZPM as ✓ Done.
- **17) Dashboard:** Added **Stale** filter — shows projects not worked on in 14+ days.
- **18) New project form:** Repo path prefills as `C:\Projects\<name>` when you type the project name (you can still edit it).
- **19) Export report:** Project detail has a dropdown: **Export: All | Last 7 days | Last 30 days**; report respects the chosen range for sessions.
- **20) Pattern detector:** Manager-set patterns (e.g. "Database strategy for Next.js/Prisma") are preserved when re-running detection (merge, not overwrite).

## Done across projects (this session)

- **1) ftable:** pl-dashboard.html now checks `profiles.is_admin` (not just session). admin-utils.js exports `esc()` for XSS-safe output.
- **Wingman:** Analytics API accepts FlushQueue-style batch `{ events: [{ type, payload? }] }` in addition to ProjectLearner shape. Delete-account API already exists: `DELETE /me/account`.
- **letsmakebillions:** Dashboard template and app.py hardened: `portfolio` can be null; template uses `(portfolio or {}).get('positions')` and view passes a safe default.
- **ExplainIt:** Added `AuthProvider` + `useAuth()` in `src/lib/auth-context.tsx` (placeholder for future login/session).
- **clubgg:** Settlement logic in thebook_settlement.py already implements the 4 fixes (Live Chips, settlement formula, W26–W113, Expenses Area 3).

---

## Needs your input or repo access

### Project-specific (you do / you provide)

- **1) ftable** — Auth guards on admin pages: add the same pattern as Heroes-Hadera (`auth-guard.js` with `requireAuth()` + `esc()` on every admin page). *Requires ftable repo (e.g. open in Cursor).*
- **2) Heroes-Hadera** — Complete admin results entry + league points (in-repo work).
- **3) PostPilot** — Instagram OAuth: create Meta app, set env (e.g. `META_APP_ID`, `META_APP_SECRET`). [Meta for Developers](https://developers.facebook.com/apps/).
- **4) KeyDrop** — OAuth (Facebook/Google), optional AI guide; deploy: `vercel` when ready.
- **5) Wingman** — Delete-account API + real subscription verification; Tel Aviv pilot (you run/coordinate).
- **6) clubgg** — Fix 4 bugs (settlement formula, live chips, week range, expenses parser) — in-repo.
- **7) letsmakebillions** — Fix dashboard JS errors; grow settled-trade sample — in-repo.
- **8) ExplainIt** — Deploy (Railway/Render + Chromium); add user auth when needed.
- **9) ftable-hands** — YouTube appeal; keep scanning.
- **10) cryptowhale** — Small mainnet/paper test; validate whale signals.

### Cross-project

- **11) PostPilot ↔ ftable** — Connect for AI social posts (APIs + env).
- **12) Heroes-Hadera** — Deploy to cPanel (you: FTP + env on server).
- **13) FlushQueue in Wingman** — Add events queue + `POST /api/events` (copy from KeyDrop/ExplainIt).
- **14) CoinLedger in Wingman** — Or in ftable/chicle (add `@royea/coin-ledger` where virtual currency is needed).
- **15) Rate-limit** — Ensure any new public API uses a rate limiter. KeyDrop: `src/lib/rate-limit.ts` + `applyRateLimit(limiter, req)` on auth/validate/submit routes. Copy that pattern to new public endpoints.

---

## Quick reference

- **Stale filter:** Dashboard → filter bar → "Stale".
- **Export range:** Project → Export dropdown → All / Last 7 days / Last 30 days → Export Report.
- **New project repo path:** Type name → repo path auto-fills; edit if different.
- **Patterns:** Manager-set patterns are kept when "Detect patterns" runs again.
