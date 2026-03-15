# Apple iOS CI/CD — Complete Guide

## Credentials needed per project

| # | Secret Name | Where to get | Notes |
|---|------------|--------------|-------|
| 1 | `DISTRIBUTION_P12_BASE64` | Generate locally (see below) | Base64 of .p12 file |
| 2 | `DISTRIBUTION_P12_PASSWORD` | Set during .p12 export | Password string |
| 3 | `PROVISIONING_PROFILE_BASE64` | Apple Developer Portal → Profiles | Must match cert + bundle ID |
| 4 | `ASC_API_KEY_P8` | App Store Connect → API Keys | Base64 of .p8 file, **Admin** role required |
| 5 | `ASC_API_KEY_ID` | Shown in API keys table | 10-char alphanumeric |
| 6 | `ASC_API_KEY_ISSUER_ID` | Top of API keys page | Same for all projects |
| 7 | `APPLE_TEAM_ID` | Apple Developer account | Same for all projects |

## Account-wide constants (Roye Arguan)

```
Team ID:    3K9KJNGL9U
Issuer ID:  686f97b8-3f8a-40b7-a6cd-5293a3168439
```

## Active API keys

| Key ID | Role | Project | Has .p8? |
|--------|------|---------|----------|
| 45FCPV43JD | Admin | 9Soccer CI | Yes (Downloads) |
| WTWALQMG5N | ? | Wingman (revoked?) | Yes (Projects) |
| C6FNC872FS | App Manager | EAS Submit | Yes (Downloads) |

## One-shot setup per project

```bash
bash scripts/setup-testflight.sh KEY_ID ISSUER_ID ~/Downloads/AuthKey_KEY_ID.p8
```

## Generate new cert + .p12 from scratch (Windows/Git Bash)

```bash
cd project/certs

# 1. Generate private key
openssl genrsa -out distribution.key 2048

# 2. Generate CSR
MSYS_NO_PATHCONV=1 openssl req -new -key distribution.key \
  -out distribution.csr \
  -subj "/CN=Apple Distribution/C=IL/emailAddress=royearguan@gmail.com"

# 3. Upload CSR to Apple Developer Portal
#    → Certificates → + → Apple Distribution → upload .csr → download .cer

# 4. Convert .cer to PEM
openssl x509 -inform DER -in distribution.cer -out distribution.pem

# 5. Create .p12
openssl pkcs12 -export \
  -in distribution.pem \
  -inkey distribution.key \
  -out distribution.p12 \
  -passout pass:YOUR_PASSWORD \
  -name "ProjectName Distribution"

# 6. Verify
openssl pkcs12 -in distribution.p12 -passin pass:YOUR_PASSWORD -nokeys | \
  openssl x509 -noout -fingerprint -subject
```

## Create provisioning profile

1. https://developer.apple.com/account/resources/profiles/add
2. Select **App Store Connect** (Distribution)
3. Select your **bundle ID** (e.g., `com.ftable.ninesoccer`)
4. Select the **Apple Distribution** certificate that matches your .p12
5. Name it, Generate, Download

**CRITICAL**: The certificate in the profile MUST match the .p12. Verify:
```bash
# Profile cert fingerprint
python -c "
import plistlib, subprocess, tempfile, os
with open('profile.mobileprovision', 'rb') as f: data = f.read()
start, end = data.find(b'<?xml'), data.find(b'</plist>') + len(b'</plist>')
pl = plistlib.loads(data[start:end])
for c in pl.get('DeveloperCertificates', []):
    with tempfile.NamedTemporaryFile(suffix='.cer', delete=False) as f:
        f.write(bytes(c)); tmp = f.name
    r = subprocess.run(['openssl','x509','-inform','DER','-in',tmp,'-noout','-fingerprint'], capture_output=True, text=True)
    print(r.stdout.strip()); os.unlink(tmp)
"

# P12 cert fingerprint (must match above)
openssl x509 -inform DER -in certs/distribution.cer -noout -fingerprint
```

## Set GitHub secrets

```bash
REPO="owner/repo"

# Certificate
cat certs/distribution.p12 | base64 -w 0 | gh secret set DISTRIBUTION_P12_BASE64 --repo $REPO --body -
gh secret set DISTRIBUTION_P12_PASSWORD --repo $REPO --body "YOUR_PASSWORD"

# Provisioning profile
cat profile.mobileprovision | base64 -w 0 | gh secret set PROVISIONING_PROFILE_BASE64 --repo $REPO --body -

# API key (MUST be Admin role)
cat AuthKey_XXXX.p8 | base64 -w 0 | gh secret set ASC_API_KEY_P8 --repo $REPO --body -
gh secret set ASC_API_KEY_ID --repo $REPO --body "KEY_ID"
gh secret set ASC_API_KEY_ISSUER_ID --repo $REPO --body "686f97b8-3f8a-40b7-a6cd-5293a3168439"
gh secret set APPLE_TEAM_ID --repo $REPO --body "3K9KJNGL9U"
```

## Common errors + fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Provisioning profile doesn't include signing certificate` | Cert in profile != cert in .p12 | Recreate profile with matching cert, verify fingerprints |
| `Error Downloading App Information` | API key revoked or wrong role | Create new Admin key in App Store Connect |
| `invalidPEMDocument` | .p8 corrupted during base64 | Re-set: `cat .p8 \| base64 -w 0 \| gh secret set` |
| `Profile size: 0 bytes` | Secret set incorrectly | Re-set with explicit `--body "$B64"` not pipe |
| `ASN1 header too long` | .p12 corrupted during base64 | Same as above |
| `401 NOT_AUTHORIZED` on API | Key revoked or Issuer ID wrong | Check key status in App Store Connect |
| `App ID not found` | Bundle ID not registered | Register at developer.apple.com/account/resources/identifiers |

## Lessons learned (9Soccer, March 2026)

1. Apple only allows ONE active Apple Distribution cert — creating new one revokes old
2. `gh secret set --body -` via pipe can silently fail — use `--body "$VAR"` instead
3. API keys need **Admin** role, not App Manager, for TestFlight upload
4. `MSYS_NO_PATHCONV=1` required for openssl on Git Bash (Windows)
5. Workflow `echo -n "$SECRET" | base64 --decode` means secret must contain base64
6. Always verify cert fingerprints match before triggering build
7. `.p8` files can only be downloaded ONCE from App Store Connect
