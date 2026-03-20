# Session memory (2026-03-20)

**User preference (always):** Simplest possible manual steps: 1) CLI → 2) API key → 3) Direct link + steps.

**Last session:** Caps Poker b104 — visual theme system Classic/Five-O, orientation picker, Five-O vertical reveal, confetti, WhatsApp bot fully live.

## Active Projects Status

### Caps Poker (NEW — added 2026-03-20)
- v1.9.3 build #104 | TestFlight + caps.ftable.co.il (Vercel) | 115/115 tests
- Features: 4 boards Omaha, vs bot, local TCP multiplayer, Supabase Realtime online, WhatsApp bot (Hebrew, image, audio), visual themes Classic/Five-O, orientation picker, leaderboard
- Pending manual: Twilio webhook URL (30s) + Google OAuth provider in Supabase dashboard
- Stack: React Native + Expo SDK 55 + TypeScript + Zustand + Supabase + Vercel

### Wingman
- React Native dating app, last build TestFlight 1.0.0 (8)
- Status: pre-launch, needs testing

### ftable
- Israeli poker portal LIVE at ftable.co.il
- Task 1 (in_progress/critical): Fix auth guards on admin pages, clean dead code

### Heroes-Hadera
- Deployed to heroes.ftable.co.il
- Task 2 (in_progress/critical): Complete admin tournament management

### KeyDrop, PostPilot, ExplainIt
- All LIVE on Vercel with LemonSqueezy billing

### Trading bots (cryptowhale, letsmakebillions)
- LIVE on Railway

## WhatsApp Bot
- Edge Function v15 LIVE on Supabase gxrpunvhjcrzqnitbqah
- Routes to 8 repos: caps-poker, wingman, keydrop, analyzer, explainit, postpilot, ftable, letsmakebillions
- Hebrew + image (Claude Vision) + audio (OpenAI Whisper)
- OPENAI_API_KEY confirmed set
- Twilio webhook URL: https://gxrpunvhjcrzqnitbqah.supabase.co/functions/v1/whatsapp-bot-handler
