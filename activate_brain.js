/**
 * activate_brain.js -- Standalone Learning Brain activation
 * Runs without Electron: directly opens data.db via sql.js
 */

const fs = require("fs");
const path = require("path");
const initSqlJs = require("./node_modules/sql.js/dist/sql-wasm.js");

const DB_PATH = "C:/Users/royea/AppData/Roaming/zprojectmanager/data.db";
const WASM_PATH = "./node_modules/sql.js/dist/sql-wasm.wasm";
const SYNC_LOG_PATH = "C:/Users/royea/AppData/Local/11STEPS2DONE/sessions_log.jsonl";
const SHARED_MEMORY_DIR = "C:/Projects/_SHARED/memory";

const PROJECT_NAME_MAP = {
  "90soccer": "9soccer", "9soccer": "9soccer", "caps": "caps", "wingman": "wingman",
  "ftable": "ftable", "clubgg": "clubgg", "explainit": "explainit",
  "analyzer": "analyzer", "analyzer-standalone": "analyzer",
  "zprojectmanager": "zprojectmanager", "letsmakebillions": "letsmakebillions",
  "cryptowhale": "cryptowhale", "heroes": "heroes", "postpilot": "postpilot",
  "venuekit": "venuekit", "keydrop": "keydrop", "general": "general",
};

function normalizeProject(raw) {
  if (!raw) return "general";
  const lower = raw.toLowerCase().replace(/[_\s]/g, "-");
  if (PROJECT_NAME_MAP[lower]) return PROJECT_NAME_MAP[lower];
  for (const [key, val] of Object.entries(PROJECT_NAME_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return lower;
}

function qualityToSignals(q) {
  const map = { 5:{c:5,t:5,q:0,e:0}, 4:{c:4,t:5,q:0,e:0}, 3:{c:3,t:5,q:1,e:1}, 2:{c:2,t:5,q:2,e:2}, 1:{c:1,t:5,q:3,e:3} };
  return map[q] || {c:3,t:5,q:1,e:1};
}

function gradeReport(completed, total, questions, errors) {
  const completeness = total > 0 ? (completed / total) * 10 : 5;
  const accuracy = Math.max(0, 10 - errors * 2);
  const efficiency = Math.max(0, 10 - questions * 1.5);
  return Math.round((efficiency * 0.25 + accuracy * 0.30 + completeness * 0.35 + 5 * 0.10) * 10) / 10;
}

function inferCategory(phase) {
  const p = (phase || "").toLowerCase();
  if (p.includes("qa")) return "testing";
  if (p.includes("ux") || p.includes("design")) return "design";
  if (p.includes("arch")) return "architecture";
  if (p.includes("plan")) return "planning";
  if (p.includes("publish") || p.includes("deploy")) return "deployment";
  return "development";
}

async function main() {
  process.stdout.write("=== LEARNING BRAIN ACTIVATION ===\n\n");
  const wasmBinary = fs.readFileSync(WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });
  const dbBuf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(new Uint8Array(dbBuf));

  db.run([
    "CREATE TABLE IF NOT EXISTS final_reports (",
    "  id TEXT PRIMARY KEY, project TEXT NOT NULL, timestamp TEXT NOT NULL,",
    "  duration_minutes INTEGER DEFAULT 60, sprint TEXT, terminal TEXT,",
    "  prompt_file TEXT, prompt_category TEXT, prompt_action TEXT, prompt_hebrew_input TEXT,",
    "  tasks_json TEXT, total_tasks INTEGER DEFAULT 0, completed_tasks INTEGER DEFAULT 0,",
    "  failed_tasks INTEGER DEFAULT 0, bot_questions_asked INTEGER DEFAULT 0,",
    "  errors_encountered INTEGER DEFAULT 0, files_changed INTEGER DEFAULT 0,",
    "  lines_added INTEGER DEFAULT 0, lines_removed INTEGER DEFAULT 0,",
    "  gems_json TEXT, blockers_json TEXT, decisions_json TEXT,",
    "  commit_hash TEXT, commit_message TEXT, branch TEXT DEFAULT 'master',",
    "  grade_score REAL, raw_json TEXT, created_at TEXT DEFAULT (datetime('now'))",
    ")"
  ].join("\n"));
  db.run("CREATE INDEX IF NOT EXISTS idx_fr_project ON final_reports(project)");
  db.run("CREATE INDEX IF NOT EXISTS idx_fr_grade ON final_reports(grade_score)");
  db.run([
    "CREATE TABLE IF NOT EXISTS prompt_patterns (",
    "  id TEXT PRIMARY KEY, action TEXT NOT NULL, category TEXT NOT NULL,",
    "  project TEXT NOT NULL, description TEXT, avg_score REAL DEFAULT 0,",
    "  times_used INTEGER DEFAULT 1, projects_used_in TEXT DEFAULT '[]',",
    "  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))",
    ")"
  ].join("\n"));

  function getAll(sql, params) {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params || []);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    } catch (e) { return []; }
  }
  function getOne(sql, params) { return getAll(sql, params)[0]; }
  function run(sql, params) { try { db.run(sql, params || []); } catch (e) {} }

  const INS = "INSERT INTO final_reports (id,project,timestamp,duration_minutes,sprint,terminal," +
    "prompt_file,prompt_category,prompt_action,prompt_hebrew_input,tasks_json,total_tasks," +
    "completed_tasks,failed_tasks,bot_questions_asked,errors_encountered," +
    "files_changed,lines_added,lines_removed,gems_json,blockers_json,decisions_json," +
    "commit_hash,commit_message,branch,grade_score,raw_json,created_at) " +
    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))";

  process.stdout.write("Reading daily sync log...\n");
  let syncImported = 0, syncSkipped = 0, syncErrors = 0;
  if (fs.existsSync(SYNC_LOG_PATH)) {
    const lines = fs.readFileSync(SYNC_LOG_PATH, "utf-8").split("\n").filter(l => l.trim().length > 0);
    process.stdout.write("  Found " + lines.length + " entries\n");
    const groups = new Map();
    for (const line of lines) {
      try {
        const e = JSON.parse(line);
        const d = (e.modified || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
        const proj = normalizeProject(e.project || "");
        const ph = (e.phase || "dev").toLowerCase();
        const k = proj + "|" + d + "|" + ph;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(e);
      } catch (e) { syncErrors++; }
    }
    process.stdout.write("  Grouped into " + groups.size + " sessions\n");
    for (const [key, entries] of groups) {
      try {
        const parts = key.split("|");
        const proj = parts[0], dateStr = parts[1], phase = parts[2];
        const pf = "synclog_" + proj + "_" + dateStr.replace(/-/g, "") + "_" + phase + ".auto";
        if (getOne("SELECT id FROM final_reports WHERE prompt_file = ?", [pf])) { syncSkipped++; continue; }
        const quals = entries.map(e => e.quality || 3).sort((a, b) => a - b);
        const sig = qualityToSignals(quals[Math.floor(quals.length / 2)]);
        const turns = entries.reduce((s, e) => s + (e.total_turns || 0), 0);
        const score = gradeReport(sig.c, sig.t, sig.q, sig.e);
        const id = proj + "_sl_" + dateStr.replace(/-/g, "") + "_" + phase + "_" + Math.random().toString(36).slice(2, 5);
        const cat = inferCategory(phase);
        run(INS, [id, proj, dateStr + "T12:00:00.000Z", Math.min(turns * 2, 240),
          "", proj.toUpperCase(), pf, cat, phase + "-session", "", "[]",
          sig.t, sig.c, sig.t - sig.c, sig.q, sig.e, entries.length, 0, 0,
          "[]", "[]", "[]", "", phase + " (" + entries.length + " files)", "master", score,
          JSON.stringify({id, project: proj, phase, entries: entries.length})]);
        syncImported++;
        if (score >= 8.0) {
          const pid = proj + "_" + cat + "_" + phase;
          if (!getOne("SELECT id FROM prompt_patterns WHERE id = ?", [pid])) {
            run("INSERT INTO prompt_patterns (id,action,category,project,description,avg_score,times_used,projects_used_in,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))",
              [pid, phase + "-session", cat, proj,
               "High-quality " + phase + " session (" + proj + ")", score, 1, JSON.stringify([proj])]);
          }
        }
      } catch (e) { syncErrors++; }
    }
  } else { process.stdout.write("  WARNING: sync log not found\n"); }

  process.stdout.write("Scanning session directories...\n");
  const SESSION_ROOTS = [
    {dir: "C:/Projects/90soccer/docs/sessions", project: "9soccer"},
    {dir: "C:/Projects/Caps/sessions", project: "caps"},
    {dir: "C:/Projects/Wingman/sessions", project: "wingman"},
    {dir: "C:/Projects/Wingman/docs/sessions", project: "wingman"},
    {dir: "C:/Projects/ZProjectManager/sessions", project: "zprojectmanager"},
    {dir: "C:/Projects/analyzer-standalone/sessions", project: "analyzer"},
    {dir: "C:/Projects/PostPilot/sessions", project: "postpilot"},
    {dir: "C:/Projects/clubgg/sessions", project: "clubgg"},
    {dir: "C:/Projects/_SHARED/sessions", project: "general"},
  ];
  let mdImported = 0, mdSkipped = 0;
  for (const root of SESSION_ROOTS) {
    if (!fs.existsSync(root.dir)) continue;
    let files; try { files = fs.readdirSync(root.dir); } catch (e) { continue; }
    for (const file of files) {
      if (!file.endsWith(".md") && !file.endsWith(".json")) continue;
      if (file === "README.md") continue;
      try {
        const content = fs.readFileSync(path.join(root.dir, file), "utf-8");
        if (content.length < 50) continue;
        if (getOne("SELECT id FROM final_reports WHERE prompt_file = ?", [file])) { mdSkipped++; continue; }
        const checkmarks = (content.match(/[✅]/g) || []).length;
        const failures = (content.toLowerCase().split("failed").length - 1);
        const tot = Math.max(checkmarks + failures, 1);
        const score = gradeReport(checkmarks, tot, 0, Math.min(failures, 3));
        const dateRx = file.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        const ts = dateRx ? dateRx[1] + "T12:00:00.000Z" : new Date().toISOString();
        const safeFile = file.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 25);
        const id = root.project + "_md_" + safeFile + "_" + Math.random().toString(36).slice(2, 5);
        run(INS, [id, root.project, ts, 60, "", root.project.toUpperCase(), file, "sprint",
          file.replace(/[.]md$/, "").slice(0, 60), "", "[]", tot, checkmarks, failures,
          0, Math.min(failures, 2), 0, 0, 0, "[]", "[]", "[]", "", file, "master", score,
          JSON.stringify({id: id, project: root.project, file: file})]);
        mdImported++;
      } catch (e) { continue; }
    }
  }
  process.stdout.write("  MD: " + mdImported + " imported, " + mdSkipped + " skipped\n");

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  process.stdout.write("DB saved.\n");

  try {
    if (fs.existsSync(SHARED_MEMORY_DIR)) {
      const rows = getAll("SELECT project, COUNT(*) as cnt, AVG(grade_score) as avg FROM final_reports GROUP BY project");
      const idx = { updated: new Date().toISOString(), projects: {} };
      for (const r of rows) idx.projects[r.project] = { count: r.cnt, avgGrade: r.avg ? +Number(r.avg).toFixed(1) : 0 };
      fs.writeFileSync(path.join(SHARED_MEMORY_DIR, "index.json"), JSON.stringify(idx, null, 2));
      const pats = getAll("SELECT * FROM prompt_patterns ORDER BY avg_score DESC LIMIT 50");
      fs.writeFileSync(path.join(SHARED_MEMORY_DIR, "skills.json"), JSON.stringify(pats, null, 2));
      process.stdout.write("Shared memory updated.\n");
    }
  } catch (e) { process.stdout.write("(shared memory: " + e.message + ")\n"); }

  const totalRow = getOne("SELECT COUNT(*) as cnt FROM final_reports") || {cnt: 0};
  const byProj = getAll("SELECT project, COUNT(*) as cnt FROM final_reports GROUP BY project ORDER BY cnt DESC");
  const ex = getOne("SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 9") || {c: 0};
  const gd = getOne("SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 7 AND grade_score < 9") || {c: 0};
  const med = getOne("SELECT COUNT(*) as c FROM final_reports WHERE grade_score >= 5 AND grade_score < 7") || {c: 0};
  const po = getOne("SELECT COUNT(*) as c FROM final_reports WHERE grade_score < 5 AND grade_score IS NOT NULL") || {c: 0};
  const ag = getOne("SELECT AVG(grade_score) as avg FROM final_reports WHERE grade_score IS NOT NULL") || {avg: 0};
  const pc = getOne("SELECT COUNT(*) as cnt FROM prompt_patterns") || {cnt: 0};
  const tp = getAll("SELECT action, category, project, avg_score FROM prompt_patterns ORDER BY avg_score DESC LIMIT 5");
  const pm = {};
  for (const r of byProj) pm[String(r.project)] = r.cnt;
  const out = [];
  out.push("");
  out.push("LEARNING BRAIN -- ACTIVATION REPORT");
  out.push("====================================");
  out.push("Sync log:   imported=" + syncImported + "  skipped=" + syncSkipped + "  errors=" + syncErrors);
  out.push("MD files:   imported=" + mdImported + "  skipped=" + mdSkipped);
  out.push("Total in DB: " + totalRow.cnt);
  out.push("");
  out.push("PER PROJECT:");
  const known = ["9soccer","caps","wingman","ftable","clubgg","explainit","analyzer","zprojectmanager","letsmakebillions","cryptowhale","heroes","postpilot","venuekit","keydrop","general"];
  for (const p of known) { if (pm[p]) out.push("  " + p.padEnd(20) + ": " + pm[p] + " reports"); }
  for (const r of byProj) { if (known.indexOf(String(r.project)) === -1) out.push("  " + String(r.project).padEnd(20) + ": " + r.cnt + " (other)"); }
  out.push("");
  out.push("GRADE DISTRIBUTION:");
  out.push("  9.0-10.0: " + ex.c + " (excellent)");
  out.push("  7.0-8.9:  " + gd.c + " (good)");
  out.push("  5.0-6.9:  " + med.c + " (mediocre)");
  out.push("  0.0-4.9:  " + po.c + " (poor)");
  out.push("  Average:  " + (ag.avg ? Number(ag.avg).toFixed(1) : "N/A"));
  out.push("");
  out.push("PATTERNS EXTRACTED: " + pc.cnt);
  for (let i = 0; i < tp.length; i++) {
    out.push("  " + (i+1) + ". [" + tp[i].category + "/" + tp[i].action + "] " + tp[i].project + " -- " + Number(tp[i].avg_score).toFixed(1));
  }
  out.push("");
  out.push("SKILLS.JSON: " + pc.cnt + " entries | INDEX.JSON: " + Object.keys(pm).length + " projects");
  process.stdout.write(out.join("\n") + "\n");
  db.close();
  process.stdout.write("\nDone.\n");
}

main().catch(function(e) { process.stderr.write("FATAL: " + e + "\n"); process.exit(1); });
