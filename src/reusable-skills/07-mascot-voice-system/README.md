# Skill 07: Mascot Voice System

## What It Does
Priority-queued voice lines for game mascots. Falls back to Web Speech API
(TTS) while waiting for ElevenLabs audio files. When ElevenLabs audio is
ready, just add `audioUrl` to each voice line.

3 mascots (lemon/mia/daniel) × 15 events × multiple variants = rich
contextual audio feedback.

## Source
- `mascot-voices.ts` from `/c/Projects/90soccer/src/lib/mascot-voices.ts`
- `mascot-voice-player.ts` from `/c/Projects/90soccer/src/lib/mascot-voice-player.ts`

## Usage
```ts
import { playMascotVoice, setVoiceEnabled } from '@/lib/mascot-voice-player'

// Enable voice
setVoiceEnabled(true)

// Play event voice
playMascotVoice('correct')    // random variant
playMascotVoice('streak_7')   // higher priority — plays over ongoing lower
playMascotVoice('win')        // highest game-end priority
```

## Events
`correct` | `wrong` | `streak_3` | `streak_7` | `streak_10` | `win` | `lose`
| `perfect_round` | `time_running_out` | `welcome_back` | `daily_challenge`
| `tournament_start`

## Priority System
- Lower priority events won't interrupt higher priority playing audio
- Resets automatically after voice line duration + 500ms buffer
- Web Speech API fallback uses Hebrew (`he-IL`) TTS

## To Add ElevenLabs Audio
1. Generate audio for each voice line
2. Upload to Supabase Storage
3. Add `audioUrl: 'https://...'` to the relevant VoiceLine in mascot-voices.ts
4. Player automatically uses audio URL over TTS when present
