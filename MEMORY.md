# Session memory (2026-03-08)

**Last session:** Do-next execution, PostPilot–ftable caption API, Heroes deploy, batch commits, learnings + migration.

- **Wingman:** TestFlight build 5 submitted; next: App Store Connect (Export compliance, add testers), smoke-test login ~8s. ZPM migration 5 sets Wingman next_action on startup.
- **PostPilot–ftable:** `POST /api/ftable/caption` live; set `POSTPILOT_FTABLE_API_KEY` in host, same as `POSTPILOT_API_KEY` in ftable Edge secrets for AI captions in auto-post-social.
- **Heroes-Hadera:** Deployed 57 files to https://heroes.ftable.co.il via Git Bash + ftable .env `FTP_PASS`. See DEPLOY_CHECKLIST.md.
- **Learnings:** Stored in ZPM DB via migration 6 (run on next app open). See SESSION_LOG_2026-03-08.md for full log and learnings text.
- **letsmakebillions:** Only untracked data/cache; don’t commit `private_key.pem` or state JSONs.
