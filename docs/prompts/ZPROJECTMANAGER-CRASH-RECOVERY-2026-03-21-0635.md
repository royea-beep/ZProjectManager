# ZPROJECTMANAGER — CRASH RECOVERY
**Date:** 2026-03-21 | **Time:** 06:35 IST

---

## FIRST — READ BEFORE TOUCHING ANYTHING

```bash
cd C:/Projects/ZProjectManager

# מה הקומיט האחרון שנשמר?
git log --oneline -10

# יש שינויים שלא נשמרו?
git status
git stash list

# האפליקציה עדיין בנויה?
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
```

---

## REPORT EXACTLY THIS:

```
CRASH RECOVERY REPORT — [timestamp]

Last commit: [hash + message]
Uncommitted changes: [yes/no — which files]
Stash: [yes/no]
TypeScript: [clean / X errors]
Build: [clean / failing]

Sprint 6 status:
□ SkeletonCard + EmptyState — [committed/not committed]
□ conversation-importer.ts — [committed/not committed]
□ PromptAnalyticsPage — [committed/not committed]
□ Shortcuts overlay update — [committed/not committed]
□ Dynamic window title — [committed/not committed]

Last known good commit: [hash]
Ready to continue at: [what to do next]
```

---

## AFTER REPORT — DO THIS

If everything was committed → just `git push origin master` if not pushed yet.

If there are uncommitted changes:
```bash
git add -A
git commit -m "chore: crash recovery save $(date +%Y-%m-%d)"
git push origin master
```

If build is failing after crash:
```bash
# Delete corrupted artifacts
rm -rf dist/ dist-electron/ node_modules/.vite/
npm run build 2>&1 | tail -10
```

Yes, allow all edits in components
