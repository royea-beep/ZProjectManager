# Skill 02: Crash Evidence (React Native)

## What It Does
A "dashcam" system for React Native apps. Always recording screenshots + step
log in a rolling buffer. On crash: saves evidence to Supabase, uploads
screenshots, sends WhatsApp with CR-XXXX code for reply-routing.

Also detects dirty-shutdown (iOS process kill / OOM) by writing a "clean exit"
flag and detecting its absence on next launch.

## Source
- `crash-evidence.ts` from `/c/Projects/Caps/utils/crash-evidence.ts`
- `CrashBoundary.tsx` from `/c/Projects/Caps/components/CrashBoundary.tsx`

## Required Tables (Supabase)
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

create table crash_reports (
  id bigserial primary key,
  crash_code text not null unique,
  project text not null,
  version text,
  error_message text,
  error_stack text,
  last_screen text,
  last_action text,
  step_log jsonb,
  screenshot_urls text[],
  console_errors text[],
  fix_prompt text,
  device jsonb,
  status text default 'new',
  created_at timestamptz default now()
);
```

## Required Storage Bucket
- `debug-screenshots` (public)

## Usage
```ts
// _layout.tsx
import { initCrashSession, startCrashRecording, checkDirtyShutdown, markCleanExit } from './crash-evidence'

useEffect(() => {
  initCrashSession()
  startCrashRecording()
  checkDirtyShutdown(sendCrashToWhatsApp)

  return () => markCleanExit()
}, [])

// In navigation/screens:
import { setCurrentScreen, trackAction, trackError } from './crash-evidence'
setCurrentScreen('Board')
trackAction('user_tapped_bet')
```

## Key Features
- Rolling 20-frame screenshot buffer (every 3s)
- Continuous DB step logging (batched 5s, instant on error/screen change)
- CR-XXXX unique crash codes for WhatsApp reply threading
- Dirty-shutdown detection via AsyncStorage flag
- 10s batch window to prevent spam if multiple crashes
- try/catch on every import — NEVER crashes the app
