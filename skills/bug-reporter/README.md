# BugReporter Skill
## Learned from: 9Soccer VAMOS 97

## What it does:
Tester sees bug → taps 🐛 → records video →
uploads → Claude AI analyzes → GitHub Issue created →
appears in Dashboard → assigned to sprint → fixed

## iOS Video Cascade:
1. getDisplayMedia (screen+audio) — desktop/web
2. getUserMedia with video — iOS camera fallback
3. getUserMedia audio only — last resort
Runtime MIME: webm on desktop, mp4 on iOS

## Required Supabase:
- Table: bug_reports
- Storage bucket: bug-report-videos
- Edge Function: analyze-bug-report
- Secrets: ANTHROPIC_API_KEY, GITHUB_TOKEN

## Template files:
See C:/Projects/90soccer/src/app/bug-report/
    C:/Projects/90soccer/supabase/functions/analyze-bug-report/
