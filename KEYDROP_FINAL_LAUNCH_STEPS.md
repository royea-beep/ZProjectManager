# KEYDROP FINAL LAUNCH STEPS
**Updated:** 2026-03-09

---

## Pre-Launch (you do these)

### 1. Push to GitHub
```bash
cd C:/Projects/KeyDrop
git push origin master
```

### 2. Deploy to Railway
```bash
# Create Railway project (if not done)
railway init

# Link to repo
railway link

# Set environment variables
railway variables set \
  DATABASE_URL="postgres://..." \
  ENCRYPTION_MASTER_KEY="$(openssl rand -hex 32)" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  JWT_REFRESH_SECRET="$(openssl rand -hex 32)" \
  NEXT_PUBLIC_APP_URL="https://keydrop-production.up.railway.app" \
  LEMONSQUEEZY_API_KEY="your-key" \
  LEMONSQUEEZY_STORE_ID="309460" \
  LEMONSQUEEZY_STORE_SLUG="ftable" \
  LEMONSQUEEZY_WEBHOOK_SECRET="generate-new-one" \
  LEMONSQUEEZY_PRO_VARIANT_ID="1377967" \
  LEMONSQUEEZY_TEAM_VARIANT_ID="1377974"

# Deploy
railway up
```

### 3. Set up Neon Postgres
1. Go to https://neon.tech
2. Create project "keydrop"
3. Copy connection string → set as DATABASE_URL on Railway
4. Run migrations: `railway run npx prisma migrate deploy`

### 4. Configure LemonSqueezy Webhook
1. Go to https://app.lemonsqueezy.com → Settings → Webhooks
2. Add webhook URL: `https://<your-railway-domain>/api/stripe/webhook`
3. Events: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
4. Copy signing secret → set as LEMONSQUEEZY_WEBHOOK_SECRET on Railway
5. **IMPORTANT:** Generate a NEW webhook secret for production (don't reuse dev)

### 5. Test End-to-End on Production
```
1. Open production URL
2. Register a new account
3. Create a credential request (pick Stripe template)
4. Copy the shareable link
5. Open link in incognito browser
6. Submit test credentials
7. Go back to dashboard → verify credentials appear (decrypted)
8. Revoke the request
9. Verify link no longer works
10. Test billing: click Upgrade → complete LemonSqueezy checkout (test mode)
11. Verify plan updates in dashboard
```

### 6. Launch
See KEYDROP_LAUNCH_COPY.md for ready-to-post content.

---

## Post-Launch (first week)

- Monitor Railway logs for errors
- Reply to every comment on launch posts
- Track signups + upgrade conversions
- Add Sentry error tracking if error rate is high
- Consider custom domain (keydrop.dev)
