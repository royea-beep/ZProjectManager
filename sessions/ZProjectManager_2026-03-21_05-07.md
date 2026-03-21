# ZProjectManager — Sprint 3: Prompt Engine
## Date: 2026-03-21 | Start: 05:07

## PLAN
- prompt-templates.ts: type definitions
- prompt-engine.ts: full generation logic (28 actions)
- DB migration v8: add `category` column (stage already exists)
- IPC: prompts:generate, prompts:get-actions
- PromptPage.tsx: full action picker UI + live preview
- ProjectDetail: replace simple PromptTab with PromptPage component

## FILES
- src/shared/prompt-templates.ts (new)
- src/main/prompt-engine.ts (new)
- src/main/database.ts (v8 migration)
- src/shared/types.ts (category field)
- src/shared/constants.ts (IPC channels)
- src/main/preload.ts (new channels)
- src/main/ipc.ts (new handlers)
- src/renderer/services/api.ts (new api functions)
- src/renderer/pages/PromptPage.tsx (new)
- src/renderer/pages/ProjectDetail.tsx (replace PromptTab)

## STATUS
- TypeScript: TBD
- Build: TBD
