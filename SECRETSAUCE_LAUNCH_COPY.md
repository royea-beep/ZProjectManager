# SECRETSAUCE LAUNCH COPY
**Ready to post:** 2026-03-09

---

## Dev.to Article

**Title:** "I built a CLI that finds the business logic you shipped to the browser"

**Tags:** javascript, typescript, security, webdev

**Body:**

Your pricing formula is in `utils/pricing.ts`.
Your scoring algorithm is in `helpers/score.ts`.
Your AI system prompt is hardcoded in `services/ai.ts`.

All of it ships to the browser. All of it is visible in DevTools. All of it can be copied.

I built **SecretSauce** — a zero-dependency CLI that scans your JS/TS codebase and finds exposed business logic that should be server-side.

### What it detects

- Pricing formulas & fee calculations
- Scoring algorithms & ranking logic
- AI/LLM system prompts
- Auth & permission rules
- Rate limiting configurations
- Game rules & reward systems
- Business validation rules
- Algorithm implementations

### How it works

```bash
npx @royea/secret-sauce analyze ./src
```

It walks your source files, matches against 8 detection categories with pattern-specific heuristics, rates each finding by uniqueness (1-5 stars), and assigns a protection level:

| Level | Meaning |
|-------|---------|
| CLIENT-OK | Safe in browser |
| CACHE-SHORT | Move server-side, cache 5-15 min |
| CACHE-LONG | Move server-side, cache 1-24 hr |
| SERVER-ONLY | Never expose to client |

### Example output

```
📦 Scanning: ./src
Found 12 files to analyze...

⭐⭐⭐⭐ PRICING_FORMULA in src/utils/pricing.ts:14
  → calculateSubscriptionPrice: tier-based pricing with multipliers
  Protection: SERVER-ONLY
  Recommendation: Move to API endpoint, never expose calculation logic

⭐⭐⭐ SCORING_ALGORITHM in src/helpers/score.ts:8
  → calculateUserScore: weighted scoring with custom factors
  Protection: CACHE-LONG (TTL: 1h)
  Recommendation: Cache result, hide weights server-side
```

### Why I built it

I was auditing my own SaaS projects and realized I had pricing logic, AI prompts, and scoring algorithms all sitting in client-side code. Every competitor could just open DevTools and copy my business logic.

There was no tool for this. Security scanners find vulnerabilities. Linters find code quality issues. Nothing finds **exposed business logic**.

So I built one.

### Install

```bash
npm install -g @royea/secret-sauce
# or run directly
npx @royea/secret-sauce analyze ./src
```

Zero dependencies. Works on any JS/TS project. Takes seconds.

**GitHub:** github.com/royea-beep/secret-sauce
**npm:** npmjs.com/package/@royea/secret-sauce

---

## Hacker News (Show HN)

**Title:** Show HN: SecretSauce – Find exposed business logic in JS/TS codebases

**Body:**
I built a zero-dependency CLI that scans JavaScript/TypeScript code for business logic that shouldn't be in the browser — pricing formulas, AI prompts, scoring algorithms, game rules.

It rates findings by uniqueness (1-5 stars) and tells you exactly what to move server-side with caching recommendations.

Not a security scanner (use Snyk for that). Not a linter. It's a business logic exposure detector.

`npx @royea/secret-sauce analyze ./src`

---

## Reddit r/webdev

**Title:** I made a zero-dependency CLI that scans your code for exposed pricing, scoring, and AI prompts

**Body:**
Hey r/webdev — I built `@royea/secret-sauce`, a CLI tool that finds business logic you accidentally left in client-side code.

It detects: pricing formulas, scoring algorithms, AI system prompts, auth rules, rate limits, game rules, and more. Rates each finding 1-5 stars by uniqueness and tells you what to move server-side.

Zero dependencies, works on any JS/TS project, runs in seconds.

```bash
npx @royea/secret-sauce analyze ./src
```

Would love feedback on what patterns you'd want it to detect!

---

## Twitter/X Thread

**Tweet 1:**
I just shipped @royea/secret-sauce — a CLI that finds the business logic you forgot to protect.

Your pricing formula? In the browser.
Your AI prompt? In the bundle.
Your scoring algorithm? Visible in DevTools.

`npx @royea/secret-sauce analyze ./src`

**Tweet 2:**
It detects 8 categories:
• Pricing formulas
• Scoring algorithms
• AI/LLM prompts
• Auth rules
• Rate limits
• Game rules
• Business validation
• Algorithm implementations

Each finding gets a 1-5 star uniqueness rating.

**Tweet 3:**
Zero dependencies.
Works on any JS/TS project.
Runs in seconds.
MIT licensed.

npm: npmjs.com/package/@royea/secret-sauce
GitHub: github.com/royea-beep/secret-sauce

**Tweet 4:**
Why does this matter?

A manual code audit costs $1,000-4,000.
This does the same thing in seconds.
For free.

Ship it. 🚀
