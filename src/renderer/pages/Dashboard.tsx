import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useData } from '../hooks/useData';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActivityHeatmap from '../components/ActivityHeatmap';
import WeeklyDigestCard from '../components/WeeklyDigest';
import { useToast } from '../components/Toast';
import * as api from '../services/api';
import type { Suggestion, WeeklyDigest } from '../services/api';
import { PROJECT_TYPES } from '../../shared/constants';

const STATUS_FILTERS = ['all', 'building', 'launched', 'paused', 'archived', 'idea', 'planning', 'testing'];

function SuggestionRow({ s, navigate, refresh }: { s: Suggestion; navigate: (path: string) => void; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [menuAbove, setMenuAbove] = useState(false);
  const { toast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Position dropdown above if near bottom of viewport
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setMenuAbove(spaceBelow < 200);
  }, [open]);

  const createTaskAndTrack = async () => {
    if (!s.action || !s.projectId) return;
    const taskTitle = s.action.replace(/^(Do this|Next step|Fix|Open the project and ): ?/i, '');
    const tasks = await api.getTasks(s.projectId);
    if (!tasks.some(t => t.title === taskTitle && t.status !== 'done')) {
      await api.createTask({
        project_id: s.projectId,
        title: taskTitle,
        description: `From suggestion: ${s.message}`,
        status: 'in_progress',
        priority: s.type === 'blocker' ? 'critical' : s.type === 'health' ? 'high' : 'medium',
      });
    }
  };

  return (
    <div className="flex items-start gap-2 text-sm py-1.5">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
        s.type === 'blocker' ? 'bg-accent-red' :
        s.type === 'stale' ? 'bg-accent-yellow' :
        s.type === 'health' ? 'bg-orange-400' :
        'bg-dark-muted'
      }`} />
      <div className="flex-1 min-w-0">
        <span className="text-dark-muted">{s.message}</span>
        {s.action && (
          <div className="text-accent-green text-xs mt-0.5">{s.action}</div>
        )}
      </div>
      {s.projectId && (
        <div className="relative shrink-0" ref={menuRef}>
          <button ref={buttonRef} onClick={() => setOpen(!open)}
            className="text-xs px-2.5 py-1 bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30 transition-colors">
            Fix it ▾
          </button>
          {open && (
            <div className={`absolute right-0 ${menuAbove ? 'bottom-full mb-1' : 'top-full mt-1'} bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50 py-1 min-w-[200px]`}>
              {s.repoPath && (
                <>
                  <button onClick={async () => {
                    await createTaskAndTrack();
                    await api.openTerminal(s.repoPath!);
                    setOpen(false);
                  }} className="w-full text-left px-3 py-2 text-xs hover:bg-dark-hover flex items-center gap-2">
                    <span className="text-accent-green">▸</span> Open Terminal
                  </button>
                  <button onClick={async () => {
                    await createTaskAndTrack();
                    await api.openVSCode(s.repoPath!);
                    setOpen(false);
                  }} className="w-full text-left px-3 py-2 text-xs hover:bg-dark-hover flex items-center gap-2">
                    <span className="text-accent-blue">▸</span> Open VS Code
                  </button>
                  <button onClick={async () => {
                    await createTaskAndTrack();
                    await api.openTerminal(s.repoPath!);
                    await api.openVSCode(s.repoPath!);
                    setOpen(false);
                  }} className="w-full text-left px-3 py-2 text-xs hover:bg-dark-hover flex items-center gap-2">
                    <span className="text-accent-purple">▸</span> Terminal + VS Code
                  </button>
                  <div className="border-t border-dark-border my-1" />
                </>
              )}
              <button onClick={() => {
                navigate(`/project/${s.projectId}?tab=Tasks`);
                setOpen(false);
              }} className="w-full text-left px-3 py-2 text-xs hover:bg-dark-hover flex items-center gap-2">
                <span className="text-dark-muted">▸</span> View Tasks
              </button>
              <button onClick={() => {
                navigate(`/project/${s.projectId}`);
                setOpen(false);
              }} className="w-full text-left px-3 py-2 text-xs hover:bg-dark-hover flex items-center gap-2">
                <span className="text-dark-muted">▸</span> View Project
              </button>
              {s.type === 'archive' && (
                <button onClick={() => {
                  setConfirmArchive(true);
                  setOpen(false);
                }} className="w-full text-left px-3 py-2 text-xs hover:bg-dark-hover flex items-center gap-2 text-orange-400">
                  <span>▸</span> Archive it
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmArchive}
        title="Archive Project"
        message={`Are you sure you want to archive "${s.projectName || 'this project'}"? You can unarchive it later from Settings.`}
        confirmLabel="Archive"
        danger
        onConfirm={async () => {
          try {
            await api.updateProject(s.projectId!, { status: 'archived' });
            toast(`${s.projectName || 'Project'} archived`, 'success');
            refresh();
          } catch {
            toast('Failed to archive project', 'error');
          }
          setConfirmArchive(false);
        }}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { projects, loading, refresh } = useProjects();
  const { data: suggestions } = useData<Suggestion>(() => api.getSuggestions());
  const { data: allSessions } = useData<{ session_date: string }>(() => api.getAllSessions());
  const [tokenWise, setTokenWise] = useState<api.TokenWiseStats | null>(null);
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'last_worked' | 'name' | 'health' | 'priority' | 'cost'>('last_worked');
  const [enrichment, setEnrichment] = useState<Record<number, { taskProgress: { done: number; total: number }; cost?: number; gitClean?: boolean | null }>>({});

  useEffect(() => {
    api.isTokenWiseAvailable().then(available => {
      if (available) api.getTokenWiseOverview().then(setTokenWise);
    });
    api.getWeeklyDigest().then(setDigest).catch(() => {});
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(() => searchParams.get('new') === '1');
  const searchRef = useRef<HTMLInputElement>(null);

  // Clear ?new=1 from URL when modal closes
  useEffect(() => {
    if (!showCreate && searchParams.get('new') === '1') {
      setSearchParams({}, { replace: true });
    }
  }, [showCreate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Enrich projects with task progress, cost, and git status (batch — 3 IPC calls total)
  useEffect(() => {
    if (projects.length === 0) return;
    const enrich = async () => {
      // Batch task progress (1 call)
      const taskMap = await api.batchTaskProgress().catch(() => ({} as Record<number, { done: number; total: number }>));

      // Batch git status for projects with repos (1 call)
      const gitProjects = projects.filter(p => p.repo_path && p.has_git).map(p => ({ id: p.id, repo_path: p.repo_path! }));
      const gitMap = gitProjects.length > 0 ? await api.batchGitStatus(gitProjects).catch(() => ({} as Record<number, boolean | null>)) : {};

      // TokenWise costs (1 call for overview, already loaded above)
      const costMap: Record<number, number> = {};
      if (tokenWise?.per_project) {
        for (const pc of tokenWise.per_project) {
          const match = projects.find(p => p.repo_path && pc.project_path.toLowerCase().includes(p.name.toLowerCase()));
          if (match) costMap[match.id] = pc.cost;
        }
      }

      const map: typeof enrichment = {};
      for (const p of projects) {
        map[p.id] = {
          taskProgress: taskMap[p.id] || { done: 0, total: 0 },
          cost: costMap[p.id],
          gitClean: gitMap[p.id] ?? null,
        };
      }
      setEnrichment(map);
    };
    enrich();
  }, [projects, tokenWise]);

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = useMemo(() => {
    const list = projects.filter(p => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const searchable = [p.name, p.description, p.type, p.goal, p.next_action].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'health':
          return b.health_score - a.health_score;
        case 'priority':
          return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
        case 'cost': {
          const ca = enrichment[a.id]?.cost ?? 0;
          const cb = enrichment[b.id]?.cost ?? 0;
          return cb - ca;
        }
        case 'last_worked':
        default: {
          const ta = a.last_worked_at ? new Date(a.last_worked_at).getTime() : 0;
          const tb = b.last_worked_at ? new Date(b.last_worked_at).getTime() : 0;
          return tb - ta;
        }
      }
    });

    return list;
  }, [projects, filter, search, sortBy, enrichment]);

  const recentlyWorked = useMemo(() => {
    return [...projects]
      .filter(p => p.last_worked_at)
      .sort((a, b) => new Date(b.last_worked_at!).getTime() - new Date(a.last_worked_at!).getTime())
      .slice(0, 3);
  }, [projects]);

  const stats = useMemo(() => ({
    total: projects.length,
    building: projects.filter(p => p.status === 'building').length,
    launched: projects.filter(p => p.status === 'launched').length,
    paused: projects.filter(p => p.status === 'paused').length,
    stale: projects.filter(p => p.last_worked_at && (Date.now() - new Date(p.last_worked_at).getTime()) > 14 * 86400000).length,
  }), [projects]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="skeleton h-7 w-40 mb-2" />
            <div className="skeleton h-4 w-56" />
          </div>
          <div className="skeleton h-9 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-dark-muted mt-1">All your projects at a glance</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-dark-text', filterVal: 'all' },
          { label: 'Building', value: stats.building, color: 'text-accent-blue', filterVal: 'building' },
          { label: 'Launched', value: stats.launched, color: 'text-accent-green', filterVal: 'launched' },
          { label: 'Paused', value: stats.paused, color: 'text-orange-400', filterVal: 'paused' },
          { label: 'Stale (14d+)', value: stats.stale, color: 'text-accent-yellow', filterVal: '' },
        ].map(s => (
          <button key={s.label} onClick={() => s.filterVal && setFilter(s.filterVal)}
            className={`bg-dark-surface border rounded-lg p-3 text-center transition-all ${
              s.filterVal && filter === s.filterVal
                ? 'border-accent-blue/50 ring-1 ring-accent-blue/20'
                : 'border-dark-border hover:border-dark-border/80'
            }`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-dark-muted">{s.label}</div>
          </button>
        ))}
      </div>

      {/* TokenWise Cost Tracker */}
      {tokenWise && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-accent-purple">Claude Usage (TokenWise)</h3>
            <span className="text-xs text-dark-muted">{tokenWise.total_interactions} interactions across {tokenWise.total_sessions} sessions</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-lg font-bold text-accent-green">${tokenWise.last_7_days_cost.toFixed(2)}</div>
              <div className="text-xs text-dark-muted">Last 7 days</div>
            </div>
            <div>
              <div className="text-lg font-bold text-accent-blue">${tokenWise.last_30_days_cost.toFixed(2)}</div>
              <div className="text-xs text-dark-muted">Last 30 days</div>
            </div>
            <div>
              <div className="text-lg font-bold text-dark-text">${tokenWise.total_cost.toFixed(2)}</div>
              <div className="text-xs text-dark-muted">All time</div>
            </div>
          </div>
          {tokenWise.per_project.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-dark-muted mb-1">Cost by project:</div>
              {tokenWise.per_project.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-dark-text">{p.project_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-dark-muted">{p.interactions} calls</span>
                    <span className="text-accent-green font-medium">${p.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Digest */}
      {digest && <WeeklyDigestCard data={digest} />}

      {/* Activity Heatmap */}
      {allSessions.length > 0 && (
        <div className="mb-6">
          <ActivityHeatmap sessions={allSessions} />
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-accent-purple/5 border border-accent-purple/20 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-accent-purple mb-2">Suggestions & Next Steps</h3>
          <div className="space-y-1">
            {suggestions.slice(0, 5).map((s, i) => (
              <SuggestionRow key={i} s={s} navigate={navigate} refresh={refresh} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Worked */}
      {recentlyWorked.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-dark-muted mb-3">Continue where you left off</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentlyWorked.map(p => (
              <ProjectCard
                key={`recent-${p.id}`}
                project={p}
                cost={enrichment[p.id]?.cost}
                gitClean={enrichment[p.id]?.gitClean}
                taskProgress={enrichment[p.id]?.taskProgress}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search & Sort */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 bg-dark-surface border border-dark-border rounded-lg p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === f ? 'bg-accent-blue text-white' : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search projects...  Ctrl+K"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-accent-blue/50"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-muted focus:outline-none focus:border-accent-blue/50"
        >
          <option value="last_worked">Sort: Last Worked</option>
          <option value="name">Sort: Name</option>
          <option value="health">Sort: Health</option>
          <option value="priority">Sort: Priority</option>
          <option value="cost">Sort: Cost</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            cost={enrichment[project.id]?.cost}
            gitClean={enrichment[project.id]?.gitClean}
            taskProgress={enrichment[project.id]?.taskProgress}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-20">
            {search || filter !== 'all' ? '~' : '+'}
          </div>
          <p className="text-dark-muted mb-1">
            {search || filter !== 'all'
              ? 'No projects match your filters'
              : 'No projects yet'}
          </p>
          {(search || filter !== 'all') ? (
            <button
              onClick={() => { setFilter('all'); setSearch(''); }}
              className="text-sm text-accent-blue hover:underline mt-2"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors"
            >
              + Create your first project
            </button>
          )}
        </div>
      )}

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={refresh} />
    </div>
  );
}

function CreateProjectModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id?: number) => void }) {
  const navigate = useNavigate();
  const defaultForm = {
    name: '', description: '', type: 'web-app', status: 'idea', priority: 'medium',
    goal: '', repo_path: '', health_score: 50, next_action: '',
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const id = await api.createProject({
      ...form,
      stage: 'concept',
      has_git: 0,
      tech_stack: null,
      repo_url: null,
      monetization_model: null,
      main_blocker: null,
    });
    onCreated();
    onClose();
    navigate(`/project/${id}`);
    setForm({ name: '', description: '', type: 'web-app', status: 'idea', priority: 'medium', goal: '', repo_path: '', health_score: 50, next_action: '' });
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      <div className="space-y-3">
        <input placeholder="Project name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-blue/50" />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-blue/50 h-20 resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none">
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none">
            {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <input placeholder="Goal" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-blue/50" />
        <input placeholder="Repo path (e.g. C:\Projects\myapp)" value={form.repo_path} onChange={e => setForm(f => ({ ...f, repo_path: e.target.value }))}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-blue/50" />
        <button onClick={handleSubmit}
          className="w-full py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors">
          Create Project
        </button>
      </div>
    </Modal>
  );
}
