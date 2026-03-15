# SECURITY REMEDIATION PLAN
**Date:** 2026-03-09 | **Updated:** 2026-03-09 post-audit
**Priority:** P0 — Execute Before All Other Work

---

## CRITICAL FINDINGS REGISTRY (CORRECTED AFTER DEEP AUDIT)

The original MASTER_AUDIT.md overstated several findings. Deep audits on 2026-03-09 corrected the severity:

| ID | Project | Issue | Original Severity | Corrected Severity | Status |
|----|---------|-------|-------------------|--------------------:|--------|
| SEC-01 | chicle | Anthropic API key in `config.php:13` (NOT in git, .gitignore covers it) | CRITICAL | MEDIUM | OPEN — recommend rotation |
| SEC-02 | chicle | Admin password `chicle2026` in `config.php:12` (NOT in git) | CRITICAL | MEDIUM | OPEN — recommend change |
| SEC-02b | chicle | **Admin password in `product-analyzer.html:318` (client-side JS, WEB-ACCESSIBLE)** | NOT IN ORIGINAL | **HIGH** | **FIXED** (commit 8c88908) |
| SEC-03 | chicle | AUTH_SECRET in config.php (NOT in git) | HIGH | LOW | OPEN |
| SEC-04 | ftable-hands | `client_secret.json` tracked in git (NO REMOTE) | CRITICAL | HIGH (local) | **FIXED** (commit e4a83db) |
| SEC-05 | ftable-hands | `drive_client_secret.json` — NOT tracked (on disk only) | CRITICAL | LOW | N/A |
| SEC-06 | ftable-hands | Pickle files — NOT tracked (.gitignore covers them) | HIGH | CLEAN | N/A |
| SEC-07 | Wingman | `.env` files — NEVER committed, proper .gitignore | CRITICAL | **CLEAN** | N/A |
| SEC-08 | Wingman | `.p8` key — NEVER committed, proper .gitignore | HIGH | **CLEAN** | N/A |
| SEC-09 | Wingman | Env dump file — NOT tracked, on disk only | HIGH | LOW | OPEN — recommend delete |
| SEC-10 | 9soccer | Signing creds — NEVER committed, comprehensive .gitignore | HIGH | **CLEAN** | N/A |
| SEC-11 | CURSOR_MEGA_PROMPT.md | 2 LemonSqueezy webhook secrets in plaintext on disk | MEDIUM | HIGH | BACKED UP — recommend delete + rotate |
| SEC-12 | letsmakebillions | `private_key.pem` in project root (gitignored) | MEDIUM | LOW | OPEN |
| SEC-13 | letsmakebillions | Admin API key defaults to empty string | MEDIUM | MEDIUM | OPEN |
| SEC-14 | mypoly | `setup_api.py` prints secrets to stdout | MEDIUM | MEDIUM | OPEN |
| SEC-15 | ProjectLearner | Supabase RLS allows anon INSERT/UPDATE | MEDIUM | MEDIUM | OPEN |
| SEC-16 | clubgg | No auth on financial dashboard | MEDIUM | LOW | OPEN |

---

## DO TODAY — Immediate Actions

### Action 1: Rotate chicle Anthropic API Key
```
1. Go to console.anthropic.com → API Keys
2. Revoke the key starting with sk-ant-api03-wRwmKDvZWLMaWVCI_-
3. Generate a new key
4. Create C:\Projects\chicle\.env (OUTSIDE web root or above public_html)
5. Add: ANTHROPIC_API_KEY=sk-ant-new-key-here
6. Refactor config.php to use: getenv('ANTHROPIC_API_KEY')
7. Deploy updated config.php
```

### Action 2: Change chicle Admin Password
```
1. In .env add: ADMIN_PASS=<new-strong-password>
2. Refactor config.php to use: getenv('ADMIN_PASS')
3. Consider using password_hash() for stored comparison
```

### Action 3: Replace chicle AUTH_SECRET
```
1. Generate: php -r "echo bin2hex(random_bytes(32));"
2. In .env add: AUTH_SECRET=<generated-value>
3. Refactor config.php to use: getenv('AUTH_SECRET')
```

### Action 4: Audit Wingman Git History
```bash
cd C:\Projects\Wingman
git log --all --diff-filter=A --name-only -- "*.env" "*.p8" "*api.env"
git log --all --diff-filter=A --name-only -- "apps/api/.env" "apps/mobile/.env"
git show HEAD:apps/api/.env 2>/dev/null && echo "EXPOSED" || echo "NOT IN HEAD"
```
**If secrets are confirmed committed:**
- Document ALL keys found (Firebase, Supabase, Twilio, AWS/R2, Redis, Sentry, Mixpanel)
- Rotate EVERY credential found
- Use BFG to rewrite history
- Force push (coordinate with any collaborators)

### Action 5: Revoke ftable-hands Google OAuth
```
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Find the OAuth client with secret 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
3. Delete or regenerate the client secret
4. Create new credentials
5. Store in C:\Projects\ftable-hands\.env (NOT in repo)
```

### Action 6: Remove 9soccer Signing Creds
```bash
cd C:\Projects\9soccer
echo "*.p8" >> .gitignore
echo "*.cer" >> .gitignore
echo "*.mobileprovision" >> .gitignore
git rm --cached AuthKey_WTWALQMG5N.p8 distribution.cer *.mobileprovision
# Store in CI secrets (EAS Credentials Service or GitHub Actions secrets)
```

---

## THIS WEEK — Follow-Up Actions

### Action 7: Purge ftable-hands Git History
```bash
cd C:\Projects\ftable-hands
# Option A: BFG Repo Cleaner (faster)
java -jar bfg.jar --delete-files "client_secret*.json" --delete-files "*.pickle"
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Option B: git filter-repo
pip install git-filter-repo
git filter-repo --path client_secret.json --path drive_client_secret.json \
  --path youtube_token.pickle --path drive_token.pickle --invert-paths
```

### Action 8: Create ftable-hands .gitignore
```gitignore
# Secrets
client_secret*.json
*_token.pickle
*.pickle
.env

# Python
__pycache__/
*.pyc
*.pyo
*.egg-info/

# Data
*.db
metadata/*.json
!metadata/.gitkeep

# OS
NUL
nul
.DS_Store
Thumbs.db

# Video (large files)
*.mp4
*.mkv
*.avi
```

### Action 9: Harden letsmakebillions
```python
# In config/settings.py or equivalent, change:
# ADMIN_API_KEY = os.getenv('ADMIN_API_KEY', '')
# TO:
ADMIN_API_KEY = os.getenv('ADMIN_API_KEY')
if not ADMIN_API_KEY and os.getenv('RAILWAY_ENVIRONMENT'):
    raise RuntimeError("ADMIN_API_KEY must be set in production")
```

### Action 10: Move CURSOR_MEGA_PROMPT.md
```bash
mkdir -p "C:\Users\royea\Documents\private-notes"
mv "C:\Projects\CURSOR_MEGA_PROMPT.md" "C:\Users\royea\Documents\private-notes\"
```

---

## UNIVERSAL HARDENING RULES

### Standard .gitignore Template (apply to ALL repos)
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
*_token.pickle
credentials.json

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

# ===== OS / IDE =====
.DS_Store
Thumbs.db
*.swp
NUL
nul

# ===== ARCHIVES =====
*.zip
*.tar.gz
*.rar

# ===== LOGS =====
*.log
logs/
```

### Secrets Management Policy
1. ALL secrets go in `.env` files, loaded via `dotenv` / `getenv()` / `process.env`
2. `.env.example` committed with placeholder values for every required var
3. NEVER place `.env` in web-accessible directories
4. Supabase anon keys: ONE config file per project, imported everywhere else
5. Signing credentials: CI/CD secrets ONLY (never in repo)
6. Webhook secrets: `.env` only, verify HMAC server-side
7. Pre-commit hook recommended to scan for high-entropy strings

### Recommended Pre-Commit Secret Scanner
```bash
#!/bin/bash
# .git/hooks/pre-commit
# Scan staged files for potential secrets

PATTERNS=(
  'sk-ant-'           # Anthropic
  'sk-[a-zA-Z0-9]{48}'  # OpenAI
  'GOCSPX-'           # Google OAuth
  'ghp_'              # GitHub PAT
  'glpat-'            # GitLab PAT
  'BEGIN.*PRIVATE KEY' # PEM keys
  'eyJ[a-zA-Z0-9]'    # JWT tokens (base64)
  'AKIA[A-Z0-9]{16}'  # AWS access key
)

for pattern in "${PATTERNS[@]}"; do
  if git diff --cached --diff-filter=ACM | grep -qE "$pattern"; then
    echo "BLOCKED: Potential secret detected matching pattern: $pattern"
    echo "Use .env files for secrets. See SECURITY_REMEDIATION_PLAN.md"
    exit 1
  fi
done
```

---

## VERIFICATION CHECKLIST

After completing all actions, verify:

- [ ] chicle: `config.php` contains NO hardcoded secrets
- [ ] chicle: `.env` exists with ANTHROPIC_API_KEY, ADMIN_PASS, AUTH_SECRET
- [ ] chicle: old API key is revoked at console.anthropic.com
- [ ] ftable-hands: `git log --all -- "client_secret*"` returns nothing
- [ ] ftable-hands: `.gitignore` blocks secrets, pickles, pycache
- [ ] ftable-hands: Google OAuth client secret regenerated
- [ ] Wingman: git history audited, secrets rotated if found
- [ ] 9soccer: `.p8`, `.cer`, `.mobileprovision` not tracked by git
- [ ] letsmakebillions: admin auth mandatory in production
- [ ] CURSOR_MEGA_PROMPT.md: removed from C:\Projects
- [ ] ALL repos: `.gitignore` includes secrets patterns
- [ ] Secret scanner returns clean across all 26 projects
