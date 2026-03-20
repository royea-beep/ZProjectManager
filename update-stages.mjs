import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const initSqlJs = require('./node_modules/sql.js/dist/sql-asm.js');
const SQL = await initSqlJs();
const dbPath = 'C:/Users/royea/AppData/Roaming/zprojectmanager/data.db';
const db = new SQL.Database(readFileSync(dbPath));

// Check project_metrics table
const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='project_metrics'");
console.log('project_metrics table:', tables.length > 0 ? 'EXISTS' : 'MISSING');

const stages = [
  ['stage_concept',        20, 'Fully defined: game rules, Iron Rules, brand, goal'],
  ['stage_research',       18, 'Tech stack well-researched; missing formal competitive analysis'],
  ['stage_architecture',   17, 'rv() system, Zustand, expo-router; newArch off (lib debt)'],
  ['stage_setup',          19, 'EAS+Vercel+Supabase+CI fully configured; missing auto web deploy'],
  ['stage_development',    18, '115/115 tests, all features done; device QA pending for new features'],
  ['stage_content_assets', 15, 'Icon+sounds+screenshots done; no marketing video or App Store copy'],
  ['stage_launch_prep',    14, 'Web live, TestFlight #117; App Store track paused by user'],
  ['stage_live_optimization', 13, 'Bug reporter+WhatsApp bot live; Twilio webhook pending, no real users yet'],
];

for (const [name, value, notes] of stages) {
  db.run(
    `INSERT INTO project_metrics (project_id, metric_name, metric_value, metric_unit, date, source, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [14, name, value, 'score_20', '2026-03-20', 'manual_audit', notes]
  );
  console.log(`Inserted ${name}: ${value}/20`);
}

const check = db.exec("SELECT metric_name, metric_value FROM project_metrics WHERE project_id=14 ORDER BY id DESC LIMIT 8");
console.log('Inserted metrics:', JSON.stringify(check[0]?.values));

const data = db.export();
writeFileSync(dbPath, Buffer.from(data));
console.log('DB saved.');
db.close();
