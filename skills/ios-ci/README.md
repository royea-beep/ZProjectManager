# iOS CI/CD Skill — TestFlight Distribution
## Learned from: 9Soccer VAMOS 97-114

## THE CRITICAL PATTERN:
Split build + distribute into 2 separate workflow files.
Never use cancel-in-progress on the distribute workflow.

## Files:
- ios-testflight.yml: builds IPA, uploads to ASC
- ios-distribute.yml: triggered by workflow_run, adds to TestFlight groups

## Required GitHub Secrets:
- ASC_API_KEY_ID, ASC_API_KEY_ISSUER_ID, ASC_KEY_P8
- DISTRIBUTION_CERT_P12, DISTRIBUTION_P12_PASSWORD
- PROVISIONING_PROFILE (base64 encoded)

## Key Fixes:
1. python3 -m venv before pip (macOS 15 PEP 668)
2. PyJWT[crypto] not bare PyJWT (ES256 needs cryptography)
3. ASC API: no filter[processingState]=VALID (deprecated 2025)
4. Build number: auto from github.run_number
5. Always verify Bundle ID before first upload

## Template files:
See C:/Projects/90soccer/.github/workflows/

## FINAL ROOT CAUSE (V116 — CONFIRMED WORKING):
ALL 400 PARAMETER_ERROR in distribute caused by wrong endpoint:
- WRONG: GET /v1/apps/{APP_ID}/builds
  (relationship endpoint, no sort/filter support)
- RIGHT: GET /v1/builds?filter[app]={APP_ID}&sort=-uploadedDate&limit=5
  (main builds endpoint, full filter support)

## Complete fix checklist for iOS CI (all 8 required):
1. ✅ python3 -m venv (macOS 15 PEP 668)
2. ✅ PyJWT[crypto] not bare PyJWT
3. ✅ No cancel-in-progress on distribute
4. ✅ Separate ios-distribute.yml via workflow_run
5. ✅ /v1/builds?filter[app]= endpoint (NOT relationship endpoint)
6. ✅ No filter[processingState]=VALID (deprecated)
7. ✅ Verify Bundle ID from ASC before first build
8. ✅ Apple ID from ASC App Information page (not assumed)
