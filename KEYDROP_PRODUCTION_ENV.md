# KEYDROP PRODUCTION ENVIRONMENT VARIABLES
**Updated:** 2026-03-09

---

## Complete List (11 variables)

Copy-paste this block into Railway. Replace placeholder values.

```env
# Database — Neon Postgres connection string
DATABASE_URL=postgresql://neondb_owner:XXXXXX@ep-XXXXX.us-east-2.aws.neon.tech/neondb?sslmode=require

# Encryption — 32-byte hex key for AES-256-GCM
# Generate: openssl rand -hex 32
ENCRYPTION_MASTER_KEY=PASTE_64_CHAR_HEX_HERE

# JWT Auth — two separate secrets
# Generate each: openssl rand -hex 32
JWT_SECRET=PASTE_64_CHAR_HEX_HERE
JWT_REFRESH_SECRET=PASTE_64_CHAR_HEX_HERE

# App URL — your production domain (NO trailing slash)
NEXT_PUBLIC_APP_URL=https://keydrop-production.up.railway.app

# LemonSqueezy billing
LEMONSQUEEZY_API_KEY=PASTE_FROM_LS_DASHBOARD
LEMONSQUEEZY_STORE_ID=309460
LEMONSQUEEZY_STORE_SLUG=ftable
LEMONSQUEEZY_WEBHOOK_SECRET=GENERATE_NEW_FOR_PRODUCTION
LEMONSQUEEZY_PRO_VARIANT_ID=1377967
LEMONSQUEEZY_TEAM_VARIANT_ID=1377974
```

---

## How to Generate Secrets

Run each of these in your terminal:

```bash
# Encryption master key
openssl rand -hex 32

# JWT secret
openssl rand -hex 32

# JWT refresh secret
openssl rand -hex 32
```

**IMPORTANT:** Use different values for each. Never reuse dev secrets in production.

---

## Where Each Value Comes From

| Variable | Source |
|----------|--------|
| DATABASE_URL | Neon dashboard → Connection Details → Connection string |
| ENCRYPTION_MASTER_KEY | You generate (`openssl rand -hex 32`) |
| JWT_SECRET | You generate |
| JWT_REFRESH_SECRET | You generate |
| NEXT_PUBLIC_APP_URL | Railway dashboard → your app's domain |
| LEMONSQUEEZY_API_KEY | https://app.lemonsqueezy.com/settings/api |
| LEMONSQUEEZY_STORE_ID | Already known: 309460 |
| LEMONSQUEEZY_STORE_SLUG | Already known: ftable |
| LEMONSQUEEZY_WEBHOOK_SECRET | LS dashboard → Webhooks → create webhook → signing secret |
| LEMONSQUEEZY_PRO_VARIANT_ID | Already known: 1377967 |
| LEMONSQUEEZY_TEAM_VARIANT_ID | Already known: 1377974 |
