# ZPROJECTMANAGER — SPRINT 8: Parameter Extractor (GPROMPT Core)
**Date:** 2026-03-21 | **Time:** 06:40 IST | **Project:** ZProjectManager

---

## FIRST ACTIONS
```bash
TIMESTAMP=$(date +%H-%M)
echo "# ZProjectManager Sprint 8 — $(date '+%Y-%m-%d %H:%M')" > C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md
git log --oneline -3
npx tsc --noEmit 2>&1 | tail -3
```

## READ FIRST
```bash
cat C:/Projects/ZProjectManager/src/main/prompt-engine.ts | head -60
cat C:/Projects/ZProjectManager/src/shared/types.ts
cat C:/Projects/ZProjectManager/src/main/ipc.ts | grep -n "handle" | head -50
cat C:/Projects/ZProjectManager/src/renderer/pages/ProjectDetail.tsx | grep -n "BASE_TABS"
```

---

## CONCEPT

**Parameter Extractor** = הלב של GPROMPT.

קלוד בוט מנחש כשהפרומפט לא אומר לו:
- איפה הקבצים (`src/components/` ? `app/components/`?)
- מה שם ה-Supabase client (`supabase` ? `createClient` ? `getSupabase`?)
- מה שמות הטבלאות (`.from('users')` ? `.from('profiles')?`)
- מה ה-auth pattern (`useUser()` ? `useSession()` ? `auth().userId`?)
- מה ה-design tokens (`bg-dark-surface` ? `bg-zinc-900` ? `bg-gray-900`?)
- מה ה-import alias (`@/` ? `~/` ? relative?)
- אילו components כבר קיימים (כדי לא לכתוב מחדש)

**הפתרון:** Parameter Extractor קורא את הcodebase → מוציא את כל הפרמטרים → מזריק לכל GPROMPT.
אפס שדות ריקים = אפס ניחושים.

---

## AGENT 1 — Create parameter-extractor.ts

**Create:** `src/main/parameter-extractor.ts`

```typescript
import * as fs from 'fs'
import * as path from 'path'

export interface ProjectParameters {
  // File structure
  srcStructure: string[]           // top-level dirs in src/
  importAlias: string              // '@/' or '~/' or 'relative'
  existingComponents: string[]     // component file names
  existingPages: string[]          // page file names
  existingHooks: string[]          // hook file names
  existingUtils: string[]          // utility file names

  // Stack detection
  isNextJs: boolean
  isCapacitor: boolean
  isExpo: boolean
  isNestJs: boolean
  isElectron: boolean
  isTailwind: boolean
  hasShadcn: boolean

  // Supabase
  supabaseClientPath: string       // path to supabase client file
  supabaseClientExport: string     // 'supabase' | 'createClient' | 'getSupabase' | unknown
  tableNames: string[]             // extracted from .from(' calls
  hasRLS: boolean | null           // detected from migration files

  // Auth
  authPattern: string              // 'supabase-auth' | 'next-auth' | 'custom' | 'unknown'
  authHook: string                 // 'useUser' | 'useSession' | 'useAuth' | 'unknown'
  userIdField: string              // 'user.id' | 'user.userId' | 'session.user.id' | 'unknown'

  // Design system
  designTokenPrefix: string        // 'dark' (as in bg-dark-surface) | 'zinc' | 'gray' | 'unknown'
  commonColorClasses: string[]     // top 5 most used bg- and text- classes
  hasCustomDesignSystem: boolean

  // API patterns
  apiResponseFormat: string        // '{ data, error }' | '{ success, result }' | 'direct' | 'unknown'
  hasRateLimiting: boolean
  hasZodValidation: boolean

  // Mobile specific
  bundleId: string                 // from capacitor.config.ts or app.json
  expoProjectId: string            // from app.json or eas.json
  nativePlugins: string[]          // installed Capacitor/Expo plugins

  // Deployment
  deployTarget: string             // 'vercel' | 'railway' | 'cpanel' | 'unknown'
  productionUrl: string            // detected from vercel.json or package.json

  // Extraction metadata
  extractedAt: string
  confidence: number               // 0-1, how confident we are in these parameters
  warnings: string[]               // things we couldn't detect reliably
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function readFileSafe(filePath: string): string {
  try { return fs.readFileSync(filePath, 'utf8') } catch { return '' }
}

function fileExists(filePath: string): boolean {
  try { return fs.existsSync(filePath) } catch { return false }
}

function listDir(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .map(d => d.name)
  } catch { return [] }
}

function listDirDeep(dirPath: string, ext: string[], maxDepth = 2): string[] {
  const results: string[] = []
  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const e of entries) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue
        const full = path.join(dir, e.name)
        if (e.isDirectory()) walk(full, depth + 1)
        else if (ext.some(x => e.name.endsWith(x))) results.push(e.name)
      }
    } catch { /* skip */ }
  }
  walk(dirPath, 0)
  return results
}

function grepInDir(dirPath: string, pattern: RegExp, fileExts = ['.ts', '.tsx']): string[] {
  const matches: string[] = []
  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const e of entries) {
        if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue
        const full = path.join(dir, e.name)
        if (e.isDirectory()) walk(full)
        else if (fileExts.some(x => e.name.endsWith(x))) {
          const content = readFileSafe(full)
          const found = content.match(pattern)
          if (found) matches.push(...found)
        }
      }
    } catch { /* skip */ }
  }
  walk(dirPath)
  return [...new Set(matches)]
}

// ─── DETECTORS ──────────────────────────────────────────────────────────────

function detectImportAlias(projectPath: string): string {
  const tsconfig = readFileSafe(path.join(projectPath, 'tsconfig.json'))
  if (tsconfig.includes('"@/*"')) return '@/'
  if (tsconfig.includes('"~/*"')) return '~/'
  if (tsconfig.includes('"#/*"')) return '#/'
  return 'relative'
}

function detectSupabaseClient(projectPath: string): { path: string; exportName: string } {
  const candidates = [
    'src/lib/supabase.ts', 'src/lib/supabase/client.ts',
    'lib/supabase.ts', 'utils/supabase.ts',
    'src/services/supabase.ts', 'app/lib/supabase.ts',
  ]
  for (const c of candidates) {
    const full = path.join(projectPath, c)
    if (fileExists(full)) {
      const content = readFileSafe(full)
      // Detect export name
      const exportMatch = content.match(/export\s+(?:const|let|var)\s+(\w+)\s*=\s*createClient/)
      const exportName = exportMatch?.[1] || 'supabase'
      return { path: c, exportName }
    }
  }
  return { path: 'not found', exportName: 'unknown' }
}

function detectTableNames(projectPath: string): string[] {
  const matches = grepInDir(
    path.join(projectPath, 'src'),
    /\.from\(['"`](\w+)['"`]\)/g
  )
  // Extract just the table name from .from('tablename')
  return [...new Set(
    matches.map(m => m.match(/\.from\(['"`](\w+)['"`]\)/)?.[1]).filter(Boolean) as string[]
  )].slice(0, 30)
}

function detectAuthPattern(projectPath: string): { pattern: string; hook: string; userIdField: string } {
  const allCode = grepInDir(path.join(projectPath, 'src'), /useUser|useSession|useAuth|getServerSession|auth\(\)|supabase\.auth/g)

  if (allCode.some(m => m.includes('getServerSession') || m.includes('next-auth'))) {
    return { pattern: 'next-auth', hook: 'useSession()', userIdField: 'session.user.id' }
  }
  if (allCode.some(m => m.includes('supabase.auth'))) {
    return { pattern: 'supabase-auth', hook: 'useUser() or supabase.auth.getUser()', userIdField: 'user.id' }
  }
  if (allCode.some(m => m.includes('useAuth'))) {
    return { pattern: 'custom', hook: 'useAuth()', userIdField: 'user.id' }
  }
  if (allCode.some(m => m.includes('auth()'))) {
    return { pattern: 'clerk', hook: 'auth() / useUser()', userIdField: 'auth().userId' }
  }
  return { pattern: 'unknown', hook: 'unknown', userIdField: 'unknown' }
}

function detectDesignTokens(projectPath: string): { prefix: string; topClasses: string[] } {
  const allClasses = grepInDir(
    path.join(projectPath, 'src'),
    /(?:bg|text|border|ring)-[\w-]+/g,
    ['.tsx', '.ts', '.css']
  )

  // Count occurrences
  const counts: Record<string, number> = {}
  for (const c of allClasses) {
    counts[c] = (counts[c] || 0) + 1
  }

  // Find top classes
  const topClasses = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cls]) => cls)

  // Detect design token prefix
  const darkClasses = allClasses.filter(c => c.includes('dark-'))
  const prefix = darkClasses.length > 5 ? 'dark' :
    allClasses.filter(c => c.includes('zinc-')).length > 5 ? 'zinc' :
    allClasses.filter(c => c.includes('gray-')).length > 5 ? 'gray' : 'unknown'

  return { prefix, topClasses }
}

function detectMobileConfig(projectPath: string): { bundleId: string; expoId: string; plugins: string[] } {
  // Capacitor
  const capConfig = readFileSafe(path.join(projectPath, 'capacitor.config.ts'))
  const capBundleMatch = capConfig.match(/appId:\s*['"`]([^'"`]+)['"`]/)

  // Expo
  const appJson = readFileSafe(path.join(projectPath, 'app.json'))
  let expoBundleId = '', expoProjectId = ''
  try {
    const parsed = JSON.parse(appJson)
    expoBundleId = parsed?.expo?.ios?.bundleIdentifier || ''
    expoProjectId = parsed?.expo?.extra?.eas?.projectId || ''
  } catch { /* skip */ }

  // Native plugins
  const pkg = readFileSafe(path.join(projectPath, 'package.json'))
  let plugins: string[] = []
  try {
    const parsed = JSON.parse(pkg)
    const deps = { ...parsed.dependencies, ...parsed.devDependencies }
    plugins = Object.keys(deps).filter(k =>
      k.startsWith('@capacitor/') || k.startsWith('expo-') || k.startsWith('@expo/')
    ).slice(0, 20)
  } catch { /* skip */ }

  return {
    bundleId: capBundleMatch?.[1] || expoBundleId || 'not found',
    expoId: expoProjectId || 'not found',
    plugins,
  }
}

function detectDeployTarget(projectPath: string): { target: string; url: string } {
  if (fileExists(path.join(projectPath, 'vercel.json'))) {
    const pkg = readFileSafe(path.join(projectPath, 'package.json'))
    const urlMatch = pkg.match(/"homepage":\s*"([^"]+)"/)
    return { target: 'vercel', url: urlMatch?.[1] || 'unknown' }
  }
  if (fileExists(path.join(projectPath, 'railway.json')) ||
      fileExists(path.join(projectPath, 'railway.toml'))) {
    return { target: 'railway', url: 'unknown' }
  }
  return { target: 'unknown', url: 'unknown' }
}

// ─── MAIN EXTRACTOR ─────────────────────────────────────────────────────────

export async function extractParameters(projectPath: string): Promise<ProjectParameters> {
  const warnings: string[] = []
  let confidence = 1.0

  const srcPath = path.join(projectPath, 'src')
  const srcExists = fileExists(srcPath)

  // File structure
  const srcStructure = srcExists ? listDir(srcPath) : []
  const importAlias = detectImportAlias(projectPath)

  // Components/pages/hooks
  const componentsPath = path.join(srcPath, 'components')
  const pagesPath = path.join(srcPath, 'app')   // Next.js app router
  const pagesPath2 = path.join(srcPath, 'pages') // Next.js pages router
  const hooksPath = path.join(srcPath, 'hooks')

  const existingComponents = listDirDeep(componentsPath, ['.tsx', '.ts'])
  const existingPages = listDirDeep(
    fileExists(pagesPath) ? pagesPath : pagesPath2,
    ['.tsx', '.ts']
  ).filter(f => f.includes('page.tsx') || f.includes('Page.tsx'))
  const existingHooks = listDirDeep(hooksPath, ['.ts', '.tsx'])
  const existingUtils = listDirDeep(path.join(srcPath, 'lib'), ['.ts'])
    .concat(listDirDeep(path.join(srcPath, 'utils'), ['.ts']))

  // Stack detection
  const pkg = readFileSafe(path.join(projectPath, 'package.json'))
  const isNextJs = pkg.includes('"next"')
  const isCapacitor = fileExists(path.join(projectPath, 'capacitor.config.ts'))
  const isExpo = pkg.includes('"expo"')
  const isNestJs = pkg.includes('"@nestjs/core"')
  const isElectron = pkg.includes('"electron"')
  const isTailwind = fileExists(path.join(projectPath, 'tailwind.config.ts')) ||
                     fileExists(path.join(projectPath, 'tailwind.config.js'))
  const hasShadcn = fileExists(path.join(projectPath, 'components.json'))

  // Supabase
  const supabaseClient = detectSupabaseClient(projectPath)
  const tableNames = detectTableNames(projectPath)
  if (supabaseClient.path === 'not found') {
    warnings.push('Supabase client file not found in common locations')
    confidence -= 0.1
  }

  // Auth
  const auth = detectAuthPattern(projectPath)
  if (auth.pattern === 'unknown') {
    warnings.push('Auth pattern not detected')
    confidence -= 0.1
  }

  // Design
  const design = detectDesignTokens(projectPath)
  if (design.prefix === 'unknown') {
    warnings.push('Design token prefix not detected')
    confidence -= 0.05
  }

  // Mobile
  const mobile = detectMobileConfig(projectPath)

  // Deploy
  const deploy = detectDeployTarget(projectPath)
  if (deploy.target === 'unknown') {
    warnings.push('Deployment target not detected')
    confidence -= 0.05
  }

  // API patterns
  const hasZodValidation = grepInDir(srcPath, /from ['"]zod['"]/g).length > 0
  const hasRateLimiting = grepInDir(srcPath, /rateLimit|rate_limit/g).length > 0

  return {
    srcStructure,
    importAlias,
    existingComponents,
    existingPages,
    existingHooks,
    existingUtils,
    isNextJs, isCapacitor, isExpo, isNestJs, isElectron, isTailwind, hasShadcn,
    supabaseClientPath: supabaseClient.path,
    supabaseClientExport: supabaseClient.exportName,
    tableNames,
    hasRLS: null, // requires DB access
    authPattern: auth.pattern,
    authHook: auth.hook,
    userIdField: auth.userIdField,
    designTokenPrefix: design.prefix,
    commonColorClasses: design.topClasses,
    hasCustomDesignSystem: design.prefix === 'dark',
    apiResponseFormat: 'unknown', // hard to detect statically
    hasRateLimiting,
    hasZodValidation,
    bundleId: mobile.bundleId,
    expoProjectId: mobile.expoId,
    nativePlugins: mobile.plugins,
    deployTarget: deploy.target,
    productionUrl: deploy.url,
    extractedAt: new Date().toISOString(),
    confidence: Math.max(0.1, confidence),
    warnings,
  }
}

// ─── FORMAT FOR PROMPT INJECTION ────────────────────────────────────────────

export function formatParametersForPrompt(params: ProjectParameters): string {
  const lines: string[] = ['## PROJECT PARAMETERS (auto-extracted — no guessing needed)']

  // Stack
  const stack = [
    params.isNextJs && 'Next.js',
    params.isCapacitor && 'Capacitor',
    params.isExpo && 'Expo',
    params.isNestJs && 'NestJS',
    params.isElectron && 'Electron',
    params.isTailwind && 'Tailwind',
    params.hasShadcn && 'shadcn/ui',
  ].filter(Boolean).join(', ')
  lines.push(`Stack: ${stack || 'unknown'}`)

  // File structure
  lines.push(`Import alias: ${params.importAlias}`)
  if (params.existingComponents.length > 0) {
    lines.push(`Existing components (reuse, do not recreate): ${params.existingComponents.slice(0, 10).join(', ')}`)
  }

  // Supabase
  if (params.supabaseClientPath !== 'not found') {
    lines.push(`Supabase client: import { ${params.supabaseClientExport} } from '${params.importAlias}${params.supabaseClientPath.replace('src/', 'lib/').replace('.ts', '')}'`)
  }
  if (params.tableNames.length > 0) {
    lines.push(`Known DB tables: ${params.tableNames.join(', ')}`)
  }

  // Auth
  if (params.authPattern !== 'unknown') {
    lines.push(`Auth pattern: ${params.authPattern} → use ${params.authHook} → user ID: ${params.userIdField}`)
  }

  // Design
  if (params.designTokenPrefix !== 'unknown') {
    lines.push(`Design tokens: use bg-${params.designTokenPrefix}-* and text-${params.designTokenPrefix}-* classes`)
    if (params.commonColorClasses.length > 0) {
      lines.push(`Most used classes: ${params.commonColorClasses.slice(0, 5).join(', ')}`)
    }
  }

  // Mobile
  if (params.bundleId !== 'not found') {
    lines.push(`Bundle ID: ${params.bundleId}`)
  }
  if (params.nativePlugins.length > 0) {
    lines.push(`Native plugins installed: ${params.nativePlugins.slice(0, 8).join(', ')}`)
  }

  // Deploy
  if (params.deployTarget !== 'unknown') {
    lines.push(`Deploy: ${params.deployTarget}${params.productionUrl !== 'unknown' ? ` → ${params.productionUrl}` : ''}`)
  }

  // Anti-guessing rules
  lines.push('')
  lines.push('## STRICT RULES — NO GUESSING ALLOWED')
  lines.push('- NEVER use mock/static/placeholder data')
  lines.push('- NEVER write TODO comments — fix it or ask')
  lines.push('- NEVER invent table names — use only the known tables listed above')
  lines.push('- NEVER recreate components that already exist — import and reuse')
  lines.push(`- ALWAYS use import alias: ${params.importAlias}`)
  if (params.supabaseClientExport !== 'unknown') {
    lines.push(`- ALWAYS use the Supabase client: ${params.supabaseClientExport} (not createClient directly)`)
  }

  if (params.warnings.length > 0) {
    lines.push('')
    lines.push(`⚠️ Could not auto-detect: ${params.warnings.join(', ')} — ask Roye before guessing`)
  }

  return lines.join('\n')
}
```

---

## AGENT 2 — Wire to IPC + DB cache

### Add to `database.ts` migration v10:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS parameters_json TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS parameters_extracted_at TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS parameters_confidence REAL DEFAULT 0;
```

### Add IPC handlers to `ipc.ts`:
```typescript
import { extractParameters, formatParametersForPrompt } from './parameter-extractor'

// Extract parameters from project codebase
ipcMain.handle('params:extract', async (_e, projectId: number) => {
  const project = getOne('SELECT repo_path, name FROM projects WHERE id = ?', [projectId])
  if (!project?.repo_path) return { error: 'No repo_path set for this project' }

  const params = await extractParameters(project.repo_path)

  // Cache in DB
  runQuery(
    'UPDATE projects SET parameters_json = ?, parameters_extracted_at = ?, parameters_confidence = ? WHERE id = ?',
    [JSON.stringify(params), params.extractedAt, params.confidence, projectId]
  )

  return params
})

// Get cached parameters
ipcMain.handle('params:get', (_e, projectId: number) => {
  const row = getOne(
    'SELECT parameters_json, parameters_extracted_at, parameters_confidence FROM projects WHERE id = ?',
    [projectId]
  )
  if (!row?.parameters_json) return null
  return {
    ...JSON.parse(row.parameters_json),
    extractedAt: row.parameters_extracted_at,
    confidence: row.parameters_confidence,
  }
})

// Format parameters for injection into prompt
ipcMain.handle('params:format-for-prompt', (_e, projectId: number) => {
  const row = getOne('SELECT parameters_json FROM projects WHERE id = ?', [projectId])
  if (!row?.parameters_json) return ''
  const { formatParametersForPrompt } = require('./parameter-extractor')
  return formatParametersForPrompt(JSON.parse(row.parameters_json))
})
```

### Add to `preload.ts`:
```typescript
'params:extract', 'params:get', 'params:format-for-prompt',
```

### Add to `api.ts`:
```typescript
export const extractProjectParams = (projectId: number) =>
  invoke('params:extract', projectId) as Promise<any>
export const getProjectParams = (projectId: number) =>
  invoke('params:get', projectId) as Promise<any>
export const formatParamsForPrompt = (projectId: number) =>
  invoke('params:format-for-prompt', projectId) as Promise<string>
```

### Update `generateMegaPrompt` in `ipc.ts`:
```typescript
// Before building the prompt, inject parameters:
ipcMain.handle(IPC_CHANNELS.PROMPTS_GENERATE, async (_e, args) => {
  // ... existing code ...

  // Auto-inject parameters if available
  let paramBlock = ''
  const paramRow = getOne('SELECT parameters_json FROM projects WHERE id = ?', [args.projectId])
  if (paramRow?.parameters_json) {
    const { formatParametersForPrompt } = require('./parameter-extractor')
    paramBlock = formatParametersForPrompt(JSON.parse(paramRow.parameters_json))
  }

  // Inject paramBlock into the prompt AFTER context section
  const prompt = generateMegaPrompt(fullProject, args.action, args.extraContext)
  return paramBlock ? prompt.replace('## LOCKED DECISIONS', paramBlock + '\n\n## LOCKED DECISIONS') : prompt
})
```

---

## AGENT 3 — Parameters Tab in ProjectDetail

### Add to `BASE_TABS`:
```typescript
const BASE_TABS = ['Overview', 'Memory', 'Tasks', 'Notes', 'Launcher', 'Metrics',
  'Decisions', 'Learnings', 'Activity', 'Prompt', 'Import', 'Params']
```

### Add render:
```tsx
{tab === 'Params' && <ParamsTab projectId={projectId} project={project} />}
```

### Create `ParamsTab` component inside `ProjectDetail.tsx`:

```tsx
function ParamsTab({ projectId, project }: { projectId: number; project: Project }) {
  const [params, setParams] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    api.getProjectParams(projectId).then(setParams).catch(() => {})
  }, [projectId])

  const extract = async () => {
    if (!project.repo_path) {
      toast('Set a repo path in Overview first', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await api.extractProjectParams(projectId)
      setParams(result)
      toast(`Parameters extracted — ${Math.round(result.confidence * 100)}% confidence`, 'success')
    } catch {
      toast('Extraction failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyForPrompt = async () => {
    const formatted = await api.formatParamsForPrompt(projectId)
    await navigator.clipboard.writeText(formatted)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Parameters copied — paste into any prompt', 'success')
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">🔬 Project Parameters</h3>
          <p className="text-xs text-dark-muted mt-0.5">
            Auto-extracted from codebase. Injected into every GPROMPT so Claude Code never guesses.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={extract}
            disabled={loading || !project.repo_path}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors disabled:opacity-40"
          >
            {loading ? '⏳ Extracting...' : '🔬 Extract'}
          </button>
          {params && (
            <button
              onClick={copyForPrompt}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 transition-colors"
            >
              {copied ? '✅ Copied' : '📋 Copy for prompt'}
            </button>
          )}
        </div>
      </div>

      {!project.repo_path && (
        <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
          ⚠️ Set a repo path in the Overview tab first (e.g., C:/Projects/9soccer)
        </div>
      )}

      {params && (
        <>
          {/* Confidence badge */}
          <div className={`text-xs px-3 py-1.5 rounded-lg border inline-flex items-center gap-2 ${
            params.confidence > 0.8 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            params.confidence > 0.6 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
            'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            Confidence: {Math.round(params.confidence * 100)}%
            <span className="opacity-60">· extracted {new Date(params.extractedAt).toLocaleString()}</span>
          </div>

          {/* Warnings */}
          {params.warnings?.length > 0 && (
            <div className="space-y-1">
              {params.warnings.map((w: string, i: number) => (
                <div key={i} className="text-xs text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/15 rounded px-3 py-1.5">
                  ⚠️ {w}
                </div>
              ))}
            </div>
          )}

          {/* Parameter sections */}
          {[
            { label: '📦 Stack', items: [
              params.isNextJs && 'Next.js',
              params.isCapacitor && 'Capacitor',
              params.isExpo && 'Expo',
              params.isNestJs && 'NestJS',
              params.isElectron && 'Electron',
              params.isTailwind && 'Tailwind CSS',
              params.hasShadcn && 'shadcn/ui',
            ].filter(Boolean) },
            { label: '🗂️ File Structure', items: [
              `Import alias: ${params.importAlias}`,
              `Components (${params.existingComponents.length}): ${params.existingComponents.slice(0,5).join(', ')}${params.existingComponents.length > 5 ? '...' : ''}`,
              `Hooks (${params.existingHooks.length}): ${params.existingHooks.slice(0,3).join(', ')}`,
            ] },
            { label: '🗄️ Supabase', items: [
              `Client: ${params.supabaseClientExport} from ${params.supabaseClientPath}`,
              params.tableNames.length > 0 && `Tables: ${params.tableNames.join(', ')}`,
            ].filter(Boolean) },
            { label: '🔐 Auth', items: [
              `Pattern: ${params.authPattern}`,
              `Hook: ${params.authHook}`,
              `User ID: ${params.userIdField}`,
            ] },
            { label: '🎨 Design', items: [
              `Token prefix: ${params.designTokenPrefix}`,
              params.commonColorClasses.length > 0 && `Top classes: ${params.commonColorClasses.slice(0,5).join(', ')}`,
            ].filter(Boolean) },
            { label: '📱 Mobile', items: [
              params.bundleId !== 'not found' && `Bundle ID: ${params.bundleId}`,
              params.nativePlugins.length > 0 && `Plugins: ${params.nativePlugins.slice(0,5).join(', ')}`,
            ].filter(Boolean) },
            { label: '🚀 Deploy', items: [
              `Target: ${params.deployTarget}`,
              params.productionUrl !== 'unknown' && `URL: ${params.productionUrl}`,
            ].filter(Boolean) },
          ].map(section => section.items.length > 0 && (
            <div key={section.label} className="bg-dark-bg border border-dark-border rounded-lg p-3">
              <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-2">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item, i) => (
                  <p key={i} className="text-xs text-dark-text font-mono">{item}</p>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {!params && !loading && project.repo_path && (
        <div className="text-center py-8 border border-dashed border-dark-border rounded-xl">
          <div className="text-3xl mb-2">🔬</div>
          <p className="text-sm text-dark-text mb-1">No parameters extracted yet</p>
          <p className="text-xs text-dark-muted">Click Extract to scan the codebase and eliminate Claude's guesswork</p>
        </div>
      )}
    </div>
  )
}
```

---

## AGENT 4 — ⭐ Golden Prompts System

### Add to `database.ts` migration v10:
```sql
ALTER TABLE prompt_usage ADD COLUMN IF NOT EXISTS is_starred INTEGER DEFAULT 0;
ALTER TABLE prompt_usage ADD COLUMN IF NOT EXISTS starred_at TEXT;
ALTER TABLE prompt_usage ADD COLUMN IF NOT EXISTS prompt_text TEXT;

CREATE TABLE IF NOT EXISTS golden_prompt_patterns (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  prompt_id TEXT NOT NULL,
  pattern TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Add IPC:
```typescript
// Star a prompt (save it to golden collection)
ipcMain.handle('prompts:star', (_e, args: { usageId: string; promptText: string }) => {
  runQuery(
    "UPDATE prompt_usage SET is_starred = 1, starred_at = datetime('now'), prompt_text = ? WHERE id = ?",
    [args.promptText, args.usageId]
  )
  return { ok: true }
})

// Get all starred prompts
ipcMain.handle('prompts:get-starred', () => {
  return getAll(`
    SELECT pu.*, p.name as project_name
    FROM prompt_usage pu
    LEFT JOIN projects p ON p.id = pu.project_id
    WHERE pu.is_starred = 1
    ORDER BY pu.starred_at DESC
  `)
})

// Analyze golden prompts — what do they have in common?
ipcMain.handle('prompts:analyze-golden', () => {
  const starred = getAll(`
    SELECT prompt_id, prompt_text, project_stage, project_category
    FROM prompt_usage
    WHERE is_starred = 1 AND prompt_text IS NOT NULL
    LIMIT 50
  `)

  // Group by prompt_id
  const byPrompt: Record<string, any[]> = {}
  for (const s of starred) {
    if (!byPrompt[s.prompt_id]) byPrompt[s.prompt_id] = []
    byPrompt[s.prompt_id].push(s)
  }

  const analysis: any[] = []
  for (const [promptId, prompts] of Object.entries(byPrompt)) {
    const stages = [...new Set(prompts.map(p => p.project_stage))]
    const categories = [...new Set(prompts.map(p => p.project_category))]
    analysis.push({
      promptId,
      starCount: prompts.length,
      stages,
      categories,
      insight: `Starred ${prompts.length}x — works best for: ${stages.join(', ')} stage, ${categories.join(', ')} category`,
    })
  }

  return analysis.sort((a, b) => b.starCount - a.starCount)
})
```

### Add to preload.ts:
```typescript
'params:extract', 'params:get', 'params:format-for-prompt',
'prompts:star', 'prompts:get-starred', 'prompts:analyze-golden',
```

### Add ⭐ button to PromptPage
In `PromptPage.tsx`, after generating a prompt and showing the copy button:
```tsx
{generatedPrompt && (
  <button
    onClick={async () => {
      // Log usage first (get the usage ID)
      const usage = await api.logPromptUsage({ promptType: 'action', promptId: selectedAction, projectId: project.id })
      // Star it
      await window.api.invoke('prompts:star', {
        usageId: usage.id,  // need to return ID from logPromptUsage
        promptText: generatedPrompt,
      })
      toast('⭐ Saved to Golden Collection', 'success')
    }}
    className="text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
  >
    ⭐ Star this prompt
  </button>
)}
```

Also update `logPromptUsage` IPC to return the new row ID:
```typescript
ipcMain.handle('prompts:log-usage', (_e, args) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  runInsert(
    'INSERT INTO prompt_usage (id, prompt_type, prompt_id, project_id) VALUES (?, ?, ?, ?)',
    [id, args.promptType, args.promptId, args.projectId ?? null]
  )
  return { ok: true, id }  // ← return the ID
})
```

---

## BUILD + COMMIT

```bash
cd C:/Projects/ZProjectManager
npx tsc --noEmit 2>&1 | tail -5
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat: parameter extractor + golden prompts + GPROMPT injection"
git push origin master
```

## APPEND TO SESSION FILE
```bash
cat >> C:/Projects/ZProjectManager/sessions/ZProjectManager_2026-03-21_${TIMESTAMP}.md << 'EOF'

## Sprint 8 — What shipped
- parameter-extractor.ts: reads codebase → extracts stack, Supabase client, tables, auth, design tokens, mobile config, deploy target
- formatParametersForPrompt(): converts parameters to STRICT RULES block
- Auto-inject: every GPROMPT now includes parameters block → zero guessing
- "Params" tab in ProjectDetail: Extract button, confidence score, all parameters displayed
- ⭐ Golden Prompts: star any prompt → DB → analyze what golden prompts have in common
- prompts:log-usage now returns ID for starring

## Architecture
Codebase → extractParameters() → ProjectParameters → formatParametersForPrompt() → injected into GPROMPT
Result: Claude Code gets exact file locations, exact table names, exact auth hooks, exact design tokens
No placeholders. No TODO. No static data. No guessing.

## Status
TypeScript: clean | Build: clean
EOF
```

---

## MEGA FINAL REPORT

| # | Agent | Status | Notes |
|---|-------|--------|-------|
| 1 | parameter-extractor.ts | ? | 9 detector functions, formatParametersForPrompt() |
| 2 | IPC + DB cache | ? | params:extract, params:get, params:format-for-prompt, auto-inject in generateMegaPrompt |
| 3 | Params tab in ProjectDetail | ? | Extract button, confidence, warnings, all fields displayed |
| 4 | ⭐ Golden Prompts | ? | Star button, get-starred, analyze-golden, log-usage returns ID |

TypeScript: clean?
Build: clean?
Session file saved?

Yes, allow all edits in components
