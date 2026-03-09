# KEYDROP MANUAL ACTIONS
**Updated:** 2026-03-09

---

These are actions that require YOUR hands — accounts, secrets, deployments.

## BEFORE DEPLOY

| # | Action | How | Time |
|---|--------|-----|------|
| 1 | Push to GitHub | `cd C:/Projects/KeyDrop && git push origin master` | 1 min |
| 2 | Create Neon Postgres | https://neon.tech → New Project → "keydrop" | 5 min |
| 3 | Create Railway project | `railway init` or https://railway.com → New Project | 5 min |
| 4 | Set env vars on Railway | See KEYDROP_DEPLOY_CHECKLIST.md for full list | 10 min |
| 5 | Generate NEW secrets | `openssl rand -hex 32` for each secret | 2 min |
| 6 | Deploy | `railway up` | 5 min |
| 7 | Run migrations | `railway run npx prisma migrate deploy` | 2 min |

## AFTER DEPLOY

| # | Action | How | Time |
|---|--------|-----|------|
| 8 | Configure LS webhook | LS dashboard → Webhooks → add production URL | 5 min |
| 9 | Test full flow | Register → create request → share → submit → retrieve | 15 min |
| 10 | Test billing | Upgrade → checkout → verify plan update | 10 min |
| 11 | Switch LS to live mode | LS dashboard → toggle live mode | 2 min |

## LAUNCH DAY

| # | Action | How | Time |
|---|--------|-----|------|
| 12 | Take screenshots | Landing, dashboard, request form, client view | 15 min |
| 13 | Record demo GIF | Screen record: create → share → submit → retrieve | 15 min |
| 14 | Post Product Hunt | Use copy from KEYDROP_LAUNCH_COPY.md | 30 min |
| 15 | Post Dev.to | Use article from KEYDROP_LAUNCH_COPY.md | 15 min |
| 16 | Post HN | Use Show HN copy | 5 min |
| 17 | Post Reddit | r/webdev + r/freelance | 10 min |
| 18 | Post Twitter/X | 4-tweet thread | 10 min |

## SECURITY REMINDERS

- Generate NEW ENCRYPTION_MASTER_KEY for production (never reuse dev key)
- Generate NEW JWT_SECRET and JWT_REFRESH_SECRET for production
- Generate NEW LEMONSQUEEZY_WEBHOOK_SECRET for production
- Verify .env is NOT committed (it's not — confirmed)
- Rotate the LemonSqueezy webhook secret that was used in dev

## TOTAL ESTIMATED TIME

- Deploy setup: ~30 minutes
- Testing: ~25 minutes
- Launch assets: ~45 minutes
- Posting: ~40 minutes
- **Total: ~2.5 hours from now to live + launched**
