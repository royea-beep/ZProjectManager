# KEYDROP RAILWAY SETUP
**Updated:** 2026-03-09

---

## Prerequisites

- Railway account (https://railway.com)
- Railway CLI installed: `npm install -g @railway/cli`
- GitHub repo with KeyDrop code pushed
- Neon Postgres connection string ready

---

## Steps

### 1. Push Code to GitHub

```bash
cd C:/Projects/KeyDrop
git push origin master
```

### 2. Create Railway Project (Web UI — recommended)

1. Go to https://railway.com/new
2. Click **Deploy from GitHub repo**
3. Select `royea-beep/KeyDrop`
4. Railway will auto-detect Next.js

### 3. Add Environment Variables

In Railway dashboard → your service → **Variables** tab:

Add ALL 11 variables from KEYDROP_PRODUCTION_ENV.md.

**Quick method — paste as raw:**
```
DATABASE_URL=postgresql://...
ENCRYPTION_MASTER_KEY=your-64-char-hex
JWT_SECRET=your-64-char-hex
JWT_REFRESH_SECRET=your-64-char-hex
NEXT_PUBLIC_APP_URL=https://keydrop-production.up.railway.app
LEMONSQUEEZY_API_KEY=your-ls-api-key
LEMONSQUEEZY_STORE_ID=309460
LEMONSQUEEZY_STORE_SLUG=ftable
LEMONSQUEEZY_WEBHOOK_SECRET=your-new-webhook-secret
LEMONSQUEEZY_PRO_VARIANT_ID=1377967
LEMONSQUEEZY_TEAM_VARIANT_ID=1377974
```

### 4. Configure Build Settings

In Railway dashboard → your service → **Settings**:

- **Build command:** `npm run build` (auto-detected)
- **Start command:** `npm start` (auto-detected)
- **Install command:** `npm install` (auto-detected — will trigger postinstall → prisma generate)

### 5. Generate Domain

In Railway dashboard → your service → **Networking**:

1. Click **Generate Domain**
2. You'll get something like: `keydrop-production.up.railway.app`
3. **IMPORTANT:** Go back to Variables and update `NEXT_PUBLIC_APP_URL` to match this domain exactly (with https://)

### 6. Deploy

Railway auto-deploys when you push to the linked branch. If it didn't start:
1. Click **Deploy** in the dashboard
2. Watch the build logs

### 7. Run Migrations

After the first successful deploy:

```bash
# Login to Railway CLI
railway login

# Link to your project
railway link

# Run migrations against production DB
railway run npx prisma migrate deploy
```

### 8. Verify Deployment

1. Open `https://keydrop-production.up.railway.app` in browser
2. Landing page should load with "Stop getting API keys over WhatsApp"
3. Click "Sign In" → login page should load
4. Try registering a new account

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails: "prisma generate" | Check that `prisma` is in devDependencies |
| Build fails: missing module | Check that vendor/*.tgz files are committed |
| Runtime: "DATABASE_URL" error | Verify Neon connection string is correct |
| Runtime: "ENCRYPTION_MASTER_KEY" error | Must be exactly 64 hex chars |
| 502 Bad Gateway | Check Railway deploy logs for crash reason |
| Webhook not firing | Check KEYDROP_WEBHOOK_SETUP.md |

---

## Railway CLI Alternative

If you prefer CLI over web UI:

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Init project
cd C:/Projects/KeyDrop
railway init

# Add env vars
railway variables set DATABASE_URL="postgresql://..."
railway variables set ENCRYPTION_MASTER_KEY="$(openssl rand -hex 32)"
railway variables set JWT_SECRET="$(openssl rand -hex 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
railway variables set NEXT_PUBLIC_APP_URL="https://your-domain.up.railway.app"
railway variables set LEMONSQUEEZY_API_KEY="your-key"
railway variables set LEMONSQUEEZY_STORE_ID="309460"
railway variables set LEMONSQUEEZY_STORE_SLUG="ftable"
railway variables set LEMONSQUEEZY_WEBHOOK_SECRET="your-new-secret"
railway variables set LEMONSQUEEZY_PRO_VARIANT_ID="1377967"
railway variables set LEMONSQUEEZY_TEAM_VARIANT_ID="1377974"

# Deploy
railway up

# Run migrations
railway run npx prisma migrate deploy

# Get domain
railway domain
```
