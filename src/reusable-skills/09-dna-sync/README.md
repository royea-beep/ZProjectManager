# Skill 09: DNA Sync (localStorage-first Bidirectional Sync)

## What It Does
A pattern for syncing user preferences/state between localStorage (instant,
offline) and Supabase (persistent, cross-device). localStorage is always the
source of truth for guest users. On login, DB takes precedence. On first login
with existing localStorage data, auto-migrates to DB.

## Source
`/c/Projects/90soccer/src/lib/dna-sync.ts`

## Pattern
```
Guest:   localStorage only
Login:   DB read → if DB has value → sync to localStorage
         if DB empty + localStorage has value → push localStorage to DB
Save:    always write localStorage + (if logged in) write DB
```

## Usage
```ts
import { saveDnaFamily, loadDnaFamily, getDnaEmoji, getDnaNameHe } from '@/lib/dna-sync'

// After quiz completion:
await saveDnaFamily('vision')

// On app load:
const family = await loadDnaFamily()
// Returns null if no family assigned yet

// Display helpers:
getDnaEmoji('vision')   // '👁️'
getDnaNameHe('vision')  // 'חזון'
```

## Adapting for Other Data Types
Replace `dna_family` with any user preference (theme, language, avatar, etc.):
1. Change localStorage key
2. Change DB column name
3. Same load/save/sync logic
