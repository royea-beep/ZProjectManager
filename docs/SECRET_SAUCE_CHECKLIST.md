# SecretSauce — security audit checklist for all projects

Use this checklist so **sensitive logic and secrets stay server-side** and never leak into client bundles or public APIs. Apply in every project that has API keys, pricing, or auth.

## 1. Server-only (never in client bundle)

- [ ] **API keys & secrets**: All `*_API_KEY`, `*_SECRET`, `*_TOKEN`, `ENCRYPTION_KEY`, `.p8` keys → **env only**, never `NEXT_PUBLIC_*` or imported in client code.
- [ ] **Payment / billing**: LemonSqueezy variant IDs, Stripe price IDs, webhook secrets → **env only**. Validation and checkout only in API routes.
- [ ] **Rate limits**: Points and duration (e.g. 5 per 15 min) → **server config or env**. Client must not know limits to avoid gaming.
- [ ] **Plan limits**: `brandsLimit`, `postsPerMonth`, `maxFields`, etc. → **enforced in API**; display can come from a **server endpoint** (see CACHE+FETCH) so client doesn’t hardcode.

## 2. CACHE+FETCH (prefer server over client)

- [ ] **Pricing / plan display**: Instead of hardcoding `PLANS = [{ price: 29 }, ...]` in a client component, **serve from API** (e.g. `GET /api/billing/plans`) and render in UI. Keeps single source of truth and avoids client-side abuse.
- [ ] **Feature flags / limits for display**: If the client shows “10 brands”, get it from the same API that enforces limits (or a read-only config endpoint).

## 3. DUAL (server + client with care)

- [ ] **Formulas (timeAgo, retryAfter)**: If purely for display (e.g. “2 hours ago”), client is OK. If it affects business logic or security (e.g. retry-after for rate limit), **server-only**.
- [ ] **Generated code (Prisma, OpenAPI)**: Usually ignore for SecretSauce; ensure generated clients don’t bundle env.

## 4. Per-project actions

- [ ] **.env.example**: List every required secret (no values). Comment which are public (`NEXT_PUBLIC_*`) vs server-only.
- [ ] **SECRET_SAUCE.md** (or section in MEMORY): Project-specific “what is sensitive” and “where it lives”. Before release: run `npx @royea/secret-sauce analyze ./src` if available, else use this checklist.
- [ ] **CI / deploy**: Ensure production env has all server-only vars; never commit `.env` or `.env.local`.

## 5. Reference

- **KeyDrop**: MEMORY.md + rate-limit.ts + payments.ts server-only; billing page has PLANS (consider API).
- **PostPilot**: MEMORY.md + payments.ts server-only; billing page has PLANS (consider GET /api/billing/plans).
- **Wingman**: API keys in apps/api .env; mobile only Firebase config and public URLs.

Run this checklist (or SecretSauce) before every release. When in doubt: **keep it on the server**.
