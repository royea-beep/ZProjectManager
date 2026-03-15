# SECURITY VERIFICATION CHECKLIST
**Date:** 2026-03-09 | **Post-Execution Verification**

---

## AUTOMATED FIXES — VERIFIED

- [x] **chicle:** `product-analyzer.html` no longer contains `chicle2026` (commit `8c88908`)
- [x] **ftable-hands:** `client_secret*.json` untracked from git (commit `e4a83db`)
- [x] **ftable-hands:** `.gitignore` now covers `client_secret*.json` and `drive_client_secret*.json`
- [x] **Wingman:** `apps/mobile/.gitignore` now covers bare `.env` (commit `9296560`)
- [x] **CURSOR_MEGA_PROMPT.md:** Backed up to `C:\Users\royea\Documents\private-notes\`
- [x] **9soccer:** Confirmed CLEAN — all signing creds properly gitignored, never committed

## MANUAL ACTIONS — PENDING USER

- [ ] **M1:** Rotate chicle Anthropic API key at console.anthropic.com
- [ ] **M2:** Change chicle admin password from `chicle2026` to strong replacement
- [ ] **M3:** Rotate KeyDrop LemonSqueezy webhook secret
- [ ] **M4:** Rotate PostPilot LemonSqueezy webhook secret
- [ ] **M5:** Delete `C:\Projects\CURSOR_MEGA_PROMPT.md` (backup exists at private-notes)
- [ ] **M6:** Delete `C:\Projects\Wingman\apps\api\ProjectsWingmanappsapi.env` (accidental env dump)
- [ ] **M7:** (Optional) Rotate ftable-hands Google OAuth client secrets before pushing to any remote

## HISTORY REWRITE — CONDITIONAL

- [ ] **ftable-hands:** Run `git filter-repo` BEFORE adding any remote. Not urgent (no remote exists).

## REPO SECURITY STATUS AFTER FIXES

| Repo | Secrets in HEAD? | Secrets in History? | .gitignore Covers Secrets? | Remote Exposure? |
|------|-----------------|--------------------|-----------------------------|-----------------|
| chicle | NO (config.php gitignored) | NO | YES | NO |
| ftable-hands | NO (untracked) | YES (local only) | YES (updated) | NO (no remote) |
| Wingman | NO | NO | YES (hardened) | NO |
| 9soccer | NO | NO | YES | NO |
| CURSOR_MEGA_PROMPT.md | N/A (not in git) | N/A | N/A | NO |
