# Skill 03: Crash Evidence (Web / Next.js)

## What It Does
Web adaptation of the React Native crash evidence system. Uses localStorage
instead of AsyncStorage, direct fetch instead of Supabase client, and
visibilitychange instead of AppState. No screenshot capture (html2canvas
optional).

## Source
`/c/Projects/90soccer/src/lib/crash-evidence.ts`

## Required Table (Supabase)
```sql
create table debug_sessions (
  id bigserial primary key,
  project text not null,
  session_id text not null,
  step_number int not null,
  step_type text not null,
  description text not null,
  screen text,
  data jsonb,
  created_at timestamptz default now()
);
```

## Usage
```ts
// app/layout.tsx
import { initSession, setCurrentScreen, trackAction } from '@/lib/crash-evidence'

// Client component:
useEffect(() => {
  initSession()
}, [])

// In any page/component:
setCurrentScreen('Home')
trackAction('user_clicked_challenge')
trackError('fetch failed: 500')
```

## Key Features
- localStorage-first (works without auth)
- Batched DB writes every 5s (instant on error/screen change)
- Zero dependencies (plain fetch to Supabase REST API)
- Silent fail — never crashes the app
