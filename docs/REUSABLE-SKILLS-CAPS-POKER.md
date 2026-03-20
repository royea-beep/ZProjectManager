# Reusable Skills — Caps Poker
**Date:** 2026-03-20 | **Source:** C:/Projects/Caps

Skills and patterns extracted from Caps Poker that can be reused in any React Native / Expo project.

---

## 1. rv() Responsive Value Helper

**What it does:** Returns a different value based on screen width + platform. Replaces all hardcoded px values with breakpoint-aware numbers.

**File:** `constants/deviceBreakpoints.ts`

```typescript
import { Platform } from 'react-native';

/**
 * Pick a responsive value based on current screen width.
 * Call with W from useWindowDimensions() — NEVER at module level.
 */
export function rv(
  W: number,
  mobileweb: number,  // W < 500 (web)
  tablet: number,     // W 500-1023 (web)
  desktop: number,    // W >= 1024 (web)
  native: number,     // iOS / Android
): number {
  if (Platform.OS !== 'web') return native;
  if (W < 500) return mobileweb;
  if (W < 1024) return tablet;
  return desktop;
}

export function getDevice(W: number, H: number) {
  return {
    isMobileWeb:  Platform.OS === 'web' && W < 500,
    isTabletWeb:  Platform.OS === 'web' && W >= 500 && W < 1024,
    isDesktopWeb: Platform.OS === 'web' && W >= 1024,
    isNativeSmall:  Platform.OS !== 'web' && W <= 375,
    isNativeMedium: Platform.OS !== 'web' && W > 375 && W <= 430,
    isNativeLarge:  Platform.OS !== 'web' && W > 430,
    W, H,
  };
}
```

**Usage in component:**
```typescript
const { width: W } = useWindowDimensions();
const cardWidth = rv(W, 40, 52, 64, 58);
const fontSize = rv(W, 14, 16, 18, 16);
```

**How to adapt:** Copy `constants/deviceBreakpoints.ts` to any Expo project. Change breakpoints (500, 1024) if needed.

**Critical rule:** Always call `rv()` inside a component — never at module level. Web crashes if `Dimensions.get()` called at module load time.

---

## 2. Visual Theme Token System

**What it does:** Full design token system for multi-theme support. Single `getTheme()` call gives all colors/radii for current theme.

**File:** `constants/visualThemes.ts`

```typescript
export type VisualTheme = 'classic' | 'fiveo';

export interface ThemeTokens {
  background: string;    surface: string;
  boardBg: string;       boardBorder: string;
  textPrimary: string;   textSecondary: string;   textMuted: string;
  accent: string;        accentText: string;
  cardFace: string;      cardBorder: string;      cardShadow: string;
  primaryBtn: string;    primaryBtnText: string;  primaryBtnRadius: number;
  winColor: string;      loseColor: string;
}

export const VISUAL_THEMES: Record<VisualTheme, ThemeTokens> = {
  classic: { background: '#0a0a0a', accent: '#c9a84c', primaryBtn: '#c9a84c', ... },
  fiveo:   { background: '#1a1a2e', accent: '#FFD700', primaryBtn: '#FFD700', ... },
};

// null-safe: returns classic when theme not yet chosen (first launch)
export function getTheme(theme: VisualTheme | null): ThemeTokens {
  return VISUAL_THEMES[theme ?? 'classic'];
}
```

**Usage:**
```typescript
const visualTheme = useGameStore((s) => s.visualTheme);
const theme = getTheme(visualTheme);
// then: backgroundColor: theme.background, color: theme.accent, etc.
```

**How to adapt:** Copy `constants/visualThemes.ts`, define your token interface, add theme colors. Store `visualTheme: VisualTheme | null` in Zustand (null triggers first-launch picker).

**Caveat:** Reanimated worklets cannot read React state — animated styles using theme colors must be hardcoded or use `useSharedValue` passed in.

---

## 3. Zustand + AsyncStorage Persist Pattern

**What it does:** Zustand store with partial persistence — only selected fields saved to AsyncStorage, transient state never stored.

**File:** `store/gameStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // state + actions
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only these fields are persisted:
        chips: state.chips,
        playerName: state.playerName,
        visualTheme: state.visualTheme,
        orientation: state.orientation,
        // Transient state (revealData, multiplayer) NOT included
      }),
    },
  ),
);
```

**How to adapt:** Copy pattern to any Expo project. Key decision: use `partialize` to exclude session-only state (prevents hydration bugs and stale multiplayer state).

---

## 4. WhatsApp Bot (Twilio + Claude + Whisper)

**What it does:** Supabase Edge Function receives WhatsApp messages via Twilio, routes to correct project, uses Claude for AI responses, OpenAI Whisper for audio transcription, triggers GitHub Actions for auto-fix.

**File:** `supabase/functions/whatsapp-bot-handler/index.ts`

**Architecture:**
```
User WhatsApp → Twilio → Edge Function → detect project keyword
                                       → if text: Claude Sonnet response
                                       → if image: Claude Vision analysis
                                       → if audio: OpenAI Whisper transcription
                                       → if approval: GitHub dispatch → EAS Build + Vercel deploy
```

**Multi-project keyword routing:**
```typescript
const PROJECT_KEYWORDS: Record<string, string[]> = {
  'caps-poker': ['caps', 'poker', 'קלפים', 'קפס', 'board'],
  'wingman':    ['wingman', 'שידוך', 'dating'],
  // ...
};

function detectProject(text: string): string {
  const lower = text.toLowerCase();
  for (const [project, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return project;
  }
  return 'caps-poker'; // default
}
```

**Secrets needed (Supabase):**
`ANTHROPIC_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, GITHUB_TOKEN, OPENAI_API_KEY`

**Deploy:**
```bash
npx supabase functions deploy whatsapp-bot-handler --no-verify-jwt
```

**How to adapt:** Copy Edge Function, update `REPO_MAP` and `PROJECT_KEYWORDS` for your projects. The Twilio signature verification, Whisper transcription, and GitHub dispatch patterns are fully reusable.

---

## 5. EAS Build + GitHub Actions CI

**What it does:** On every `git push origin main`, GitHub Actions triggers EAS Build which compiles an iOS IPA and uploads to TestFlight automatically.

**File:** `.github/workflows/eas-build.yml` (or `claude-fix.yml`)

```yaml
name: EAS Build
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform ios --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

**Key setting in eas.json:**
```json
{ "build": { "production": { "credentialsSource": "remote" } } }
```
`credentialsSource: remote` means no local `.mobileprovision` — all certs managed in Expo dashboard.

**How to adapt:** Set `EXPO_TOKEN` GitHub secret (from expo.dev). Change `--profile` as needed (development/preview/production).

---

## 6. Supabase BugReporter + bug_reports Table

**What it does:** Shake phone or tap FAB → modal → screenshot + description → sends to Supabase `bug_reports` table. Hidden on game screens.

**File:** `components/BugReporter.tsx`

**Supabase table:**
```sql
CREATE TABLE bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text,
  screenshot_url text,
  app_version text,
  platform text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert only" ON bug_reports FOR INSERT WITH CHECK (true);
```

**Key pattern — read Supabase creds from Constants (not process.env):**
```typescript
import Constants from 'expo-constants';
const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
const url = extra?.supabaseUrl;   // NOT process.env.EXPO_PUBLIC_SUPABASE_URL
const key = extra?.supabaseAnonKey;
```

**Why:** In Expo managed workflow, `process.env.EXPO_PUBLIC_*` is undefined at runtime — only `Constants.expoConfig.extra` is reliably populated.

---

## 7. Pre-Calculation Pattern (Background Computation During UX Delay)

**What it does:** While user sees a countdown timer or animation, run expensive computation in background. By the time animation ends, result is ready — zero-wait navigation.

**File:** `app/game.tsx`

```typescript
// Start countdown (3s)
setCountdown(3);
const timer = setInterval(() => setCountdown(c => c - 1), 1000);

// Simultaneously compute results in background
setTimeout(() => {
  const results = computeExpensiveResults(gameState);
  setPrecomputedResults(results); // stored in state
}, 0);

// When countdown hits 0:
if (countdown === 0) {
  clearInterval(timer);
  store.setRevealData(precomputedResults); // already computed
  router.push('/results'); // instant navigation
}
```

**Caps Poker result:** ~2.1ms computation hidden behind 3s countdown → feels instant.

**How to adapt:** Any time you have a mandatory UX delay (animation, loading screen, intro), use it to compute the next step.

---

## 8. expo-screen-orientation Lock Pattern

**What it does:** Locks screen orientation based on user's stored preference. Works on iOS/Android, safely skipped on web.

**File:** `app/_layout.tsx`

```typescript
// Lazy-load — not available on web
let ScreenOrientation: typeof import('expo-screen-orientation') | null = null;
if (Platform.OS !== 'web') {
  try { ScreenOrientation = require('expo-screen-orientation'); } catch {}
}

// In component:
useEffect(() => {
  if (!ScreenOrientation || !orientation) return;
  const lock = orientation === 'landscape'
    ? ScreenOrientation.OrientationLock.LANDSCAPE
    : ScreenOrientation.OrientationLock.PORTRAIT_UP;
  ScreenOrientation.lockAsync(lock).catch(() => {});
}, [orientation]);
```

**app.json settings:**
```json
{
  "orientation": "default",
  "ios": {
    "infoPlist": {
      "UISupportedInterfaceOrientations": [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight"
      ]
    }
  }
}
```

**How to adapt:** Copy the lazy-load pattern + useEffect. Install `expo-screen-orientation`. Add orientation state to store.

---

## 9. First-Launch Onboarding Flow (Multi-Step)

**What it does:** Shows onboarding screens on first launch in sequence (theme → orientation → home). Each step null-gates on store value.

**File:** `app/_layout.tsx`

```typescript
const visualTheme = useGameStore((s) => s.visualTheme);
const orientation = useGameStore((s) => s.orientation);

useEffect(() => {
  if (!splashDone) return;
  if (visualTheme === null) {
    router.replace('/theme-pick');    // Step 1: choose theme
  } else if (orientation === null) {
    router.replace('/orientation-pick'); // Step 2: choose orientation
  }
  // else: home screen (default route)
}, [splashDone, visualTheme, orientation]);
```

**How to adapt:** Add `null` as the default for any first-launch choice in your store. Add a check in `_layout.tsx` useEffect chain. Each onboarding screen calls `store.set*` then `router.replace('/')`.

---

## 10. Reanimated Glow/Pulse Animation

**What it does:** Gold border glow that springs in when a card is highlighted. Uses `glowOpacity` shared value for smooth animation.

**File:** `components/Card.tsx`

```typescript
const glowOpacity = useSharedValue(0);

useEffect(() => {
  glowOpacity.value = highlighted
    ? withSpring(1, { damping: 12, stiffness: 120 })
    : withTiming(0, { duration: 200 });
}, [highlighted]);

const highlightAnimStyle = useAnimatedStyle(() => ({
  borderWidth: glowOpacity.value > 0.01 ? 2.5 : 1,
  borderColor: glowOpacity.value > 0.01 ? '#c9a84c' : 'rgba(0,0,0,0.15)',
  shadowColor: '#c9a84c',
  shadowOpacity: glowOpacity.value * 0.9,
  shadowRadius: glowOpacity.value * 14,
  elevation: glowOpacity.value * 10,
  transform: [
    { scale: 1 + glowOpacity.value * 0.03 },
    { translateY: glowOpacity.value * -6 },
  ],
}));
```

**Caveat:** Worklet functions cannot access React state or store values — all values must be passed as shared values.
