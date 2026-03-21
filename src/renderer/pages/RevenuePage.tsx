import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import type { RevenueEntry } from '../../shared/types';
import type { Project } from '../../shared/types';
import { useToast } from '../components/Toast';
import { EmptyState } from '../components/EmptyState';

const REVENUE_MODELS = [
  'pre-revenue',
  'subscription',
  'one-time',
  'freemium',
  'marketplace',
  'advertising',
  'services',
];

const ENTRY_TYPES = [
  { value: 'mrr', label: 'MRR (Monthly Recurring)' },
  { value: 'one-time', label: 'One-time Payment' },
  { value: 'refund', label: 'Refund' },
];

function formatCurrency(amount: number): string {
  if (amount >= 1000) return `₪${(amount / 1000).toFixed(1)}k`;
  return `₪${amount}`;
}

function modelColor(model: string | null): string {
  switch (model) {
    case 'subscription': return 'text-accent-blue';
    case 'one-time': return 'text-accent-green';
    case 'freemium': return 'text-accent-purple';
    case 'marketplace': return 'text-yellow-400';
    case 'services': return 'text-orange-400';
    case 'pre-revenue': return 'text-dark-muted';
    default: return 'text-dark-muted';
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'launched': return 'bg-green-500/15 text-green-400';
    case 'building': return 'bg-accent-blue/15 text-accent-blue';
    case 'paused': return 'bg-orange-500/15 text-orange-400';
    default: return 'bg-dark-border text-dark-muted';
  }
}

interface EditingProject {
  id: number;
  name: string;
  mrr: number;
  arr: number;
  paying_customers: number;
  revenue_model: string;
  revenue_notes: string;
}

export default function RevenuePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [editingProject, setEditingProject] = useState<EditingProject | null>(null);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ project_id: 0, amount: '', type: 'mrr', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [projs, revEntries] = await Promise.all([
      api.getProjects(),
      api.getRevenueEntries(),
    ]);
    setProjects(projs);
    setEntries(revEntries);
    if (newEntry.project_id === 0 && projs.length > 0) {
      setNewEntry(prev => ({ ...prev, project_id: projs[0].id }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Aggregated stats
  const totalMrr = projects.reduce((sum, p) => sum + (p.mrr || 0), 0);
  const totalArr = totalMrr * 12;
  const totalCustomers = projects.reduce((sum, p) => sum + (p.paying_customers || 0), 0);
  const liveProjects = projects.filter(p => p.status === 'launched').length;

  const liveWithRevenue = projects
    .filter(p => p.status === 'launched' || (p.mrr || 0) > 0)
    .sort((a, b) => (b.mrr || 0) - (a.mrr || 0));

  const closestToRevenue = projects
    .filter(p => p.status !== 'launched' && p.status !== 'archived' && (p.mrr || 0) === 0)
    .slice(0, 5);

  const handleSaveProject = async () => {
    if (!editingProject) return;
    setSaving(true);
    try {
      await api.updateProjectRevenue(editingProject.id, {
        mrr: editingProject.mrr,
        arr: editingProject.mrr * 12,
        revenue_model: editingProject.revenue_model,
        paying_customers: editingProject.paying_customers,
        revenue_notes: editingProject.revenue_notes,
      });
      toast('Revenue data saved', 'success');
      setEditingProject(null);
      await load();
    } catch {
      toast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.amount || !newEntry.project_id) return;
    setSaving(true);
    try {
      await api.createRevenueEntry({
        project_id: newEntry.project_id,
        amount: parseInt(newEntry.amount, 10),
        type: newEntry.type,
        date: newEntry.date,
        notes: newEntry.notes || undefined,
      });
      toast('Entry added', 'success');
      setShowAddEntry(false);
      setNewEntry({ project_id: newEntry.project_id, amount: '', type: 'mrr', date: new Date().toISOString().slice(0, 10), notes: '' });
      await load();
    } catch {
      toast('Failed to add entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    await api.deleteRevenueEntry(id);
    toast('Entry deleted', 'success');
    await load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
          <p className="text-sm text-dark-muted mt-0.5">Track MRR, customers, and monetization across all projects</p>
        </div>
        <button
          onClick={() => setShowAddEntry(true)}
          className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80"
        >
          + Log Entry
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total MRR', value: formatCurrency(totalMrr), color: 'text-accent-green', sub: 'Monthly recurring' },
          { label: 'ARR', value: formatCurrency(totalArr), color: 'text-accent-blue', sub: 'Annual run rate' },
          { label: 'Customers', value: String(totalCustomers), color: 'text-accent-purple', sub: 'Paying users' },
          { label: 'Live Projects', value: String(liveProjects), color: 'text-yellow-400', sub: 'Status: launched' },
        ].map(k => (
          <div key={k.label} className="bg-dark-surface border border-dark-border rounded-lg p-4">
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-sm font-medium mt-0.5">{k.label}</div>
            <div className="text-xs text-dark-muted mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Per-project revenue table */}
      <div className="bg-dark-surface border border-dark-border rounded-lg mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
          <h2 className="text-sm font-medium">Projects — Revenue Status</h2>
          <span className="text-xs text-dark-muted">Click row to edit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-dark-muted">Project</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-dark-muted">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-dark-muted">Model</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-dark-muted">MRR</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-dark-muted">Customers</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {projects.filter(p => p.status !== 'archived').map(p => (
                <tr
                  key={p.id}
                  className="border-b border-dark-border/50 last:border-0 hover:bg-dark-hover cursor-pointer transition-colors"
                  onClick={() => setEditingProject({
                    id: p.id,
                    name: p.name,
                    mrr: p.mrr || 0,
                    arr: p.arr || 0,
                    paying_customers: p.paying_customers || 0,
                    revenue_model: p.revenue_model || 'pre-revenue',
                    revenue_notes: p.revenue_notes || '',
                  })}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{p.name}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs ${modelColor(p.revenue_model)}`}>
                      {p.revenue_model || 'pre-revenue'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {(p.mrr || 0) > 0
                      ? <span className="text-accent-green font-medium">{formatCurrency(p.mrr || 0)}</span>
                      : <span className="text-dark-muted text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {(p.paying_customers || 0) > 0
                      ? <span className="text-accent-purple">{p.paying_customers}</span>
                      : <span className="text-dark-muted text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      className="text-xs text-dark-muted hover:text-accent-blue transition-colors"
                      onClick={e => { e.stopPropagation(); navigate(`/project/${p.id}`); }}
                    >
                      →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closest to revenue */}
      {closestToRevenue.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-dark-border">
            <h2 className="text-sm font-medium">Closest to Revenue</h2>
            <p className="text-xs text-dark-muted mt-0.5">Projects in progress — ranked by health score</p>
          </div>
          <div className="p-4 space-y-2">
            {closestToRevenue
              .sort((a, b) => b.health_score - a.health_score)
              .map((p, i) => (
                <div key={p.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-dark-hover rounded px-2 py-1.5 transition-colors"
                  onClick={() => navigate(`/project/${p.id}`)}
                >
                  <span className="text-xs text-dark-muted w-4">{i + 1}.</span>
                  <span className="font-medium text-sm flex-1">{p.name}</span>
                  {p.main_blocker && (
                    <span className="text-xs text-red-400 truncate max-w-[200px]" title={p.main_blocker}>
                      {p.main_blocker}
                    </span>
                  )}
                  <span className="text-xs text-dark-muted">{p.status}</span>
                  <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-blue rounded-full"
                      style={{ width: `${p.health_score}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Live projects revenue breakdown */}
      {liveWithRevenue.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-dark-border">
            <h2 className="text-sm font-medium">Live Projects Breakdown</h2>
          </div>
          <div className="p-4 space-y-3">
            {liveWithRevenue.map(p => {
              const pct = totalMrr > 0 ? ((p.mrr || 0) / totalMrr) * 100 : 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-32 truncate">{p.name}</span>
                  <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-blue rounded-full transition-all"
                      style={{ width: `${Math.max(pct, (p.mrr || 0) > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-16 text-right ${(p.mrr || 0) > 0 ? 'text-accent-green' : 'text-dark-muted'}`}>
                    {(p.mrr || 0) > 0 ? formatCurrency(p.mrr || 0) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for no entries */}
      {entries.length === 0 && !showAddEntry && (
        <div className="mb-4">
          <EmptyState
            icon="💰"
            title="No revenue tracked yet"
            description="Log MRR, one-time payments, or refunds to track your portfolio's revenue over time."
            action={{ label: '+ Log first entry', onClick: () => setShowAddEntry(true) }}
            compact
          />
        </div>
      )}

      {/* Recent revenue entries */}
      {entries.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-lg">
          <div className="px-4 py-3 border-b border-dark-border">
            <h2 className="text-sm font-medium">Revenue Log</h2>
          </div>
          <div className="divide-y divide-dark-border/50">
            {entries.slice(0, 20).map(e => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{e.project_name}</span>
                  {e.notes && <span className="text-xs text-dark-muted ml-2">{e.notes}</span>}
                </div>
                <span className="text-xs text-dark-muted">{e.date}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  e.type === 'mrr' ? 'bg-accent-blue/15 text-accent-blue' :
                  e.type === 'one-time' ? 'bg-green-500/15 text-green-400' :
                  'bg-red-500/15 text-red-400'
                }`}>
                  {e.type}
                </span>
                <span className={`text-sm font-medium w-16 text-right ${e.type === 'refund' ? 'text-red-400' : 'text-accent-green'}`}>
                  {e.type === 'refund' ? '-' : '+'}{formatCurrency(e.amount)}
                </span>
                <button
                  onClick={() => handleDeleteEntry(e.id)}
                  className="text-dark-muted hover:text-red-400 transition-colors text-xs ml-1"
                  title="Delete entry"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit project revenue modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditingProject(null)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingProject.name}</h2>
              <button onClick={() => setEditingProject(null)} className="text-dark-muted hover:text-dark-text">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-muted mb-1 block">Revenue Model</label>
                <select
                  value={editingProject.revenue_model}
                  onChange={e => setEditingProject(prev => prev ? { ...prev, revenue_model: e.target.value } : null)}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue"
                >
                  {REVENUE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-muted mb-1 block">MRR (₪)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProject.mrr}
                    onChange={e => setEditingProject(prev => prev ? { ...prev, mrr: parseInt(e.target.value, 10) || 0 } : null)}
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-muted mb-1 block">Paying Customers</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProject.paying_customers}
                    onChange={e => setEditingProject(prev => prev ? { ...prev, paying_customers: parseInt(e.target.value, 10) || 0 } : null)}
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-dark-muted mb-1 block">Notes</label>
                <input
                  type="text"
                  value={editingProject.revenue_notes}
                  onChange={e => setEditingProject(prev => prev ? { ...prev, revenue_notes: e.target.value } : null)}
                  placeholder="e.g. LemonSqueezy Pro plan live"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSaveProject}
                disabled={saving}
                className="flex-1 py-2 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue/80 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 text-sm bg-dark-bg border border-dark-border text-dark-muted rounded hover:bg-dark-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add entry modal */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddEntry(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Log Revenue Entry</h2>
              <button onClick={() => setShowAddEntry(false)} className="text-dark-muted hover:text-dark-text">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-muted mb-1 block">Project</label>
                <select
                  value={newEntry.project_id}
                  onChange={e => setNewEntry(prev => ({ ...prev, project_id: parseInt(e.target.value, 10) }))}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue"
                >
                  {projects.filter(p => p.status !== 'archived').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-muted mb-1 block">Type</label>
                  <select
                    value={newEntry.type}
                    onChange={e => setNewEntry(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue"
                  >
                    {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-muted mb-1 block">Amount (₪)</label>
                  <input
                    type="number"
                    min="0"
                    value={newEntry.amount}
                    onChange={e => setNewEntry(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="79"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-dark-muted mb-1 block">Date</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={e => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="text-xs text-dark-muted mb-1 block">Notes (optional)</label>
                <input
                  type="text"
                  value={newEntry.notes}
                  onChange={e => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. First Pro subscriber"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAddEntry}
                disabled={saving || !newEntry.amount}
                className="flex-1 py-2 text-sm bg-accent-green text-white rounded hover:bg-accent-green/80 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Entry'}
              </button>
              <button
                onClick={() => setShowAddEntry(false)}
                className="px-4 py-2 text-sm bg-dark-bg border border-dark-border text-dark-muted rounded hover:bg-dark-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
