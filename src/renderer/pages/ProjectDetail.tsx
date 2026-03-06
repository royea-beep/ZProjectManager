import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useData } from '../hooks/useData';
import * as api from '../services/api';
import type { Project, ProjectSession, ProjectTask, ProjectCommand, ProjectMetric, Learning, ProjectDecision } from '../../shared/types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import HealthBar from '../components/HealthBar';
import Modal from '../components/Modal';
const MetricsChart = React.lazy(() => import('../components/MetricsChart'));
import TechStackTags from '../components/TechStackTags';
import ConfirmDialog from '../components/ConfirmDialog';
import TagInput from '../components/TagInput';
import { STATUS_LABELS, STAGE_LABELS, PRIORITY_LABELS, TASK_STATUS_LABELS, PROJECT_TYPES, MOOD_LABELS, DESIGN_DIMENSIONS, DESIGN_STATUS_LABELS, DESIGN_STATUS_COLORS, WEB_RELEVANT_TYPES } from '../../shared/constants';
import type { WebsiteDesignScore } from '../../shared/types';
import { useToast } from '../components/Toast';

const BASE_TABS = ['Overview', 'Memory', 'Tasks', 'Launcher', 'Metrics', 'Decisions', 'Learnings'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);
  const { project, loading, update, refresh } = useProject(projectId);
  const [tab, setTab] = useState('Overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    return <div className="flex items-center justify-center h-full text-dark-muted">Loading...</div>;
  }

  const handleDelete = async () => {
    await api.deleteProject(projectId);
    toast('Project deleted', 'info');
    navigate('/');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0 border-b border-dark-border">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/')} className="text-sm text-dark-muted hover:text-dark-text inline-block">
            &larr; Back to Dashboard
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-accent-red/60 hover:text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded">
            Delete Project
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <StatusBadge status={project.status} />
          <PriorityBadge priority={project.priority} />
        </div>
        {project.description && (
          <p className="text-sm text-dark-muted mb-4">{project.description}</p>
        )}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                tab === t ? 'border-accent-blue text-accent-blue' : 'border-transparent text-dark-muted hover:text-dark-text'
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
        {tab === 'Memory' && <MemoryTab projectId={projectId} />}
        {tab === 'Tasks' && <TasksTab projectId={projectId} />}
        {tab === 'Launcher' && <LauncherTab projectId={projectId} repoPath={project.repo_path} />}
        {tab === 'Metrics' && <MetricsTab projectId={projectId} />}
        {tab === 'Decisions' && <DecisionsTab projectId={projectId} />}
        {tab === 'Learnings' && <LearningsTab projectId={projectId} />}
        {tab === 'Design' && <DesignTab projectId={projectId} projectType={project.type} />}
      </div>
    </div>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab({ project, onUpdate }: { project: Project; onUpdate: (data: Partial<Project>) => Promise<any> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(project);

  // Re-sync form when project changes externally (e.g. idea execution)
  React.useEffect(() => {
    if (!editing) setForm(project);
  }, [project, editing]);

  const handleSave = async () => {
    await onUpdate({
      name: form.name, description: form.description, type: form.type, stage: form.stage,
      status: form.status, priority: form.priority, goal: form.goal, tech_stack: form.tech_stack,
      monetization_model: form.monetization_model, main_blocker: form.main_blocker,
      next_action: form.next_action, health_score: form.health_score,
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setForm(project); setEditing(true); }}
            className="px-3 py-1.5 text-sm bg-dark-surface border border-dark-border rounded hover:bg-dark-hover">Edit</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type" value={project.type} />
          <Field label="Stage" value={STAGE_LABELS[project.stage] || project.stage} />
          <Field label="Status" value={STATUS_LABELS[project.status] || project.status} />
          <Field label="Priority" value={PRIORITY_LABELS[project.priority] || project.priority} />
        </div>
        <Field label="Goal" value={project.goal} />
        <div>
          <label className="text-xs text-dark-muted block mb-1">Tech Stack</label>
          <TechStackTags techStack={project.tech_stack} />
        </div>
        <Field label="Monetization" value={project.monetization_model} />
        <Field label="Main Blocker" value={project.main_blocker} />
        <Field label="Next Action" value={project.next_action} />
        <Field label="Repo Path" value={project.repo_path} />
        <div>
          <label className="text-xs text-dark-muted block mb-1">Health Score</label>
          <HealthBar score={project.health_score} />
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
function MemoryTab({ projectId }: { projectId: number }) {
  const { data: sessions, refresh } = useData<ProjectSession>(() => api.getSessions(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
  const { toast } = useToast();

  const lastSession = sessions[0];

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
        <button onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80">
          + New Session
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s.id} className="bg-dark-surface border border-dark-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{s.session_date}</span>
              <div className="flex items-center gap-2">
                {s.duration_minutes && <span className="text-xs text-dark-muted">{s.duration_minutes}min</span>}
                <button onClick={() => setDeleteSessionId(s.id)}
                  className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded">Del</button>
              </div>
            </div>
            {s.summary && <p className="text-sm mb-1 session-text">{s.summary}</p>}
            {s.what_done && <p className="text-xs text-dark-muted session-text">Done: {s.what_done}</p>}
            {s.blockers && <p className="text-xs text-accent-yellow/70 session-text">Blockers: {s.blockers}</p>}
            {s.next_step && <p className="text-xs text-accent-green/70 session-text">Next: {s.next_step}</p>}
          </div>
        ))}
        {sessions.length === 0 && <p className="text-sm text-dark-muted">No sessions yet — log your first one to build memory.</p>}
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
function TasksTab({ projectId }: { projectId: number }) {
  const { data: tasks, refresh } = useData<ProjectTask>(() => api.getTasks(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'status' | 'priority'>('status');
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const { toast } = useToast();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(grouped) as [string, ProjectTask[]][]).map(([status, items]) => (
          <div key={status}>
            <h4 className="text-xs font-medium text-dark-muted uppercase mb-2">
              {TASK_STATUS_LABELS[status]} ({items.length})
            </h4>
            <div className="space-y-2">
              {items.map(task => (
                <div key={task.id} className="bg-dark-surface border border-dark-border rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">{task.title}</p>
                  {task.description && <p className="text-xs text-dark-muted mb-2">{task.description}</p>}
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
          <div key={cmd.id} className="bg-dark-surface border border-dark-border rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{cmd.label}</span>
                <span className="text-xs text-dark-muted">{cmd.command_type}</span>
                {cmd.auto_run ? <span className="text-xs text-accent-green">auto</span> : null}
              </div>
              <code className="text-xs text-dark-muted font-mono">{cmd.command}</code>
              {cmd.ports_used && (
                <span className="text-xs text-accent-purple ml-2">Ports: {cmd.ports_used}</span>
              )}
            </div>
            <button onClick={() => api.launchCommand(cmd.id)}
              className="px-3 py-1.5 text-sm bg-accent-green/20 text-accent-green rounded hover:bg-accent-green/30">
              Launch
            </button>
            <button onClick={() => setDeleteCmdId(cmd.id)}
              className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded">Del</button>
          </div>
        ))}
        {commands.length === 0 && <p className="text-sm text-dark-muted">No launch commands yet — add one to open your dev environment in one click.</p>}
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
function MetricsTab({ projectId }: { projectId: number }) {
  const { data: metrics, refresh } = useData<ProjectMetric>(() => api.getMetrics(projectId), [projectId]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ metric_name: '', metric_value: '', metric_unit: '', date: new Date().toISOString().split('T')[0], source: '', notes: '' });
  const [deleteMetricId, setDeleteMetricId] = useState<number | null>(null);
  const { toast } = useToast();

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

  return (
    <div className="max-w-2xl">
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
          <div key={m.id} className="bg-dark-surface border border-dark-border rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{m.metric_name}</span>
              <span className="text-sm text-accent-blue ml-2">{m.metric_value} {m.metric_unit}</span>
              <span className="text-xs text-dark-muted ml-2">{m.date}</span>
            </div>
            <button onClick={() => setDeleteMetricId(m.id)}
              className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded">Del</button>
          </div>
        ))}
        {metrics.length === 0 && <p className="text-sm text-dark-muted">No metrics yet — start tracking to see your progress over time.</p>}
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
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!form.learning.trim()) return;
    await api.createLearning({
      project_id: projectId, learning: form.learning, category: form.category, impact_score: Number(form.impact_score),
    });
    setForm({ learning: '', category: 'technical', impact_score: '5' });
    setShowForm(false);
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
              {['technical', 'business', 'process', 'personal'].map(c => <option key={c} value={c}>{c}</option>)}
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
              <p className="text-sm">{l.learning}</p>
              <button onClick={() => setDeleteLearningId(l.id)}
                className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded ml-2 shrink-0">Del</button>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-dark-muted">{l.category}</span>
              <span className="text-xs text-accent-purple">Impact: {l.impact_score}/10</span>
            </div>
          </div>
        ))}
        {learnings.length === 0 && <p className="text-sm text-dark-muted">No learnings yet — capture insights so you don't forget what worked.</p>}
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
              <p className="text-sm font-medium">{d.decision}</p>
              <button onClick={() => setDeleteDecisionId(d.id)}
                className="text-xs text-accent-red hover:bg-accent-red/10 px-2 py-1 rounded ml-2 shrink-0">Del</button>
            </div>
            {d.reason && <p className="text-xs text-dark-muted mb-1">Why: {d.reason}</p>}
            {d.alternatives_considered && (
              <p className="text-xs text-dark-muted mb-1">Alternatives: {d.alternatives_considered}</p>
            )}
            {d.outcome && (
              <p className="text-xs text-accent-green/80 mb-1">Outcome: {d.outcome}</p>
            )}
            <span className="text-xs text-dark-muted">{d.decided_at?.split('T')[0]}</span>
          </div>
        ))}
        {decisions.length === 0 && <p className="text-sm text-dark-muted">No decisions yet — log the big calls so future-you knows the reasoning.</p>}
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
