# SECRETSAUCE FINAL PUBLISH STEPS
**Updated:** 2026-03-09

---

## Pre-Publish (one-time setup)

```bash
# 1. Create GitHub repo (if not done)
gh repo create royea-beep/secret-sauce --public --source=C:/Projects/SecretSauce --push

# 2. Verify npm login
npm whoami
# If not logged in:
npm login
```

## Publish

```bash
cd C:/Projects/SecretSauce
npm publish --access public
```

The `prepublishOnly` hook runs `tsc` automatically before publish.

## Verify (immediately after publish)

```bash
# Install globally from npm
npm install -g @royea/secret-sauce

# Test CLI
secret-sauce --version      # → 1.0.0
secret-sauce --help          # → usage info
secret-sauce analyze ./src   # → scan results on any project

# Test programmatic API
node -e "import('@royea/secret-sauce').then(m => console.log(Object.keys(m)))"

# Check npm page
# https://www.npmjs.com/package/@royea/secret-sauce
```

## Post-Publish Same Day

1. Post Dev.to article (use SECRETSAUCE_LAUNCH_COPY.md as base)
2. Post Show HN
3. Post to Reddit r/webdev
4. Tweet/X thread
5. Run against 3 popular open-source projects, share findings

## Tracking

```bash
# Check download stats
npm info @royea/secret-sauce

# Weekly downloads
# https://www.npmjs.com/package/@royea/secret-sauce
```
