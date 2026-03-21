import * as fs from 'fs';
import * as path from 'path';

export interface ProjectParameter {
  key: string;
  category: string;
  value: string | null;
  isAutoExtracted: boolean;
}

export interface ExtractedParameters {
  // Structure
  srcPath: string | null;
  importAlias: string | null;
  componentPaths: string[];
  pagesPaths: string[];
  // Stack
  framework: string | null; // next.js | react | capacitor | expo | electron | express
  isCapacitor: boolean;
  isExpo: boolean;
  isNextJs: boolean;
  isElectron: boolean;
  isVanillaJs: boolean;
  // Supabase
  supabaseClientPath: string | null;
  supabaseClientExport: string | null;
  supabaseTableNames: string[];
  // Auth
  authPattern: string | null; // useUser | useSession | getServerSession | auth()
  userIdField: string | null;
  // Design
  stylingSystem: string | null; // tailwind | css-modules | styled-components
  hasDesignTokens: boolean;
  colorTokenSample: string[];
  // State
  stateManager: string | null; // useState | zustand | jotai | redux | context
  serverState: string | null; // react-query | swr | manual
  // Components available
  existingComponents: string[];
  // Bundle / Deployment
  bundleId: string | null;
  deployTarget: string | null; // vercel | railway | cpanel | electron
  // Misc
  apiResponseFormat: string | null;
  errorHandlingPattern: string | null;
}

function safeReadFile(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch { /* ignore */ }
  return null;
}

function safeReadJson(filePath: string): Record<string, unknown> | null {
  const content = safeReadFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch { return null; }
}

function walkDir(dir: string, ext: string[], maxDepth = 4, _depth = 0): string[] {
  if (_depth > maxDepth) return [];
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        results.push(...walkDir(fullPath, ext, maxDepth, _depth + 1));
      } else if (ext.some(x => e.name.endsWith(x))) {
        results.push(fullPath);
      }
    }
  } catch { /* ignore */ }
  return results;
}

function grepInFiles(files: string[], patterns: RegExp[]): string[] {
  const matches: string[] = [];
  for (const file of files) {
    const content = safeReadFile(file);
    if (!content) continue;
    for (const pattern of patterns) {
      const found = content.match(pattern);
      if (found) {
        matches.push(...found);
      }
    }
  }
  return [...new Set(matches)];
}

function grepFirst(files: string[], pattern: RegExp): string | null {
  for (const file of files) {
    const content = safeReadFile(file);
    if (!content) continue;
    const match = content.match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
}

export function extractProjectParameters(projectPath: string): ExtractedParameters {
  if (!fs.existsSync(projectPath)) {
    return getEmptyParams();
  }

  const tsFiles = walkDir(projectPath, ['.ts', '.tsx', '.js', '.jsx'], 5);
  const srcDir = fs.existsSync(path.join(projectPath, 'src')) ? path.join(projectPath, 'src') : projectPath;

  // ---- Stack Detection ----
  const isCapacitor = fs.existsSync(path.join(projectPath, 'capacitor.config.ts'))
    || fs.existsSync(path.join(projectPath, 'capacitor.config.js'));
  const isExpo = fs.existsSync(path.join(projectPath, 'app.json'))
    && !!safeReadJson(path.join(projectPath, 'app.json'))?.expo;
  const isNextJs = fs.existsSync(path.join(projectPath, 'next.config.ts'))
    || fs.existsSync(path.join(projectPath, 'next.config.js'))
    || fs.existsSync(path.join(projectPath, 'next.config.mjs'));
  const pkg = safeReadJson(path.join(projectPath, 'package.json')) as Record<string, Record<string, string>> | null;
  const isElectron = fs.existsSync(path.join(projectPath, 'electron.vite.config.ts'))
    || !!(pkg?.dependencies?.['electron']);
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const isVanillaJs = !deps['react'] && !deps['vue'] && !deps['svelte'];

  // ---- Framework ----
  let framework: string | null = null;
  if (isElectron) framework = 'electron';
  else if (isNextJs) framework = 'next.js';
  else if (isCapacitor) framework = 'capacitor';
  else if (isExpo) framework = 'expo';
  else if (deps['react']) framework = 'react';
  else if (deps['express'] || deps['fastify'] || deps['@nestjs/core']) framework = 'node-api';

  // ---- Import Alias ----
  let importAlias: string | null = null;
  const tsconfig = safeReadJson(path.join(projectPath, 'tsconfig.json')) as Record<string, { paths?: Record<string, string[]> }> | null;
  if (tsconfig?.compilerOptions?.paths) {
    const paths = tsconfig.compilerOptions.paths;
    const firstKey = Object.keys(paths)[0];
    if (firstKey) {
      importAlias = firstKey.replace('/*', ''); // e.g. '@/' or '~/'
    }
  }

  // ---- Supabase ----
  const supabaseFiles = tsFiles.filter(f =>
    f.includes('supabase') && !f.includes('node_modules')
  );
  const supabaseClientPath = supabaseFiles.length > 0
    ? supabaseFiles[0].replace(projectPath + path.sep, '').replace(/\\/g, '/')
    : null;

  let supabaseClientExport: string | null = null;
  if (supabaseClientPath) {
    const content = safeReadFile(path.join(projectPath, supabaseClientPath));
    if (content) {
      const exportMatch = content.match(/export\s+(?:const\s+)?(\w+)\s*=\s*createClient/);
      if (exportMatch) supabaseClientExport = exportMatch[1];
    }
  }

  // Extract table names from .from('tableName') calls
  const tableMatches = grepInFiles(tsFiles, [/\.from\(['"`]([a-zA-Z_][a-zA-Z0-9_]*?)['"`]\)/g]);
  const supabaseTableNames = [...new Set(
    tableMatches
      .map(m => m.match(/\.from\(['"`]([a-zA-Z_][a-zA-Z0-9_]*?)['"`]\)/)?.[1])
      .filter((t): t is string => !!t && t.length > 0)
  )].slice(0, 20);

  // ---- Auth Pattern ----
  const authPatterns = [
    { pattern: /useUser\(\)/, label: 'useUser()' },
    { pattern: /useSession\(\)/, label: 'useSession()' },
    { pattern: /getServerSession\(/, label: 'getServerSession()' },
    { pattern: /auth\(\)\.userId/, label: 'auth().userId' },
    { pattern: /useAuthStore/, label: 'useAuthStore' },
    { pattern: /useAuth\(\)/, label: 'useAuth()' },
    { pattern: /supabase\.auth\.getUser/, label: 'supabase.auth.getUser()' },
  ];
  let authPattern: string | null = null;
  for (const { pattern, label } of authPatterns) {
    if (grepFirst(tsFiles, pattern)) {
      authPattern = label;
      break;
    }
  }

  // User ID field
  const userIdPatterns = [
    { pattern: /user\.id\b/, label: 'user.id' },
    { pattern: /user\.userId\b/, label: 'user.userId' },
    { pattern: /session\.user\.id\b/, label: 'session.user.id' },
    { pattern: /userId\b/, label: 'userId' },
  ];
  let userIdField: string | null = null;
  for (const { pattern, label } of userIdPatterns) {
    if (grepFirst(tsFiles, pattern)) {
      userIdField = label;
      break;
    }
  }

  // ---- Design System ----
  let stylingSystem: string | null = null;
  if (deps['tailwindcss']) stylingSystem = 'tailwind';
  else if (deps['styled-components']) stylingSystem = 'styled-components';
  else if (tsFiles.some(f => f.endsWith('.module.css'))) stylingSystem = 'css-modules';

  // Detect design tokens (custom Tailwind classes like bg-dark-*)
  const hasDesignTokens = grepFirst(tsFiles, /bg-dark-|text-dark-|accent-blue|accent-green|accent-red/) !== null;
  const colorSamples: string[] = [];
  if (hasDesignTokens) {
    const matches = grepInFiles(tsFiles.slice(0, 20), [/(bg-dark-\w+|text-dark-\w+|bg-accent-\w+|text-accent-\w+)/g]);
    colorSamples.push(...[...new Set(matches)].slice(0, 6));
  }

  // ---- State Management ----
  let stateManager: string | null = null;
  if (deps['zustand']) stateManager = 'zustand';
  else if (deps['jotai']) stateManager = 'jotai';
  else if (deps['@reduxjs/toolkit'] || deps['redux']) stateManager = 'redux';
  else if (grepFirst(tsFiles.slice(0, 30), /createContext\(|useContext\(/)) stateManager = 'context';
  else stateManager = 'useState';

  let serverState: string | null = null;
  if (deps['@tanstack/react-query'] || deps['react-query']) serverState = 'react-query';
  else if (deps['swr']) serverState = 'swr';

  // ---- Components ----
  const componentDirs = [
    path.join(srcDir, 'components'),
    path.join(srcDir, 'renderer', 'components'),
    path.join(srcDir, 'ui'),
    path.join(srcDir, 'shared', 'components'),
  ];
  const existingComponents: string[] = [];
  for (const dir of componentDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir).filter(f => f.match(/\.(tsx|jsx)$/));
        existingComponents.push(...files.map(f => f.replace(/\.(tsx|jsx)$/, '')));
      } catch { /* ignore */ }
    }
  }

  // ---- Src / Pages structure ----
  const getSrcSubdirs = (base: string) => {
    try {
      if (!fs.existsSync(base)) return [];
      return fs.readdirSync(base, { withFileTypes: true })
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => e.name);
    } catch { return []; }
  };

  const componentPaths = componentDirs.filter(d => fs.existsSync(d))
    .map(d => d.replace(projectPath + path.sep, '').replace(/\\/g, '/'));

  const pageDirs = [
    path.join(srcDir, 'pages'),
    path.join(srcDir, 'renderer', 'pages'),
    path.join(srcDir, 'app'),
  ];
  const pagesPaths = pageDirs.filter(d => fs.existsSync(d))
    .map(d => d.replace(projectPath + path.sep, '').replace(/\\/g, '/'));

  // ---- Bundle ID (Capacitor/Expo) ----
  let bundleId: string | null = null;
  if (isCapacitor) {
    const capConfig = safeReadFile(path.join(projectPath, 'capacitor.config.ts'))
      || safeReadFile(path.join(projectPath, 'capacitor.config.js'));
    if (capConfig) {
      const match = capConfig.match(/appId:\s*['"`]([^'"`]+)['"`]/);
      if (match) bundleId = match[1];
    }
  }
  if (isExpo && !bundleId) {
    const appJson = safeReadJson(path.join(projectPath, 'app.json')) as Record<string, Record<string, unknown>> | null;
    const expoSection = appJson?.expo;
    if (expoSection?.ios) {
      bundleId = (expoSection.ios as Record<string, string>).bundleIdentifier || null;
    }
  }

  // ---- Deploy Target ----
  let deployTarget: string | null = null;
  if (fs.existsSync(path.join(projectPath, 'vercel.json'))) deployTarget = 'vercel';
  else if (fs.existsSync(path.join(projectPath, 'railway.json')) || fs.existsSync(path.join(projectPath, 'railway.toml'))) deployTarget = 'railway';
  else if (fs.existsSync(path.join(projectPath, 'deploy.sh'))) deployTarget = 'cpanel-ftp';
  else if (isElectron) deployTarget = 'electron-app';
  else if (isCapacitor) deployTarget = 'ios-testflight';
  else if (isExpo) deployTarget = 'eas';

  // ---- API Response Format ----
  const apiResponseFormat = grepFirst(tsFiles, /\{.*?data:.*?error:|\{.*?success:.*?result:|NextResponse\.json\(/) !== null
    ? grepFirst(tsFiles, /\{\s*data:/) ? '{ data, error }' : '{ success, result }'
    : null;

  // ---- Error Handling ----
  const errorHandlingPattern = deps['zod']
    ? 'zod validation'
    : grepFirst(tsFiles, /Result<T|ApiError\(/) !== null
      ? 'Result<T, E>'
      : 'try/catch + return 500';

  return {
    srcPath: srcDir !== projectPath ? srcDir.replace(projectPath + path.sep, '').replace(/\\/g, '/') : null,
    importAlias,
    componentPaths,
    pagesPaths,
    framework,
    isCapacitor,
    isExpo,
    isNextJs,
    isElectron,
    isVanillaJs,
    supabaseClientPath,
    supabaseClientExport,
    supabaseTableNames,
    authPattern,
    userIdField,
    stylingSystem,
    hasDesignTokens,
    colorTokenSample: colorSamples,
    stateManager,
    serverState,
    existingComponents: [...new Set(existingComponents)].slice(0, 30),
    bundleId,
    deployTarget,
    apiResponseFormat,
    errorHandlingPattern,
  };
}

function getEmptyParams(): ExtractedParameters {
  return {
    srcPath: null, importAlias: null, componentPaths: [], pagesPaths: [],
    framework: null, isCapacitor: false, isExpo: false, isNextJs: false, isElectron: false, isVanillaJs: false,
    supabaseClientPath: null, supabaseClientExport: null, supabaseTableNames: [],
    authPattern: null, userIdField: null,
    stylingSystem: null, hasDesignTokens: false, colorTokenSample: [],
    stateManager: null, serverState: null,
    existingComponents: [], bundleId: null, deployTarget: null,
    apiResponseFormat: null, errorHandlingPattern: null,
  };
}

// Converts extracted params to flat key-value for DB storage
export function parametersToDbRows(params: ExtractedParameters): Array<{ key: string; category: string; value: string | null }> {
  const rows: Array<{ key: string; category: string; value: string | null }> = [];
  const add = (key: string, category: string, value: string | string[] | boolean | null) => {
    let v: string | null = null;
    if (Array.isArray(value)) v = value.length > 0 ? value.join(', ') : null;
    else if (typeof value === 'boolean') v = value ? 'true' : 'false';
    else v = value;
    rows.push({ key, category, value: v });
  };

  add('srcPath', 'structure', params.srcPath);
  add('importAlias', 'structure', params.importAlias);
  add('componentPaths', 'structure', params.componentPaths);
  add('pagesPaths', 'structure', params.pagesPaths);

  add('framework', 'stack', params.framework);
  add('isCapacitor', 'stack', params.isCapacitor);
  add('isExpo', 'stack', params.isExpo);
  add('isNextJs', 'stack', params.isNextJs);
  add('isElectron', 'stack', params.isElectron);
  add('isVanillaJs', 'stack', params.isVanillaJs);
  add('bundleId', 'stack', params.bundleId);
  add('deployTarget', 'stack', params.deployTarget);

  add('supabaseClientPath', 'supabase', params.supabaseClientPath);
  add('supabaseClientExport', 'supabase', params.supabaseClientExport);
  add('supabaseTableNames', 'supabase', params.supabaseTableNames);

  add('authPattern', 'auth', params.authPattern);
  add('userIdField', 'auth', params.userIdField);

  add('stylingSystem', 'design', params.stylingSystem);
  add('hasDesignTokens', 'design', params.hasDesignTokens);
  add('colorTokenSample', 'design', params.colorTokenSample);

  add('stateManager', 'state', params.stateManager);
  add('serverState', 'state', params.serverState);

  add('existingComponents', 'components', params.existingComponents);

  add('apiResponseFormat', 'api', params.apiResponseFormat);
  add('errorHandlingPattern', 'api', params.errorHandlingPattern);

  return rows;
}

// Format params as GPROMPT context block to inject into prompts
export function formatParamsAsContext(params: Record<string, string | null>): string {
  const lines: string[] = ['## PROJECT PARAMETERS (auto-extracted — use exactly, no guessing)'];

  const grouped: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!value || value === 'false' || value === '') continue;
    const cat = getParamCategory(key);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(`${key}: ${value}`);
  }

  for (const [cat, entries] of Object.entries(grouped)) {
    if (entries.length === 0) continue;
    lines.push(`\n### ${cat.toUpperCase()}`);
    for (const e of entries) lines.push(`- ${e}`);
  }

  lines.push('\n## RULES');
  lines.push('- Use ONLY the paths/patterns/names listed above');
  lines.push('- Do NOT create files/functions that already exist');
  lines.push('- Do NOT use placeholder/mock/TODO');
  lines.push('- Do NOT guess any parameter — if something is missing, say "MISSING: X" and stop');

  return lines.join('\n');
}

const PARAM_CATEGORY_MAP: Record<string, string> = {
  srcPath: 'structure', importAlias: 'structure', componentPaths: 'structure', pagesPaths: 'structure',
  framework: 'stack', isCapacitor: 'stack', isExpo: 'stack', isNextJs: 'stack', isElectron: 'stack',
  isVanillaJs: 'stack', bundleId: 'stack', deployTarget: 'stack',
  supabaseClientPath: 'supabase', supabaseClientExport: 'supabase', supabaseTableNames: 'supabase',
  authPattern: 'auth', userIdField: 'auth',
  stylingSystem: 'design', hasDesignTokens: 'design', colorTokenSample: 'design',
  stateManager: 'state', serverState: 'state',
  existingComponents: 'components',
  apiResponseFormat: 'api', errorHandlingPattern: 'api',
};

export function getParamCategory(key: string): string {
  return PARAM_CATEGORY_MAP[key] || 'general';
}
