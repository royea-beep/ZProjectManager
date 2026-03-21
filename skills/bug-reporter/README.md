# BugReporter Skill
# Source: 9Soccer VAMOS 97 + V108 iOS fix
# Last updated: 2026-03-21

## What it does:
Tester taps 🐛 → records video → uploads to Supabase Storage
→ Edge Function → Claude AI analysis → GitHub Issue created
→ Dashboard /bugs page → assign to sprint → fix it

## iOS Video Cascade (REQUIRED — getDisplayMedia not supported on iOS):
```typescript
async function getRecordingStream(): Promise<MediaStream> {
  if (typeof navigator.mediaDevices?.getDisplayMedia === "function") {
    try { return await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); }
    catch {}
  }
  try { return await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); }
  catch {}
  return await navigator.mediaDevices.getUserMedia({ audio: true });
}

const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
  ? "video/webm;codecs=vp8,opus"
  : MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "";
```

## Required Supabase setup:
Table: bug_reports (id, tester_name, video_url, language, status, severity,
                     ai_summary, ai_steps, ai_screen, github_issue_url, vamos_sprint)
Storage bucket: bug-report-videos (public read, 50MB limit)
Edge Function: analyze-bug-report
Secrets: ANTHROPIC_API_KEY, GITHUB_TOKEN

## Feature flag gate (only show in TestFlight):
```typescript
const bugReporterEnabled = await isEnabled("bug_reporter"); // DB flag
```

## Template files:
src/app/bug-report/ (in 9Soccer project)
supabase/functions/analyze-bug-report/ (in 9Soccer project)
