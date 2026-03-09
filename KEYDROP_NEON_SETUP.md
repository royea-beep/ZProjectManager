# KEYDROP NEON POSTGRES SETUP
**Updated:** 2026-03-09

---

## Steps

### 1. Create Neon Project

1. Go to https://neon.tech
2. Sign in (or create account)
3. Click **New Project**
4. Settings:
   - **Name:** `keydrop`
   - **Region:** Pick closest to your users (us-east-2 for US, eu-central-1 for EU)
   - **Postgres version:** Latest (16+)
5. Click **Create Project**

### 2. Get Connection String

1. On the project dashboard, find **Connection Details**
2. Make sure **Connection string** tab is selected
3. Copy the full connection string. It looks like:
   ```
   postgresql://neondb_owner:XXXXXX@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. This is your `DATABASE_URL`

### 3. Run Migrations

After Railway is deployed (see KEYDROP_RAILWAY_SETUP.md):

```bash
# Option A: Via Railway CLI
railway run npx prisma migrate deploy

# Option B: Direct (if you have the connection string)
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 4. Verify

```bash
# Check that tables were created
railway run npx prisma db pull
```

You should see the users, credential_requests, credential_fields, audit_logs, etc. tables.

---

## Notes

- Neon free tier: 0.5 GB storage, 24/7 availability
- Connection pooling is built-in (no need for PgBouncer)
- Neon supports branching (useful for testing migrations later)
- The `?sslmode=require` parameter is required for Neon connections
