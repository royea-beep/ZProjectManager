import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { flushDb } from './database';

let backupInterval: NodeJS.Timeout | null = null;
let lastBackupTime: string | null = null;

function getBackupDir(): string {
  const dir = path.join(app.getPath('userData'), 'backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function runBackup(): { success: boolean; path?: string; error?: string } {
  try {
    flushDb();
    const dbPath = path.join(app.getPath('userData'), 'data.db');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(getBackupDir(), `backup-${timestamp}.db`);
    fs.copyFileSync(dbPath, backupPath);
    lastBackupTime = new Date().toISOString();
    // Clean old backups — keep only last 10
    const files = fs.readdirSync(getBackupDir()).filter(f => f.startsWith('backup-')).sort().reverse();
    for (const f of files.slice(10)) {
      fs.unlinkSync(path.join(getBackupDir(), f));
    }
    return { success: true, path: backupPath };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function startAutoBackup(intervalHours: number = 6): void {
  stopAutoBackup();
  if (intervalHours <= 0) return;
  const ms = intervalHours * 60 * 60 * 1000;
  backupInterval = setInterval(() => runBackup(), ms);
  // Also run one immediately on start
  runBackup();
}

export function stopAutoBackup(): void {
  if (backupInterval) { clearInterval(backupInterval); backupInterval = null; }
}

export function getLastBackupTime(): string | null { return lastBackupTime; }

export function getBackupList(): { name: string; size: number; date: string }[] {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('backup-'))
    .map(f => {
      const stat = fs.statSync(path.join(dir, f));
      return { name: f, size: stat.size, date: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function restoreBackup(backupName: string): boolean {
  const backupPath = path.join(getBackupDir(), backupName);
  const dbPath = path.join(app.getPath('userData'), 'data.db');
  if (!fs.existsSync(backupPath)) return false;
  fs.copyFileSync(backupPath, dbPath);
  return true; // App needs restart after restore
}

export function getBackupDir_public(): string {
  return getBackupDir();
}
