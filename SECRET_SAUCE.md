# SecretSauce — ZProjectManager

Security audit checklist: **keep sensitive logic server-side**. See **docs/SECRET_SAUCE_CHECKLIST.md** in this repo for the full checklist used across all projects.

## This app (ZPM)

- **Electron main process** — DB path, app path, file system access. No API keys; optional TokenWise integration reads local files only.
- **Renderer** — no secrets; all data from main via IPC. Ensure no `process.env` or secrets in renderer bundle.
- **Seed data** — SEED_DATA.sql has no secrets; repo paths and project names are non-sensitive.

## Before release

- Use **docs/SECRET_SAUCE_CHECKLIST.md** for any new features (e.g. if you add cloud sync or API keys).
