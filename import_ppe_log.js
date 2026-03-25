// import_ppe_log.js — Import PrePrompt V2 generation logs into Learning Brain
// Run at 3AM after build_ppe_v2.js to match generated prompts to final reports
// Usage: node import_ppe_log.js [path-to-generations.json]
'use strict';
const path = require('path');
const SHARED_MEM = 'C:/Projects/_SHARED/memory';
const GENS_FILE = path.join(SHARED_MEM, 'generations.json');
const IMPORTED_FILE = path.join(SHARED_MEM, 'imported_generations.json');

function run() {
  // Check in Downloads folder too (user may have saved it there)
  const downloadsPath = process.env.USERPROFILE + '/Downloads/ppe_generations_' + new Date().toISOString().slice(0,10) + '.json';
  const inputFile = process.argv[2] || (fs.existsSync(GENS_FILE) ? GENS_FILE : null) || (fs.existsSync(downloadsPath) ? downloadsPath : null);

  if (!inputFile) {
    console.log('No generations.json found. Skipping.');
    return;
  }

  const generations = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  console.log('Found', generations.length, 'prompt generations');

  // Load already-imported IDs
  const imported = new Set(
    fs.existsSync(IMPORTED_FILE)
      ? JSON.parse(fs.readFileSync(IMPORTED_FILE, 'utf8'))
      : []
  );

  // Load reports index
  const indexFile = path.join(SHARED_MEM, 'index.json');
  const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};

  let newCount = 0;
  const newImported = [];

  for (const gen of generations) {
    if (imported.has(gen.id)) continue;

    // Try to match to a final report by filename
    const matchedReport = Object.values(index).find(r =>
      r.prompt_file && (r.prompt_file.includes(gen.filename) || gen.filename.includes(r.prompt_file))
    );

    if (matchedReport) {
      console.log('Matched generation', gen.id, 'to report', matchedReport.id, 'grade:', matchedReport.grade_score);
    }

    // Record this generation in the index with metadata
    const genRecord = {
      ...gen,
      type: 'ppe_generation',
      matched_report_id: matchedReport ? matchedReport.id : null,
      matched_grade: matchedReport ? matchedReport.grade_score : null,
      imported_at: new Date().toISOString(),
    };

    // Append to generations log in shared memory
    const genLogFile = path.join(SHARED_MEM, 'ppe_generations_imported.json');
    const existing = fs.existsSync(genLogFile) ? JSON.parse(fs.readFileSync(genLogFile, 'utf8')) : [];
    existing.unshift(genRecord);
    fs.writeFileSync(genLogFile, JSON.stringify(existing.slice(0, 500), null, 2));

    newImported.push(gen.id);
    newCount++;
  }

  // Save updated imported IDs
  const allImported = [...imported, ...newImported];
  fs.writeFileSync(IMPORTED_FILE, JSON.stringify(allImported));

  // Copy generations.json to shared memory for persistence
  if (inputFile !== GENS_FILE) {
    fs.writeFileSync(GENS_FILE, fs.readFileSync(inputFile));
  }

  console.log('Imported', newCount, 'new generations. Total:', allImported.length);
}

run();
