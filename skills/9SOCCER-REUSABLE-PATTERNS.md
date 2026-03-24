# 9Soccer Reusable Patterns
# Last updated: 2026-03-24 Sprint D
# Copy any of these into any project

---

## Pattern 1: Multilingual Game Component (AR/HE/EN)
File: src/app/gulf-stars/page.tsx
```typescript
import { getStoredLanguage } from '@/lib/i18n';
const [lang, setLang] = useState('he');
useEffect(() => { setLang(getStoredLanguage()); }, []);
const isRTL = lang === 'ar';
// <div dir={isRTL ? 'rtl' : 'ltr'}>
// {lang === 'ar' ? text_ar : lang === 'he' ? text_he : text_en}
```

## Pattern 2: Global Vote Counter (Supabase)
Tables: votes (side, user_id) + vote_totals VIEW
Client: supabase.from('vote_totals').select('*').single()
Result: {a_votes, b_votes, total} → percentage split bar

## Pattern 3: Time-Locked Content
```typescript
const LOCK = new Date('2026-06-11T17:00:00Z');
const isLocked = () => new Date() >= LOCK;
const daysLeft = () => Math.max(0, Math.ceil((LOCK.getTime() - Date.now()) / 86400000));
```

## Pattern 4: Seeded Daily Shuffle (same result for all users on same day)
File: src/lib/daily-roulette.ts
Seed = parseInt(YYYYMMDD) → LCG shuffle → deterministic per day

## Pattern 5: Server-only SMS/WhatsApp (Twilio)
File: src/lib/twilio.ts
Dynamic import + graceful fallback if env vars missing
Never import in client components

## Pattern 6: Supabase JSONB Community Stats
```sql
CREATE VIEW group_stats AS
  SELECT key, value, COUNT(*) as picks,
    ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER (PARTITION BY key), 1) as pct
  FROM predictions, jsonb_each_text(data)
  GROUP BY key, value;
```

## Pattern 7: TestFlight Auto-Distribute
After upload: poll /v1/builds, add to ALL groups, call buildBetaNotifications
Never use filter[processingState]=VALID (deprecated)
Build number = GitHub run_number + 500

## Pattern 8: 5-round progressive reveal game
File: src/app/dna-detective/page.tsx
POINTS_BY_HINTS = [100, 75, 50, 25, 10] → more hints = fewer points
Wrong penalty per attempt → 3 wrong = auto-reveal

## Pattern 9: Speed trivia with bonuses
File: src/app/blitz/page.tsx
Timer bar + digit display | Speed bonus (< 2s) | Streak multiplier (×1.5 at 3+)
Progress dots | Share result with score

## Pattern 10: GOAT/Opinion vote (no right answer)
File: src/app/goat-debate/page.tsx
5 questions → tally picks → reveal "you are X person"
Submit vote to DB → show live global percentage
