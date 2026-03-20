# ASC API Skill
## Learned from: 9Soccer VAMOS 112-113

## Key lessons:
1. filter[processingState]=VALID → 400 error (deprecated 2025)
   Fix: remove filter, check attribute in response
2. Always query real Bundle ID from ASC before assuming
3. Apple ID ≠ always what you think — verify from ASC screenshot

## JWT generation (Python — use PyJWT[crypto]):
import jwt, time
payload = {
    'iss': issuer_id,
    'iat': int(time.time()),
    'exp': int(time.time()) + 1200,
    'aud': 'appstoreconnect-v1'
}
token = jwt.encode(payload, private_key,
    algorithm='ES256',
    headers={'kid': key_id})

## Required:
- ASC_API_KEY_ID (from App Store Connect)
- ASC_API_KEY_ISSUER_ID
- ASC_KEY_P8 (private key content, NOT file path)
