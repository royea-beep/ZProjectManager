# KEYDROP END-TO-END PRODUCTION TEST PLAN
**Updated:** 2026-03-09

---

## Test in this exact order. Stop if any step fails.

### Phase 1: Infrastructure (2 min)

- [ ] Landing page loads at production URL
- [ ] No console errors in DevTools
- [ ] Page title shows "KeyDrop — Secure Credential Collector"
- [ ] /terms loads correctly
- [ ] /privacy loads correctly
- [ ] Footer links to Terms and Privacy work

### Phase 2: Auth (3 min)

- [ ] Click "Sign In" → /login loads, shows "KeyDrop" heading
- [ ] Click "Register" link → /register loads
- [ ] Fill registration form (name, email, password 8+ chars)
- [ ] Submit → redirects to /dashboard
- [ ] Dashboard shows "KeyDrop" in header
- [ ] Log out → redirected to /login
- [ ] Log back in with same credentials → dashboard loads
- [ ] Refresh page → stays logged in (JWT refresh working)

### Phase 3: Core Flow (5 min)

- [ ] Click "New Request"
- [ ] Select a template (e.g., Stripe)
- [ ] Fill in client name + email
- [ ] Submit → request created, share link shown
- [ ] Copy the share link
- [ ] Open share link in **incognito/private** browser window
- [ ] Client form loads with template fields
- [ ] Fill in test credentials (any values)
- [ ] Submit → success message shown
- [ ] Go back to dashboard (logged-in window)
- [ ] Request status changed to "Submitted" or similar
- [ ] Click request → credential detail view
- [ ] Credentials are decrypted and visible
- [ ] Copy credential button works
- [ ] Revoke the request
- [ ] Open the share link again in incognito → should show expired/revoked

### Phase 4: Billing (5 min)

- [ ] Navigate to /billing
- [ ] Current plan shows "Free" with correct limits
- [ ] Click "Upgrade" on Pro plan
- [ ] Redirected to LemonSqueezy checkout page
- [ ] Complete checkout with test card: `4242 4242 4242 4242`
- [ ] Redirected back to dashboard with `?upgraded=true`
- [ ] Check /billing → plan shows "Pro"
- [ ] Usage counter reflects Pro limits (100 requests)
- [ ] Click "Manage Subscription" → opens LS customer portal

### Phase 5: Edge Cases (3 min)

- [ ] Try accessing /dashboard without login → redirected to /login
- [ ] Try submitting an expired link → shows error
- [ ] Try accessing another user's request → 403 or 404
- [ ] Create 2+ requests → dashboard shows all of them
- [ ] Rate limiting: hit login 6+ times rapidly → get 429 response

---

## Expected Results

| Test | Expected |
|------|----------|
| Registration | Account created, JWT issued, redirected to dashboard |
| Credential submission | AES-256 encrypted in DB, decrypted on retrieve |
| Link expiry | One-time use, expired after submission |
| Revoke | Link immediately dead |
| Billing upgrade | Plan changes in DB, webhook fires, limits updated |
| Auth persistence | JWT refresh keeps session alive across page reloads |

---

## If Something Fails

1. Check Railway deploy logs (Railway dashboard → Logs)
2. Check browser DevTools → Network tab for API error responses
3. Check browser DevTools → Console for client-side errors
4. Common issues:
   - **"Failed to fetch"** → NEXT_PUBLIC_APP_URL is wrong or not set
   - **500 on registration** → DATABASE_URL is wrong
   - **Decryption fails** → ENCRYPTION_MASTER_KEY is wrong
   - **Webhook doesn't fire** → Check LS webhook URL and secret
