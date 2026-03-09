# KEYDROP LEMONSQUEEZY WEBHOOK SETUP
**Updated:** 2026-03-09

---

## Webhook URL

```
https://<your-railway-domain>/api/stripe/webhook
```

Example: `https://keydrop-production.up.railway.app/api/stripe/webhook`

> Note: The path says "stripe" for legacy reasons. It handles LemonSqueezy webhooks correctly.

---

## Steps

### 1. Open LemonSqueezy Dashboard

Go to: https://app.lemonsqueezy.com/settings/webhooks

### 2. Create Webhook

1. Click **Add Webhook** (or **+**)
2. **Callback URL:** `https://<your-railway-domain>/api/stripe/webhook`
3. **Signing secret:** Click "Generate" — copy this value
4. **Events to listen for:** Check these 4:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
5. Click **Save**

### 3. Set the Secret in Railway

```bash
railway variables set LEMONSQUEEZY_WEBHOOK_SECRET="the-secret-you-copied"
```

Or paste it in Railway dashboard → Variables.

### 4. Verify

After setup, test by:
1. Creating a test checkout (billing page → Upgrade)
2. Complete the LemonSqueezy test checkout
3. Check Railway logs for webhook receipt:
   ```
   Webhook received: subscription_created
   ```
4. Verify user plan updated in the app

---

## How the Webhook Works

```
LemonSqueezy → POST /api/stripe/webhook → KeyDrop
                                            ↓
                              1. Verify HMAC-SHA256 signature
                              2. Parse event type
                              3. Update user record in DB:
                                 - subscription_created → set plan, customerId
                                 - subscription_updated → update status
                                 - subscription_cancelled → revert to FREE
                                 - subscription_expired → revert to FREE
```

---

## Debugging

| Symptom | Check |
|---------|-------|
| Webhook returns 500 | `LEMONSQUEEZY_WEBHOOK_SECRET` not set in Railway |
| Webhook returns 400 | Signing secret mismatch — regenerate in LS and update Railway |
| User plan doesn't update | Check that `custom_data.user_id` is passed in checkout |
| No webhook calls at all | Verify webhook URL is correct in LS dashboard |
