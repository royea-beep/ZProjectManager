# ASC API Skill
# Source: 9Soccer VAMOS 112-116
# Last updated: 2026-03-21

## Critical Lessons (learned the hard way):

### 1. Two completely different endpoint families:
RELATIONSHIP:   GET /v1/apps/{APP_ID}/builds
  → Returns data but IGNORES all sort/filter params
  → Adding ?sort=... returns 400 PARAMETER_ERROR.ILLEGAL
  → DO NOT USE for querying/filtering

MAIN ENDPOINT:  GET /v1/builds?filter[app]={APP_ID}&sort=-uploadedDate&limit=5
  → Full query support
  → USE THIS for polling latest builds

### 2. Deprecated filter (since ~2025):
filter[processingState]=VALID → 400 PARAMETER_ERROR.ILLEGAL
Fix: fetch all recent builds, check processingState attribute in response body

### 3. JWT requires PyJWT[crypto]:
```python
# pip install "PyJWT[crypto]"  ← [crypto] REQUIRED for ES256
# Always in venv on macOS 15+

import jwt, time
token = jwt.encode(
    {"iss": issuer_id, "iat": int(time.time()),
     "exp": int(time.time()) + 1200, "aud": "appstoreconnect-v1"},
    private_key_p8_text,  # text contents, not file path
    algorithm="ES256",
    headers={"kid": key_id}
)
```

### 4. Always verify Apple ID from ASC UI:
Apple ID = numeric app identifier from ASC → App Information page
Never assume from existing code — 9Soccer had wrong ID for months.

## Template:
query-asc.template.js (this directory) — queries bundle ID + IAP + builds
