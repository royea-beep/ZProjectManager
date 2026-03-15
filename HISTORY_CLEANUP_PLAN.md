# HISTORY CLEANUP PLAN
**Date:** 2026-03-09

---

## Summary

Only 1 repo requires potential git history rewrite. The situation is much better than originally assessed.

---

## ftable-hands — CONDITIONAL (before any remote push)

### What's in history
Two Google OAuth client_secret JSON files were committed in the initial commit (`b3812f7`, 2026-03-06). They have been untracked as of commit `e4a83db` but remain in git history.

### Current risk
**LOW** — No remote configured. Secrets exist only in local `.git/objects`. No one else has access to this history.

### When to clean
**Before running `git remote add` or `git push` for the first time.** If the repo is never pushed, cleanup is optional.

### Cleanup commands
```bash
cd C:\Projects\ftable-hands

# Option A: git-filter-repo (recommended, cleaner)
pip install git-filter-repo
git filter-repo \
  --path client_secret.json \
  --path "client_secret_1089166918612-3nth9j04k92e74j0a41mtmui0fnptghl.apps.googleusercontent.com.json" \
  --invert-paths

# Option B: BFG Repo Cleaner (alternative)
# java -jar bfg.jar --delete-files "client_secret*.json"
# git reflog expire --expire=now --all
# git gc --prune=now --aggressive
```

### Impact
- All commit hashes will change
- Safe since no remote exists and no one depends on these hashes
- Files remain on disk (only removed from git history)

### Post-cleanup verification
```bash
git log --all --diff-filter=A --name-only -- "client_secret*"
# Should return empty
```

---

## All Other Repos — NO CLEANUP NEEDED

| Repo | Reason |
|------|--------|
| chicle | config.php was NEVER committed (.gitignore covered it from the start) |
| Wingman | .env and .p8 files were NEVER committed to any branch |
| 9soccer | Signing credentials were NEVER committed (comprehensive .gitignore) |
| All other repos | No secret exposure found in git history |
