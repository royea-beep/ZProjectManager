/**
 * activate_brain.js — Standalone Learning Brain activation
 * Runs without Electron: directly opens data.db via sql.js
 * Usage: node activate_brain.js
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('./node_modules/sql.js/dist/sql-wasm.js');

const DB_PATH = 'C:/Users/royea/AppData/Roaming/zprojectmanager/data.db';
const WASM_PATH = './node_modules/sql.js/dist/sql-wasm.wasm';
const SYNC_LOG_PATH = 'C:/Users/royea/AppData/Local/11STEPS2DONE/sessions_log.jsonl';
const SHARED_MEMORY_DIR = 'C:/Projects/_SHARED/memory';

const PROJECT_NAME_MAP = {
  '90soccer': '9soccer', '9soccer': '9soccer', 'caps': 'caps',
  'wingman': 'wingman', 'ftable': 'ftable', 'clubgg': 'clubgg',
  'explainit': 'explainit', 'analyzer': 'analyzer',
  'analyzer-standalone': 'analyzer', 'zprojectmanager': 'zprojectmanager',
  'letsmakebillions': 'letsmakebillions', 'cryptowhale': 'cryptowhale',
  'heroes': 'heroes', 'postpilot': 'postpilot', 'venuekit': 'venuekit',
  'keydrop': 'keydrop', 'general': 'general', 'secretsauce': 'secretsauce',
};

function normalizeProject(raw) {
  if (!raw) return 'general';
  const lower = raw.toLowerCase().replace(/[_s]/g, '-');
  if (PROJECT_NAME_MAP[lower]) return PROJECT_NAME_MAP[lower];
  for (const [key, val] of Object.entries(PROJECT_NAME_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return lower;
}

function qualityToSignals(q) {
  switch (q) {
    case 5: return { completed: 5, total: 5, questions: 0, errors: 0 };
    case 4: return { completed: 4, total: 5, questions: 0, errors: 0 };
    case 3: return { completed: 3, total: 5, questions: 1, errors: 1 };
    case 2: return { completed: 2, total: 5, questions: 2, errors: 2 };
    case 1: return { completed: 1, total: 5, questions: 3, errors: 3 };
    default: return { completed: 3, total: 5, questions: 1, errors: 1 };
  }
}

function gradeReport(completed, total, questions, errors) {
  const completeness = total > 0 ? (completed / total) * 10 : 5;
  const accuracy = Math.max(0, 10 - errors * 2);
  const efficiency = Math.max(0, 10 - questions * 1.5);
  const reusability = 5;
  const score = efficiency * 0.25 + accuracy * 0.30 + completeness * 0.35 + reusability * 0.10;
  return Math.round(score * 10) / 10;
}

function inferCategory(phase) {
  const p = (phase || '').toLowerCase();
  if (p.includes('qa')) return 'testing';
  if (p.includes('ux') || p.includes('design')) return 'design';
  if (p.includes('arch')) return 'architecture';
  if (p.includes('plan')) return 'planning';
  if (p.includes('publish') || p.includes('deploy')) return 'deployment';
  return 'development';
}

async function main() {
  console.log('=== LEARNING BRAIN ACTIVATION ===
');

  // 1. Load sql.js
  const wasmBinary = fs.readFileSync(WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });

  // 2. Open existing DB
  const dbBuf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(new Uint8Array(dbBuf));

  // Ensure final_reports table exists
  db.run(`CREATE TABLE IF NOT EXISTS final_reports (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    sprint TEXT,
    terminal TEXT,
    prompt_file TEXT,
    prompt_category TEXT,
    prompt_action TEXT,
    prompt_hebrew_input TEXT,
    tasks_json TEXT,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    bot_questions_asked INTEGER DEFAULT 0,
    errors_encountered INTEGER DEFAULT 0,
    rollbacks_needed INTEGER DEFAULT 0,
    files_changed INTEGER DEFAULT 0,
    lines_added INTEGER DEFAULT 0,
    lines_removed INTEGER DEFAULT 0,
    gems_json TEXT,
    blockers_json TEXT,
    decisions_json TEXT,
    commit_hash TEXT,
    commit_message TEXT,
    branch TEXT DEFAULT 'master',
    grade_score REAL,
    grade_json TEXT,
    raw_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_fr_project ON final_reports(project)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fr_grade ON final_reports(grade_score)`);

  db.run(`CREATE TABLE IF NOT EXISTS prompt_patterns (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    category TEXT NOT NULL,
    project TEXT NOT NULL,
    description TEXT,
    template TEXT,
    example_report_id TEXT,
    avg_score REAL DEFAULT 0,
    times_used INTEGER DEFAULT 1,
    times_reused INTEGER DEFAULT 0,
    projects_used_in TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  function getAll(sql, params) {
    if (!params) params = [];
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (e) { return []; }
  }

  function getOne(sql, params) {
    return getAll(sql, params)[0];
  }

  function runQuery(sql, params) {
    if (!params) params = [];
    try { db.run(sql, params); } catch (e) { /* ignore */ }
  }

  // 3. Import from sync log
  console.log('📥 Reading daily sync log...');
  let syncImported = 0, syncSkipped = 0, syncErrors = 0;

  if (fs.existsSync(SYNC_LOG_PATH)) {
    const rawContent = fs.readFileSync(SYNC_LOG_PATH, 'utf-8');
    const lines = rawContent.trim().split('
').filter(function(l) { return l.trim().length > 0; });
    console.log('   Found ' + lines.length + ' entries in sync log');

    const groups = new Map();
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const dateStr = (entry.modified || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
        const proj = normalizeProject(entry.project || '');
        const phase = (entry.phase || 'dev').toLowerCase();
        const key = proj + '|' + dateStr + '|' + phase;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(entry);
      } catch (e) { syncErrors++; }
    }

    console.log('   Grouped into ' + groups.size + ' sessions (project+date+phase)');

    for (const [key, entries] of groups) {
      try {
        const parts = key.split('|');
        const proj = parts[0];
        const dateStr = parts[1];
        const phase = parts[2];
        const promptFile = 'synclog_' + proj + '_' + dateStr.replace(/-/g, '') + '_' + phase + '.auto';

        const existing = getOne('SELECT id FROM final_reports WHERE prompt_file = ?', [promptFile]);
        if (existing) { syncSkipped++; continue; }

        const qualities = entries.map(function(e) { return e.quality || 3; }).sort(function(a, b) { return a - b; });
        const medianQ = qualities[Math.floor(qualities.length / 2)];
        const signals = qualityToSignals(medianQ);
        const totalTurns = entries.reduce(function(s, e) { return s + (e.total_turns || 0); }, 0);
        const score = gradeReport(signals.completed, signals.total, signals.questions, signals.errors);

        const randSuffix = Math.random().toString(36).slice(2, 5);
        const id = proj + '_synclog_' + dateStr.replace(/-/g, '') + '_' + phase + '_' + randSuffix;
        const category = inferCategory(phase);

        runQuery(
          'INSERT INTO final_reports (id, project, timestamp, duration_minutes, sprint, terminal, prompt_file, prompt_category, prompt_action, prompt_hebrew_input, tasks_json, total_tasks, completed_tasks, failed_tasks, bot_questions_asked, errors_encountered, rollbacks_needed, files_changed, lines_added, lines_removed, gems_json, blockers_json, decisions_json, commit_hash, commit_message, branch, grade_score, raw_json, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime("now"))',
          [id, proj, dateStr + 'T12:00:00.000Z', Math.min(totalTurns * 2, 240),
           '', proj.toUpperCase(), promptFile, category,
           phase + '-session', '', '[]', signals.total, signals.completed,
           signals.total - signals.completed, signals.questions, signals.errors,
           0, entries.length, 0, 0, '[]', '[]', '[]',
           '', phase + ' session (' + entries.length + ' files)', 'master', score,
           JSON.stringify({ id: id, project: proj, phase: phase, entries: entries.length, score: score })]
        );

        syncImported++;

        if (score >= 8.0) {
          const patternId = proj + '_' + category + '_' + phase;
          const existingP = getOne('SELECT id FROM prompt_patterns WHERE id = ?', [patternId]);
          if (!existingP) {
            runQuery(
              'INSERT INTO prompt_patterns (id, action, category, project, description, avg_score, times_used, projects_used_in, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,datetime("now"),datetime("now"))',
              [patternId, phase + '-session', category, proj,
               'High-quality ' + phase + ' session for ' + proj + ' (quality ' + medianQ + '/5)',
               score, 1, JSON.stringify([proj])]
            );
          }
        }
      } catch (e) { syncErrors++; }
    }
  } else {
    console.log('   WARNING: Sync log not found at ' + SYNC_LOG_PATH);
  }

  // 4. Scan .md session files
  console.log('
📂 Scanning project session directories...');
  const SESSION_ROOTS = [
    { dir: 'C:/Projects/90soccer/docs/sessions', project: '9soccer' },
    { dir: 'C:/Projects/Caps/sessions', project: 'caps' },
    { dir: 'C:/Projects/Wingman/sessions', project: 'wingman' },
    { dir: 'C:/Projects/Wingman/docs/sessions', project: 'wingman' },
    { dir: 'C:/Projects/ZProjectManager/sessions', project: 'zprojectmanager' },
    { dir: 'C:/Projects/analyzer-standalone/sessions', project: 'analyzer' },
    { dir: 'C:/Projects/PostPilot/sessions', project: 'postpilot' },
    { dir: 'C:/Projects/clubgg/sessions', project: 'clubgg' },
    { dir: 'C:/Projects/ExplainIt/sessions', project: 'explainit' },
    { dir: 'C:/Projects/VenueKit/sessions', project: 'venuekit' },
    { dir: 'C:/Projects/KeyDrop/sessions', project: 'keydrop' },
    { dir: 'C:/Projects/ftable/sessions', project: 'ftable' },
    { dir: 'C:/Projects/letsmakebillions/sessions', project: 'letsmakebillions' },
    { dir: 'C:/Projects/_SHARED/sessions', project: 'general' },
  ];

  let mdImported = 0, mdSkipped = 0;
  for (const root of SESSION_ROOTS) {
    if (!fs.existsSync(root.dir)) continue;
    let files;
    try { files = fs.readdirSync(root.dir); } catch (e) { continue; }
    for (const file of files) {
      if (!file.endsWith('.md') && !file.endsWith('.json')) continue;
      if (file === 'README.md') continue;
      const filepath = path.join(root.dir, file);
      try {
        const content = fs.readFileSync(filepath, 'utf-8');
        if (content.length < 50) continue;
        const existing = getOne('SELECT id FROM final_reports WHERE prompt_file = ?', [file]);
        if (existing) { mdSkipped++; continue; }

        const completedCount = (content.match(/✅/g) || []).length;
        const failedCount = (content.match(/🚨/g) || []).length;
        const total = Math.max(completedCount + failedCount, 1);
        const score = gradeReport(completedCount, total, 0, Math.min(failedCount, 3));

        const dateMatch = file.match(/(d{4}-d{2}-d{2})/);
        const timestamp = dateMatch ? dateMatch[1] + 'T12:00:00.000Z' : new Date().toISOString();
        const safeFile = file.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
        const randSuffix = Math.random().toString(36).slice(2, 5);
        const id = root.project + '_md_' + safeFile + '_' + randSuffix;

        runQuery(
          'INSERT INTO final_reports (id, project, timestamp, duration_minutes, sprint, terminal, prompt_file, prompt_category, prompt_action, prompt_hebrew_input, tasks_json, total_tasks, completed_tasks, failed_tasks, bot_questions_asked, errors_encountered, rollbacks_needed, files_changed, lines_added, lines_removed, gems_json, blockers_json, decisions_json, commit_hash, commit_message, branch, grade_score, raw_json, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime("now"))',
          [id, root.project, timestamp, 60, '', root.project.toUpperCase(), file, 'sprint',
           file.replace(/.md$/, '').slice(0, 60), '', '[]', total, completedCount, failedCount,
           0, Math.min(failedCount, 2), 0, 0, 0, 0, '[]', '[]', '[]',
           '', file, 'master', score,
           JSON.stringify({ id: id, project: root.project, file: file })]
        );
        mdImported++;
      } catch (e) { continue; }
    }
  }
  console.log('   Imported ' + mdImported + ' .md session files, skipped ' + mdSkipped);

  // 5. Save DB
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  // 6. Rebuild shared memory index
  try {
    if (fs.existsSync(SHARED_MEMORY_DIR)) {
      const allRows = getAll('SELECT project, COUNT(*) as cnt, AVG(grade_score) as avg FROM final_reports GROUP BY project');
      const index = { updated: new Date().toISOString(), projects: {} };
      for (const r of allRows) {
        index.projects[r.project] = { count: r.cnt, avgGrade: r.avg ? Math.round(Number(r.avg) * 10) / 10 : 0 };
      }
      fs.writeFileSync(path.join(SHARED_MEMORY_DIR, 'index.json'), JSON.stringify(index, null, 2));

      const patterns = getAll('SELECT * FROM prompt_patterns ORDER BY avg_score DESC LIMIT 50');
      fs.writeFileSync(path.join(SHARED_MEMORY_DIR, 'skills.json'), JSON.stringify(patterns, null, 2));
      console.log('
💾 Shared memory index + skills.json updated');
    }
  } catch (e) { console.log('   (shared memory dir not writable: ' + e.message + ')'); }

  // 7. Print stats
  const totalRow = getOne('SELECT COUNT(*) as cnt FROM final_reports');
  const byProject = getAll('SELECT project, COUNT(*) as cnt FROM final_reports GROUP BY project ORDER BY cnt DESC');
  const excellent = getOne('SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 9') || { c: 0 };
  const good = getOne('SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 7 AND grade_score < 9') || { c: 0 };
  const mediocre = getOne('SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 5 AND grade_score < 7') || { c: 0 };
  const poor = getOne('SELECT COUNT(*) as c FROM final_reports WHERE grade_score < 5 AND grade_score IS NOT NULL') || { c: 0 };
  const avgGradeRow = getOne('SELECT AVG(grade_score) as avg FROM final_reports WHERE grade_score IS NOT NULL') || { avg: 0 };
  const patternCount = getOne('SELECT COUNT(*) as cnt FROM prompt_patterns') || { cnt: 0 };
  const topPatterns = getAll('SELECT action, category, project, avg_score FROM prompt_patterns ORDER BY avg_score DESC LIMIT 5');

  console.log('
LEARNING BRAIN — ACTIVATION REPORT');
  console.log('===================================');
  console.log('Sync log:   imported=' + syncImported + '  skipped=' + syncSkipped + '  errors=' + syncErrors);
  console.log('MD files:   imported=' + mdImported + '  skipped=' + mdSkipped);
  console.log('Total in DB: ' + totalRow.cnt);
  console.log('');
  console.log('PER PROJECT:');
  const knownProjects = ['9soccer','caps','wingman','ftable','clubgg','explainit','analyzer','zprojectmanager','letsmakebillions','cryptowhale','heroes','postpilot','venuekit','keydrop','general'];
  const byProjMap = {};
  for (const r of byProject) byProjMap[String(r.project)] = r.cnt;
  for (const p of knownProjects) {
    const cnt = byProjMap[p] || 0;
    if (cnt > 0) console.log('  ' + p.padEnd(20) + ': ' + cnt + ' reports');
  }
  for (const r of byProject) {
    if (!knownProjects.includes(String(r.project))) {
      console.log('  ' + String(r.project).padEnd(20) + ': ' + r.cnt + ' reports (unknown)');
    }
  }
  console.log('');
  console.log('GRADE DISTRIBUTION:');
  console.log('  9.0-10.0: ' + excellent.c + ' reports (excellent)');
  console.log('  7.0-8.9:  ' + good.c + ' reports (good)');
  console.log('  5.0-6.9:  ' + mediocre.c + ' reports (mediocre)');
  console.log('  0.0-4.9:  ' + poor.c + ' reports (poor)');
  console.log('  Average:  ' + (avgGradeRow.avg ? Number(avgGradeRow.avg).toFixed(1) : 'N/A'));
  console.log('');
  console.log('PATTERNS EXTRACTED: ' + patternCount.cnt);
  if (topPatterns.length > 0) {
    console.log('  Top patterns:');
    topPatterns.forEach(function(p, i) {
      console.log('  ' + (i+1) + '. [' + p.category + '/' + p.action + '] ' + p.project + ' — score ' + Number(p.avg_score).toFixed(1));
    });
  }
  console.log('');
  console.log('SKILLS.JSON: ' + patternCount.cnt + ' entries');
  console.log('INDEX.JSON:  ' + Object.keys(byProjMap).length + ' projects');

  db.close();
  console.log('
Done. DB saved to ' + DB_PATH);
}

main().catch(function(e) { console.error('FATAL:', e); process.exit(1); });
