# Session memory (2026-03-08)

**Last session:** Do-next execution, PostPilot–ftable caption API, Heroes deploy, batch commits, learnings + migration.

- **Wingman:** TestFlight build **1.0.0 (8)** submitted; Sentry mobile re-enabled. Next: App Store Connect (add testers, export compliance), smoke-test. See docs/TESTFLIGHT.md, docs/SENTRY_MOBILE.md. Delete account implemented; subscription verify is stub — see docs/SUBSCRIPTION.md.
- **90soccer:** iOS TestFlight blocked until DISTRIBUTION_P12_BASE64 is set (use certs/request.csr → Apple → .cer → scripts/build-p12-and-secret.ps1). Content pipeline: scout + questions OK; cutter fails on Windows (path). Android: `gh workflow run "Android Build"`.
- **PostPilot–ftable:** `POST /api/ftable/caption` live; set `POSTPILOT_FTABLE_API_KEY` in host, same as `POSTPILOT_API_KEY` in ftable Edge secrets for AI captions in auto-post-social.
- **Heroes-Hadera:** Deployed 57 files to https://heroes.ftable.co.il via Git Bash + ftable .env `FTP_PASS`. See DEPLOY_CHECKLIST.md.
- **Learnings:** Stored in ZPM DB via migration 6 (run on next app open). See SESSION_LOG_2026-03-08.md for full log and learnings text.
- **letsmakebillions:** Only untracked data/cache; don’t commit `private_key.pem` or state JSONs.
