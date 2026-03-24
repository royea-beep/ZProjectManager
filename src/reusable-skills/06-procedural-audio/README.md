# Skill 06: Procedural Audio (Web Audio API)

## What It Does
5 background music themes generated entirely via Web Audio API. No external
audio files required. Themes: menu (warm pad), game (rhythmic), battle
(intense), victory (fanfare), tournament (epic).

Also includes SFX: correct/wrong answer sounds, streak sounds, etc.

## Source
First 150 lines of `/c/Projects/90soccer/src/lib/music.ts`

## Usage
```ts
import { musicSystem } from '@/lib/music'

// After first user interaction (required by browser autoplay policy):
musicSystem.handleUserInteraction()

// Enable/disable
musicSystem.setEnabled(true)
musicSystem.setVolume(80) // 0-100

// Play themes
musicSystem.play('menu')
musicSystem.play('game')
musicSystem.play('battle')
musicSystem.play('victory')
musicSystem.play('tournament')
musicSystem.stop()
```

## Key Features
- Zero external files — pure Web Audio API oscillators
- User-interaction gate (browser autoplay policy compliance)
- localStorage persistence (enabled/volume settings)
- Fade in/out on theme transitions
- Singleton pattern — safe to call from anywhere
- SSR-safe (typeof window checks)

## Procedural Techniques Used
- Oscillator detuning for chorus effect
- LFO on filter cutoff for movement
- Frequency ramps for arpeggio
- Gain envelope (ADSR-style)
- Multiple oscillators layered for richness
