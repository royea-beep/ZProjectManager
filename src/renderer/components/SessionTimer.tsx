import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';
import { useToast } from './Toast';
import type { ProjectSession } from '../../shared/types';

interface SessionTimerProps {
  projectId: number;
  projectName: string;
  onSessionCreated: () => void;
}

interface ActiveTimer {
  projectId: number;
  projectName: string;
  startTime: number;
}

const STORAGE_KEY = 'activeTimer';

function getActiveTimer(): ActiveTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export { getActiveTimer, STORAGE_KEY };

export default function SessionTimer({ projectId, projectName, onSessionCreated }: SessionTimerProps) {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const summaryInputRef = useRef<HTMLInputElement>(null);

  // On mount, check localStorage for active timer for this project
  useEffect(() => {
    const stored = getActiveTimer();
    if (stored && stored.projectId === projectId) {
      setStartTime(stored.startTime);
      setElapsed(Date.now() - stored.startTime);
      setRunning(true);
    }
  }, [projectId]);

  // Tick the timer
  useEffect(() => {
    if (running && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, startTime]);

  // Focus summary input when form shows
  useEffect(() => {
    if (showForm && summaryInputRef.current) {
      summaryInputRef.current.focus();
    }
  }, [showForm]);

  const handleStart = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);
    setRunning(true);
    setShowForm(false);
    setSummary('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projectId, projectName, startTime: now }));
  }, [projectId, projectName]);

  const handleStop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!summary.trim()) return;
    setSaving(true);
    try {
      const durationMinutes = Math.max(1, Math.round(elapsed / 60000));
      await api.createSession({
        project_id: projectId,
        summary: summary.trim(),
        duration_minutes: durationMinutes,
        mood: 'confident',
      } as Partial<ProjectSession>);
      // Clean up
      localStorage.removeItem(STORAGE_KEY);
      setShowForm(false);
      setSummary('');
      setStartTime(null);
      setElapsed(0);
      onSessionCreated();
    } catch {
      toast('Failed to save session', 'error');
    }
    setSaving(false);
  }, [summary, elapsed, projectId, onSessionCreated]);

  const handleDiscard = useCallback(() => {
    const minutes = Math.round(elapsed / 60000);
    if (minutes >= 5 && !window.confirm(`Discard ${minutes} minutes of session time?`)) return;
    localStorage.removeItem(STORAGE_KEY);
    setShowForm(false);
    setSummary('');
    setStartTime(null);
    setElapsed(0);
  }, [elapsed]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleDiscard();
  }, [handleSave, handleDiscard]);

  // Not running and no form — show start button
  if (!running && !showForm) {
    return (
      <div className="border-t border-dark-border bg-dark-surface px-6 py-3 flex items-center justify-between">
        <span className="text-sm text-dark-muted">No active timer</span>
        <button
          onClick={handleStart}
          className="px-4 py-1.5 text-sm bg-accent-green/20 text-accent-green border border-accent-green/30 rounded hover:bg-accent-green/30 transition-colors"
        >
          Start Timer
        </button>
      </div>
    );
  }

  // Running — show timer bar
  if (running) {
    return (
      <div className="border-t border-accent-green/30 bg-accent-green/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green"></span>
          </span>
          <span className="text-sm text-dark-text">
            Working on <span className="font-semibold">{projectName}</span>
          </span>
          <span className="font-mono text-lg text-accent-green font-semibold tracking-wider">
            {formatElapsed(elapsed)}
          </span>
        </div>
        <button
          onClick={handleStop}
          className="px-4 py-1.5 text-sm bg-accent-red/20 text-accent-red border border-accent-red/30 rounded hover:bg-accent-red/30 transition-colors"
        >
          Stop &amp; Log
        </button>
      </div>
    );
  }

  // Stopped — show summary form
  return (
    <div className="border-t border-accent-blue/30 bg-accent-blue/10 px-6 py-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm text-dark-muted">
          Session: <span className="font-mono text-accent-blue">{formatElapsed(elapsed)}</span>
          {' '}({Math.max(1, Math.round(elapsed / 60000))} min)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={summaryInputRef}
          type="text"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What did you work on?"
          className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent-blue"
        />
        <button
          onClick={handleSave}
          disabled={!summary.trim() || saving}
          className="px-4 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Session'}
        </button>
        <button
          onClick={handleDiscard}
          className="px-3 py-1.5 text-sm text-dark-muted hover:text-accent-red transition-colors"
          title="Discard"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
