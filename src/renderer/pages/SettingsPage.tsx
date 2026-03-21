import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { APP_VERSION } from '../../shared/constants';
import type { ScannedProject, BackupInfo } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../components/Toast';

const INTERVAL_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '1 hour', value: 1 },
  { label: '3 hours', value: 3 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function SettingsPage() {
  const { lang, setLang, t } = useLanguage();
  const { toast } = useToast();
  const [scanned, setScanned] = useState<ScannedProject[]>([]);
  const [scanning, setScanning] = useState(false);
  const [imported, setImported] = useState<string[]>([]);
  const [exportMsg, setExportMsg] = useState('');
  const [projectsDir, setProjectsDir] = useState('');
  const [projectsDirSaved, setProjectsDirSaved] = useState(false);

  // Backup state
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupList, setBackupList] = useState<BackupInfo[]>([]);
  const [backupInterval, setBackupIntervalState] = useState(6);
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [backupDir, setBackupDir] = useState('');
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);

  // Data stats state
  const [dataStats, setDataStats] = useState<Record<string, number> | null>(null);
  const [dbPath, setDbPath] = useState('');
  const [clearAuditConfirm, setClearAuditConfirm] = useState(false);
  const [dangerMsg, setDangerMsg] = useState('');

  // GitHub state
  const [githubToken, setGithubToken] = useState('');
  const [githubTokenSaved, setGithubTokenSaved] = useState(false);
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [githubSyncMsg, setGithubSyncMsg] = useState('');

  const loadBackupData = useCallback(async () => {
    const [time, list, dir] = await Promise.all([
      api.getLastBackupTime(),
      api.getBackupList(),
      api.getBackupDir(),
    ]);
    setLastBackupTime(time);
    setBackupList(list);
    setBackupDir(dir);
  }, []);

  const loadStats = useCallback(async () => {
    const [stats, path] = await Promise.all([
      api.getDataStats(),
      api.getDbPath(),
    ]);
    setDataStats(stats);
    setDbPath(path);
  }, []);

  const loadProjectsDir = useCallback(async () => {
    const dir = await api.getAppSetting('projects_dir');
    setProjectsDir(dir ?? 'C:\\Projects');
  }, []);

  const loadGithubToken = useCallback(async () => {
    const token = await api.getAppSetting('github_token');
    if (token) setGithubToken(token);
  }, []);

  useEffect(() => {
    loadBackupData();
    loadStats();
    loadProjectsDir();
    loadGithubToken();
  }, [loadBackupData, loadStats, loadProjectsDir, loadGithubToken]);

  const handleScan = async () => {
    setScanning(true);
    const results = await api.scanProjectsDir();
    setScanned(results);
    setScanning(false);
  };

  const handleImport = async (p: ScannedProject) => {
    try {
      await api.createProject({
        name: p.name,
        description: null,
        type: 'web-app',
        stage: 'concept',
        status: 'idea',
        priority: 'medium',
        goal: null,
        tech_stack: null,
        repo_path: p.path,
        repo_url: null,
        has_git: p.hasGit ? 1 : 0,
        monetization_model: null,
        main_blocker: null,
        next_action: null,
        health_score: 50,
      });
      setImported(prev => [...prev, p.name]);
      toast(`Imported ${p.name}`, 'success');
    } catch {
      toast(`Failed to import ${p.name}`, 'error');
    }
  };

  const handleBackupNow = async () => {
    setBackupRunning(true);
    setBackupMsg('');
    try {
      const result = await api.runBackup();
      if (result.success) {
        toast('Backup created', 'success');
        setBackupMsg('Backup created successfully!');
      } else {
        toast('Backup failed', 'error');
        setBackupMsg(`Backup failed: ${result.error || 'Unknown error'}`);
      }
      await loadBackupData();
    } catch {
      toast('Backup failed', 'error');
    } finally {
      setBackupRunning(false);
      setTimeout(() => setBackupMsg(''), 4000);
    }
  };

  const handleIntervalChange = async (hours: number) => {
    setBackupIntervalState(hours);
    await api.setBackupInterval(hours);
  };

  const handleRestore = async (backupName: string) => {
    const ok = await api.restoreBackup(backupName);
    if (ok) {
      setBackupMsg('Backup restored. Please restart the app for changes to take effect.');
      setRestoreConfirm(null);
    } else {
      setBackupMsg('Restore failed: backup file not found.');
    }
    setTimeout(() => setBackupMsg(''), 6000);
  };

  const handleSaveGithubToken = async () => {
    await api.githubSetToken(githubToken.trim());
    setGithubTokenSaved(true);
    toast('GitHub token saved', 'success');
    setTimeout(() => setGithubTokenSaved(false), 2000);
  };

  const handleGithubSyncAll = async () => {
    setGithubSyncing(true);
    setGithubSyncMsg('');
    try {
      const result = await api.githubSyncAll();
      setGithubSyncMsg(`Synced ${result.synced} repos${result.errors > 0 ? ` (${result.errors} failed)` : ''}`);
      toast(`Synced ${result.synced} GitHub repos`, 'success');
    } catch {
      setGithubSyncMsg('Sync failed — check token and repo names');
      toast('GitHub sync failed', 'error');
    } finally {
      setGithubSyncing(false);
      setTimeout(() => setGithubSyncMsg(''), 5000);
    }
  };

  const handleClearAuditLog = async () => {
    await api.clearAuditLog();
    setClearAuditConfirm(false);
    setDangerMsg('Audit log cleared.');
    await loadStats();
    setTimeout(() => setDangerMsg(''), 4000);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-dark-muted mb-6">App configuration</p>

      <div className="space-y-4 max-w-2xl">
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">About</h3>
          <div className="space-y-2 text-sm text-dark-muted">
            <p>ZProjectManager v{APP_VERSION}</p>
            <p>Project Operating System</p>
            <p>Data stored locally in SQLite</p>
            {dbPath && <p>Database: <span className="text-dark-text font-mono text-xs">{dbPath}</span></p>}
            {dataStats && <p>Tracking <span className="text-dark-text font-semibold">{dataStats.projects}</span> projects</p>}
            <p>
              <a
                href="https://github.com/royea-beep/ZProjectManager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue hover:underline"
              >
                GitHub Repository
              </a>
            </p>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">{t('Language', 'שפה')} / {t('שפה', 'Language')}</h3>
          <p className="text-xs text-dark-muted mb-3">
            {t(
              'Choose display language. Hebrew enables right-to-left layout.',
              'בחר שפת תצוגה. עברית מפעילה פריסה מימין לשמאל.'
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                lang === 'en'
                  ? 'bg-accent-blue text-white'
                  : 'bg-dark-bg text-dark-muted border border-dark-border hover:text-dark-text hover:bg-dark-hover'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('he')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                lang === 'he'
                  ? 'bg-accent-blue text-white'
                  : 'bg-dark-bg text-dark-muted border border-dark-border hover:text-dark-text hover:bg-dark-hover'
              }`}
            >
              עברית
            </button>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium">Database</h3>
              <p className="text-sm text-dark-muted mt-1">
                Location: %APPDATA%/zprojectmanager/data.db
              </p>
            </div>
            <button onClick={async () => {
              const ok = await api.exportDatabase();
              if (ok) setExportMsg('Backup saved!');
              else setExportMsg('Export cancelled or failed.');
              setTimeout(() => setExportMsg(''), 3000);
            }}
              className="px-3 py-1.5 text-sm bg-accent-green text-white rounded hover:bg-accent-green/80">
              Export Backup
            </button>
          </div>
          {exportMsg && <p className="text-xs text-accent-green mt-2">{exportMsg}</p>}
        </div>

        {/* Auto Backup Section */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium">Auto Backup</h3>
              <p className="text-xs text-dark-muted mt-0.5">
                Automatically backup the database on a schedule
              </p>
            </div>
            <button onClick={handleBackupNow} disabled={backupRunning}
              className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80 disabled:opacity-50">
              {backupRunning ? 'Backing up...' : 'Backup Now'}
            </button>
          </div>

          <div className="space-y-3">
            {/* Last backup time */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-muted">Last backup:</span>
              <span className={lastBackupTime ? 'text-dark-text' : 'text-dark-muted'}>
                {lastBackupTime ? formatDate(lastBackupTime) : 'Never'}
              </span>
            </div>

            {/* Interval selector */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-muted">Backup interval:</span>
              <select
                value={backupInterval}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-dark-text focus:outline-none focus:border-accent-blue"
              >
                {INTERVAL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Backup directory */}
            {backupDir && (
              <div className="text-xs text-dark-muted">
                Backup folder: {backupDir}
              </div>
            )}

            {/* Status message */}
            {backupMsg && (
              <p className={`text-xs ${backupMsg.includes('failed') || backupMsg.includes('Failed') ? 'text-red-400' : 'text-accent-green'}`}>
                {backupMsg}
              </p>
            )}

            {/* Backup list */}
            {backupList.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-dark-muted mb-2">
                  Existing Backups ({backupList.length})
                </h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {backupList.map(b => (
                    <div key={b.name} className="flex items-center justify-between bg-dark-bg rounded p-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-dark-text truncate">{b.name}</div>
                        <div className="text-xs text-dark-muted">
                          {formatDate(b.date)} &middot; {formatBytes(b.size)}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {restoreConfirm === b.name ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRestore(b.name)}
                              className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setRestoreConfirm(null)}
                              className="px-2 py-0.5 text-xs bg-dark-surface text-dark-muted rounded hover:bg-dark-border"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRestoreConfirm(b.name)}
                            className="px-2 py-0.5 text-xs bg-dark-surface text-dark-muted rounded hover:bg-dark-border hover:text-dark-text"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Projects Folder</h3>
          <p className="text-xs text-dark-muted mt-0.5 mb-2">Folder to scan for untracked projects (e.g. C:\\Projects)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={projectsDir}
              onChange={e => { setProjectsDir(e.target.value); setProjectsDirSaved(false); }}
              placeholder="C:\Projects"
              className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-accent-blue"
            />
            <button
              onClick={async () => {
                await api.setAppSetting('projects_dir', projectsDir.trim() || 'C:\\Projects');
                setProjectsDirSaved(true);
                toast('Projects folder saved', 'success');
                setTimeout(() => setProjectsDirSaved(false), 2000);
              }}
              className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80 whitespace-nowrap"
            >
              {projectsDirSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium">Auto-Detect Projects</h3>
              <p className="text-xs text-dark-muted mt-0.5">Scan the projects folder above for folders not yet tracked</p>
            </div>
            <button onClick={handleScan} disabled={scanning}
              className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80 disabled:opacity-50">
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>

          {scanned.length > 0 && (
            <div className="space-y-2 mt-3">
              {scanned.map(p => (
                <div key={p.path} className="flex items-center justify-between bg-dark-bg rounded p-2.5">
                  <div>
                    <span className="text-sm font-medium">{p.name}</span>
                    <div className="flex gap-2 mt-0.5">
                      {p.hasGit && <span className="text-xs text-accent-green">git</span>}
                      {p.hasPackageJson && <span className="text-xs text-accent-blue">npm</span>}
                    </div>
                  </div>
                  {imported.includes(p.name) ? (
                    <span className="text-xs text-accent-green">Imported</span>
                  ) : (
                    <button onClick={() => handleImport(p)}
                      className="px-3 py-1 text-xs bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30">
                      Import
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {scanned.length === 0 && !scanning && (
            <p className="text-xs text-dark-muted mt-2">Click "Scan Now" to detect untracked project folders.</p>
          )}
        </div>

        {/* Data Statistics */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Data Statistics</h3>
          {dataStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Projects', value: dataStats.projects, color: 'text-accent-blue' },
                { label: 'Sessions', value: dataStats.sessions, color: 'text-accent-green' },
                { label: 'Tasks (Open)', value: dataStats.tasks_open, color: 'text-yellow-400' },
                { label: 'Tasks (Done)', value: dataStats.tasks_done, color: 'text-accent-green' },
                { label: 'Decisions', value: dataStats.decisions, color: 'text-purple-400' },
                { label: 'Learnings', value: dataStats.learnings, color: 'text-orange-400' },
                { label: 'Audit Entries', value: dataStats.audit_entries, color: 'text-dark-muted' },
                { label: 'Patterns', value: dataStats.patterns, color: 'text-pink-400' },
              ].map(s => (
                <div key={s.label} className="bg-dark-bg rounded-lg p-3 text-center">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-dark-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-dark-muted">Loading statistics...</p>
          )}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Keyboard Shortcuts</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                { keys: 'Ctrl+K', description: 'Global Search' },
                { keys: 'Ctrl+I', description: 'Idea Collector' },
                { keys: 'Ctrl+N', description: 'New Project (on Dashboard)' },
                { keys: 'Esc', description: 'Close modal / overlay' },
              ].map(shortcut => (
                <tr key={shortcut.keys} className="border-b border-dark-border/50 last:border-0">
                  <td className="py-2 pr-4">
                    <kbd className="px-2 py-0.5 bg-dark-bg border border-dark-border rounded text-xs font-mono text-dark-text">
                      {shortcut.keys}
                    </kbd>
                  </td>
                  <td className="py-2 text-dark-muted">{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GitHub Integration */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium">GitHub Integration</h3>
              <p className="text-xs text-dark-muted mt-0.5">Live CI status, open PRs, stars, and last push on project cards</p>
            </div>
            <button
              onClick={handleGithubSyncAll}
              disabled={githubSyncing || !githubToken}
              className="px-3 py-1.5 text-sm bg-dark-bg border border-dark-border text-dark-text rounded hover:bg-dark-hover disabled:opacity-40 whitespace-nowrap"
            >
              {githubSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="password"
              value={githubToken}
              onChange={e => { setGithubToken(e.target.value); setGithubTokenSaved(false); }}
              placeholder="ghp_..."
              className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-accent-blue font-mono"
            />
            <button
              onClick={handleSaveGithubToken}
              className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80 whitespace-nowrap"
            >
              {githubTokenSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-dark-muted">
            Create at github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
            Required permissions: <span className="text-dark-text">Contents (read)</span>, <span className="text-dark-text">Actions (read)</span>, <span className="text-dark-text">Pull requests (read)</span>.
          </p>
          {githubSyncMsg && (
            <p className={`text-xs mt-2 ${githubSyncMsg.includes('failed') || githubSyncMsg.includes('Failed') ? 'text-red-400' : 'text-accent-green'}`}>
              {githubSyncMsg}
            </p>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-dark-surface border-2 border-red-500/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>

          {/* Clear Audit Log */}
          <div className="flex items-center justify-between py-3 border-b border-dark-border/50">
            <div>
              <p className="text-sm text-dark-text">Clear Audit Log</p>
              <p className="text-xs text-dark-muted mt-0.5">
                Permanently delete all audit trail entries. This cannot be undone.
              </p>
            </div>
            {clearAuditConfirm ? (
              <div className="flex gap-2 flex-shrink-0 ml-4">
                <button
                  onClick={handleClearAuditLog}
                  className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setClearAuditConfirm(false)}
                  className="px-3 py-1.5 text-xs bg-dark-bg text-dark-muted rounded hover:bg-dark-border"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setClearAuditConfirm(true)}
                className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 flex-shrink-0 ml-4"
              >
                Clear Audit Log
              </button>
            )}
          </div>

          {/* Reset All Data */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-dark-text">Reset All Data</p>
              <p className="text-xs text-dark-muted mt-0.5">
                Drop all data and re-seed from scratch. This is irreversible.
              </p>
            </div>
            <button
              disabled
              className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400/50 border border-red-500/20 rounded cursor-not-allowed flex-shrink-0 ml-4"
              title="This action is currently disabled for safety"
            >
              Reset All Data
            </button>
          </div>

          {dangerMsg && (
            <p className="text-xs text-red-400 mt-3">{dangerMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
