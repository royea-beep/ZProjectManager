# VAMOS 157 — Video Quality: Drive Pipeline for All 608 Clips
**Date:** 2026-03-22 10:45 IST

## FIRST ACTIONS
```
Read MEMORY.md. Iron Rules confirmed.
cd C:/Projects/90soccer
cp this file to docs/prompts/VAMOS-157-2026-03-22-1045.md
```

## CONTEXT
GEM script exists: scripts/gem-youtube-to-drive.py
608 challenges in Supabase — most have YouTube URLs, need Drive H.264 MP4 links.
Goal: every clip loads instantly on iPhone Safari.

## TASK

### Step 1 — Check what we have
```
# Check how many challenges have Drive URLs vs YouTube URLs
python3 -c "
import os, json
# Read challenges from Supabase or local data
" 2>/dev/null

# Or check via grep
grep -rn "youtube\|youtu.be\|drive.google\|video_url" src/lib/ --include="*.ts" | grep -v node_modules | head -20
```

### Step 2 — Check GEM script is ready
```
cat scripts/gem-youtube-to-drive.py | head -50
# Verify: gdrive-service-account.json exists
ls scripts/gdrive-service-account.json 2>/dev/null || echo "MISSING — needs Google Service Account"
```

### Step 3 — If service account exists: run batch
```
py -3.11 scripts/gem-youtube-to-drive.py --batch --limit 20 2>&1 | tail -30
```

### Step 4 — If service account missing: prepare setup instructions
Output exact steps to create Google Service Account for Drive API:
1. console.cloud.google.com → New Project "9soccer-clips"
2. Enable Google Drive API
3. Create Service Account → Download JSON key
4. Save as scripts/gdrive-service-account.json
5. Share the "9soccer-clips" Drive folder with the service account email

### Step 5 — Update video player to use Drive URLs
```
grep -rn "video_url\|clip.*url\|src.*video" src/components/game/NineSecondPlayer.tsx | head -10
```

Add Drive URL detection:
```typescript
function getVideoSrc(url: string): string {
  // Google Drive: convert to direct stream URL
  if (url.includes('drive.google.com')) {
    const id = url.match(/id=([^&]+)/)?.[1] || url.match(/\/d\/([^/]+)/)?.[1]
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`
  }
  // YouTube: use embed (fallback)
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.match(/v=([^&]+)/)?.[1] || url.match(/youtu\.be\/([^?]+)/)?.[1]
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1`
  }
  return url // direct MP4 or other
}
```

## DEPLOY
```
npx tsc --noEmit
npx next build
vercel --prod
git add -A
git commit -m "feat: VAMOS 157 — Drive video pipeline + URL handler (v3.7.6)"
git push origin main
```

## DEFINITION OF DONE
Video player handles Drive URLs correctly
At least first 20 clips converted to Drive H.264
