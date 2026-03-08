# Hebrew-first language model (Chicle pattern)

Use this when adding or auditing language in deploying platforms. **Hebrew (he) at the beginning** = default/first locale so Israeli users see Hebrew on first load.

## Reference: Chicle

- **Repo:** `C:\Projects\chicle`
- **Entry:** `index.html` — `<html lang="he" dir="rtl">` so first paint is Hebrew RTL before JS.
- **Locales:** `he`, `en`, `ar`, `ru` — **he first** in list and as default.
- **Default:** `localStorage` key `chicle-lang`; if missing or invalid → **`"he"`**.
- **URL override:** `?lang=en` on load applies and can be stored.
- **Runtime:** `LANGS` (dir, name, font per locale), `TX[locale][key]` for strings; sync `document.documentElement.lang` and `dir` on change.

## Checklist for any deploying platform

1. **HTML/root:** `<html lang="he" dir="rtl">` (or `dir="auto"` if you set it from JS) so first paint is RTL Hebrew when applicable.
2. **Default locale:** Initial language = **`he`** unless URL/storage override (e.g. `?lang=en`, `localStorage.getItem("...-lang")`).
3. **Storage key:** One key per app (e.g. `chicle-lang`, `postpilot-lang`) so preference persists.
4. **RTL:** When `lang === 'he'` (or `ar`), set `document.dir = 'rtl'` and use RTL-aware layout/fonts.
5. **Translations:** Central object per locale (e.g. `TX[locale]` or i18n resources); **he** keys present and first in order where it matters.

## Copy-paste pattern (React/Next)

```ts
// Default he; restore from localStorage; optional ?lang= override
const [lang, setLang] = useState<Language>(() => {
  if (typeof window === 'undefined') return 'he';
  const url = new URLSearchParams(window.location.search).get('lang');
  if (url === 'en' || url === 'he') return url;
  const saved = localStorage.getItem('myapp-lang');
  return (saved === 'en' || saved === 'he') ? saved : 'he';
});
useEffect(() => {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  localStorage.setItem('myapp-lang', lang);
}, [lang]);
```

## React Native (e.g. Wingman)

- Use i18next (or similar) with **`lng: 'he'`** and **`fallbackLng: 'he'`** (or `fallbackLng: ['he','en']`) so Hebrew is default.
- RTL: `I18nManager.forceRTL(true)` when `lng === 'he'` (restart or OTA for full effect).
