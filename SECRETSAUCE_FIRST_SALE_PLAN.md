# SECRETSAUCE FIRST SALE PLAN
**Updated:** 2026-03-09

---

## Product

**@royea/secret-sauce** — CLI tool that finds exposed business logic in JavaScript/TypeScript codebases.

**Promise:** "Scan your code. Find the business logic you accidentally shipped to the browser. Get exact migration guidance."

---

## Pricing

| Tier | Price | Audience |
|------|-------|---------|
| Open Source | Free (MIT) | Community adoption, credibility |
| Pro License | $49-79 | Teams wanting support + custom patterns |

**First sale strategy:** Launch as free/open-source on npm. Build adoption. Sell Pro license later when demand is proven.

**Why free first:**
- npm packages with paid licenses have near-zero conversion
- Developer trust requires free trial / full access
- Revenue comes from Pro tier after proving value
- Better to have 500 free users than 2 paid users

---

## Launch Sequence

### Day 1: Publish
```bash
npm publish --access public
```

### Day 1-2: Announce
1. **Dev.to article:** "I built a CLI that finds the business logic you shipped to the browser"
   - Problem (everyone does this)
   - Demo (scan a real project, show output)
   - Architecture (how detection works)
   - Install command
2. **Hacker News Show HN:** "Show HN: SecretSauce — find exposed business logic in JS/TS"
3. **Reddit r/webdev:** "I made a zero-dependency CLI that scans your code for exposed pricing, scoring, and AI prompts"
4. **Twitter/X thread:** "Thread: 5 types of business logic you're accidentally shipping to the browser"

### Day 3-7: Engage
- Reply to every comment
- Run it against popular open-source projects and share findings
- Create a "Hall of Shame" blog post (anonymized real findings)

### Day 7-14: Measure
- Track npm downloads (weekly)
- Track GitHub stars
- Collect feedback (what patterns are missing?)

### Day 14+: Monetize (if traction)
- Add Pro tier: custom pattern definitions, CI/CD integration, JSON output, team reports
- Price: $49 one-time or $199/year for teams
- Gumroad or LemonSqueezy for payment

---

## Launch Assets Needed

| Asset | Status | Effort |
|-------|--------|--------|
| npm package | READY to publish | 0 min |
| README with example output | DONE | — |
| Dev.to article | TO WRITE | 1-2 hours |
| HN post | TO WRITE | 15 min |
| Reddit post | TO WRITE | 15 min |
| Twitter thread | TO WRITE | 30 min |
| Demo GIF/video | NOT DONE | 30 min (record terminal) |
| Landing page | NOT NEEDED yet | — |
| GitHub repo public | NEED TO CREATE | 10 min |

---

## Manual Steps You Must Do

1. **`npm login`** — Log in as your npm account
2. **`npm publish --access public`** — Publish the package
3. **Create GitHub repo** — `royea-beep/secret-sauce` (public)
4. **`git remote add origin`** + **`git push`** — Push code to GitHub
5. **Write Dev.to article** — Use README as base, add personal story
6. **Record terminal demo** — Run `secret-sauce analyze` on a real project, capture output
7. **Post to HN/Reddit/Twitter** — Same day as publish

---

## Success Metrics (first 30 days)

| Metric | Target |
|--------|--------|
| npm weekly downloads | 100+ |
| GitHub stars | 50+ |
| Dev.to article views | 1,000+ |
| HN upvotes | 20+ |
| Feedback/issues | 5+ |
