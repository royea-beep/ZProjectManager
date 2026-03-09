# KEYDROP LAUNCH BLOCKERS
**Updated:** 2026-03-09

---

## RESOLVED THIS SESSION

| Blocker | Status | Fix |
|---------|--------|-----|
| No Terms of Service | FIXED | Created `/terms` page (commit d7f5cf6) |
| No Privacy Policy | FIXED | Created `/privacy` page (commit d7f5cf6) |
| No legal links in footer | FIXED | Added Terms + Privacy links (commit d7f5cf6) |
| Social proof placeholder ("Your quote here") | FIXED | Replaced with trust stats section (commit d7f5cf6) |
| Team plan promises unbuilt features | FIXED | Removed "(soon)" items (commit d7f5cf6) |
| .env.example missing LS vars | FIXED | Added all LemonSqueezy vars (commit 185ec09) |

---

## REMAINING BLOCKERS (you must do)

### BLOCKER 1: Stripe → LS Naming (Confusing, not broken)
- **Severity:** HIGH (unprofessional, confuses debugging)
- **What:** `/api/stripe/webhook` handles LemonSqueezy. `stripeCustomerId` stores LS IDs.
- **Fix:** Rename directory + Prisma fields + all references
- **Effort:** 1 hour
- **Risk:** Low (just renaming, requires DB migration)

### BLOCKER 2: Production Deployment
- **Severity:** CRITICAL (product is not live)
- **What:** Needs Neon Postgres + env vars configured on Vercel/Railway
- **Fix:** See KEYDROP_LAUNCH_CHECKLIST.md
- **Effort:** 1 hour
- **Risk:** Low

### BLOCKER 3: End-to-End Testing
- **Severity:** HIGH (untested in production)
- **What:** Registration → request → share → submit → retrieve flow needs testing on production
- **Fix:** Manual testing checklist
- **Effort:** 30 minutes
- **Risk:** May reveal issues

---

## NOT BLOCKERS (common misconceptions)

| Item | Why Not Blocking |
|------|-----------------|
| No tests | MVP launch doesn't need automated tests |
| No email notifications | Nice-to-have, not blocking core flow |
| No API docs | Pro/Team feature, can add post-launch |
| No custom domain | Can launch on Vercel subdomain first |
| No team members feature | Removed from plan copy — not promised anymore |
| Stripe naming in code | Works fine, just confusing — fix post-launch if needed |
