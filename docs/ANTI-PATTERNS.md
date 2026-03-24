# Anti-Patterns — Mistakes Made & Lessons Learned

## Building features not in the BIBLE
**What happened:** 5,574 lines of creature code built. Never in design docs.
**Fix:** Always read BIBLE before coding. If feature isn't in BIBLE → don't build.

## Saying "deployed" without testing
**What happened:** Auto-debug "worked" on all 3 projects but WhatsApp was empty.
**Fix:** End-to-end verification. Actually trigger a crash. Actually check WhatsApp.

## Debug code that crashes the app
**What happened:** react-native-view-shot import without try/catch → app crash.
**Fix:** Every debug import wrapped in try/catch. Debug tools = silent fail only.

## Hardcoded pixel values
**What happened:** Cards overflow on iPhone SE, too small on iPad.
**Fix:** responsive.ts with scale functions. Zero hardcoded values.

## Two workflows on same trigger
**What happened:** ios.yml + ios-testflight.yml both fire on push → race condition.
**Fix:** One workflow per trigger. Or: cron-only for builds.

## Suggesting monetization unprompted
**What happened:** Roye gets annoyed every time.
**Fix:** NEVER suggest App Store, payments, revenue unless explicitly asked.

## Multiple questions per message
**What happened:** Slows down the session.
**Fix:** ONE question. Or better: just decide and move.

## WhatsApp alerts without content
**What happened:** "Crash detected!" with no error, no screenshots, no steps.
**Fix:** 3 channels (WhatsApp short + ntfy backup + DB full). Content mandatory.

## In-memory evidence for native crashes
**What happened:** Dashcam buffer dies with process kill.
**Fix:** Continuous DB logging. Reconstruct from DB on relaunch.

## Asking Roye to do manual steps
**What happened:** "Go to Supabase dashboard and..."
**Fix:** API/CLI for everything. Supabase Management API, gh CLI, cPanel UAPI.
