import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useData } from '../hooks/useData';
import * as api from '../services/api';
import type { Project, ProjectSession, ProjectTask, ProjectCommand, ProjectMetric, Learning, ProjectDecision, TaskSubtask } from '../../shared/types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import HealthBar from '../components/HealthBar';
import Modal from '../components/Modal';
const MetricsChart = React.lazy(() => import('../components/MetricsChart'));
import TechStackTags from '../components/TechStackTags';
import ConfirmDialog from '../components/ConfirmDialog';
import TagInput from '../components/TagInput';
import SessionTimer from '../components/SessionTimer';
import ProjectTags from '../components/ProjectTags';
import QuickNotes from '../components/QuickNotes';
import { STATUS_LABELS, STAGE_LABELS, PRIORITY_LABELS, TASK_STATUS_LABELS, PROJECT_TYPES, MOOD_LABELS, DESIGN_DIMENSIONS, DESIGN_STATUS_LABELS, DESIGN_STATUS_COLORS, WEB_RELEVANT_TYPES } from '../../shared/constants';
import type { WebsiteDesignScore } from '../../shared/types';
import { useToast } from '../components/Toast';
import PromptPage from './PromptPage';

const BASE_TABS = ['Overview', 'Memory', 'Tasks', 'Notes', 'Launcher', 'Metrics', 'Decisions', 'Learnings', 'Activity', 'Prompt'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);
  const { project, loading, update, refresh } = useProject(projectId);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'Overview';
  const [tab, setTab] = useState(initialTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [exportRange, setExportRange] = useState<'7' | '30' | 'all'>('all');
  const { toast } = useToast();

  const TABS = [...BASE_TABS, 'Design'];

  // Update window title when project loads
  React.useEffect(() => {
    if (project) {
      document.title = `${project.name} — ZProjectManager`;
    }
    return () => { document.title = 'ZProjectManager'; };
  }, [project]);

  if (isNaN(projectId)) {
    navigate('/');
    return null;
  }

  if (loading || !project) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 pt-4 pb-3 border-b border-dark-border">
          <div className="skeleton h-4 w-16 mb-3" />
          <div className="flex items-center gap-2 mb-2">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="skeleton h-4 w-96 mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-8 w-20 rounded" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-2xl space-y-4">
            <div className="skeleton h-6 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="skeleton h-16 rounded-lg" />
              <div className="skeleton h-16 rounded-lg" />
              <div className="skeleton h-16 rounded-lg" />
              <div className="skeleton h-16 rounded-lg" />
            </div>
            <div className="skeleton h-24 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    await api.deleteProject(projectId);
    toast('Project deleted', 'info');
    navigate('/');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-4 pb-0 border-b border-dark-border">
        <div className="flex items-center justify-between mb-2">
          <nav className="flex items-center gap-1.5 text-xs text-dark-muted">
            <button onClick={() => navigate('/')} className="hover:text-accent-blue transition-colors">
              Dashboard
            </button>
            <span>/</span>
            <span className="text-dark-text">{project.name}</span>
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <select
                value={exportRange}
                onChange={e => setExportRange(e.target.value as '7' | '30' | 'all')}
                className="text-xs bg-dark-surface border border-dark-border rounded px-2 py-1 text-dark-muted focus:outline-none focus:border-accent-blue/50"
              >
                <option value="all">Export: All</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
              <button onClick={async () => {
                const ok = await api.exportProjectReport(projectId, exportRange);
                if (ok) toast('Report exported', 'info');
              }} className="text-xs text-dark-muted hover:text-dark-text hover:bg-dark-surface px-2 py-1 rounded">
                Export Report
              </button>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-accent-red/60 hover:text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded">
              Delete Project
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-xl font-bold">{project.name}</h1>
          <StatusBadge status={project.status} />
          <PriorityBadge priority={project.priority} />
        </div>
        <div className="mb-2">
          <ProjectTags projectId={projectId} />
        </div>
        {project.description && (
          <p className="text-sm text-dark-muted mb-2 line-clamp-2">{project.description}</p>
        )}
        <div className="flex overflow-x-auto scrollbar-hide -mb-px" role="tablist">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} role="tab" aria-selected={tab === t}
              className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                tab === t ? 'border-accent-blue text-accent-blue' : 'border-transparent text-dark-muted hover:text-dark-text hover:border-dark-border'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This will remove all sessions, tasks, commands, and metrics. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === 'Overview' && <OverviewTab project={project} onUpdate={update} />}
        {tab === 'Memory' && <MemoryTab projectId={projectId} repoPath={project.repo_path} key={`memory-${sessionRefreshKey}`} />}
        {tab === 'Tasks' && <TasksTab projectId={projectId} repoPath={project.repo_path} />}
        {tab === 'Launcher' && <LauncherTab projectId={projectId} repoPath={project.repo_path} />}
        {tab === 'Metrics' && <MetricsTab projectId={projectId} repoPath={project.repo_path} />}
        {tab === 'Decisions' && <DecisionsTab projectId={projectId} />}
        {tab === 'Learnings' && <LearningsTab projectId={projectId} />}
        {tab === 'Design' && <DesignTab projectId={projectId} projectType={project.type} />}
        {tab === 'Notes' && <QuickNotes projectId={projectId} />}
        {tab === 'Activity' && <ActivityTab projectId={projectId} />}
        {tab === 'Prompt' && <PromptPage project={project} onUpdate={update} />}
      </div>

      {/* Session Work Timer */}
      <SessionTimer
        projectId={projectId}
        projectName={project.name}
        onSessionCreated={() => {
          setSessionRefreshKey(k => k + 1);
          toast('Session logged from timer');
          refresh();
        }}
      />
    </div>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab({ project, onUpdate }: { project: Project; onUpdate: (data: Partial<Project>) => Promise<any> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(project);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [showHealthSlider, setShowHealthSlider] = useState(false);
  const [gitStatus, setGitStatus] = useState<{ branch: string; uncommitted: number; untracked: number; ahead: number; behind: number } | null>(null);
  const [recentCommits, setRecentCommits] = useState<{ hash: string; message: string; date: string; author: string }[]>([]);
  const [healthRecalculated, setHealthRecalculated] = useState(false);

  React.useEffect(() => {
    if (!editing) setForm(project);
  }, [project, editing]);

  // Feature 1: Load git status + recent commits on mount
  useEffect(() => {
    if (project.repo_path) {
      api.getGitStatus(project.repo_path).then(status => setGitStatus(status)).catch(() => {});
      api.getRecentCommits(project.repo_path, 10).then(commits => setRecentCommits(commits)).catch(() => {});
    }
  }, [project.repo_path]);

  // Feature 2: Auto health score recalculation on mount
  useEffect(() => {
    api.autoHealth(project.id).then(score => {
      if (score !== null && score !== project.health_score) {
        onUpdate({ health_score: score });
      }
      setHealthRecalculated(true);
      setTimeout(() => setHealthRecalculated(false), 3000);
    }).catch(() => {});
  }, [project.id]);

  const handleSave = async () => {
    await onUpdate({
      name: form.name, description: form.description, type: form.type, stage: form.stage,
      status: form.status, priority: form.priority, goal: form.goal, tech_stack: form.tech_stack,
      repo_url: form.repo_url, monetization_model: form.monetization_model, main_blocker: form.main_blocker,
      next_action: form.next_action, health_score: form.health_score,
    });
    setEditing(false);
  };

  const inlineSave = async (field: string, value: string | number | null) => {
    await onUpdate({ [field]: value });
    setEditingField(null);
  };

  const startInline = (field: string, current: string | null) => {
    setEditingField(field);
    setFieldValue(current || '');
  };

  const renderInlineSelect = (field: string, label: string, currentKey: string, options: Record<string, string>, displayValue: string) => (
    <div>
      <label className="text-xs text-dark-muted block mb-0.5">{label}</label>
      {editingField === field ? (
        <select autoFocus value={currentKey}
          onChange={e => { inlineSave(field, e.target.value); }}
          onBlur={() => setEditingField(null)}
          className="bg-dark-bg border border-accent-blue rounded px-2 py-1 text-sm w-full">
          {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      ) : (
        <p className="text-sm cursor-pointer hover:text-accent-blue editable-field inline-block" onClick={() => setEditingField(field)}>{displayValue}</p>
      )}
    </div>
  );

  const renderInlineText = (field: string, label: string, current: string | null, placeholder: string) => (
    <div>
      <label className="text-xs text-dark-muted block mb-0.5">{label}</label>
      {editingField === field ? (
        <input autoFocus value={fieldValue} onChange={e => setFieldValue(e.target.value)}
          onBlur={() => inlineSave(field, fieldValue || null)}
          onKeyDown={e => { if (e.key === 'Enter') inlineSave(field, fieldValue || null); if (e.key === 'Escape') setEditingField(null); }}
          className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-sm" />
      ) : (
        <p className={`text-sm cursor-pointer hover:text-accent-blue editable-field inline-block ${current ? '' : 'text-dark-muted/50 italic'}`}
          onClick={() => startInline(field, current)}>
          {current || placeholder}
        </p>
      )}
    </div>
  );

  if (!editing) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setForm(project); setEditing(true); }}
            className="px-3 py-1.5 text-sm bg-dark-surface border border-dark-border rounded hover:bg-dark-hover">Edit All</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-dark-muted block mb-0.5">Type</label>
            {editingField === 'type' ? (
              <select autoFocus value={project.type || ''}
                onChange={e => { inlineSave('type', e.target.value); }}
                onBlur={() => setEditingField(null)}
                className="bg-dark-bg border border-accent-blue rounded px-2 py-1 text-sm w-full">
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <p className="text-sm cursor-pointer hover:text-accent-blue" onClick={() => setEditingField('type')}>{project.type}</p>
            )}
          </div>
          {renderInlineSelect('stage', 'Stage', project.stage, STAGE_LABELS, STAGE_LABELS[project.stage] || project.stage)}
          {renderInlineSelect('status', 'Status', project.status, STATUS_LABELS, STATUS_LABELS[project.status] || project.status)}
          {renderInlineSelect('priority', 'Priority', project.priority, PRIORITY_LABELS, PRIORITY_LABELS[project.priority] || project.priority)}
        </div>
        {renderInlineText('goal', 'Goal', project.goal, '+ add goal')}
        <div>
          <label className="text-xs text-dark-muted block mb-1">Tech Stack</label>
          <TechStackTags techStack={project.tech_stack} />
        </div>
        {renderInlineText('monetization_model', 'Monetization', project.monetization_model, '+ add monetization')}
        {renderInlineText('main_blocker', 'Main Blocker', project.main_blocker, '+ add blocker')}
        {renderInlineText('next_action', 'Next Action', project.next_action, '+ add next action')}
        <div>
          <label className="text-xs text-dark-muted block mb-0.5">Repo URL</label>
          {editingField === 'repo_url' ? (
            <input autoFocus value={fieldValue} onChange={e => setFieldValue(e.target.value)}
              onBlur={() => inlineSave('repo_url', fieldValue || null)}
              onKeyDown={e => { if (e.key === 'Enter') inlineSave('repo_url', fieldValue || null); if (e.key === 'Escape') setEditingField(null); }}
              placeholder="https://github.com/..."
              className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-sm" />
          ) : project.repo_url ? (
            <div className="flex items-center gap-2">
              <a href={project.repo_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-accent-blue hover:underline truncate">{project.repo_url}</a>
              <button onClick={() => startInline('repo_url', project.repo_url)}
                className="text-xs text-dark-muted hover:text-dark-text px-1">edit</button>
            </div>
          ) : (
            <p className="text-sm text-dark-muted/50 italic cursor-pointer hover:text-accent-blue"
              onClick={() => startInline('repo_url', project.repo_url)}>
              + add repo URL
            </p>
          )}
        </div>
        <Field label="Repo Path" value={project.repo_path} />
        {gitStatus && project.repo_path && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-dark-surface border border-dark-border">
              <span className="text-dark-muted">branch:</span>
              <span className="text-accent-blue font-medium">{gitStatus.branch}</span>
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${gitStatus.uncommitted > 0 ? 'bg-yellow-900/20 border-yellow-600/40 text-yellow-400' : 'bg-dark-surface border-dark-border text-dark-muted'}`}>
              {gitStatus.uncommitted} uncommitted
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${gitStatus.untracked > 0 ? 'bg-yellow-900/20 border-yellow-600/40 text-yellow-400' : 'bg-dark-surface border-dark-border text-dark-muted'}`}>
              {gitStatus.untracked} untracked
            </span>
            {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
              <>
                {gitStatus.ahead > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-900/20 border border-green-600/40 text-green-400">
                    {gitStatus.ahead} ahead
                  </span>
                )}
                {gitStatus.behind > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-accent-red/20 border border-accent-red/40 text-accent-red">
                    {gitStatus.behind} behind
                  </span>
                )}
              </>
            )}
          </div>
        )}
        {/* Recent Commits */}
        {recentCommits.length > 0 && (
          <div>
            <label className="text-xs text-dark-muted block mb-1.5">Recent Commits</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {recentCommits.map((c) => (
                <div key={c.hash} className="flex items-start gap-2 text-xs">
                  <code className="text-accent-blue font-mono shrink-0">{c.hash}</code>
                  <span className="text-dark-text truncate flex-1" title={c.message}>{c.message}</span>
                  <span className="text-dark-muted shrink-0">{c.date.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-xs text-dark-muted">Health Score</label>
            {healthRecalculated && (
              <span className="text-[10px] text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded" title="Based on: task completion, session recency, blocker status">
                auto-recalculated
              </span>
            )}
          </div>
          {showHealthSlider ? (
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" value={project.health_score}
                onChange={e => onUpdate({ health_score: Number(e.target.value) })}
                onMouseUp={() => setShowHealthSlider(false)}
                onBlur={() => setShowHealthSlider(false)}
                aria-label="Health score"
                className="flex-1" autoFocus />
              <span className="text-sm font-medium w-8 text-right">{project.health_score}</span>
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => setShowHealthSlider(true)}>
              <HealthBar score={project.health_score} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs text-dark-muted">
          <div>Created: {project.created_at?.split('T')[0]}</div>
          <div>Last worked: {project.last_worked_at || 'Never'}</div>
          <div>Launched: {project.launched_at || 'Not yet'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-3">
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
        className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" placeholder="Name" />
      <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
        className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-20 resize-none" placeholder="Description" />
      <div className="grid grid-cols-2 gap-3">
        <select value={form.type || ''} onChange={e => setForm({ ...form, type: e.target.value })}
          className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
          {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
          className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
          {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
          className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
          className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <input value={form.goal || ''} onChange={e => setForm({ ...form, goal: e.target.value })}
        className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" placeholder="Goal" />
      <div>
        <label className="text-xs text-dark-muted block mb-1">Tech Stack</label>
        <TagInput value={form.tech_stack} onChange={v => setForm({ ...form, tech_stack: v })} placeholder="Type and press Enter..." />
      </div>
      <input value={form.repo_url || ''} onChange={e => setForm({ ...form, repo_url: e.target.value })}
        className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" placeholder="Repo URL" />
      <input value={form.monetization_model || ''} onChange={e => setForm({ ...form, monetization_model: e.target.value })}
        className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" placeholder="Monetization model" />
      <input value={form.main_blocker || ''} onChange={e => setForm({ ...form, main_blocker: e.target.value })}
        className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" placeholder="Main blocker" />
      <input value={form.next_action || ''} onChange={e => setForm({ ...form, next_action: e.target.value })}
        className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" placeholder="Next action" />
      <div>
        <label className="text-xs text-dark-muted mb-1 block">Health: {form.health_score}</label>
        <input type="range" min="0" max="100" value={form.health_score}
          onChange={e => setForm({ ...form, health_score: Number(e.target.value) })}
          aria-label="Health score"
          className="w-full" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave}
          className="px-4 py-2 bg-accent-blue text-white text-sm rounded hover:bg-accent-blue/80">Save</button>
        <button onClick={() => setEditing(false)}
          className="px-4 py-2 bg-dark-surface border border-dark-border text-sm rounded hover:bg-dark-hover">Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <label className="text-xs text-dark-muted block mb-0.5">{label}</label>
      <p className="text-sm">{value || <span className="text-dark-muted italic">Not set</span>}</p>
    </div>
  );
}

// ============ MEMORY TAB ============
function MemoryTab({ projectId, repoPath }: { projectId: number; repoPath: string | null }) {
  const { data: sessions, refresh } = useData<ProjectSession>(() => api.getSessions(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [detecting, setDetecting] = useState(false);
  const { toast } = useToast();

  const handleAutoDetect = async () => {
    if (!repoPath) return;
    setDetecting(true);
    try {
      const lastDate = sessions[0]?.session_date || undefined;
      const detected = await api.detectSession(repoPath, lastDate);
      if (!detected) {
        toast('No new git activity detected', 'info');
        setDetecting(false);
        return;
      }
      // Auto-create session from detected data
      await api.createSession({
        project_id: projectId,
        summary: detected.suggested_summary,
        what_done: detected.suggested_what_done,
        files_changed: JSON.stringify(detected.files_changed),
        commands_used: JSON.stringify(detected.commands_used),
        duration_minutes: detected.duration_estimate,
        mood: 'confident',
      } as Partial<ProjectSession>);
      toast(`Session auto-logged: ${detected.commits.length} commits detected`);
      refresh();
    } catch (e) {
      toast('Failed to detect session', 'error');
    }
    setDetecting(false);
  };

  const lastSession = sessions[0];
  const moodKeys = Object.keys(MOOD_LABELS);

  const handleSessionEdit = async (sessionId: number, field: string, value: string | number) => {
    await api.updateSession(sessionId, { [field]: value || null } as Partial<ProjectSession>);
    setEditingSession(null);
    toast('Session updated');
    refresh();
  };

  const startSessionEditing = (sessionId: number, field: string, currentValue: string | number | null) => {
    setEditingSession({ id: sessionId, field });
    setEditValue(currentValue != null ? String(currentValue) : '');
  };

  const handleMoodCycle = async (session: ProjectSession) => {
    const currentIdx = moodKeys.indexOf(session.mood || 'neutral');
    const nextMood = moodKeys[(currentIdx + 1) % moodKeys.length];
    await api.updateSession(session.id, { mood: nextMood } as Partial<ProjectSession>);
    toast(`Mood: ${MOOD_LABELS[nextMood]}`);
    refresh();
  };

  const parseJsonTags = (val: string | null | undefined): string[] => {
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return val ? [val] : [];
    }
  };

  const renderEditableField = (
    session: ProjectSession,
    field: string,
    label: string,
    colorClass: string,
    isTextarea: boolean = false,
  ) => {
    const value = (session as unknown as Record<string, unknown>)[field] as string | null;
    const isEditing = editingSession?.id === session.id && editingSession?.field === field;

    if (isEditing) {
      const inputClass = 'w-full bg-dark-bg border border-accent-blue/50 rounded px-2 py-1 text-sm focus:outline-none focus:border-accent-blue';
      const handleSave = () => handleSessionEdit(session.id, field, field === 'duration_minutes' ? Number(editValue) : editValue);
      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (!isTextarea || e.metaKey || e.ctrlKey)) handleSave();
        if (e.key === 'Escape') setEditingSession(null);
      };

      return field === 'duration_minutes' ? (
        <input type="number" value={editValue} autoFocus
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleSave} onKeyDown={handleKeyDown}
          className={`${inputClass} w-24`} />
      ) : isTextarea ? (
        <textarea value={editValue} autoFocus
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleSave} onKeyDown={handleKeyDown}
          className={`${inputClass} h-16 resize-none`} />
      ) : (
        <input type="text" value={editValue} autoFocus
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleSave} onKeyDown={handleKeyDown}
          className={inputClass} />
      );
    }

    if (!value && field !== 'duration_minutes') {
      return (
        <span onClick={() => startSessionEditing(session.id, field, '')}
          className="text-xs text-dark-muted/50 italic cursor-pointer hover:text-dark-muted">
          + Add {label.toLowerCase()}
        </span>
      );
    }
    if (field === 'duration_minutes' && !value) {
      return (
        <span onClick={() => startSessionEditing(session.id, field, '')}
          className="text-xs text-dark-muted/50 italic cursor-pointer hover:text-dark-muted">?min</span>
      );
    }

    return (
      <span onClick={() => startSessionEditing(session.id, field, value)}
        className={`cursor-pointer hover:bg-dark-hover/30 rounded px-0.5 -mx-0.5 ${colorClass}`}
        title="Click to edit">
        {field === 'summary' ? value : `${label}: ${value}`}
        {field === 'duration_minutes' && 'min'}
      </span>
    );
  };

  return (
    <div className="max-w-2xl">
      {/* Session Resume Card */}
      {lastSession && (
        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-accent-blue mb-2">Last Session — {lastSession.session_date}</h3>
          {lastSession.summary && <p className="text-sm mb-2">{lastSession.summary}</p>}
          {lastSession.blockers && (
            <p className="text-sm text-accent-yellow/80 mb-1">Blockers: {lastSession.blockers}</p>
          )}
          {lastSession.next_step && (
            <p className="text-sm text-accent-green/80">Next step: {lastSession.next_step}</p>
          )}
          {lastSession.mood && (
            <span className="inline-block mt-2 text-xs bg-dark-surface px-2 py-0.5 rounded">
              Mood: {MOOD_LABELS[lastSession.mood] || lastSession.mood}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Sessions</h3>
        <div className="flex gap-2">
          {repoPath && (
            <button onClick={handleAutoDetect} disabled={detecting}
              className="px-3 py-1.5 text-sm bg-accent-purple/20 text-accent-purple rounded hover:bg-accent-purple/30 disabled:opacity-50">
              {detecting ? 'Scanning...' : 'Auto-detect from Git'}
            </button>
          )}
          <button onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80">
            + New Session
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map(s => {
          const filesChanged = parseJsonTags(s.files_changed as string | null);
          const commandsUsed = parseJsonTags(s.commands_used as string | null);

          return (
            <div key={s.id} className="bg-dark-surface border border-dark-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{s.session_date}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dark-muted">
                    {renderEditableField(s, 'duration_minutes', 'Duration', 'text-dark-muted')}
                  </span>
                  <span onClick={() => handleMoodCycle(s)}
                    className="text-xs bg-dark-bg px-2 py-0.5 rounded cursor-pointer hover:bg-dark-hover/30"
                    title="Click to cycle mood">
                    {MOOD_LABELS[s.mood || 'neutral'] || s.mood || 'Set mood'}
                  </span>
                  <button onClick={() => setDeleteSessionId(s.id)}
                    className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded">Del</button>
                </div>
              </div>
              <div className="text-sm mb-1 session-text">
                {renderEditableField(s, 'summary', 'Summary', '')}
              </div>
              <div className="text-xs text-dark-muted session-text">
                {renderEditableField(s, 'what_done', 'Done', 'text-dark-muted', true)}
              </div>
              <div className="text-xs text-accent-yellow/70 session-text">
                {renderEditableField(s, 'blockers', 'Blockers', 'text-accent-yellow/70', true)}
              </div>
              <div className="text-xs text-accent-green/70 session-text">
                {renderEditableField(s, 'next_step', 'Next', 'text-accent-green/70', true)}
              </div>
              {/* Files changed & commands used tag lists */}
              {filesChanged.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-dark-muted mr-1">Files:</span>
                  {filesChanged.map((f, i) => (
                    <span key={i} className="text-xs bg-dark-bg border border-dark-border rounded px-1.5 py-0.5 font-mono">{f}</span>
                  ))}
                </div>
              )}
              {commandsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-xs text-dark-muted mr-1">Commands:</span>
                  {commandsUsed.map((c, i) => (
                    <span key={i} className="text-xs bg-accent-blue/10 border border-accent-blue/20 rounded px-1.5 py-0.5 font-mono">{c}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-blue/10 flex items-center justify-center">
              <span className="text-xl text-accent-blue/50">{'\u25C8'}</span>
            </div>
            <p className="text-sm text-dark-muted mb-1">No sessions logged yet</p>
            <p className="text-xs text-dark-muted/60 mb-3">Sessions are the memory of your project. Log what you did, what worked, and what's next.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors">
                Log First Session
              </button>
              {repoPath && (
                <button onClick={handleAutoDetect} disabled={detecting}
                  className="px-4 py-2 bg-accent-purple/20 text-accent-purple text-sm rounded-lg hover:bg-accent-purple/30 transition-colors disabled:opacity-50">
                  {detecting ? 'Scanning...' : 'Auto-detect from Git'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteSessionId !== null}
        title="Delete Session"
        message="Are you sure you want to delete this session?"
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deleteSessionId) {
            const deleted = sessions.find(s => s.id === deleteSessionId);
            await api.deleteSession(deleteSessionId);
            refresh();
            toast('Session deleted', 'info', deleted ? {
              label: 'Undo',
              onClick: async () => {
                await api.createSession({ project_id: projectId, summary: deleted.summary, what_done: deleted.what_done, what_worked: deleted.what_worked, what_failed: deleted.what_failed, blockers: deleted.blockers, next_step: deleted.next_step, mood: deleted.mood, duration_minutes: deleted.duration_minutes });
                refresh();
              },
            } : undefined);
          }
          setDeleteSessionId(null);
        }}
        onCancel={() => setDeleteSessionId(null)}
      />
      <NewSessionModal open={showForm} onClose={() => setShowForm(false)} projectId={projectId} onCreated={refresh} />
    </div>
  );
}

function NewSessionModal({ open, onClose, projectId, onCreated }: { open: boolean; onClose: () => void; projectId: number; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    summary: '', what_done: '', what_worked: '', what_failed: '', blockers: '', next_step: '', mood: 'neutral' as string, duration_minutes: '',
  });

  const handleSubmit = async () => {
    await api.createSession({
      project_id: projectId,
      ...form,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
    });
    toast('Session logged');
    onCreated();
    onClose();
    setForm({ summary: '', what_done: '', what_worked: '', what_failed: '', blockers: '', next_step: '', mood: 'neutral', duration_minutes: '' });
  };

  return (
    <Modal open={open} onClose={onClose} title="New Session Log">
      <div className="space-y-3">
        <textarea placeholder="Summary — what happened this session?" value={form.summary}
          onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-20 resize-none" />
        <textarea placeholder="What did you get done?" value={form.what_done}
          onChange={e => setForm(f => ({ ...f, what_done: e.target.value }))}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-16 resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <textarea placeholder="What worked well?" value={form.what_worked}
            onChange={e => setForm(f => ({ ...f, what_worked: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-16 resize-none" />
          <textarea placeholder="What didn't work?" value={form.what_failed}
            onChange={e => setForm(f => ({ ...f, what_failed: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-16 resize-none" />
        </div>
        <textarea placeholder="Blockers?" value={form.blockers}
          onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-16 resize-none" />
        <textarea placeholder="Next step" value={form.next_step}
          onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-16 resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}
            className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
            {Object.entries(MOOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="number" placeholder="Duration (min)" value={form.duration_minutes}
            onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
            className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" />
        </div>
        <button onClick={handleSubmit}
          className="w-full py-2 bg-accent-blue text-white text-sm rounded hover:bg-accent-blue/80">
          Log Session
        </button>
      </div>
    </Modal>
  );
}

// ============ TASKS TAB ============
function TasksTab({ projectId, repoPath }: { projectId: number; repoPath: string | null }) {
  const { data: tasks, refresh } = useData<ProjectTask>(() => api.getTasks(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'status' | 'priority'>('status');
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [subtasksMap, setSubtasksMap] = useState<Record<number, TaskSubtask[]>>({});
  const [newSubtaskFor, setNewSubtaskFor] = useState<number | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<{ id: number; title: string } | null>(null);
  const { toast } = useToast();

  // Load subtasks for all tasks
  useEffect(() => {
    if (tasks.length === 0) return;
    const loadSubtasks = async () => {
      const map: Record<number, TaskSubtask[]> = {};
      await Promise.all(tasks.map(async (task) => {
        map[task.id] = await api.getSubtasks(task.id);
      }));
      setSubtasksMap(map);
    };
    loadSubtasks();
  }, [tasks]);

  const refreshSubtasks = async (taskId: number) => {
    const subs = await api.getSubtasks(taskId);
    setSubtasksMap(prev => ({ ...prev, [taskId]: subs }));
  };

  const handleCreateSubtask = async (taskId: number) => {
    if (!newSubtaskTitle.trim()) return;
    const existing = subtasksMap[taskId] || [];
    await api.createSubtask({ task_id: taskId, title: newSubtaskTitle.trim(), order_index: existing.length });
    setNewSubtaskTitle('');
    setNewSubtaskFor(null);
    await refreshSubtasks(taskId);
  };

  const handleToggleSubtask = async (subtask: TaskSubtask) => {
    await api.updateSubtask(subtask.id, { done: subtask.done ? 0 : 1 });
    await refreshSubtasks(subtask.task_id);
  };

  const handleUpdateSubtaskTitle = async (subtask: TaskSubtask, title: string) => {
    if (title.trim() && title !== subtask.title) {
      await api.updateSubtask(subtask.id, { title: title.trim() });
    }
    setEditingSubtask(null);
    await refreshSubtasks(subtask.task_id);
  };

  const handleDeleteSubtask = async (subtask: TaskSubtask) => {
    await api.deleteSubtask(subtask.id);
    await refreshSubtasks(subtask.task_id);
  };

  const handleInlineEdit = async (taskId: number, field: string, value: string) => {
    await api.updateTask(taskId, { [field]: value || null });
    setEditingTask(null);
    refresh();
  };

  const startEditing = (taskId: number, field: string, currentValue: string) => {
    setEditingTask({ id: taskId, field });
    setEditValue(currentValue || '');
  };

  const priorityCycle: Record<string, string> = { low: 'medium', medium: 'high', high: 'critical', critical: 'low' };
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-blue-500/20 text-blue-400',
    low: 'bg-gray-500/20 text-gray-400',
  };

  const handlePriorityCycle = async (task: ProjectTask) => {
    const next = priorityCycle[task.priority] || 'medium';
    await api.updateTask(task.id, { priority: next });
    refresh();
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) return;
    await api.createTask({
      project_id: projectId, title: newTask.title, description: newTask.description || null,
      status: 'todo', priority: newTask.priority, due_date: null,
    });
    toast('Task created');
    setNewTask({ title: '', description: '', priority: 'medium' });
    setShowForm(false);
    refresh();
  };

  const handleStatusChange = async (taskId: number, status: string) => {
    await api.updateTask(taskId, { status });
    refresh();
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (taskFilter !== 'all') {
      result = result.filter(t => t.status === taskFilter);
    }
    if (sortBy === 'priority') {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      result = [...result].sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));
    }
    return result;
  }, [tasks, taskFilter, sortBy]);

  const grouped = {
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    todo: filteredTasks.filter(t => t.status === 'todo'),
    blocked: filteredTasks.filter(t => t.status === 'blocked'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">Tasks</h3>
          <div className="flex gap-1 bg-dark-surface border border-dark-border rounded p-0.5">
            {['all', 'todo', 'in_progress', 'blocked', 'done'].map(f => (
              <button key={f} onClick={() => setTaskFilter(f)}
                className={`px-2 py-0.5 text-xs rounded ${taskFilter === f ? 'bg-accent-blue text-white' : 'text-dark-muted hover:text-dark-text'}`}>
                {f === 'all' ? 'All' : TASK_STATUS_LABELS[f]}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'status' | 'priority')}
            className="bg-dark-surface border border-dark-border rounded px-2 py-0.5 text-xs">
            <option value="status">Sort: Status</option>
            <option value="priority">Sort: Priority</option>
          </select>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80">+ Add Task</button>
      </div>

      {showForm && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-4 max-w-lg">
          <input placeholder="Task title" value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm mb-2" />
          <textarea placeholder="Description (optional)" value={newTask.description} onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-16 resize-none mb-2" />
          <div className="flex gap-2">
            <select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={handleCreate} className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded">Create</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-dark-muted hover:text-dark-text">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(Object.entries(grouped) as [string, ProjectTask[]][]).map(([status, items]) => (
          <div key={status} className="min-w-0">
            <h4 className="text-xs font-medium text-dark-muted uppercase mb-2">
              {TASK_STATUS_LABELS[status]} ({items.length})
            </h4>
            <div className="space-y-2">
              {items.map(task => (
                <div key={task.id} className="bg-dark-surface border border-dark-border rounded-lg p-3">
                  {/* Title - inline editable + subtask progress */}
                  {editingTask?.id === task.id && editingTask.field === 'title' ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleInlineEdit(task.id, 'title', editValue)}
                      onKeyDown={e => { if (e.key === 'Enter') handleInlineEdit(task.id, 'title', editValue); if (e.key === 'Escape') setEditingTask(null); }}
                      className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-sm font-medium mb-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium cursor-pointer hover:text-accent-blue flex-1"
                        onClick={() => startEditing(task.id, 'title', task.title)}>
                        {task.title}
                      </p>
                      {(subtasksMap[task.id]?.length ?? 0) > 0 && (
                        <span className="text-xs text-dark-muted whitespace-nowrap">
                          {subtasksMap[task.id].filter(s => s.done).length}/{subtasksMap[task.id].length}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Priority badge - click to cycle */}
                  <button onClick={() => handlePriorityCycle(task)}
                    className={`text-xs px-2 py-0.5 rounded mb-1 inline-block ${priorityColors[task.priority] || priorityColors.medium}`}>
                    {PRIORITY_LABELS[task.priority] || task.priority}
                  </button>

                  {/* Description - inline editable */}
                  {editingTask?.id === task.id && editingTask.field === 'description' ? (
                    <textarea
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleInlineEdit(task.id, 'description', editValue)}
                      onKeyDown={e => { if (e.key === 'Escape') setEditingTask(null); }}
                      className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-xs h-16 resize-none mb-2"
                    />
                  ) : (
                    <p className={`text-xs mb-2 cursor-pointer hover:text-accent-blue ${task.description ? 'text-dark-muted' : 'text-dark-muted/50 italic'}`}
                      onClick={() => startEditing(task.id, 'description', task.description || '')}>
                      {task.description || '+ add description'}
                    </p>
                  )}

                  {/* Due date - inline editable */}
                  {editingTask?.id === task.id && editingTask.field === 'due_date' ? (
                    <input
                      type="date"
                      autoFocus
                      value={editValue}
                      onChange={e => { handleInlineEdit(task.id, 'due_date', e.target.value); }}
                      onBlur={() => setEditingTask(null)}
                      onKeyDown={e => { if (e.key === 'Escape') setEditingTask(null); }}
                      className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-xs mb-2 block"
                    />
                  ) : (
                    <p className={`text-xs mb-2 cursor-pointer hover:text-accent-blue ${task.due_date ? 'text-dark-muted' : 'text-dark-muted/50 italic'}`}
                      onClick={() => startEditing(task.id, 'due_date', task.due_date || '')}>
                      {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : '+ due date'}
                    </p>
                  )}

                  {/* Completed at */}
                  {task.status === 'done' && task.completed_at && (
                    <p className="text-xs text-accent-green mb-2">
                      Completed: {new Date(task.completed_at).toLocaleDateString()}
                    </p>
                  )}

                  {/* Subtasks checklist */}
                  {((subtasksMap[task.id]?.length ?? 0) > 0 || newSubtaskFor === task.id) && (
                    <div className="mb-2 border-t border-dark-border pt-2">
                      {(subtasksMap[task.id] || []).map(sub => (
                        <div key={sub.id} className="flex items-center gap-1.5 group py-0.5">
                          <input
                            type="checkbox"
                            checked={!!sub.done}
                            onChange={() => handleToggleSubtask(sub)}
                            className="accent-accent-blue cursor-pointer flex-shrink-0"
                          />
                          {editingSubtask?.id === sub.id ? (
                            <input
                              autoFocus
                              value={editingSubtask.title}
                              onChange={e => setEditingSubtask({ id: sub.id, title: e.target.value })}
                              onBlur={() => handleUpdateSubtaskTitle(sub, editingSubtask.title)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdateSubtaskTitle(sub, editingSubtask.title);
                                if (e.key === 'Escape') setEditingSubtask(null);
                              }}
                              className="flex-1 bg-dark-bg border border-accent-blue rounded px-1.5 py-0.5 text-xs min-w-0"
                            />
                          ) : (
                            <span
                              className={`flex-1 text-xs cursor-pointer hover:text-accent-blue min-w-0 truncate ${sub.done ? 'line-through text-dark-muted/60' : 'text-dark-text'}`}
                              onClick={() => setEditingSubtask({ id: sub.id, title: sub.title })}
                            >
                              {sub.title}
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteSubtask(sub)}
                            className="text-xs text-dark-muted/40 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            x
                          </button>
                        </div>
                      ))}
                      {newSubtaskFor === task.id && (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span className="text-xs text-dark-muted flex-shrink-0">+</span>
                          <input
                            autoFocus
                            value={newSubtaskTitle}
                            onChange={e => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCreateSubtask(task.id);
                              if (e.key === 'Escape') { setNewSubtaskFor(null); setNewSubtaskTitle(''); }
                            }}
                            onBlur={() => { if (!newSubtaskTitle.trim()) { setNewSubtaskFor(null); setNewSubtaskTitle(''); } }}
                            placeholder="Subtask title..."
                            className="flex-1 bg-dark-bg border border-dark-border rounded px-1.5 py-0.5 text-xs min-w-0"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {/* Add subtask button */}
                  {newSubtaskFor !== task.id && (
                    <button
                      onClick={() => { setNewSubtaskFor(task.id); setNewSubtaskTitle(''); }}
                      className="text-xs text-dark-muted/50 hover:text-accent-blue mb-2 block"
                    >
                      + subtask
                    </button>
                  )}

                  {repoPath && task.status !== 'done' && (
                    <div className="flex gap-1 mb-2">
                      <button onClick={async () => {
                        await api.openTerminal(repoPath);
                        if (task.status === 'todo') handleStatusChange(task.id, 'in_progress');
                      }}
                        className="text-xs px-2 py-1 bg-accent-green/20 text-accent-green rounded hover:bg-accent-green/30">
                        Open Terminal
                      </button>
                      <button onClick={async () => {
                        await api.openVSCode(repoPath);
                        if (task.status === 'todo') handleStatusChange(task.id, 'in_progress');
                      }}
                        className="text-xs px-2 py-1 bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30">
                        Open VS Code
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1 flex-wrap">
                    {['todo', 'in_progress', 'done', 'blocked'].filter(s => s !== status).map(s => (
                      <button key={s} onClick={() => handleStatusChange(task.id, s)}
                        className="text-xs px-2 py-0.5 bg-dark-bg rounded hover:bg-dark-hover">
                        {TASK_STATUS_LABELS[s]}
                      </button>
                    ))}
                    <button onClick={() => setDeleteTaskId(task.id)}
                      className="text-xs px-2 py-0.5 text-accent-red hover:bg-accent-red/10 rounded ml-auto">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={deleteTaskId !== null}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deleteTaskId) {
            const deleted = tasks.find(t => t.id === deleteTaskId);
            await api.deleteTask(deleteTaskId);
            refresh();
            toast('Task deleted', 'info', deleted ? {
              label: 'Undo',
              onClick: async () => {
                await api.createTask({ project_id: projectId, title: deleted.title, description: deleted.description, status: deleted.status, priority: deleted.priority, due_date: deleted.due_date });
                refresh();
              },
            } : undefined);
          }
          setDeleteTaskId(null);
        }}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
}

// ============ LAUNCHER TAB ============
function LauncherTab({ projectId, repoPath }: { projectId: number; repoPath: string | null }) {
  const { data: commands, refresh } = useData<ProjectCommand>(() => api.getCommands(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [newCmd, setNewCmd] = useState({ label: '', command: '', command_type: 'terminal', shell: 'powershell', auto_run: 0 });
  const [deleteCmdId, setDeleteCmdId] = useState<number | null>(null);
  const [editingCmd, setEditingCmd] = useState<{ id: number; field: string } | null>(null);
  const [cmdEditValue, setCmdEditValue] = useState('');
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!newCmd.label.trim() || !newCmd.command.trim()) return;
    await api.createCommand({
      project_id: projectId, ...newCmd, working_dir: null, order_index: commands.length,
      ports_used: null, notes: null,
    });
    setNewCmd({ label: '', command: '', command_type: 'terminal', shell: 'powershell', auto_run: 0 });
    setShowForm(false);
    refresh();
  };

  const launchAll = async () => {
    const autoRun = commands.filter(c => c.auto_run);
    for (const cmd of autoRun) {
      await api.launchCommand(cmd.id);
    }
    toast(`Launched ${autoRun.length} command(s)`, 'success');
  };

  const saveCmdField = async (cmdId: number, field: string, value: string | number | null) => {
    await api.updateCommand(cmdId, { [field]: value });
    setEditingCmd(null);
    refresh();
  };

  const startCmdEdit = (cmdId: number, field: string, current: string | null) => {
    setEditingCmd({ id: cmdId, field });
    setCmdEditValue(current || '');
  };

  const toggleAutoRun = async (cmd: ProjectCommand) => {
    await api.updateCommand(cmd.id, { auto_run: cmd.auto_run ? 0 : 1 });
    refresh();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-base font-semibold">Launch Commands</h3>
        {repoPath && <span className="text-xs text-dark-muted">{repoPath}</span>}
        <div className="ml-auto flex gap-2">
          {commands.some(c => c.auto_run) && (
            <button onClick={launchAll}
              className="px-3 py-1.5 text-sm bg-accent-green text-white rounded hover:bg-accent-green/80">
              Launch All Auto-Run
            </button>
          )}
          <button onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80">+ Add</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input placeholder="Label (e.g. Start Dev Server)" value={newCmd.label}
              onChange={e => setNewCmd(c => ({ ...c, label: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" />
            <input placeholder="Command" value={newCmd.command}
              onChange={e => setNewCmd(c => ({ ...c, command: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3 items-center">
            <select value={newCmd.command_type} onChange={e => setNewCmd(c => ({ ...c, command_type: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
              <option value="terminal">Terminal</option>
              <option value="vscode">VS Code</option>
              <option value="browser">Browser</option>
            </select>
            <select value={newCmd.shell} onChange={e => setNewCmd(c => ({ ...c, shell: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
              <option value="powershell">PowerShell</option>
              <option value="bash">Bash</option>
              <option value="cmd">CMD</option>
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={!!newCmd.auto_run}
                onChange={e => setNewCmd(c => ({ ...c, auto_run: e.target.checked ? 1 : 0 }))} />
              Auto-run
            </label>
            <button onClick={handleCreate} className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded ml-auto">Add</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-dark-muted">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {commands.map(cmd => (
          <div key={cmd.id} className="bg-dark-surface border border-dark-border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {editingCmd?.id === cmd.id && editingCmd.field === 'label' ? (
                    <input autoFocus value={cmdEditValue} onChange={e => setCmdEditValue(e.target.value)}
                      onBlur={() => saveCmdField(cmd.id, 'label', cmdEditValue)}
                      onKeyDown={e => { if (e.key === 'Enter') saveCmdField(cmd.id, 'label', cmdEditValue); if (e.key === 'Escape') setEditingCmd(null); }}
                      className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-sm font-medium flex-1" />
                  ) : (
                    <span className="text-sm font-medium cursor-pointer hover:text-accent-blue"
                      onClick={() => startCmdEdit(cmd.id, 'label', cmd.label)}>{cmd.label}</span>
                  )}
                  <span className="text-xs text-dark-muted">{cmd.command_type}</span>
                  <button onClick={() => toggleAutoRun(cmd)}
                    className={`text-xs px-1.5 py-0.5 rounded transition-colors ${cmd.auto_run ? 'bg-accent-green/20 text-accent-green' : 'bg-dark-bg text-dark-muted hover:text-dark-text'}`}>
                    {cmd.auto_run ? 'auto' : 'manual'}
                  </button>
                </div>
                {editingCmd?.id === cmd.id && editingCmd.field === 'command' ? (
                  <input autoFocus value={cmdEditValue} onChange={e => setCmdEditValue(e.target.value)}
                    onBlur={() => saveCmdField(cmd.id, 'command', cmdEditValue)}
                    onKeyDown={e => { if (e.key === 'Enter') saveCmdField(cmd.id, 'command', cmdEditValue); if (e.key === 'Escape') setEditingCmd(null); }}
                    className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-xs font-mono" />
                ) : (
                  <code className="text-xs text-dark-muted font-mono cursor-pointer hover:text-accent-blue block"
                    onClick={() => startCmdEdit(cmd.id, 'command', cmd.command)}>{cmd.command}</code>
                )}
                {editingCmd?.id === cmd.id && editingCmd.field === 'working_dir' ? (
                  <input autoFocus value={cmdEditValue} onChange={e => setCmdEditValue(e.target.value)}
                    onBlur={() => saveCmdField(cmd.id, 'working_dir', cmdEditValue || null)}
                    onKeyDown={e => { if (e.key === 'Enter') saveCmdField(cmd.id, 'working_dir', cmdEditValue || null); if (e.key === 'Escape') setEditingCmd(null); }}
                    placeholder="Working directory..."
                    className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-xs mt-1" />
                ) : cmd.working_dir && cmd.working_dir !== repoPath ? (
                  <span className="text-xs text-dark-muted mt-1 block cursor-pointer hover:text-accent-blue"
                    onClick={() => startCmdEdit(cmd.id, 'working_dir', cmd.working_dir)}>Dir: {cmd.working_dir}</span>
                ) : (
                  <span className="text-xs text-dark-muted/40 mt-1 block cursor-pointer hover:text-dark-muted italic"
                    onClick={() => startCmdEdit(cmd.id, 'working_dir', cmd.working_dir)}>+ working dir</span>
                )}
                <div className="flex gap-3 mt-1">
                  {editingCmd?.id === cmd.id && editingCmd.field === 'ports_used' ? (
                    <input autoFocus value={cmdEditValue} onChange={e => setCmdEditValue(e.target.value)}
                      onBlur={() => saveCmdField(cmd.id, 'ports_used', cmdEditValue || null)}
                      onKeyDown={e => { if (e.key === 'Enter') saveCmdField(cmd.id, 'ports_used', cmdEditValue || null); if (e.key === 'Escape') setEditingCmd(null); }}
                      placeholder="e.g. 3000, 5432"
                      className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-xs" />
                  ) : cmd.ports_used ? (
                    <span className="text-xs text-accent-purple cursor-pointer hover:text-accent-purple/70"
                      onClick={() => startCmdEdit(cmd.id, 'ports_used', cmd.ports_used)}>Ports: {cmd.ports_used}</span>
                  ) : (
                    <span className="text-xs text-dark-muted/40 cursor-pointer hover:text-dark-muted italic"
                      onClick={() => startCmdEdit(cmd.id, 'ports_used', '')}>+ ports</span>
                  )}
                </div>
                {editingCmd?.id === cmd.id && editingCmd.field === 'notes' ? (
                  <textarea autoFocus value={cmdEditValue} onChange={e => setCmdEditValue(e.target.value)}
                    onBlur={() => saveCmdField(cmd.id, 'notes', cmdEditValue || null)}
                    onKeyDown={e => { if (e.key === 'Escape') setEditingCmd(null); }}
                    className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-xs mt-1 h-12 resize-none" />
                ) : cmd.notes ? (
                  <p className="text-xs text-dark-muted/80 mt-1 cursor-pointer hover:text-accent-blue"
                    onClick={() => startCmdEdit(cmd.id, 'notes', cmd.notes)}>{cmd.notes}</p>
                ) : (
                  <span className="text-xs text-dark-muted/40 mt-1 block cursor-pointer hover:text-dark-muted italic"
                    onClick={() => startCmdEdit(cmd.id, 'notes', '')}>+ add notes</span>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={async () => {
                  const result = await api.launchCommand(cmd.id);
                  if (result.ok) toast(`Launched "${cmd.label}"`, 'success');
                  else toast(result.error || 'Launch failed', 'error');
                }}
                  className="px-3 py-1.5 text-sm bg-accent-green/20 text-accent-green rounded hover:bg-accent-green/30">
                  Launch
                </button>
                <button onClick={() => setDeleteCmdId(cmd.id)}
                  className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded">Del</button>
              </div>
            </div>
          </div>
        ))}
        {commands.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-green/10 flex items-center justify-center">
              <span className="text-xl text-accent-green/50">{'\u25B8'}</span>
            </div>
            <p className="text-sm text-dark-muted mb-1">No launch commands yet</p>
            <p className="text-xs text-dark-muted/60 mb-3">Add terminal commands, VS Code openers, or browser URLs to launch your dev environment in one click.</p>
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors">
              + Add First Command
            </button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deleteCmdId !== null}
        title="Delete Command"
        message="Are you sure you want to delete this launch command?"
        confirmLabel="Delete"
        danger
        onConfirm={async () => { if (deleteCmdId) { await api.deleteCommand(deleteCmdId); toast('Command deleted', 'info'); refresh(); } setDeleteCmdId(null); }}
        onCancel={() => setDeleteCmdId(null)}
      />
    </div>
  );
}

// ============ METRICS TAB ============
function MetricsTab({ projectId, repoPath }: { projectId: number; repoPath: string | null }) {
  const { data: metrics, refresh } = useData<ProjectMetric>(() => api.getMetrics(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ metric_name: '', metric_value: '', metric_unit: '', date: new Date().toISOString().split('T')[0], source: '', notes: '' });
  const [deleteMetricId, setDeleteMetricId] = useState<number | null>(null);
  const [editingMetric, setEditingMetric] = useState<{ id: number; field: string } | null>(null);
  const [metricEditValue, setMetricEditValue] = useState('');
  const { toast } = useToast();
  const [tokenWiseAvailable, setTokenWiseAvailable] = useState(false);
  const [projectCost, setProjectCost] = useState<{ total_cost: number; total_interactions: number; sessions: number; last_used: string | null; daily_costs: { date: string; cost: number }[] } | null>(null);

  // Feature 3: Load TokenWise cost data
  useEffect(() => {
    if (!repoPath) return;
    api.isTokenWiseAvailable().then(available => {
      setTokenWiseAvailable(available);
      if (available) {
        api.getProjectCost(repoPath).then(data => setProjectCost(data)).catch(() => {});
      }
    }).catch(() => {});
  }, [repoPath]);

  const handleCreate = async () => {
    if (!form.metric_name || !form.metric_value) return;
    await api.createMetric({
      project_id: projectId, metric_name: form.metric_name, metric_value: Number(form.metric_value),
      metric_unit: form.metric_unit || null, date: form.date, source: form.source || null, notes: form.notes || null,
    });
    setForm({ metric_name: '', metric_value: '', metric_unit: '', date: new Date().toISOString().split('T')[0], source: '', notes: '' });
    setShowForm(false);
    refresh();
  };

  const saveMetricField = async (metricId: number, field: string, value: string | number | null) => {
    await api.updateMetric(metricId, { [field]: value } as Partial<ProjectMetric>);
    setEditingMetric(null);
    refresh();
  };

  const startMetricEdit = (metricId: number, field: string, current: string | number | null) => {
    setEditingMetric({ id: metricId, field });
    setMetricEditValue(current != null ? String(current) : '');
  };

  const maxDailyCost = projectCost?.daily_costs?.length
    ? Math.max(...projectCost.daily_costs.map(d => d.cost), 0.01)
    : 1;

  return (
    <div className="max-w-2xl">
      {tokenWiseAvailable && repoPath && projectCost && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold mb-3 text-dark-text">Claude Cost (TokenWise)</h4>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-xs text-dark-muted">Total Cost</div>
              <div className="text-lg font-bold text-accent-blue">${projectCost.total_cost.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-dark-muted">Interactions</div>
              <div className="text-lg font-bold">{projectCost.total_interactions}</div>
            </div>
            <div>
              <div className="text-xs text-dark-muted">Last Used</div>
              <div className="text-sm">{projectCost.last_used ? projectCost.last_used.split('T')[0] : 'N/A'}</div>
            </div>
          </div>
          {projectCost.daily_costs && projectCost.daily_costs.length > 0 && (
            <div>
              <div className="text-xs text-dark-muted mb-1">Daily costs (last 30 days)</div>
              <div className="flex items-end gap-px h-16">
                {projectCost.daily_costs.slice(-30).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className="w-full bg-accent-blue/70 rounded-t-sm min-h-[2px] hover:bg-accent-blue transition-colors"
                      style={{ height: `${Math.max((d.cost / maxDailyCost) * 100, 3)}%` }}
                      title={`${d.date}: $${d.cost.toFixed(2)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Metrics</h3>
        <button onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80">+ Add Metric</button>
      </div>

      {showForm && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input placeholder="Metric name" value={form.metric_name}
              onChange={e => setForm(f => ({ ...f, metric_name: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" />
            <input type="number" placeholder="Value" value={form.metric_value}
              onChange={e => setForm(f => ({ ...f, metric_value: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" />
            <input placeholder="Unit (NIS, USD, count)" value={form.metric_unit}
              onChange={e => setForm(f => ({ ...f, metric_unit: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm" />
            <button onClick={handleCreate} className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded">Add</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-dark-muted">Cancel</button>
          </div>
        </div>
      )}

      <React.Suspense fallback={<div className="h-[220px] bg-dark-surface border border-dark-border rounded-lg animate-pulse" />}>
        <MetricsChart metrics={metrics} />
      </React.Suspense>

      <div className="space-y-2">
        {metrics.map(m => (
          <div key={m.id} className="bg-dark-surface border border-dark-border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {editingMetric?.id === m.id && editingMetric.field === 'metric_name' ? (
                  <input autoFocus value={metricEditValue} onChange={e => setMetricEditValue(e.target.value)}
                    onBlur={() => saveMetricField(m.id, 'metric_name', metricEditValue)}
                    onKeyDown={e => { if (e.key === 'Enter') saveMetricField(m.id, 'metric_name', metricEditValue); if (e.key === 'Escape') setEditingMetric(null); }}
                    className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-sm font-medium" />
                ) : (
                  <span className="text-sm font-medium cursor-pointer hover:text-accent-blue"
                    onClick={() => startMetricEdit(m.id, 'metric_name', m.metric_name)}>{m.metric_name}</span>
                )}
                {editingMetric?.id === m.id && editingMetric.field === 'metric_value' ? (
                  <input autoFocus type="number" value={metricEditValue} onChange={e => setMetricEditValue(e.target.value)}
                    onBlur={() => saveMetricField(m.id, 'metric_value', Number(metricEditValue))}
                    onKeyDown={e => { if (e.key === 'Enter') saveMetricField(m.id, 'metric_value', Number(metricEditValue)); if (e.key === 'Escape') setEditingMetric(null); }}
                    className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-sm w-24" />
                ) : (
                  <span className="text-sm text-accent-blue cursor-pointer hover:text-accent-blue/70"
                    onClick={() => startMetricEdit(m.id, 'metric_value', m.metric_value)}>{m.metric_value} {m.metric_unit}</span>
                )}
                {editingMetric?.id === m.id && editingMetric.field === 'date' ? (
                  <input autoFocus type="date" value={metricEditValue}
                    onChange={e => saveMetricField(m.id, 'date', e.target.value)}
                    onBlur={() => setEditingMetric(null)}
                    className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-xs" />
                ) : (
                  <span className="text-xs text-dark-muted cursor-pointer hover:text-accent-blue"
                    onClick={() => startMetricEdit(m.id, 'date', m.date)}>{m.date}</span>
                )}
              </div>
              <button onClick={() => setDeleteMetricId(m.id)}
                className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded shrink-0">Del</button>
            </div>
            <div className="flex gap-4 mt-1">
              {editingMetric?.id === m.id && editingMetric.field === 'source' ? (
                <input autoFocus value={metricEditValue} onChange={e => setMetricEditValue(e.target.value)}
                  onBlur={() => saveMetricField(m.id, 'source', metricEditValue || null)}
                  onKeyDown={e => { if (e.key === 'Enter') saveMetricField(m.id, 'source', metricEditValue || null); if (e.key === 'Escape') setEditingMetric(null); }}
                  placeholder="Source..."
                  className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-xs flex-1" />
              ) : (
                <span className={`text-xs cursor-pointer hover:text-accent-blue ${m.source ? 'text-dark-muted' : 'text-dark-muted/40 italic'}`}
                  onClick={() => startMetricEdit(m.id, 'source', m.source)}>
                  {m.source ? `Source: ${m.source}` : '+ source'}
                </span>
              )}
              {editingMetric?.id === m.id && editingMetric.field === 'notes' ? (
                <input autoFocus value={metricEditValue} onChange={e => setMetricEditValue(e.target.value)}
                  onBlur={() => saveMetricField(m.id, 'notes', metricEditValue || null)}
                  onKeyDown={e => { if (e.key === 'Enter') saveMetricField(m.id, 'notes', metricEditValue || null); if (e.key === 'Escape') setEditingMetric(null); }}
                  placeholder="Notes..."
                  className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-xs flex-1" />
              ) : (
                <span className={`text-xs cursor-pointer hover:text-accent-blue ${m.notes ? 'text-dark-muted' : 'text-dark-muted/40 italic'}`}
                  onClick={() => startMetricEdit(m.id, 'notes', m.notes)}>
                  {m.notes || '+ notes'}
                </span>
              )}
            </div>
          </div>
        ))}
        {metrics.length === 0 && !tokenWiseAvailable && (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-blue/10 flex items-center justify-center">
              <span className="text-xl text-accent-blue/50">{'\u2261'}</span>
            </div>
            <p className="text-sm text-dark-muted mb-1">No metrics yet</p>
            <p className="text-xs text-dark-muted/60 mb-3">Track revenue, users, performance, or any numeric data over time.</p>
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors">
              + Add First Metric
            </button>
          </div>
        )}
        {metrics.length === 0 && tokenWiseAvailable && (
          <p className="text-sm text-dark-muted mt-4">No custom metrics yet — add some to track alongside your Claude costs.</p>
        )}
      </div>
      <ConfirmDialog
        open={deleteMetricId !== null}
        title="Delete Metric"
        message="Are you sure you want to delete this metric?"
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deleteMetricId) {
            const deleted = metrics.find(m => m.id === deleteMetricId);
            await api.deleteMetric(deleteMetricId);
            refresh();
            toast('Metric deleted', 'info', deleted ? {
              label: 'Undo',
              onClick: async () => {
                await api.createMetric({ project_id: projectId, metric_name: deleted.metric_name, metric_value: deleted.metric_value, metric_unit: deleted.metric_unit, date: deleted.date, source: deleted.source, notes: deleted.notes });
                refresh();
              },
            } : undefined);
          }
          setDeleteMetricId(null);
        }}
        onCancel={() => setDeleteMetricId(null)}
      />
    </div>
  );
}

// ============ LEARNINGS TAB ============
function LearningsTab({ projectId }: { projectId: number }) {
  const { data: learnings, refresh } = useData<Learning>(() => api.getLearnings(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ learning: '', category: 'technical', impact_score: '5' });
  const [deleteLearningId, setDeleteLearningId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();

  const CATEGORIES = ['technical', 'business', 'process', 'personal'] as const;

  const handleCreate = async () => {
    if (!form.learning.trim()) return;
    await api.createLearning({
      project_id: projectId, learning: form.learning, category: form.category, impact_score: Number(form.impact_score),
    });
    setForm({ learning: '', category: 'technical', impact_score: '5' });
    setShowForm(false);
    refresh();
  };

  const saveEdit = async (id: number, field: string, value: unknown) => {
    await api.updateLearning(id, { [field]: value } as Partial<Learning>);
    setEditing(null);
    setEditValue('');
    refresh();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setEditing(null); setEditValue(''); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (editing) saveEdit(editing.id, editing.field, editValue); }
  };

  const cycleCategory = async (id: number, current: string | null) => {
    const idx = current ? CATEGORIES.indexOf(current as typeof CATEGORIES[number]) : -1;
    const next = CATEGORIES[(idx + 1) % CATEGORIES.length];
    await api.updateLearning(id, { category: next } as Partial<Learning>);
    refresh();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Learnings</h3>
        <button onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80">+ Add Learning</button>
      </div>

      {showForm && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-4">
          <textarea placeholder="What did you learn?" value={form.learning}
            onChange={e => setForm(f => ({ ...f, learning: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-20 resize-none mb-3" />
          <div className="flex gap-3">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min="1" max="10" placeholder="Impact (1-10)" value={form.impact_score}
              onChange={e => setForm(f => ({ ...f, impact_score: e.target.value }))}
              className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm w-32" />
            <button onClick={handleCreate} className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded">Add</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-dark-muted">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {learnings.map(l => (
          <div key={l.id} className="bg-dark-surface border border-dark-border rounded-lg p-3">
            <div className="flex items-start justify-between">
              {editing?.id === l.id && editing.field === 'learning' ? (
                <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(l.id, 'learning', editValue)}
                  onKeyDown={handleEditKeyDown}
                  className="flex-1 bg-dark-bg border border-accent-blue rounded px-2 py-1 text-sm h-16 resize-none" />
              ) : (
                <p className="text-sm cursor-pointer hover:text-accent-blue transition-colors"
                  onClick={() => { setEditing({ id: l.id, field: 'learning' }); setEditValue(l.learning); }}>{l.learning}</p>
              )}
              <button onClick={() => setDeleteLearningId(l.id)}
                className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded ml-2 shrink-0">Del</button>
            </div>
            <div className="flex gap-2 mt-2 items-center">
              <span className="text-xs text-dark-muted cursor-pointer hover:text-accent-blue transition-colors px-1.5 py-0.5 rounded hover:bg-dark-bg"
                onClick={() => cycleCategory(l.id, l.category)} title="Click to cycle category">{l.category}</span>
              {editing?.id === l.id && editing.field === 'impact_score' ? (
                <input autoFocus type="number" min="1" max="10" value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(l.id, 'impact_score', Number(editValue) || 5)}
                  onKeyDown={e => { if (e.key === 'Enter') { saveEdit(l.id, 'impact_score', Number(editValue) || 5); } if (e.key === 'Escape') { setEditing(null); } }}
                  className="bg-dark-bg border border-accent-blue rounded px-2 py-0.5 text-xs w-16" />
              ) : (
                <span className="text-xs text-accent-purple cursor-pointer hover:text-accent-purple/70 transition-colors"
                  onClick={() => { setEditing({ id: l.id, field: 'impact_score' }); setEditValue(String(l.impact_score)); }}>Impact: {l.impact_score}/10</span>
              )}
            </div>
          </div>
        ))}
        {learnings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-orange-400/10 flex items-center justify-center">
              <span className="text-xl text-orange-400/50">{'\u25C8'}</span>
            </div>
            <p className="text-sm text-dark-muted mb-1">No learnings yet</p>
            <p className="text-xs text-dark-muted/60 mb-3">Capture what worked, what didn't, and insights you want to remember.</p>
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors">
              Add First Learning
            </button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deleteLearningId !== null}
        title="Delete Learning"
        message="Are you sure you want to delete this learning?"
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deleteLearningId) {
            const deleted = learnings.find(l => l.id === deleteLearningId);
            await api.deleteLearning(deleteLearningId);
            refresh();
            toast('Learning deleted', 'info', deleted ? {
              label: 'Undo',
              onClick: async () => {
                await api.createLearning({ project_id: projectId, learning: deleted.learning, category: deleted.category, impact_score: deleted.impact_score });
                refresh();
              },
            } : undefined);
          }
          setDeleteLearningId(null);
        }}
        onCancel={() => setDeleteLearningId(null)}
      />
    </div>
  );
}

// ============ DECISIONS TAB ============
function DecisionsTab({ projectId }: { projectId: number }) {
  const { data: decisions, refresh } = useData<ProjectDecision>(() => api.getDecisions(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ decision: '', reason: '', alternatives_considered: '', outcome: '' });
  const [deleteDecisionId, setDeleteDecisionId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!form.decision.trim()) return;
    await api.createDecision({
      project_id: projectId,
      decision: form.decision,
      reason: form.reason || null,
      alternatives_considered: form.alternatives_considered || null,
      outcome: form.outcome || null,
    });
    toast('Decision logged');
    setForm({ decision: '', reason: '', alternatives_considered: '', outcome: '' });
    setShowForm(false);
    refresh();
  };

  const startEdit = (id: number, field: string, value: string | null) => {
    setEditing({ id, field });
    setEditValue(value || '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    await api.updateDecision(editing.id, { [editing.field]: editValue || null } as Partial<ProjectDecision>);
    setEditing(null);
    setEditValue('');
    refresh();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, multiline: boolean) => {
    if (e.key === 'Escape') { setEditing(null); setEditValue(''); return; }
    if (e.key === 'Enter' && (!multiline || !e.shiftKey)) { e.preventDefault(); saveEdit(); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Decision Log</h3>
        <button onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80">+ Log Decision</button>
      </div>

      {showForm && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-4">
          <textarea placeholder="What did you decide?" value={form.decision}
            onChange={e => setForm(f => ({ ...f, decision: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-16 resize-none mb-3" />
          <textarea placeholder="Why? What was the reasoning?" value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-16 resize-none mb-3" />
          <textarea placeholder="What alternatives did you consider?" value={form.alternatives_considered}
            onChange={e => setForm(f => ({ ...f, alternatives_considered: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-12 resize-none mb-3" />
          <input placeholder="Outcome (optional — fill in later)" value={form.outcome}
            onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm mb-3" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded">Log</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-dark-muted hover:text-dark-text">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {decisions.map(d => (
          <div key={d.id} className="bg-dark-surface border border-dark-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-1">
              {editing?.id === d.id && editing.field === 'decision' ? (
                <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                  onBlur={saveEdit} onKeyDown={e => handleEditKeyDown(e, false)}
                  className="flex-1 bg-dark-bg border border-accent-blue rounded px-2 py-1 text-sm font-medium" />
              ) : (
                <p className="text-sm font-medium cursor-pointer hover:text-accent-blue transition-colors"
                  onClick={() => startEdit(d.id, 'decision', d.decision)}>{d.decision}</p>
              )}
              <button onClick={() => setDeleteDecisionId(d.id)}
                className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded ml-2 shrink-0">Del</button>
            </div>
            {editing?.id === d.id && editing.field === 'reason' ? (
              <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit} onKeyDown={e => handleEditKeyDown(e, true)}
                className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-xs h-16 resize-none mb-1" />
            ) : (
              <p className="text-xs text-dark-muted mb-1 cursor-pointer hover:text-dark-text transition-colors"
                onClick={() => startEdit(d.id, 'reason', d.reason)}>
                {d.reason ? `Why: ${d.reason}` : <span className="italic opacity-50">+ add reason</span>}
              </p>
            )}
            {editing?.id === d.id && editing.field === 'alternatives_considered' ? (
              <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit} onKeyDown={e => handleEditKeyDown(e, true)}
                className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-xs h-12 resize-none mb-1" />
            ) : (
              <p className="text-xs text-dark-muted mb-1 cursor-pointer hover:text-dark-text transition-colors"
                onClick={() => startEdit(d.id, 'alternatives_considered', d.alternatives_considered)}>
                {d.alternatives_considered ? `Alternatives: ${d.alternatives_considered}` : <span className="italic opacity-50">+ add alternatives</span>}
              </p>
            )}
            {editing?.id === d.id && editing.field === 'outcome' ? (
              <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit} onKeyDown={e => handleEditKeyDown(e, true)}
                className="w-full bg-dark-bg border border-accent-blue rounded px-2 py-1 text-xs h-12 resize-none mb-1" />
            ) : d.outcome ? (
              <p className="text-xs text-accent-green/80 mb-1 cursor-pointer hover:text-accent-green transition-colors"
                onClick={() => startEdit(d.id, 'outcome', d.outcome)}>Outcome: {d.outcome}</p>
            ) : (
              <p className="text-xs text-accent-green/40 mb-1 cursor-pointer hover:text-accent-green/70 italic transition-colors"
                onClick={() => startEdit(d.id, 'outcome', '')}>+ add outcome</p>
            )}
            <span className="text-xs text-dark-muted">{d.decided_at?.split('T')[0]}</span>
          </div>
        ))}
        {decisions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-yellow/10 flex items-center justify-center">
              <span className="text-xl text-accent-yellow/50">?</span>
            </div>
            <p className="text-sm text-dark-muted mb-1">No decisions logged yet</p>
            <p className="text-xs text-dark-muted/60 mb-3">Record important decisions with reasoning and alternatives so future-you knows why.</p>
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors">
              Log First Decision
            </button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deleteDecisionId !== null}
        title="Delete Decision"
        message="Are you sure you want to delete this decision?"
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deleteDecisionId) {
            const deleted = decisions.find(d => d.id === deleteDecisionId);
            await api.deleteDecision(deleteDecisionId);
            refresh();
            toast('Decision deleted', 'info', deleted ? {
              label: 'Undo',
              onClick: async () => {
                await api.createDecision({ project_id: projectId, decision: deleted.decision, reason: deleted.reason, alternatives_considered: deleted.alternatives_considered, outcome: deleted.outcome });
                refresh();
              },
            } : undefined);
          }
          setDeleteDecisionId(null);
        }}
        onCancel={() => setDeleteDecisionId(null)}
      />
    </div>
  );
}

// ============ DESIGN TAB ============
function DesignTab({ projectId, projectType }: { projectId: number; projectType: string | null }) {
  const [scores, setScores] = useState<WebsiteDesignScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDim, setEditingDim] = useState<string | null>(null);

  const loadScores = async () => {
    const data = await api.initDesignScores(projectId);
    setScores(data);
    setLoading(false);
  };

  React.useEffect(() => { loadScores(); }, [projectId]);

  const handleUpdate = async (dimension: string, updates: Partial<WebsiteDesignScore>) => {
    const current = scores.find(s => s.dimension === dimension);
    await api.upsertDesignScore({
      project_id: projectId,
      dimension,
      score: updates.score ?? current?.score ?? 0,
      status: updates.status ?? current?.status ?? 'not_assessed',
      is_relevant: updates.is_relevant ?? current?.is_relevant ?? 1,
      notes: updates.notes ?? current?.notes ?? null,
    });
    await loadScores();
    if (updates.score !== undefined || updates.status !== undefined) {
      setEditingDim(null);
    }
  };

  if (loading) return <div className="text-dark-muted text-sm">Loading design dimensions...</div>;

  const relevantScores = scores.filter(s => s.is_relevant);
  const avgScore = relevantScores.length > 0
    ? Math.round(relevantScores.reduce((sum, s) => sum + s.score, 0) / relevantScores.length)
    : 0;
  const assessedCount = relevantScores.filter(s => s.status !== 'not_assessed').length;
  const isWebType = WEB_RELEVANT_TYPES.includes(projectType || '');

  return (
    <div className="max-w-3xl">
      {/* Summary header */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold">Website Design Quality</h3>
            <p className="text-xs text-dark-muted mt-0.5">
              {isWebType ? 'Web project — all dimensions relevant by default' : 'Non-web project — toggle relevant dimensions'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: avgScore >= 7 ? '#a855f7' : avgScore >= 5 ? '#22c55e' : avgScore >= 3 ? '#eab308' : '#ef4444' }}>
              {avgScore}/10
            </div>
            <p className="text-xs text-dark-muted">{assessedCount}/{relevantScores.length} assessed</p>
          </div>
        </div>
        {/* Mini bar chart */}
        <div className="flex gap-1">
          {scores.map(s => {
            const dim = DESIGN_DIMENSIONS[s.dimension];
            if (!dim) return null;
            return (
              <div key={s.dimension} className="flex-1 group relative">
                <div className="h-8 bg-dark-bg rounded overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${s.is_relevant ? Math.max(s.score * 10, 5) : 5}%`,
                      backgroundColor: s.is_relevant ? (DESIGN_STATUS_COLORS[s.status] || '#6b7280') : '#374151',
                    }}
                  />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {dim.label}: {s.score}/10
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimension cards */}
      <div className="space-y-3">
        {scores.map(s => {
          const dim = DESIGN_DIMENSIONS[s.dimension];
          if (!dim) return null;
          const isEditing = editingDim === s.dimension;

          return (
            <div key={s.dimension}
              className={`bg-dark-surface border rounded-lg p-4 transition-all ${
                s.is_relevant ? 'border-dark-border' : 'border-dark-border/50 opacity-50'
              }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl">{dim.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{dim.label}</h4>
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: (DESIGN_STATUS_COLORS[s.status] || '#6b7280') + '20',
                          color: DESIGN_STATUS_COLORS[s.status] || '#6b7280',
                        }}>
                        {DESIGN_STATUS_LABELS[s.status]}
                      </span>
                      {s.is_relevant && s.score > 0 && (
                        <span className="text-xs font-mono text-dark-muted">{s.score}/10</span>
                      )}
                    </div>
                    <p className="text-xs text-dark-muted mb-1">{dim.description}</p>
                    <p className="text-xs italic text-accent-purple/60">{dim.psychology}</p>
                    {s.notes && !isEditing && (
                      <p className="text-xs text-dark-text/80 mt-2 bg-dark-bg rounded px-2 py-1">{s.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <label className="flex items-center gap-1 text-xs text-dark-muted cursor-pointer">
                    <input type="checkbox" checked={!!s.is_relevant}
                      onChange={e => handleUpdate(s.dimension, { is_relevant: e.target.checked ? 1 : 0 })} />
                    Relevant
                  </label>
                  {s.is_relevant && (
                    <button onClick={() => setEditingDim(isEditing ? null : s.dimension)}
                      className="text-xs px-2 py-1 bg-dark-bg rounded hover:bg-dark-hover">
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>

              {/* Edit panel */}
              {isEditing && s.is_relevant && (
                <DesignDimensionEditor
                  score={s}
                  onSave={(updates) => handleUpdate(s.dimension, updates)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesignDimensionEditor({ score, onSave }: { score: WebsiteDesignScore; onSave: (updates: Partial<WebsiteDesignScore>) => void }) {
  const [form, setForm] = useState({
    score: score.score,
    status: score.status,
    notes: score.notes || '',
  });

  return (
    <div className="mt-3 pt-3 border-t border-dark-border space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs text-dark-muted block mb-1">Score: {form.score}/10</label>
          <input type="range" min="0" max="10" value={form.score}
            onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) }))}
            aria-label="Design dimension score"
            className="w-full" />
        </div>
        <div>
          <label className="text-xs text-dark-muted block mb-1">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm">
            {Object.entries(DESIGN_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <textarea
        placeholder="Notes — what's done, what needs improvement, specific decisions..."
        value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm h-20 resize-none"
      />
      <button onClick={() => onSave(form)}
        className="px-4 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80">
        Save
      </button>
    </div>
  );
}

// ============ ACTIVITY TAB (Audit Trail) ============
function ActivityTab({ projectId }: { projectId: number }) {
  const { data: entries, refresh } = useData<api.AuditEntry>(() => api.getProjectAuditLog(projectId, 50), [projectId]);

  const formatAction = (e: api.AuditEntry) => {
    if (e.action === 'create') return `Created ${e.entity_type}`;
    if (e.action === 'update' && e.field_changed) {
      const oldVal = e.old_value ? `"${e.old_value.slice(0, 40)}"` : 'empty';
      const newVal = e.new_value ? `"${e.new_value.slice(0, 40)}"` : 'empty';
      return `Changed ${e.entity_type} ${e.field_changed}: ${oldVal} → ${newVal}`;
    }
    if (e.action === 'delete') return `Deleted ${e.entity_type}`;
    return `${e.action} ${e.entity_type}`;
  };

  const actionColor = (action: string) => {
    if (action === 'create') return 'text-accent-green';
    if (action === 'update') return 'text-accent-blue';
    if (action === 'delete') return 'text-accent-red';
    return 'text-dark-muted';
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-4">Activity Log</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-dark-muted">No activity recorded yet. Changes will appear here as you edit this project.</p>
      ) : (
        <div className="space-y-1">
          {entries.map(e => (
            <div key={e.id} className="flex items-start gap-3 text-sm py-1.5 border-b border-dark-border/50">
              <span className="text-xs text-dark-muted shrink-0 w-16 pt-0.5">{timeAgo(e.created_at)}</span>
              <span className={`shrink-0 text-xs font-medium uppercase w-14 pt-0.5 ${actionColor(e.action)}`}>{e.action}</span>
              <span className="text-dark-text">{formatAction(e)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
