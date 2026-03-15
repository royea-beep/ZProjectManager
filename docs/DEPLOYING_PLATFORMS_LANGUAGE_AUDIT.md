# Deploying platforms — language audit

Audit of projects that are **deployed or about to deploy**: Hebrew (he) first and i18n status. Use with [HEBREW_FIRST_MODEL.md](./HEBREW_FIRST_MODEL.md) (chicle pattern).

| Project | Deployed / URL | He default? | i18n / pattern | Gap / action |
|---------|----------------|-------------|----------------|--------------|
| **chicle** | LIVE ftable.co.il/chicle | ✅ Yes | LANGS + TX, localStorage, `?lang=`, he first | **Model** — no change |
| **ftable** | LIVE ftable.co.il | ✅ (Israeli) | Hebrew across JS/html; no single “default lang” switch | Audit root `index.html` for `<html lang="he" dir="rtl">` |
| **Heroes-Hadera** | Deployed heroes.ftable.co.il | ✅ (Israeli) | Same stack as ftable | Ensure root HTML lang/dir he/rtl |
| **ExplainIt** | LIVE explainit-one.vercel.app | ✅ Yes | language-context default `"he"`, layout `lang="he" dir="auto"` | None |
| **PostPilot** | LIVE (Vercel) | ❌ No | language-context default `"en"`, `<html lang="en">` | **Set default to he**; root `<html lang="he" dir="rtl">` or set from provider |
| **Wingman** | TestFlight / pre-launch | ❌ No | i18next `lng: 'en'`, `fallbackLng: 'en'` | **Set lng/fallbackLng to 'he'** for Israeli launch |
| **9soccer** | Building (TestFlight/Play), 9soccer.ftable.co.il | ❓ | No he/i18n found in app yet | **Add he first**: lang context or i18n, default he, RTL |
| **KeyDrop (1-2Clicks)** | Not deployed yet | ❓ | — | When deploying: add he first per model |
| **preprompt-web** | Launched | ❓ | — | Quick check: default locale; add he if Israeli audience |

## Summary

- **Already he first:** chicle, ExplainIt; ftable/Heroes Israeli by content.
- **Fix to he first:** PostPilot (state + root html), Wingman (i18n init).
- **Add he + audit:** 9soccer, KeyDrop when deploying; preprompt-web if needed.

## How to use this audit

1. When adding a **new** deploying app: add a row; default locale = **he** unless product is English-only.
2. When **releasing** an existing app: run down the checklist in HEBREW_FIRST_MODEL.md and fix “Gap” column.
3. Re-run this audit when new platforms go live (e.g. 9soccer, KeyDrop).
