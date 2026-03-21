import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';

interface WorkSummary {
  project_name: string;
  project_id: number;
  total_hours: number;
  billed_hours: number;
  billing_rate: number;
}

function exportInvoicePdf(inv: Record<string, unknown>) {
  const html = `<html><body style="font-family:sans-serif;padding:40px;color:#111">
    <h1 style="margin-bottom:8px">Invoice ${inv.invoice_number || '#'}</h1>
    <p style="color:#666;margin:4px 0">Client: ${inv.client_name}</p>
    <p style="color:#666;margin:4px 0">Date: ${new Date(inv.issued_at as string).toLocaleDateString('he-IL')}</p>
    <p style="color:#666;margin:4px 0">Hours: ${inv.total_hours}h × ₪${inv.billing_rate}/h</p>
    <hr style="margin:20px 0">
    <h2>Total: ₪${(inv.total_amount as number || 0).toLocaleString()}</h2>
    <p style="color:#999;margin-top:40px;font-size:12px">Status: ${inv.status}</p>
    </body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.print(); }
}

export default function BillingPage() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null);
  const [summary, setSummary] = useState<WorkSummary[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showLogHours, setShowLogHours] = useState(false);
  const [logForm, setLogForm] = useState({ project_id: 0, hours: 1, description: '' });
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [ws, inv] = await Promise.all([
      window.api.invoke('workspaces:get-all'),
      window.api.invoke('invoices:get'),
    ]);
    const clientWorkspaces = ((ws as any[]) || []).filter((w: any) => w.type === 'client');
    setWorkspaces(clientWorkspaces);
    if (clientWorkspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspaceId(clientWorkspaces[0].id);
    }
    setInvoices((inv as any[]) || []);
  };

  useEffect(() => {
    if (!activeWorkspaceId) return;
    window.api.invoke('work-sessions:summary', activeWorkspaceId).then(r => setSummary((r as WorkSummary[]) || [])).catch(() => {});
    window.api.invoke('projects:getAll').then(r => setProjects((r as any[]) || [])).catch(() => {});
  }, [activeWorkspaceId]);

  const logHours = async () => {
    await window.api.invoke('work-sessions:log', {
      ...logForm,
      workspace_id: activeWorkspaceId,
    });
    toast('Hours logged', 'success');
    setShowLogHours(false);
    window.api.invoke('work-sessions:summary', activeWorkspaceId).then(r => setSummary((r as WorkSummary[]) || []));
    window.api.invoke('intelligence:run').catch(() => {});
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const unbilledSummary = summary.filter(s => s.total_hours - s.billed_hours > 0);
  const totalUnbilledHours = unbilledSummary.reduce((sum, s) => sum + (s.total_hours - s.billed_hours), 0);
  const totalUnbilledAmount = unbilledSummary.reduce((sum, s) =>
    sum + (s.total_hours - s.billed_hours) * (s.billing_rate || activeWorkspace?.billing_rate || 200), 0);

  const createInvoice = async () => {
    if (!activeWorkspace || unbilledSummary.length === 0) return;
    const lineItems = unbilledSummary.map(s => ({
      project: s.project_name,
      hours: s.total_hours - s.billed_hours,
      rate: s.billing_rate || activeWorkspace.billing_rate || 200,
      amount: (s.total_hours - s.billed_hours) * (s.billing_rate || activeWorkspace.billing_rate || 200),
    }));

    await window.api.invoke('invoices:create', {
      workspace_id: activeWorkspace.id,
      client_name: activeWorkspace.client_name || activeWorkspace.name,
      total_hours: totalUnbilledHours,
      billing_rate: activeWorkspace.billing_rate || 200,
      total_amount: totalUnbilledAmount,
      line_items: lineItems,
      due_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });

    for (const s of unbilledSummary) {
      await window.api.invoke('work-sessions:mark-billed', s.project_id);
    }

    toast(`Invoice created: ₪${totalUnbilledAmount.toLocaleString()}`, 'success');
    loadAll();
    window.api.invoke('work-sessions:summary', activeWorkspaceId).then(r => setSummary((r as WorkSummary[]) || []));
  };

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="text-4xl mb-3">💼</div>
        <p className="text-sm font-semibold text-dark-text mb-1">No client workspaces yet</p>
        <p className="text-xs text-dark-muted max-w-xs">
          Create a client workspace from the sidebar to start tracking hours and generating invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-dark-text">💼 Billing</h2>
          <p className="text-xs text-dark-muted mt-0.5">Hours tracking + Invoice generation</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogHours(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-dark-text hover:border-accent-blue/40 transition-colors"
          >
            + Log Hours
          </button>
          {totalUnbilledHours > 0 && (
            <button
              onClick={createInvoice}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent-green text-white font-medium hover:bg-accent-green/80 transition-colors"
            >
              🧾 Create Invoice (₪{totalUnbilledAmount.toLocaleString()})
            </button>
          )}
        </div>
      </div>

      {/* Workspace tabs */}
      <div className="flex gap-2 mb-6">
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspaceId(ws.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeWorkspaceId === ws.id
                ? 'text-white border-transparent'
                : 'border-dark-border text-dark-muted hover:text-dark-text'
            }`}
            style={activeWorkspaceId === ws.id ? { background: ws.color } : {}}
          >
            {ws.emoji} {ws.name}
          </button>
        ))}
      </div>

      {/* Unbilled summary */}
      {unbilledSummary.length > 0 && (
        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-yellow-400 mb-3">
            Unbilled: {totalUnbilledHours}h = ₪{totalUnbilledAmount.toLocaleString()}
          </p>
          <div className="space-y-1">
            {unbilledSummary.map(s => (
              <div key={s.project_id} className="flex items-center justify-between text-xs">
                <span className="text-dark-text">{s.project_name}</span>
                <span className="text-dark-muted">
                  {(s.total_hours - s.billed_hours)}h × ₪{s.billing_rate || activeWorkspace?.billing_rate || 200} =
                  <span className="text-yellow-400 ml-1 font-medium">
                    ₪{((s.total_hours - s.billed_hours) * (s.billing_rate || activeWorkspace?.billing_rate || 200)).toLocaleString()}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {unbilledSummary.length === 0 && summary.length === 0 && (
        <div className="text-center py-10 border border-dashed border-dark-border rounded-xl mb-6">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm text-dark-text">No unbilled hours</p>
          <p className="text-xs text-dark-muted mt-1">Log hours to track work for this client</p>
        </div>
      )}

      {/* Invoice history */}
      {invoices.filter(inv => inv.workspace_id === activeWorkspaceId).length > 0 && (
        <div>
          <p className="text-[10px] text-dark-muted uppercase tracking-wider mb-3">Invoice History</p>
          <div className="space-y-2">
            {invoices
              .filter(inv => inv.workspace_id === activeWorkspaceId)
              .map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-dark-text">{inv.invoice_number}</p>
                    <p className="text-[10px] text-dark-muted">
                      {inv.client_name} · {inv.total_hours}h · {new Date(inv.issued_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-dark-text">₪{inv.total_amount.toLocaleString()}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      inv.status === 'paid' ? 'text-green-400 border-green-400/30 bg-green-400/5' :
                      inv.status === 'sent' ? 'text-accent-blue border-accent-blue/30' :
                      'text-dark-muted border-dark-border'
                    }`}>
                      {inv.status}
                    </span>
                    {inv.status === 'draft' && (
                      <button
                        onClick={() => window.api.invoke('invoices:update-status', inv.id, 'sent').then(loadAll)}
                        className="text-[10px] text-accent-blue hover:underline"
                      >Mark sent</button>
                    )}
                    {inv.status === 'sent' && (
                      <button
                        onClick={() => window.api.invoke('invoices:update-status', inv.id, 'paid').then(loadAll)}
                        className="text-[10px] text-green-400 hover:underline"
                      >Mark paid</button>
                    )}
                    <button
                      onClick={() => exportInvoicePdf(inv as Record<string, unknown>)}
                      className="text-[10px] text-dark-muted hover:text-dark-text"
                      title="Export PDF"
                    >📄</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Log hours modal */}
      {showLogHours && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowLogHours(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">Log Hours</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Project</label>
                <select
                  value={logForm.project_id}
                  onChange={e => setLogForm(f => ({ ...f, project_id: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                >
                  <option value={0}>— Select project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Hours</label>
                <input
                  type="number" step="0.5" min="0.5" value={logForm.hours}
                  onChange={e => setLogForm(f => ({ ...f, hours: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="text-[10px] text-dark-muted uppercase tracking-wider block mb-1">Description</label>
                <input
                  value={logForm.description}
                  onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="מה עשיתי..."
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowLogHours(false)} className="flex-1 text-xs py-2 rounded-lg border border-dark-border text-dark-muted">Cancel</button>
                <button onClick={logHours} className="flex-1 text-xs py-2 rounded-lg bg-accent-green text-white font-medium">Log</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
