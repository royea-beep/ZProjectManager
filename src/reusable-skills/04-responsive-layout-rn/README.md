# Skill 04: Responsive Layout (React Native)

## What It Does
Universal responsive scaling system for React Native. Base design target:
iPhone 14 Pro (393×852pt). Scales correctly to all devices from 320pt (iPhone SE)
to 480pt (Android foldables). Eliminates ALL hardcoded pixel values.

## Source
`/c/Projects/Caps/utils/responsive.ts`

## IRON RULE
Never call `Dimensions.get()` at module level on web — crashes the SPA before
DOM is ready. This file handles it with a Platform guard.

## Usage
```ts
import { scale, verticalScale, moderateScale, SCREEN_W } from './responsive'

const styles = StyleSheet.create({
  card: {
    width: scale(200),           // horizontal scaling
    height: verticalScale(120),  // vertical scaling
    borderRadius: moderateScale(12),  // moderate (doesn't scale as aggressively)
    padding: scale(16),
    fontSize: moderateScale(16),
  }
})
```

## Key Functions
- `scale(size)` — scales horizontally (ratio of actual screen / base 393px)
- `verticalScale(size)` — scales vertically (ratio of actual screen / base 852px)
- `moderateScale(size, factor = 0.5)` — scales with damping factor (for fonts/border-radius)
- `SCREEN_W`, `SCREEN_H`, `PIXEL_RATIO` — exported constants
- Device category helpers: `deviceCategory()` → 'tiny'|'xsmall'|'small'|'medium'|'large'|'xlarge'
