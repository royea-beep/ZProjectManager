// src/lib/crash-evidence.ts — Web version (adapted from Caps crash-evidence.ts)
// AsyncStorage → localStorage | captureScreen → html2canvas | AppState → visibilitychange

const SESSION_KEY = '9soccer_debug_session'
let sessionId = ''
let stepNumber = 0
let currentScreen = 'unknown'
let lastAction = 'none'
let consoleErrors: string[] = []

export function initSession(): string {
  sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  stepNumber = 0
  localStorage.setItem(SESSION_KEY, sessionId)
  localStorage.setItem('debug_last_launch', new Date().toISOString())
  localStorage.removeItem('debug_clean_exit')
  logStepToDB('lifecycle', 'Page loaded')
  return sessionId
}

// Continuous DB logging — batch every 5 seconds
let pendingSteps: Record<string, unknown>[] = []
let flushTimeout: ReturnType<typeof setTimeout> | null = null

function logStepToDB(type: string, description: string, screen?: string, data?: Record<string, unknown> | null) {
  stepNumber++
  pendingSteps.push({
    project: '9Soccer',
    session_id: sessionId,
    step_number: stepNumber,
    step_type: type,
    description,
    screen: screen || currentScreen,
    data: data || null,
  })

  if (!flushTimeout) {
    flushTimeout = setTimeout(flushToDB, 5000)
  }
  if (type === 'error' || type === 'screen_change') {
    flushToDB()
  }
}

async function flushToDB() {
  if (flushTimeout) { clearTimeout(flushTimeout); flushTimeout = null }
  if (pendingSteps.length === 0) return
  const batch = [...pendingSteps]
  pendingSteps = []
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url) return
    fetch(`${url}/rest/v1/debug_sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(batch),
    }).catch(() => {})
  } catch { /* silent */ }
}

export function setCurrentScreen(screen: string) {
  if (screen !== currentScreen) {
    currentScreen = screen
    logStepToDB('screen_change', `-> ${screen}`, screen)
  }
}

export function trackAction(action: string, data?: Record<string, unknown>) {
  lastAction = action
  logStepToDB('user_action', action, currentScreen, data)
}

export function trackError(error: string, data?: Record<string, unknown>) {
  logStepToDB('error', error, currentScreen, data)
}

// Capture console errors
export function startErrorCapture() {
  if (typeof window === 'undefined') return
  const orig = console.error
  console.error = (...args: unknown[]) => {
    consoleErrors.push(`[${new Date().toISOString().slice(11, 19)}] ${args.map(String).join(' ')}`)
    if (consoleErrors.length > 50) consoleErrors.shift()
    orig.apply(console, args)
  }
  window.addEventListener('error', (e) => {
    trackError(`[UNCAUGHT] ${e.message} at ${e.filename}:${e.lineno}`)
  })
  window.addEventListener('unhandledrejection', (e) => {
    trackError(`[PROMISE] ${String(e.reason)}`)
  })
}

// Clean exit tracking
export function setupVisibilityTracking() {
  if (typeof document === 'undefined') return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      localStorage.setItem('debug_clean_exit', 'true')
      flushToDB()
    }
  })
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('debug_clean_exit', 'true')
    flushToDB()
  })
}

// Generate crash code
export function generateCrashCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'CR-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Generate crash report
export async function generateCrashReport(error: { message: string; stack?: string; componentStack?: string }) {
  const crashCode = generateCrashCode()

  // Screenshot via html2canvas
  const screenshotUrls: string[] = []
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(document.body, { scale: 0.5, logging: false, useCORS: true })
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.5))
    if (blob) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const filename = `9soccer/crash-${crashCode}-${Date.now()}.jpg`
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url, key)
      const { data } = await supabase.storage.from('debug-screenshots').upload(filename, blob, { contentType: 'image/jpeg' })
      if (data) {
        const { data: urlData } = supabase.storage.from('debug-screenshots').getPublicUrl(filename)
        screenshotUrls.push(urlData.publicUrl)
      }
    }
  } catch { /* silent — screenshot optional */ }

  const report = {
    project: '9Soccer',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '3.4.6',
    crashCode,
    timestamp: new Date().toISOString(),
    error,
    lastScreen: currentScreen,
    lastAction,
    stepLog: pendingSteps.slice(-20),
    storageUrls: screenshotUrls,
    consoleErrors: [...consoleErrors],
    device: { platform: 'web', userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'unknown' },
    fixPrompt: '',
  }

  // Build fix prompt
  const stepHistory = report.stepLog.map((s) =>
    `  [${s['step_number']}] ${s['step_type']}: ${s['description']}`
  ).join('\n')

  report.fixPrompt = `## CRASH FIX: 9Soccer v${report.version} [${crashCode}]

Yes, allow all edits in components
Project: /c/Projects/90soccer

## ERROR
\`\`\`
${error.message}
\`\`\`

## STACK
\`\`\`
${error.stack || 'N/A'}
\`\`\`

## WHERE: ${currentScreen} -> ${lastAction}

## STEP LOG (last ${report.stepLog.length}):
${stepHistory}

## SCREENSHOTS:
${screenshotUrls.map((u, i) => `  ${i + 1}: ${u}`).join('\n') || '  none'}

## TASK
1. Read error + stack
2. Find the file/line
3. Fix it
4. npm run build -- must pass
5. git commit + push`

  // Save to DB
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    fetch(`${url}/rest/v1/crash_reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        project: '9Soccer', version: report.version, crash_code: crashCode,
        error_message: error.message, error_stack: error.stack || '',
        last_screen: currentScreen, last_action: lastAction,
        step_log: report.stepLog, screenshot_urls: screenshotUrls,
        console_errors: consoleErrors, fix_prompt: report.fixPrompt,
        device: report.device, status: 'new',
      }),
    }).catch(() => {})
  } catch { /* silent */ }

  // Send ntfy alert
  try {
    fetch('https://ntfy.sh/9soccer-bugs-roye', {
      method: 'POST',
      headers: {
        'Title': `[${crashCode}] 9Soccer: ${error.message.slice(0, 50)}`,
        'Priority': '5',
        'Tags': 'warning',
      },
      body: `[CRASH] ${crashCode}\nError: ${error.message.slice(0, 150)}\nScreen: ${currentScreen}\nAction: ${lastAction}\n\nFix: SELECT fix_prompt FROM crash_reports WHERE crash_code='${crashCode}'`,
    }).catch(() => {})
  } catch { /* silent */ }

  return report
}

// Dirty-shutdown check on page load
export async function checkDirtyShutdown() {
  try {
    const lastSession = localStorage.getItem(SESSION_KEY)
    const cleanExit = localStorage.getItem('debug_clean_exit')
    if (!lastSession || cleanExit === 'true') return

    // Dirty shutdown — pull steps from DB
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url) return

    const res = await fetch(
      `${url}/rest/v1/debug_sessions?session_id=eq.${lastSession}&order=step_number.desc&limit=20`,
      { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
    )
    const steps = await res.json() as Record<string, unknown>[]

    if (steps && steps.length > 0) {
      const lastStep = steps[0]
      const crashCode = generateCrashCode()
      const stepLog = steps.reverse()
      const stepHistory = stepLog.map((s) =>
        `  [${s['step_number']}] ${s['step_type']}: ${s['description']}`
      ).join('\n')

      // Save crash report
      fetch(`${url}/rest/v1/crash_reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          project: '9Soccer', version: process.env.NEXT_PUBLIC_APP_VERSION || '3.4.6',
          crash_code: crashCode,
          error_message: `Dirty shutdown after: ${String(lastStep['description'])}`,
          last_screen: String(lastStep['screen'] || 'unknown'), last_action: String(lastStep['description']),
          step_log: stepLog, screenshot_urls: [], console_errors: [],
          fix_prompt: `## DIRTY SHUTDOWN: 9Soccer [${crashCode}]\n\nYes, allow all edits in components\nProject: /c/Projects/90soccer\n\n## Last ${stepLog.length} steps:\n${stepHistory}\n\n## TASK\nCheck memory leaks, heavy renders on "${String(lastStep['screen'])}"`,
          device: { platform: 'web' }, status: 'new',
        }),
      }).catch(() => {})

      // ntfy alert
      fetch('https://ntfy.sh/9soccer-bugs-roye', {
        method: 'POST',
        headers: { 'Title': `[${crashCode}] 9Soccer dirty-shutdown`, 'Priority': '4' },
        body: `Last screen: ${String(lastStep['screen'])}\nLast action: ${String(lastStep['description'])}\n${stepLog.length} steps recovered`,
      }).catch(() => {})
    }
  } catch { /* silent */ }
}
