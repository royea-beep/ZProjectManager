# PACKAGE PUBLISH QUEUE
**Updated:** 2026-03-09

---

## Publish Order (by leverage)

### 1. @royea/secret-sauce — PUBLISH FIRST
**Why first:** Revenue opportunity ($49-79/sale), unique niche, zero competition
**Status:** Code complete, README upgraded, npm metadata ready
**Blocker:** None (publish now, add tests later)
**Command:** `cd C:\Projects\SecretSauce && npm run build && npm publish --access public`
**Post-publish:** Dev.to article, HN Show, Reddit r/webdev

### 2. @royea/flush-queue — PUBLISH SECOND
**Why second:** 3 active consumers (ExplainIt, KeyDrop, PostPilot) copying code
**Status:** npm metadata ready (commit 153626e)
**Blocker:** None
**Command:** `cd C:\Projects\FlushQueue && npm run build && npm publish --access public`
**Post-publish:** Update consumers to `npm install @royea/flush-queue`

### 3. @royea/prompt-guard — PUBLISH THIRD
**Why third:** Security utility, 2+ consumers, consolidate Wingman fork
**Status:** npm metadata ready (commit 84e58a9)
**Blocker:** Verify Wingman fork compatibility
**Command:** `cd C:\Projects\PromptGuard && npm run build && npm publish --access public`
**Post-publish:** Update Wingman to use published version

### 4. @royea/coin-ledger — PUBLISH FOURTH
**Why fourth:** No active consumers yet, but well-architected
**Status:** npm metadata ready (commit 5c99367)
**Blocker:** None
**Command:** `cd C:\Projects\CoinLedger && npm run build && npm publish --access public`
**Post-publish:** Integrate into first consumer (chicle or ftable)

### 5. @royea/shared-utils — PUBLISH LAST
**Why last:** Foundation layer, needs tests before publishing
**Status:** 11 modules, 914 lines, all building clean
**Blocker:** No test suite
**Command:** Add tests → `npm run build && npm publish --access public`

---

## Already Published

| Package | Version | npm URL |
|---------|---------|---------|
| @royea/tokenwise | 0.4.0 | https://www.npmjs.com/package/@royea/tokenwise |

---

## Pre-Publish Checklist (all packages)

- [ ] `npm run build` succeeds
- [ ] `npm publish --dry-run` shows correct files
- [ ] README has install instructions + usage example
- [ ] package.json has: name, version, description, author, license, repository, files, exports
- [ ] .gitignore excludes node_modules and dist
- [ ] No secrets in published files
