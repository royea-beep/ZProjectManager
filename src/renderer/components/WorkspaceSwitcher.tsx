import React, { useState, useEffect } from 'react';
import type { Workspace } from '../../shared/types';

interface Props {
  onWorkspaceChange: (id: number) => void;
}

export default function WorkspaceSwitcher({ onWorkspaceChange }: Props) {
  const [workspaces, setWorkspaces] = useState<(Workspace & { project_count: number })[]>([]);
  const [activeId, setActiveId] = useState<number>(0);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    const [all, active] = await Promise.all([
      window.api.invoke('workspaces:get-all'),
      window.api.invoke('workspaces:get-active'),
    ]);
    setWorkspaces((all || []) as (Workspace & { project_count: number })[]);
    const activeWs = active as Workspace | null;
    setActiveId(activeWs?.id || 0);
  };

  const switchTo = async (id: number) => {
    await window.api.invoke('workspaces:set-active', id);
    setActiveId(id);
    onWorkspaceChange(id);
  };

  const totalProjects = workspaces.reduce((s, w) => s + (w.project_count || 0), 0);

  return (
    <div className="px-3 mb-2">
      <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-1.5 px-2">Workspaces</p>

      <button
        onClick={() => switchTo(0)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors mb-0.5 ${
          activeId === 0
            ? 'bg-dark-hover text-dark-text font-medium'
            : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
        }`}
      >
        <span className="opacity-60">📁</span>
        <span className="flex-1 text-left">כולם</span>
        <span className="text-[10px] opacity-50">{totalProjects}</span>
      </button>

      {workspaces.map(ws => (
        <button
          key={ws.id}
          onClick={() => switchTo(ws.id)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors mb-0.5 ${
            activeId === ws.id
              ? 'bg-dark-hover text-dark-text font-medium'
              : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ws.color }} />
          <span className="flex-1 text-left truncate">{ws.name}</span>
          <span className="text-[10px] opacity-50">{ws.project_count || 0}</span>
        </button>
      ))}

      <button
        onClick={() => setShowCreate(true)}
        className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[11px] text-dark-muted hover:text-dark-text transition-colors mt-1"
      >
        <span className="opacity-50">+</span>
        <span>Add workspace</span>
      </button>

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { loadWorkspaces(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'mine' | 'client' | 'partnership'>('client');
  const [clientName, setClientName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [billingRate, setBillingRate] = useState(200);
  const [color, setColor] = useState('#3b82f6');

  const create = async () => {
    if (!name.trim()) return;
    await window.api.invoke('workspaces:create', {
      name: name.trim(),
      type,
      color,
      emoji: type === 'mine' ? '🏠' : type === 'client' ? '💼' : '🤝',
      client_name: type === 'client' ? clientName : null,
      partner_name: type === 'partnership' ? partnerName : null,
      billing_rate: type === 'client' ? billingRate : 0,
    });
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-dark-surface border border-dark-border rounded-xl p-5 w-80" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-4">New Workspace</h3>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Type</label>
            <div className="flex gap-2">
              {(['mine', 'client', 'partnership'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                    type === t ? 'border-accent-blue text-accent-blue bg-accent-blue/10' : 'border-dark-border text-dark-muted'
                  }`}
                >
                  {t === 'mine' ? '🏠 שלי' : t === 'client' ? '💼 לקוח' : '🤝 שותפות'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={type === 'client' ? 'לקוח: אבי' : type === 'partnership' ? 'שותפות: Heroes' : 'שלי'}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
            />
          </div>

          {type === 'client' && (
            <>
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Client name</label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Tzach"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Billing rate (₪/hour)</label>
                <input
                  type="number"
                  value={billingRate}
                  onChange={e => setBillingRate(parseInt(e.target.value) || 0)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
            </>
          )}

          {type === 'partnership' && (
            <div>
              <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Partner name</label>
              <input
                value={partnerName}
                onChange={e => setPartnerName(e.target.value)}
                placeholder="דביר"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 text-xs py-2 rounded-lg border border-dark-border text-dark-muted">Cancel</button>
            <button onClick={create} disabled={!name.trim()} className="flex-1 text-xs py-2 rounded-lg bg-accent-green text-white font-medium disabled:opacity-40">Create</button>
          </div>
        </div>
      </div>
    </div>
  );
}
