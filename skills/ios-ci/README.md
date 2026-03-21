# iOS CI/CD Skill — TestFlight Distribution
# Source: 9Soccer VAMOS 97-116 (hard-won over ~20 sprints)
# Last updated: 2026-03-21

---

## THE PATTERN: Two Separate Workflow Files

ios-testflight.yml  →  builds IPA + uploads to ASC
ios-distribute.yml  →  triggered by workflow_run, polls ASC, adds to TestFlight groups

WHY TWO FILES: If both are in one file, GitHub's cancel-in-progress kills the
40-minute distribute poll every time a new push arrives. A separate workflow_run-
triggered file is completely immune to build cancellations.

---

## THE 8-POINT CHECKLIST (all required):

1. python3 -m venv before pip
   → macOS 15 enforces PEP 668 (no global pip installs)
   → python3 -m venv /tmp/venv && /tmp/venv/bin/pip install "PyJWT[crypto]" requests

2. PyJWT[crypto] not bare PyJWT
   → ES256 algorithm requires cryptography package
   → bare PyJWT raises NotImplementedError on jwt.encode(..., algorithm="ES256")

3. No cancel-in-progress on distribute workflow
   → distribute polls ASC for up to 45 min — must not be cancelled
   → ios-testflight.yml CAN have cancel-in-progress: true
   → ios-distribute.yml must have NO concurrency group

4. Separate ios-distribute.yml via workflow_run
   → on: workflow_run: workflows: ["iOS TestFlight"] types: [completed]
   → if: ${{ github.event.workflow_run.conclusion == 'success' }}

5. /v1/builds?filter[app]= endpoint (NOT /v1/apps/{id}/builds)
   → /v1/apps/{id}/builds is a RELATIONSHIP endpoint
   → Relationship endpoints ignore sort/filter query params → 400 PARAMETER_ERROR
   → Correct: GET /v1/builds?filter[app]={APP_ID}&sort=-uploadedDate&limit=5

6. No filter[processingState]=VALID
   → Deprecated in ASC API v1 since ~2025 → 400 PARAMETER_ERROR
   → Correct: fetch all recent builds, check processingState attribute in response

7. Verify Bundle ID from ASC before first build
   → Never assume bundle ID from existing code
   → Extract from IPA: unzip app.ipa && grep -r CFBundleIdentifier
   → Must match EXACTLY what's in ASC App Information page

8. Apple ID from ASC App Information page (not assumed)
   → Apple ID is the NUMERIC app identifier (e.g. 6760544822)
   → Check: ASC → My Apps → app → App Information → Apple ID field
   → 9Soccer had wrong Apple ID (6760251165 vs 6760544822) for months

---

## REQUIRED GITHUB SECRETS:
- ASC_API_KEY_ID          → ASC → Users → Integrations → Keys
- ASC_API_KEY_ISSUER_ID   → same location
- ASC_API_KEY_P8          → .p8 file CONTENTS (text, not base64)
- DISTRIBUTION_CERT_P12   → base64 encoded .p12 distribution certificate
- DISTRIBUTION_P12_PASSWORD
- PROVISIONING_PROFILE    → base64 encoded .mobileprovision file

---

## CORRECT ASC API POLLING (Python):
```python
import jwt, time, requests

def make_token(key_id, issuer_id, private_key):
    return jwt.encode(
        {"iss": issuer_id, "iat": int(time.time()),
         "exp": int(time.time()) + 1200, "aud": "appstoreconnect-v1"},
        private_key, algorithm="ES256", headers={"kid": key_id}
    )

# Poll for VALID build (up to 45 attempts × 60s = 45 min):
build_id = None
for attempt in range(45):
    time.sleep(60)
    r = requests.get(
        "https://api.appstoreconnect.apple.com/v1/builds",
        headers={"Authorization": f"Bearer {make_token(...)}"},
        params={"filter[app]": APP_ID, "sort": "-uploadedDate", "limit": 5}
    )
    if r.status_code == 200:
        for build in r.json().get("data", []):
            state = build["attributes"]["processingState"]
            if state == "VALID":
                build_id = build["id"]
                break
    if build_id:
        break

# Add to beta group:
requests.post(
    f"https://api.appstoreconnect.apple.com/v1/betaGroups/{group_id}/relationships/builds",
    headers={"Authorization": f"Bearer {make_token(...)}"},
    json={"data": [{"type": "builds", "id": build_id}]}
)
```

---

## BUILD NUMBER STRATEGY:
```bash
# Auto-increment from GitHub run number (guarantees unique builds)
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${{ github.run_number }}" \
  ios/App/App/Info.plist
```

---

## TEMPLATE FILES:
- ios-testflight.template.yml  (this directory)
- ios-distribute.template.yml  (this directory)
