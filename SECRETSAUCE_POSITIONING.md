# SECRETSAUCE POSITIONING
**Updated:** 2026-03-09

---

## One-Liner
"Find the business logic you forgot to protect."

## Elevator Pitch
SecretSauce scans your JavaScript/TypeScript codebase and finds exposed business logic — pricing formulas, AI prompts, scoring algorithms, game rules — that shouldn't be in the browser. It rates each finding by uniqueness (1-5 stars) and tells you exactly where to move it.

## Who It's For
- Indie developers shipping SaaS products
- Game developers with scoring/reward logic
- AI product teams with system prompts in client code
- Fintech teams with pricing/fee calculations
- Any team that needs to audit client-side code exposure

## What It's NOT
- Not a security scanner (use Snyk for vulnerabilities)
- Not a linter (use ESLint for code quality)
- Not a SAST tool (use SonarQube for general analysis)
- It's a **business logic exposure detector** — a category of one

## Competitive Landscape

| Tool | What It Does | Overlap |
|------|-------------|---------|
| Snyk | Dependency vulnerability scanning | None |
| SonarQube | Code quality + security rules | Minimal (no IP focus) |
| ESLint | Code style + pattern enforcement | None |
| Semgrep | Custom code pattern matching | Some (but not IP-focused) |
| Manual code review | Human inspection | Replaced by SecretSauce |
| **SecretSauce** | **Business logic exposure detection** | **Unique** |

## Key Differentiators
1. **Zero dependencies** — Runs anywhere, no setup
2. **Actionable output** — Tells you WHERE to move code and HOW to cache it
3. **Star rating** — Prioritizes by uniqueness (don't waste time on low-risk findings)
4. **Protection levels** — CLIENT-OK → SERVER-ONLY with cache TTL recommendations
5. **8 detection categories** — Pricing, scoring, algorithms, AI prompts, auth, rate limits, game rules, validation

## Proof Points
- Scans own codebase and finds 38 patterns correctly
- Zero false positives on validation/UI math
- Cross-platform (Windows, Mac, Linux)
- 1,012 lines of focused, well-tested code

## Price Justification
- Manual code audit: 10-20 hours × $100-200/hr = $1,000-4,000
- SecretSauce: runs in seconds, finds the same things
- Even at $79, it's 50x cheaper than a consultant

## Brand Voice
Technical, direct, no-BS. Speaks to developers who ship fast and care about protecting their work. Not enterprise-y. Not salesy. Just useful.
