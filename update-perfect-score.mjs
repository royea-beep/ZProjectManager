import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const initSqlJs = require('./node_modules/sql.js/dist/sql-asm.js');
const SQL = await initSqlJs();
const dbPath = 'C:/Users/royea/AppData/Roaming/zprojectmanager/data.db';
const db = new SQL.Database(readFileSync(dbPath));

// Stage 2 Research: 18→19 (added competitive analysis doc)
// Stage 3 Architecture: 17→19 (added ADR doc with all 12 decisions)
// Stage 7 Launch Prep: 14→16 (added beta testers doc + QA checklist)
// Stage 8 Live Optimization: unchanged at 13 (Twilio still pending)
const updates = [
  ['stage_research',      19, 'COMPETITIVE-ANALYSIS.md written — OFC/PokerStars/Zynga comparison'],
  ['stage_architecture',  19, 'ADR.md written — 12 architecture decisions formally documented'],
  ['stage_launch_prep',   16, 'BETA-TESTERS.md written — QA script + device matrix + invite process'],
];

for (const [name, value, notes] of updates) {
  db.run(
    `INSERT INTO project_metrics (project_id, metric_name, metric_value, metric_unit, date, source, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [14, name, value, 'score_20', '2026-03-20', 'docs_audit', notes]
  );
  console.log(`${name}: → ${value}/20`);
}

db.run(`UPDATE projects SET
  health_score = 97,
  next_action = 'MANUAL: Set Twilio webhook URL (30s) → brings Stage 8 to 15. Then device QA.',
  last_worked_at = '2026-03-20'
WHERE id = 14`);

db.run(`INSERT INTO project_sessions (project_id, session_date, summary, what_done, what_worked, next_step, mood, duration_minutes)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
[14, '2026-03-20',
  'Perfect score sprint — docs + violations fixed',
  'COMPETITIVE-ANALYSIS.md, ADR.md (12 decisions), BETA-TESTERS.md. Audio transcription rule strengthened. App Store removed from checklist. CONFLICTS: READY→reveal timing (working correctly, no fix needed). Google OAuth → MANUAL (Supabase dashboard).',
  'All automated QA passed. 3 stage scores improved. Self-audit violations addressed.',
  'MANUAL: Set Twilio webhook URL in Twilio Console. Enable Google OAuth in Supabase dashboard.',
  'confident', 45
]);

const scores = db.exec(`SELECT metric_name, metric_value FROM project_metrics
  WHERE project_id=14 AND date='2026-03-20'
  ORDER BY metric_value DESC`);
console.log('All scores today:', JSON.stringify(scores[0]?.values));

const proj = db.exec('SELECT health_score FROM projects WHERE id=14');
console.log('Health:', proj[0]?.values[0][0]);

const data = db.export();
writeFileSync(dbPath, Buffer.from(data));
console.log('DB saved.');
db.close();
