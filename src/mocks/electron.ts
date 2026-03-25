// Mock electron module for standalone scripts (Learning Brain daily sync)
import * as os from 'os';
import * as path from 'path';

// __dirname = src/mocks/ -> ../.. = ZProjectManager root
const ZPM_ROOT = path.resolve(__dirname, '../..');

// Set process.resourcesPath so database.ts finds sql.js WASM
(process as NodeJS.Process & { resourcesPath: string }).resourcesPath = ZPM_ROOT;

export const app = {
  getPath: (name: string): string => {
    if (name === 'userData') return path.join(os.homedir(), 'AppData', 'Roaming', 'zprojectmanager');
    return os.homedir();
  },
  isPackaged: true,
};
