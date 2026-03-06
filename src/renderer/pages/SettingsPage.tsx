import React, { useState } from 'react';
import * as api from '../services/api';
import { APP_VERSION } from '../../shared/constants';
import type { ScannedProject } from '../services/api';

export default function SettingsPage() {
  const [scanned, setScanned] = useState<ScannedProject[]>([]);
  const [scanning, setScanning] = useState(false);
  const [imported, setImported] = useState<string[]>([]);
  const [exportMsg, setExportMsg] = useState('');

  const handleScan = async () => {
    setScanning(true);
    const results = await api.scanProjectsDir();
    setScanned(results);
    setScanning(false);
  };

  const handleImport = async (p: ScannedProject) => {
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

        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium">Auto-Detect Projects</h3>
              <p className="text-xs text-dark-muted mt-0.5">Scan C:\Projects for folders not yet tracked</p>
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

        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-dark-muted">
            <span>Search projects</span><span className="text-dark-text">Ctrl+K</span>
            <span>Idea Collector</span><span className="text-dark-text">Ctrl+I</span>
          </div>
        </div>
      </div>
    </div>
  );
}
