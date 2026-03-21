# GEM — All Device Sizes & Responsive Reference
**Version:** 1.0 | **Date:** 2026-03-21
**Use in:** 9Soccer, trivia-mascots, CAPS Poker, wingman, explainit, any web/mobile project

---

## iOS — iPhone

| Device | Width | Height | Scale | Safe Area Bottom | Notes |
|--------|-------|--------|-------|-----------------|-------|
| iPhone SE 1st gen | 320px | 568px | 2x | 0px | smallest iPhone ever |
| iPhone SE 2nd/3rd gen | 375px | 667px | 2x | 0px | no notch, no home indicator |
| iPhone 12 mini / 13 mini | 375px | 812px | 3x | 34px | notch + home indicator |
| iPhone 12 / 13 / 14 | 390px | 844px | 3x | 34px | notch + home indicator |
| iPhone 14 Pro | 393px | 852px | 3x | 34px | Dynamic Island |
| iPhone 15 / 15 Pro | 393px | 852px | 3x | 34px | Dynamic Island |
| iPhone 16 / 16 Pro | 393px | 852px | 3x | 34px | Dynamic Island |
| iPhone 12 Pro Max / 13 Pro Max | 428px | 926px | 3x | 34px | large notch |
| iPhone 14 Plus / 14 Pro Max | 430px | 932px | 3x | 34px | notch / Dynamic Island |
| iPhone 15 Pro Max / 16 Pro Max | 430px | 932px | 3x | 34px | Dynamic Island |
| iPhone 16 Plus | 440px | 956px | 3x | 34px | Dynamic Island |

**Critical rule for all iPhones with home indicator:**
```css
padding-bottom: max(1rem, env(safe-area-inset-bottom));
/* OR for fixed bottom buttons: */
bottom: max(1rem, env(safe-area-inset-bottom));
```

---

## iOS — iPad

| Device | Width | Height | Scale | Notes |
|--------|-------|--------|-------|-------|
| iPad mini 6th gen | 744px | 1133px | 2x | home indicator, no notch |
| iPad 10th gen | 820px | 1180px | 2x | home indicator |
| iPad Air 4th/5th gen | 820px | 1180px | 2x | home indicator |
| iPad Pro 11" | 834px | 1194px | 2x | home indicator, no home button |
| iPad Pro 12.9" | 1024px | 1366px | 2x | largest iPad |
| iPad Pro 13" M4 | 1032px | 1376px | 2x | newest large iPad |

---

## Android — Samsung

| Device | Width | Height | DPR | Notes |
|--------|-------|--------|-----|-------|
| Galaxy A14 / A15 | 360px | 780px | 2x | budget, very common |
| Galaxy S21 / S22 | 360px | 800px | 3x | flagship |
| Galaxy S23 / S24 | 393px | 851px | 3x | flagship |
| Galaxy S23 Ultra | 480px | 1040px | 3.75x | largest Android phone |
| Galaxy Z Fold 5 (outer) | 373px | 812px | 3x | foldable closed |
| Galaxy Z Fold 5 (inner) | 673px | 841px | 2.6x | foldable open |
| Galaxy Tab S9 | 753px | 1193px | 2.5x | tablet |
| Galaxy Tab S9 Ultra | 1024px | 1600px | 2x | large tablet |

---

## Android — Google Pixel

| Device | Width | Height | DPR | Notes |
|--------|-------|--------|-----|-------|
| Pixel 6a | 393px | 851px | 2.75x | mid-range |
| Pixel 7 / 7 Pro | 412px | 915px | 2.625x | flagship |
| Pixel 8 / 8 Pro | 412px | 915px | 2.625x | flagship |
| Pixel Fold (inner) | 616px | 720px | 2x | foldable open |

---

## Desktop & Laptop

| Category | Width | Height | Notes |
|----------|-------|--------|-------|
| Small laptop | 1024px | 768px | older MacBook Air |
| MacBook Air 13" | 1280px | 800px | most common laptop |
| MacBook Pro 14" | 1512px | 982px | |
| MacBook Pro 16" | 1728px | 1117px | |
| Full HD monitor | 1920px | 1080px | most common desktop |
| 2K / QHD | 2560px | 1440px | |
| 4K | 3840px | 2160px | |

---

## Breakpoints to Use (Tailwind / CSS)

```css
/* Mobile first — these are the breakpoints */
xs:  320px   /* iPhone SE — absolute minimum */
sm:  390px   /* iPhone 14 — standard phone */
md:  768px   /* iPad mini — tablet starts */
lg:  1024px  /* iPad Pro / small laptop */
xl:  1280px  /* MacBook Air */
2xl: 1536px  /* large desktop */
```

In Tailwind:
```tsx
// Responsive text example
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

// Show/hide per device
<div className="hidden md:block">  {/* desktop only */}
<div className="md:hidden">        {/* mobile only */}
```

---

## Safe Areas — Full Reference

```css
/* iOS notch / Dynamic Island */
padding-top: env(safe-area-inset-top);       /* 44px on notch, 59px on Dynamic Island */

/* iOS home indicator */
padding-bottom: env(safe-area-inset-bottom); /* 34px on all Face ID iPhones */

/* Always use max() to ensure minimum padding */
padding-bottom: max(16px, env(safe-area-inset-bottom));

/* For viewport height — use dvh not vh */
height: 100dvh;      /* dynamic viewport height — accounts for browser chrome */
min-height: 100dvh;

/* In Tailwind with plugin: */
<div className="h-dvh">
<div className="pb-safe">  /* requires tailwind-safe-area plugin */
```

---

## Font Sizes — Responsive Scale

```css
/* Use clamp() for fluid typography */
h1: clamp(24px, 5vw, 48px)   /* title */
h2: clamp(20px, 4vw, 36px)   /* section heading */
h3: clamp(16px, 3vw, 24px)   /* subsection */
body: clamp(14px, 2vw, 18px) /* body text */
small: clamp(12px, 1.5vw, 14px)
```

Minimum touch target: **44px × 44px** (Apple HIG)
Minimum font size on mobile: **12px** (below = unreadable)

---

## Playwright — Test All Devices

```typescript
// Copy-paste into any Playwright test file
const ALL_DEVICES = [
  // Critical small phones
  { name: 'iPhone_SE', width: 320, height: 568 },
  { name: 'iPhone_SE_3rd', width: 375, height: 667 },
  // Standard phones (most users)
  { name: 'iPhone_14', width: 390, height: 844 },
  { name: 'Samsung_A14', width: 360, height: 780 },
  { name: 'Pixel_7', width: 412, height: 915 },
  // Large phones
  { name: 'iPhone_16_Pro_Max', width: 430, height: 932 },
  { name: 'Samsung_S23_Ultra', width: 480, height: 1040 },
  // Tablets
  { name: 'iPad_Mini', width: 744, height: 1133 },
  { name: 'iPad_Pro_11', width: 834, height: 1194 },
  { name: 'iPad_Pro_13', width: 1024, height: 1366 },
  // Foldables
  { name: 'Galaxy_Fold_open', width: 673, height: 841 },
  // Desktop
  { name: 'MacBook_Air', width: 1280, height: 800 },
  { name: 'Desktop_FHD', width: 1920, height: 1080 },
]

// Check for horizontal overflow on any device
for (const device of ALL_DEVICES) {
  test(`No overflow — ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height })
    await page.goto('/')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(device.width + 2)
  })
}
```

---

## Common Mobile Bugs & Fixes

| Bug | Cause | Fix |
|-----|-------|-----|
| Button hidden behind home indicator | no safe area padding | `pb-safe` or `env(safe-area-inset-bottom)` |
| Page taller than screen, no scroll | `overflow: hidden` on parent | remove or change to `overflow-y: auto` |
| Horizontal scroll | fixed width wider than viewport | `max-width: 100%` + `overflow-x: hidden` |
| Text overflows card | no text wrapping | `word-break: break-word` or `overflow-wrap: anywhere` |
| Input zoom on iOS | font-size < 16px on input | always `font-size: 16px` on inputs |
| Click doesn't work on iOS | missing `-webkit-tap-highlight-color` | `cursor: pointer` + `user-select: none` |
| 100vh too tall on mobile | browser chrome takes space | use `100dvh` instead |
| Content under notch | no safe area top | `pt: env(safe-area-inset-top)` |
| Buttons too small to tap | < 44px | min `h-11` (44px) on all interactive elements |

---

## App Store Screenshot Sizes Required

| Device | Size | Notes |
|--------|------|-------|
| iPhone 6.9" (required) | 1320 × 2868 | iPhone 16 Pro Max |
| iPhone 6.5" (required) | 1242 × 2688 | iPhone 11 Pro Max |
| iPad 12.9" (required) | 2048 × 2732 | iPad Pro |
| iPhone 5.5" (optional) | 1242 × 2208 | iPhone 8 Plus |

---

*GEM created 2026-03-21 | Use freely across all ftable projects*
