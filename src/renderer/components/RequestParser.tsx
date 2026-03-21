import React, { useState } from 'react';

export interface ExtractedRequest {
  id: number;
  text: string;
  priority: 'high' | 'medium' | 'low';
  project?: string;
  actionType?: string;
  confidence: number;
  isConfirmed: boolean;
  isCompleted: boolean;
}

interface Props {
  requests: ExtractedRequest[];
  onConfirm: (confirmed: ExtractedRequest[]) => void;
  onDismiss: () => void;
}

export default function RequestParser({ requests, onConfirm, onDismiss }: Props) {
  const [items, setItems] = useState(requests.map(r => ({ ...r, isConfirmed: true })));
  const [newItem, setNewItem] = useState('');

  const toggle = (id: number) => {
    setItems(prev => prev.map(r => r.id === id ? { ...r, isConfirmed: !r.isConfirmed } : r));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, {
      id: prev.length + 1,
      text: newItem.trim(),
      priority: 'medium' as const,
      confidence: 1.0,
      isConfirmed: true,
      isCompleted: false,
    }]);
    setNewItem('');
  };

  const confirmed = items.filter(r => r.isConfirmed);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center pb-6 px-4">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <div>
            <h3 className="text-sm font-bold text-dark-text">
              📋 זיהיתי {items.length} בקשות
            </h3>
            <p className="text-[10px] text-dark-muted mt-0.5">
              בדוק שהכל כאן לפני שמתחילים. הסר מה שלא רלוונטי.
            </p>
          </div>
          <button onClick={onDismiss} className="text-dark-muted hover:text-dark-text text-lg leading-none">✕</button>
        </div>

        {/* Request list */}
        <div className="max-h-72 overflow-y-auto p-3 space-y-2">
          {items.map(req => (
            <div
              key={req.id}
              onClick={() => toggle(req.id)}
              className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                req.isConfirmed
                  ? 'border-accent-blue/30 bg-accent-blue/5'
                  : 'border-dark-border bg-dark-bg opacity-40'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                req.isConfirmed ? 'border-accent-blue bg-accent-blue' : 'border-dark-muted'
              }`}>
                {req.isConfirmed && <span className="text-white text-[9px] leading-none">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-dark-muted">{req.id}.</span>
                  {req.priority === 'high' && (
                    <span className="text-[9px] px-1 rounded bg-red-400/15 text-red-400">דחוף</span>
                  )}
                  {req.project && (
                    <span className="text-[9px] px-1 rounded bg-dark-hover text-dark-muted">{req.project}</span>
                  )}
                </div>
                <p className="text-xs text-dark-text leading-relaxed">{req.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add missing + actions */}
        <div className="p-3 border-t border-dark-border">
          <div className="flex gap-2 mb-3">
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="הוסף דבר שחסר..."
              className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-text placeholder-dark-muted/50 focus:outline-none focus:border-accent-blue"
            />
            <button
              onClick={addItem}
              disabled={!newItem.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-text disabled:opacity-30 transition-colors"
            >
              + הוסף
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-dark-muted flex-1">
              {confirmed.length} מאושר{confirmed.length !== 1 ? 'ים' : ''}
            </span>
            <button onClick={onDismiss} className="text-xs px-3 py-1.5 text-dark-muted hover:text-dark-text transition-colors">
              ביטול
            </button>
            <button
              onClick={() => onConfirm(confirmed)}
              disabled={confirmed.length === 0}
              className="text-xs px-4 py-1.5 rounded-lg bg-accent-green text-white font-semibold disabled:opacity-40 hover:bg-accent-green/80 transition-colors"
            >
              ✅ התחל ({confirmed.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
