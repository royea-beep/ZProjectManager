import { app, BrowserWindow, screen, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { initDatabase, flushDb, getAll, runInsert, runQuery, getOne } from './database';
import { registerIpcHandlers } from './ipc';
import { autoUpdater } from 'electron-updater';
import { startAutoBackup, stopAutoBackup } from './auto-backup';
import { detectPatterns } from './pattern-detector';

// Crash reporting — log to file and show dialog
function getCrashLogPath(): string {
  return path.join(app.getPath('userData'), 'crash.log');
}

function logCrash(error: Error | string, context: string): void {
  const timestamp = new Date().toISOString();
  const msg = typeof error === 'string' ? error : `${error.message}\n${error.stack}`;
  const entry = `[${timestamp}] ${context}: ${msg}\n\n`;
  try {
    fs.appendFileSync(getCrashLogPath(), entry);
  } catch { /* can't even log */ }
}

process.on('uncaughtException', (error) => {
  logCrash(error, 'uncaughtException');
  flushDb();
  dialog.showErrorBox('ZProjectManager Error', `An unexpected error occurred:\n\n${error.message}\n\nThe app will try to continue. Check crash.log for details.`);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason : new Error(String(reason));
  logCrash(msg, 'unhandledRejection');
});

let mainWindow: BrowserWindow | null = null;

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState(): WindowState {
  try {
    const data = fs.readFileSync(getWindowStatePath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return { width: 1400, height: 900 };
  }
}

function saveWindowState(win: BrowserWindow): void {
  const prev = loadWindowState();
  const isMax = win.isMaximized();
  const bounds = win.getBounds();
  const state: WindowState = {
    isMaximized: isMax,
    width: isMax ? prev.width : bounds.width,
    height: isMax ? prev.height : bounds.height,
    x: isMax ? prev.x : bounds.x,
    y: isMax ? prev.y : bounds.y,
  };
  fs.writeFileSync(getWindowStatePath(), JSON.stringify(state));
}

function isPositionOnScreen(x: number | undefined, y: number | undefined): boolean {
  if (x === undefined || y === undefined) return false;
  const displays = screen.getAllDisplays();
  return displays.some(d => {
    const { x: dx, y: dy, width: dw, height: dh } = d.bounds;
    return x >= dx && x < dx + dw && y >= dy && y < dy + dh;
  });
}

function createWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const state = loadWindowState();

  // Reset position if saved coordinates are off-screen (e.g. display config changed)
  const validPosition = isPositionOnScreen(state.x, state.y);

  mainWindow = new BrowserWindow({
    width: Math.min(state.width, screenW),
    height: Math.min(state.height, screenH),
    x: validPosition ? state.x : undefined,
    y: validPosition ? state.y : undefined,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1219',
    title: 'ZProjectManager',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Auto-updater — checks GitHub Releases for new versions
function setupAutoUpdater(): void {
  if (!app.isPackaged) return; // Skip in dev mode

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available and will be downloaded in the background.`,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. It will be installed when you restart the app.',
      buttons: ['Restart Now', 'Later'],
    }).then(({ response }) => {
      if (response === 0) {
        flushDb();
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    logCrash(err, 'autoUpdater');
  });

  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(async () => {
  await initDatabase();
  registerIpcHandlers();
  createWindow();
  setupAutoUpdater();
  startAutoBackup(6);

  // Auto-detect patterns on startup (delayed to not block UI)
  setTimeout(() => {
    try { detectPatterns({ getAll, runInsert, runQuery }); } catch (e) { console.error('[patterns] Auto-detect failed:', e); }
  }, 5000);

  // Auto-load latest mega_prompts into DB (8s delay)
  setTimeout(async () => {
    try {
      const { loadMegaPrompts, getLatestMegaPromptsFile } = await import('./pipeline-reader');
      const currentFile = getLatestMegaPromptsFile();
      if (!currentFile) return;

      const versionMatch = currentFile.match(/v(\d+)/);
      if (!versionMatch) return;
      const version = parseInt(versionMatch[1]);

      const existing = getOne('SELECT version FROM mega_prompt_versions WHERE version = ?', [version]);
      if (!existing) {
        const data = loadMegaPrompts();
        if (data) {
          runQuery(
            `INSERT OR REPLACE INTO mega_prompt_versions (version, file_path, phases_json, raw_content, loaded_at)
             VALUES (?, ?, ?, ?, datetime('now'))`,
            [data.version, currentFile, JSON.stringify(data.phases), data.raw_content]
          );
          console.log(`[pipeline] Loaded mega_prompts_v${data.version}`);
        }
      }
    } catch (e) {
      console.error('[pipeline] Auto-load error:', e);
    }
  }, 8000);

  // Auto-sync GitHub data on startup (30s delay to not slow startup)
  setTimeout(async () => {
    try {
      const { syncAllProjects } = await import('./github-api');
      const result = await syncAllProjects();
      if (result.synced > 0) {
        console.log(`[github] Auto-synced ${result.synced} repos`);
      }
    } catch (e) {
      console.error('[github] Auto-sync failed:', e);
    }
  }, 30000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  flushDb();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopAutoBackup();
  flushDb();
});
