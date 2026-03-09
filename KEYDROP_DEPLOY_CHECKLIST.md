# KEYDROP DEPLOY CHECKLIST
**Updated:** 2026-03-09

---

## Pre-Deploy

- [x] TypeScript clean (`npx tsc --noEmit`)
- [x] Brand consistent ("KeyDrop" everywhere)
- [x] Legal pages live (/terms, /privacy)
- [x] Billing integration working (LemonSqueezy)
- [x] .env NOT in git
- [x] .env.example has all vars documented
- [x] README replaced with real docs
- [x] All changes committed (434644f)

## Infrastructure Setup

- [ ] **Neon Postgres** — Create project, get connection string
- [ ] **Railway** — Create project, link GitHub repo
- [ ] **Environment vars** — Set ALL of these on Railway:

| Variable | Source | Notes |
|----------|--------|-------|
| DATABASE_URL | Neon dashboard | postgres://... connection string |
| ENCRYPTION_MASTER_KEY | `openssl rand -hex 32` | GENERATE NEW for prod |
| JWT_SECRET | `openssl rand -hex 32` | GENERATE NEW for prod |
| JWT_REFRESH_SECRET | `openssl rand -hex 32` | GENERATE NEW for prod |
| NEXT_PUBLIC_APP_URL | Railway domain | e.g. https://keydrop-production.up.railway.app |
| LEMONSQUEEZY_API_KEY | LS dashboard | API Keys page |
| LEMONSQUEEZY_STORE_ID | LS dashboard | 309460 |
| LEMONSQUEEZY_STORE_SLUG | LS dashboard | ftable |
| LEMONSQUEEZY_WEBHOOK_SECRET | LS dashboard | GENERATE NEW for prod |
| LEMONSQUEEZY_PRO_VARIANT_ID | LS dashboard | 1377967 |
| LEMONSQUEEZY_TEAM_VARIANT_ID | LS dashboard | 1377974 |

## Deploy

- [ ] `railway up` or push to linked GitHub branch
- [ ] Run `railway run npx prisma migrate deploy`
- [ ] Verify landing page loads on production URL
- [ ] Verify /login and /register work

## Post-Deploy Verification

- [ ] Register test account
- [ ] Create credential request
- [ ] Open share link in incognito
- [ ] Submit test credentials
- [ ] Verify credentials appear in dashboard
- [ ] Revoke request, verify link dies
- [ ] Test billing checkout (LemonSqueezy test mode)
- [ ] Verify webhook fires and plan updates
- [ ] Check /terms and /privacy load correctly

## Launch (only after all above pass)

- [ ] Switch LemonSqueezy to live mode
- [ ] Post to Product Hunt (see KEYDROP_LAUNCH_COPY.md)
- [ ] Post to Dev.to, HN, Reddit, Twitter
