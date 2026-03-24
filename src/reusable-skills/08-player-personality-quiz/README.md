# Skill 08: Player Personality Quiz

## What It Does
3-round photo quiz where players pick their favorite footballer from 3 options
per round. Majority vote of chosen players' DNA families determines the
player's DNA family. Used as onboarding/personalization — replaces creature
system as the correct Bible-specified onboarding.

## Source
First 80 lines of `/c/Projects/90soccer/src/lib/player-quiz.ts`

## DNA Families
`vision` | `flair` | `speed` | `technique` | `leadership` | `instinct`
| `resilience` | `mind_games` | `clutch`

## Usage
```ts
import { QUIZ_ROUNDS, type DnaFamily, type QuizRound } from '@/lib/player-quiz'

// 3 rounds, show players[0], players[1], players[2]
// User picks one per round
// Count family votes → most common = their DNA family

function calculateDnaFamily(picks: string[]): DnaFamily {
  const votes: Record<string, number> = {}
  for (const playerId of picks) {
    const family = findFamily(playerId) // look up in QUIZ_ROUNDS
    votes[family] = (votes[family] ?? 0) + 1
  }
  return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0] as DnaFamily
}
```

## Adapting for Other Domains
Replace footballer QuizPlayers with domain-relevant choices:
- Anime: characters → personality type
- Music: artists → genre affinity
- Food: dishes → flavor profile
Same 3-round structure, same majority-vote logic.
