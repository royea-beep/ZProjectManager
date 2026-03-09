# KEYDROP LAUNCH CHECKLIST
**Updated:** 2026-03-09 | **Target:** Product Hunt launch

---

## DONE (this session)

- [x] `.env.example` completed with all LemonSqueezy vars (commit 185ec09)
- [x] Terms of Service page created at `/terms` (commit d7f5cf6)
- [x] Privacy Policy page created at `/privacy` (commit d7f5cf6)
- [x] Footer links added for Terms + Privacy (commit d7f5cf6)
- [x] Social proof placeholder replaced with trust signal stats (commit d7f5cf6)
- [x] Team plan: removed "(soon)" feature promises (commit d7f5cf6)
- [x] `.env` NOT in git (confirmed — .gitignore has `.env*`)
- [x] TypeScript clean (`npx tsc --noEmit` passes)

---

## YOU MUST DO (manual steps before launch)

### 1. Stripe → LemonSqueezy Naming (1 hour)
- [ ] Rename `src/app/api/stripe/` directory to `src/app/api/billing/`
- [ ] Update Prisma schema: `stripeCustomerId` → `billingCustomerId`
- [ ] Update Prisma schema: `stripeSubscriptionId` → `billingSubscriptionId`
- [ ] Run `npx prisma migrate dev --name rename-billing-fields`
- [ ] Update all code references (billing page, webhook, portal)
- [ ] Update LAUNCH_CHECKLIST.md webhook URL

### 2. Deploy to Production (1 hour)
- [ ] Provision Neon Postgres database
- [ ] Set all env vars on deployment platform (Vercel or Railway):
  - `DATABASE_URL` (Neon connection string)
  - `ENCRYPTION_MASTER_KEY` (generate: `openssl rand -hex 32`)
  - `JWT_SECRET` (generate: `openssl rand -hex 32`)
  - `JWT_REFRESH_SECRET` (generate: `openssl rand -hex 32`)
  - `NEXT_PUBLIC_APP_URL` (production domain)
  - All `LEMONSQUEEZY_*` vars from your local .env
- [ ] Deploy and run Prisma migrations
- [ ] Verify landing page loads on production URL

### 3. Test Billing End-to-End (30 min)
- [ ] Register a test account
- [ ] Click "Upgrade to Pro" → complete LemonSqueezy checkout (test mode)
- [ ] Verify webhook fires and plan updates
- [ ] Verify usage counter resets correctly
- [ ] Test "Manage Subscription" portal link

### 4. Test Core Flow End-to-End (30 min)
- [ ] Create a credential request (use Stripe template)
- [ ] Copy the shareable link
- [ ] Open link in incognito browser
- [ ] Submit credentials as client
- [ ] Verify credentials appear in dashboard (decrypted)
- [ ] Revoke the request
- [ ] Verify link no longer works

### 5. Product Hunt Submission (2 hours)
- [ ] Take 3-4 screenshots (landing, dashboard, request form, client submission)
- [ ] Create 30-second demo GIF showing the flow
- [ ] Write PH tagline: "Stop getting API keys over WhatsApp"
- [ ] Write PH description (see KEYDROP_GO_TO_MARKET.md)
- [ ] Schedule launch for Tuesday or Wednesday (best PH days)
- [ ] Post in dev communities: HN, Reddit r/webdev, Dev.to, Twitter/X

---

## NICE TO HAVE (post-launch)

- [ ] Email notification when client submits credentials
- [ ] Custom domain (keydrop.dev or similar)
- [ ] Sentry error tracking
- [ ] Basic analytics (Plausible or Vercel Analytics)
- [ ] API documentation for Pro/Team users
- [ ] Favicon and social preview image (og:image)
