# SECRET HANDLING STANDARD
**Date:** 2026-03-09 | **Applies to:** All projects in C:\Projects

---

## Core Rules

1. **NEVER commit secrets to git** — API keys, passwords, tokens, signing keys, OAuth secrets, webhook secrets
2. **ALWAYS use .env files** — loaded at runtime via `dotenv` / `getenv()` / `process.env`
3. **ALWAYS provide .env.example** — committed to git with placeholder values for every required variable
4. **NEVER hardcode secrets in client-side code** — JavaScript, HTML, React components
5. **NEVER place .env in web-accessible directories** — keep above web root when possible

---

## .gitignore Standard

Every repo MUST include these patterns:

```gitignore
# ===== SECRETS =====
.env
.env.*
!.env.example
*.pem
*.p8
*.p12
*.key
*.cer
*.mobileprovision
client_secret*.json
drive_client_secret*.json
credentials.json
*_token.pickle

# ===== DATABASE =====
*.db
*.sqlite
*.sqlite3

# ===== BUILD =====
__pycache__/
*.pyc
dist/
node_modules/
.next/
out/

# ===== OS =====
.DS_Store
Thumbs.db
NUL
nul

# ===== ARCHIVES =====
*.zip
*.tar.gz
```

---

## Environment Variable Naming

```
# Service API keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Auth
JWT_SECRET=<random-256-bit-hex>
AUTH_SECRET=<random-256-bit-hex>
ADMIN_PASSWORD=<strong-password>

# Billing
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_STORE_ID=...

# External services
FIREBASE_PRIVATE_KEY=...
TWILIO_AUTH_TOKEN=...
AWS_SECRET_ACCESS_KEY=...

# Deployment
RAILWAY_TOKEN=...
VERCEL_TOKEN=...
FTP_PASSWORD=...
```

---

## Per-Stack Guidelines

### Node.js / Next.js
- Use `dotenv` or Next.js built-in `.env.local` support
- Server-only secrets: prefix with nothing (accessed via `process.env.SECRET`)
- Client-exposed values: prefix with `NEXT_PUBLIC_` (only for truly public values like Supabase anon key)

### Python / FastAPI
- Use `python-dotenv` with `load_dotenv()`
- Access via `os.getenv('SECRET_NAME')`
- NEVER use default values for production secrets: `os.getenv('SECRET')` not `os.getenv('SECRET', '')`

### PHP
- Use `.env` file outside web root
- Load via `getenv()` or a dotenv library
- Block `.env` access in `.htaccess`: `<Files ".env"> Require all denied </Files>`

### React Native / Expo
- Use `.env` with `expo-constants` or `react-native-dotenv`
- NEVER bundle real secrets in the mobile app binary

### Electron
- Store secrets in OS keychain or encrypted config
- Never embed in the renderer process

---

## Supabase Key Management

Supabase anon keys are public by design (protected by RLS), but should be centralized:

```javascript
// supabase-config.js — SINGLE SOURCE OF TRUTH
const SUPABASE_URL = 'https://xxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...';
export { SUPABASE_URL, SUPABASE_ANON_KEY };

// All other files import from here:
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';
```

**NEVER** duplicate the key in multiple files. One file, one import.

---

## Signing Credentials

- Apple (.p8, .cer, .mobileprovision): Store ONLY in CI/CD secrets (EAS Credentials, GitHub Actions)
- Google OAuth (client_secret.json): Store ONLY in .env or secure local path
- Android keystore (.jks, .keystore): Store in CI/CD secrets

---

## Pre-Push Checklist

Before pushing any repo to a remote for the first time:

1. Run `git log --all --diff-filter=A --name-only -- "*.env" "*.p8" "*.pem" "client_secret*" "*.pickle"`
2. If anything appears → run `git filter-repo` to purge before pushing
3. Verify `.gitignore` covers all secret patterns
4. Check for hardcoded secrets in source: `grep -rn "sk-ant-\|GOCSPX-\|BEGIN PRIVATE KEY" --include="*.ts" --include="*.js" --include="*.py" --include="*.php" .`

---

## Incident Response

If a secret is accidentally committed:

1. **Rotate the secret immediately** (new key from the service provider)
2. **Remove from git tracking:** `git rm --cached <file>`
3. **Add to .gitignore**
4. **If pushed to remote:** Use `git filter-repo` to purge from history, then force push
5. **If local only:** Untrack and gitignore is sufficient
6. **Document** the incident in SECURITY_EXECUTION_LOG.md
