# MONETIZATION MATRIX
**Updated:** 2026-03-09

---

## Revenue-Ready Products

| Product | Model | Price | MRR Potential | Time to First $ | Effort | Confidence |
|---------|-------|-------|--------------|-----------------|--------|------------|
| **KeyDrop** | SaaS subscription | $19-49/mo | $500-2K | 1 week | Low (polish only) | HIGH |
| **SecretSauce** | One-time CLI sale | $49-79 | $200-500 | 3 days | Zero (publish) | HIGH |
| **VenueKit** | Setup fee + hosting | ₪2.5-5.9K + ₪200/mo | ₪3-6K first sale | 2 weeks | Medium (sales) | MEDIUM |
| **ExplainIt** | SaaS subscription | $19-49/mo | $300-1K | 2 weeks | Low (billing) | MEDIUM |
| **PostPilot** | SaaS subscription | $29-79/mo | $500-3K | 4-6 weeks | HIGH (APIs) | LOW |

---

## Revenue Model Analysis

### Recurring (SaaS)
| Product | Free Tier | Pro | Enterprise | Stickiness |
|---------|-----------|-----|-----------|-----------|
| KeyDrop | 5 req/mo | $19 (100 req) | $49 (unlimited) | HIGH (encryption + audit) |
| PostPilot | 10 posts/mo | $29 (100 posts) | $79 (unlimited) | HIGH (if platforms work) |
| ExplainIt | 3 pipelines/mo | $19 (50) | $49 (unlimited) | MEDIUM |

### One-Time
| Product | Price | Upsell | Repeat Purchase |
|---------|-------|--------|----------------|
| SecretSauce CLI | $49-79 | Pro tier $199 | Per-project license |
| VenueKit | ₪2.5-5.9K | Hosting ₪200/mo | New venues |

### Infrastructure (no direct revenue)
| Package | Value | Revenue Path |
|---------|-------|-------------|
| @royea/flush-queue | npm credibility | Portfolio signal |
| @royea/prompt-guard | npm credibility | Portfolio signal |
| @royea/coin-ledger | npm credibility | Portfolio signal |
| @royea/tokenwise | Published, 34 models | Future Pro tier |
| @royea/shared-utils | Foundation layer | Internal only |

---

## Pricing Recommendations

### KeyDrop — KEEP CURRENT
$0 / $19 / $49 is well-positioned. Pro at $19 has low friction for freelancers. Team at $49 targets agencies. Consider annual pricing (2 months free) after launch.

### SecretSauce — RAISE FROM $29 TO $49-79
- No competition in this niche
- Saves 10-20 hours of manual code review ($500-2K consultant cost)
- $49 is impulse-buy for solo devs, $79 for teams
- Future: Pro tier at $199 (CI/CD integration, custom patterns, team dashboard)

### VenueKit — KEEP CURRENT
₪2,500-5,900 is 30-40% of custom dev cost. Fair for Israel market. Add recurring ₪200/mo for hosting/updates (builds relationship + steady income).

### ExplainIt — KEEP CURRENT
$19/$49 is standard for dev tool SaaS. Consider free tier at 5 (not 3) to reduce friction.

### PostPilot — NOT READY TO PRICE
Product doesn't actually post yet. Fix platform APIs first, then validate pricing with 5 beta agencies.

---

## Quick Revenue Targets

| Target | What | When | Expected |
|--------|------|------|----------|
| First npm sale | SecretSauce publish | This week | $49-79 |
| First SaaS sub | KeyDrop PH launch | Next week | $19-49/mo |
| First venue sale | VenueKit cold outreach | 2 weeks | ₪2,500-5,900 |
| First ExplainIt sub | Billing go-live | 2 weeks | $19/mo |
