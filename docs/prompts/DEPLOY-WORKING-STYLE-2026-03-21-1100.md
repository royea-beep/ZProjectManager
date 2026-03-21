# DEPLOY — ROYE_WORKING_STYLE.md to All Projects
**Date:** 2026-03-21 | **Time:** 11:00 IST

Yes, allow all edits in components

## MISSION
שים את ROYE_WORKING_STYLE.md בכל פרויקט.
זה הקובץ שקלוד בוט קורא ב-FIRST ACTIONS של כל session חדש.

## STEP 1 — Copy the source file

```bash
SOURCE="C:/Users/royea/Downloads/ROYE-WORKING-STYLE-2026-03-21-1055.md"

# Verify it exists
ls -la "$SOURCE"
wc -l "$SOURCE"
```

## STEP 2 — Deploy to all projects

```bash
PROJECTS=(
  "C:/Projects/90soccer"
  "C:/Projects/Caps"
  "C:/Projects/ZProjectManager"
  "C:/Projects/Wingman"
  "C:/Projects/PostPilot"
  "C:/Projects/KeyDrop"
  "C:/Projects/analyzer-standalone"
  "C:/Projects/ExplainIt"
  "C:/Projects/VenueKit"
  "C:/Projects/shared-utils"
)

for PROJECT in "${PROJECTS[@]}"; do
  if [ -d "$PROJECT" ]; then
    mkdir -p "$PROJECT/docs"
    cp "$SOURCE" "$PROJECT/docs/ROYE_WORKING_STYLE.md"
    echo "✅ $(basename $PROJECT)/docs/ROYE_WORKING_STYLE.md"
  else
    echo "⚠️ Not found: $PROJECT"
  fi
done
```

## STEP 3 — Add to FIRST ACTIONS of each project's IRON_RULES.md

For each project that has `IRON_RULES.md`, add this line at the top:
```bash
for PROJECT in "${PROJECTS[@]}"; do
  IRON="$PROJECT/IRON_RULES.md"
  if [ -f "$IRON" ]; then
    # Check if already has working style reference
    if ! grep -q "ROYE_WORKING_STYLE" "$IRON"; then
      # Add reference at top after the title
      sed -i '2s/^/\nRead: docs\/ROYE_WORKING_STYLE.md (working style guide)\n/' "$IRON"
      echo "✅ Updated IRON_RULES.md: $(basename $PROJECT)"
    fi
  fi
done
```

## STEP 4 — Update VAMOS session-start situational prompt
The session-start prompt should reference ROYE_WORKING_STYLE.md.

In each project's MEMORY.md (if exists), add a reference:
```bash
for PROJECT in "${PROJECTS[@]}"; do
  MEMORY="$PROJECT/MEMORY.md"
  if [ -f "$MEMORY" ] && ! grep -q "ROYE_WORKING_STYLE" "$MEMORY"; then
    echo "" >> "$MEMORY"
    echo "## Working Style" >> "$MEMORY"
    echo "Read: docs/ROYE_WORKING_STYLE.md before starting any session" >> "$MEMORY"
    echo "✅ Updated MEMORY.md: $(basename $PROJECT)"
  fi
done
```

## STEP 5 — Commit to all projects

```bash
for PROJECT in "${PROJECTS[@]}"; do
  [ -d "$PROJECT" ] || continue
  cd "$PROJECT"
  
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    git add docs/ROYE_WORKING_STYLE.md IRON_RULES.md MEMORY.md 2>/dev/null
    git commit -m "chore: add ROYE_WORKING_STYLE.md — working collaboration guide"
    git push origin main 2>/dev/null || git push origin master 2>/dev/null
    echo "✅ Committed: $(basename $PROJECT)"
  else
    echo "⏭️ Nothing to commit: $(basename $PROJECT)"
  fi
done
```

## STEP 6 — Verify

```bash
echo "=== VERIFICATION ==="
for PROJECT in "${PROJECTS[@]}"; do
  FILE="$PROJECT/docs/ROYE_WORKING_STYLE.md"
  if [ -f "$FILE" ]; then
    echo "✅ $(basename $PROJECT): $(wc -l < $FILE) lines"
  else
    echo "❌ MISSING: $(basename $PROJECT)"
  fi
done
```

## FINAL REPORT

```
ROYE_WORKING_STYLE.md DEPLOYMENT REPORT — [timestamp]

Files deployed: [N]/[total]
Projects updated: [list]
IRON_RULES.md updated: [list]
MEMORY.md updated: [list]
Committed + pushed: [list]
Failed: [list or NONE]
```

Yes, allow all edits in components
