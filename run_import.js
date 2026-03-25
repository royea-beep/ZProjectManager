// run_import.js -- Standalone Learning Brain import
'use strict';
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ZPM_DIR = path.dirname(require.resolve('./package.json'));
const tmpFile = path.join(ZPM_DIR, '_run_import_tmp.ts');

const scriptLines = [
  "import { initDatabase } from './src/main/database';",
  "import { importAllSessions } from './src/main/session-importer';",
  'async function run() {',
  '  await initDatabase();',
  '  const imp = importAllSessions();',
  '  console.log(JSON.stringify({ imported: imp.imported, skipped: imp.skipped, patterns: imp.patternsExtracted }));',
  '}',
  'run().catch(e => { console.error(e.message); process.exit(1); });'
];
fs.writeFileSync(tmpFile, scriptLines.join('\n'));
try {
  const out = execSync(
    'npx tsx --tsconfig tsconfig.standalone.json "' + tmpFile + '"',
    { cwd: ZPM_DIR, encoding: 'utf8', timeout: 120000 }
  );
  console.log(out.trim());
} finally {
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
}
