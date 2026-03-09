# QUICK WINS TO REVENUE
**Updated:** 2026-03-09

---

## Win 1: Publish SecretSauce to npm (3 days to first sale)

**Steps:**
1. `cd C:\Projects\SecretSauce && npm run build`
2. `npm login` (use royea-beep account)
3. `npm publish --access public`
4. Post on: Dev.to, Hacker News, Reddit r/webdev, Twitter/X
5. Title: "I built a CLI that finds the business logic you accidentally shipped to the browser"

**Expected:** 50-200 installs first week, 1-5 paid licenses at $49 = $49-245

---

## Win 2: KeyDrop Product Hunt Launch (1 week to first sub)

**Pre-launch checklist:**
- [x] .env.example completed with all LS vars (commit 185ec09)
- [ ] Rename `stripeCustomerId` → `billingCustomerId` in Prisma schema
- [ ] Rename `stripeSubscriptionId` → `billingSubscriptionId` in Prisma schema
- [ ] Move webhook from `/api/stripe/webhook` to `/api/billing/webhook`
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Replace social proof placeholder with 2-3 real quotes (use yourself + friends)
- [ ] Deploy to production Vercel with Neon Postgres
- [ ] Test end-to-end: register → create request → share link → client submits → view credentials
- [ ] Test billing: checkout → webhook → plan upgrade
- [ ] Create Product Hunt page with screenshots + demo GIF

**Launch copy:** "Stop getting API keys over WhatsApp. KeyDrop lets you collect credentials through encrypted, one-time links with audit trails."

**Expected:** 100-300 upvotes, 50-100 signups, 5-15 paid converts = $95-735/mo MRR

---

## Win 3: VenueKit First Sale (2 weeks)

**Steps:**
1. Add WhatsApp button to landing page (venuekit.ftable.co.il)
2. Create 60-second demo video (screen recording of config → deploy)
3. Prepare invoice template (₪2,500 base, itemized modules)
4. Cold message 30 poker venues via WhatsApp:
   > "שלום! בניתי מערכת שמייצרת אתר מלא לפוקר קלאב - עם ניהול טורנירים, ליגה, גלריה ולוח שחקנים. הדגמה חיה: heroes.ftable.co.il. מחיר: ₪2,500 (חצי ממה שעולה לבנות באופן מותאם). מעוניינים?"
5. Offer first 3 venues at ₪1,500 (beta pricing) for testimonials

**Expected:** 3-5 interested, 1-2 sales = ₪2,500-5,900

---

## Win 4: ExplainIt Billing Go-Live (2 weeks)

**Steps:**
1. Log into LemonSqueezy dashboard
2. Create 2 products: "ExplainIt Pro" ($19/mo), "ExplainIt Team" ($49/mo)
3. Copy variant IDs to Vercel env vars
4. Set up webhook URL in LS dashboard
5. Test checkout flow
6. Announce on Dev.to: "I built a tool that turns any URL into a tutorial video in 60 seconds"

**Expected:** 10-30 signups from post, 2-5 paid = $38-245/mo MRR

---

## Win 5: npm Package Portfolio (credibility, not revenue)

**Publish order:**
1. `@royea/flush-queue` — 3 active consumers, proven
2. `@royea/prompt-guard` — security utility, good for portfolio
3. `@royea/coin-ledger` — adapter pattern showcase
4. `@royea/shared-utils` — foundation (after tests)

**Each publish:** `cd [project] && npm run build && npm publish --access public`

**Expected:** 0 revenue, but strong portfolio signal for hiring/partnerships/credibility

---

## Revenue Forecast (30 days)

| Source | Optimistic | Realistic | Conservative |
|--------|-----------|-----------|-------------|
| SecretSauce npm sales | $395 (5x$79) | $147 (3x$49) | $49 (1x$49) |
| KeyDrop MRR | $735 (15x$49) | $190 (10x$19) | $57 (3x$19) |
| VenueKit setup fees | ₪11,800 (2x₪5,900) | ₪2,500 (1x₪2,500) | ₪0 |
| ExplainIt MRR | $245 (5x$49) | $57 (3x$19) | $19 (1x$19) |
| **Total (30d)** | **~$1,375 + ₪11,800** | **~$394 + ₪2,500** | **~$125** |

---

## Priority Order (do in this sequence)

1. **SecretSauce npm publish** — 5 minutes, immediate
2. **KeyDrop Stripe→LS naming fix** — 1 hour, removes launch blocker
3. **KeyDrop PH launch** — 1 day prep, then submit
4. **VenueKit cold outreach** — 2 hours composing messages
5. **ExplainIt billing go-live** — 30 min in LS dashboard + deploy
