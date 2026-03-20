import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const initSqlJs = require('./node_modules/sql.js/dist/sql-asm.js');
const SQL = await initSqlJs();
const dbPath = 'C:/Users/royea/AppData/Roaming/zprojectmanager/data.db';
const db = new SQL.Database(readFileSync(dbPath));

// Google OAuth verified: curl returns 302 → Google accounts with valid client_id
// stage_launch_prep: 16 → 18 (OAuth endpoint live + web redirect confirmed)
db.run(
  `INSERT INTO project_metrics (project_id, metric_name, metric_value, metric_unit, date, source, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [14, 'stage_launch_prep', 18, 'score_20', '2026-03-20', 'oauth_verify',
   'Google OAuth confirmed enabled in Supabase — curl 302→accounts.google.com, client_id 133353581092']
);
console.log('stage_launch_prep: → 18/20');

db.run(`UPDATE projects SET
  health_score = 98,
  next_action = 'MANUAL: (1) Add Supabase callback to Google Cloud Console. (2) Set Twilio webhook URL.',
  last_worked_at = '2026-03-20'
WHERE id = 14`);

const scores = db.exec(`SELECT metric_name, MAX(metric_value) as best
  FROM project_metrics WHERE project_id=14
  GROUP BY metric_name ORDER BY best DESC`);
console.log('Best scores:', JSON.stringify(scores[0]?.values));

const proj = db.exec('SELECT health_score FROM projects WHERE id=14');
console.log('Health:', proj[0]?.values[0][0]);

const data = db.export();
writeFileSync(dbPath, Buffer.from(data));
console.log('DB saved.');
db.close();
