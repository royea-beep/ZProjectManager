# Skill 05: Video Skill Overlay

## What It Does
Applies DNA-family-mapped CSS effects on top of a video player during a game
viewing window. Warning appears 500ms before activation. Effects: blur, mirror,
grayscale, speed-up, delay, partial block, overlay squares, blackout.

## Source
- `video-skills.ts` from `/c/Projects/90soccer/src/lib/video-skills.ts`
- `VideoSkillOverlay.tsx` from `/c/Projects/90soccer/src/components/game/VideoSkillOverlay.tsx`

## Usage
```tsx
import { VIDEO_SKILLS } from '@/lib/video-skills'
import { VideoSkillOverlay } from '@/components/game/VideoSkillOverlay'

const skill = VIDEO_SKILLS[playerDnaFamily]

<VideoSkillOverlay skill={skill} isActive={isViewingWindow}>
  <video src={challengeVideoUrl} ... />
</VideoSkillOverlay>
```

## Effect Types
| effectType | What It Does |
|------------|-------------|
| css-filter | blur, grayscale, sepia via CSS filter |
| css-transform | scaleX(-1) mirror, rotate |
| js-speed | playbackRate 1.5× + 3s blackout |
| js-delay | video paused for 1.5s |
| overlay-block | semi-transparent rectangle over quadrant |
| overlay-squares | 5 random floating squares |
| overlay-blackout | 2× gentle 400ms fade-to-black (non-strobing) |

## DNA Family → Skill Mapping
| Family | Effect |
|--------|--------|
| vision | blur (fog) |
| speed | fast forward |
| technique | mirror |
| leadership | tactical block |
| instinct | late whistle (delay) |
| resilience | grayscale |
| flair | rotation |
| mind_games | overlay squares |
| clutch | blackout |
