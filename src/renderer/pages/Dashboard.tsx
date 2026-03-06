import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useData } from '../hooks/useData';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import ActivityHeatmap from '../components/ActivityHeatmap';
import * as api from '../services/api';
import type { Suggestion } from '../services/api';
import { PROJECT_TYPES } from '../../shared/constants';

const STATUS_FILTERS = ['all', 'building', 'launched', 'paused', 'archived', 'idea', 'planning', 'testing'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, loading, refresh } = useProjects();
  const { data: suggestions } = useData<Suggestion>(() => api.getSuggestions());
  const { data: allSessions } = useData<{ session_date: string }>(() => api.getAllSessions());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const searchable = [p.name, p.description, p.type, p.goal, p.next_action].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [projects, filter, search]);

  const stats = useMemo(() => ({
    total: projects.length,
    building: projects.filter(p => p.status === 'building').length,
    launched: projects.filter(p => p.status === 'launched').length,
    paused: projects.filter(p => p.status === 'paused').length,
    stale: projects.filter(p => p.last_worked_at && (Date.now() - new Date(p.last_worked_at).getTime()) > 14 * 86400000).length,
  }), [projects]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-dark-muted">Loading...</div>;
  }

  return (
    <div className="p-6">
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
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-dark-text' },
          { label: 'Building', value: stats.building, color: 'text-accent-blue' },
          { label: 'Launched', value: stats.launched, color: 'text-accent-green' },
          { label: 'Paused', value: stats.paused, color: 'text-orange-400' },
          { label: 'Stale (14d+)', value: stats.stale, color: 'text-accent-yellow' },
        ].map(s => (
          <div key={s.label} className="bg-dark-surface border border-dark-border rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-dark-muted">{s.label}</div>
          </div>
        ))}
      </div>

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
          <div className="space-y-1.5">
            {suggestions.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  s.type === 'blocker' ? 'bg-accent-red' :
                  s.type === 'stale' ? 'bg-accent-yellow' :
                  s.type === 'health' ? 'bg-orange-400' :
                  'bg-dark-muted'
                }`} />
                <span className="text-dark-muted flex-1">{s.message}</span>
                {s.projectId && (
                  <button onClick={() => navigate(`/project/${s.projectId}`)}
                    className="text-xs text-accent-blue hover:underline shrink-0">Go</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search */}
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
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-dark-muted py-12">No projects match your filters.</div>
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
