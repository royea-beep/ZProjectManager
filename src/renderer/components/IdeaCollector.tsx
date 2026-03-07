import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useToast } from './Toast';
import type { ProcessedIdea, IdeaAction } from '../../shared/types';

const ACTION_ICONS: Record<string, string> = {
  task: '+',
  project: '*',
  next_action: '>',
  decision: '?',
  learning: '!',
  blocker_clear: 'x',
};

const ACTION_COLORS: Record<string, string> = {
  task: 'text-accent-blue',
  project: 'text-accent-purple',
  next_action: 'text-accent-green',
  decision: 'text-accent-yellow',
  learning: 'text-orange-400',
  blocker_clear: 'text-accent-red',
};

export default function IdeaCollector() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedIdea | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ctrl+I to open, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setInput('');
        setResult(null);
        setExecutionResult(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setInput('');
    setResult(null);
    setExecutionResult(null);
  };

  const handleSubmit = async () => {
    if (!input.trim() || processing) return;
    setProcessing(true);
    setResult(null);
    setExecutionResult(null);
    try {
      const res = await api.processIdea(input.trim());
      setResult(res);
    } catch {
      toast('Failed to process idea', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleExecute = async () => {
    if (!result || executing) return;
    setExecuting(true);
    try {
      const res = await api.executeIdea(result.idea.id as number);
      setExecutionResult(res.results);
      toast(`Executed ${res.results.length} action(s)`, 'success');
    } catch {
      toast('Failed to execute actions', 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleDismiss = async () => {
    if (!result) return;
    await api.dismissIdea(result.idea.id as number);
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-accent-purple rounded-full shadow-lg shadow-accent-purple/30 flex items-center justify-center text-white text-xl hover:scale-110 transition-transform z-40"
        title="Idea Collector (Ctrl+I)"
      >
        +
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative bg-dark-surface border border-dark-border rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-dark-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Brain Dump</h2>
                <p className="text-xs text-dark-muted">Type anything — I'll try to match it to a project and suggest actions.</p>
              </div>
              <span className="text-xs text-dark-muted">Ctrl+Enter to process</span>
            </div>

            {/* Input */}
            {!result && !executionResult && (
              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind?&#10;&#10;Examples:&#10;- add auth to ftable admin pages&#10;- new idea: AI tool that generates pitch decks&#10;- fixed the Wingman subscription bug&#10;- need to deploy Heroes-Hadera this week&#10;- learned: always test on mobile first"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-dark-text placeholder-dark-muted/50 focus:outline-none focus:border-accent-purple/50 resize-none"
                  rows={6}
                />
                <div className="flex items-center justify-between mt-3">
                  <button onClick={handleClose}
                    className="text-xs text-dark-muted hover:text-dark-text px-3 py-1.5">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={!input.trim() || processing}
                    className="px-4 py-2 bg-accent-purple text-white text-sm rounded-lg hover:bg-accent-purple/80 disabled:opacity-50 transition-colors">
                    {processing ? 'Thinking...' : 'Process'}
                  </button>
                </div>
              </div>
            )}

            {/* Result preview */}
            {result && !executionResult && (
              <div className="p-4">
                {/* What I understood */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-accent-purple">Analysis</span>
                    <span className="text-xs text-dark-muted">
                      {Math.round(result.confidence * 100)}% confident
                    </span>
                  </div>
                  <p className="text-xs text-dark-muted">{result.reasoning}</p>
                </div>

                {/* Matched project */}
                {result.idea.matched_project_name && (
                  <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-lg px-3 py-2 mb-3">
                    <span className="text-xs text-accent-blue">
                      Matched project: <strong>{result.idea.matched_project_name as string}</strong>
                    </span>
                  </div>
                )}

                {/* Actions to execute */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-dark-muted mb-2 uppercase">Actions to execute:</p>
                  <div className="space-y-1.5">
                    {result.actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 bg-dark-bg rounded-lg px-3 py-2">
                        <span className={`text-xs font-bold mt-0.5 ${ACTION_COLORS[action.type] || 'text-dark-muted'}`}>
                          {ACTION_ICONS[action.type] || '-'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-dark-muted uppercase">{action.type.replace('_', ' ')}</span>
                            {action.priority && action.priority !== 'medium' && (
                              <span className={`text-xs ${action.priority === 'critical' || action.priority === 'high' ? 'text-accent-red' : 'text-dark-muted'}`}>
                                {action.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-sm truncate">{action.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button onClick={handleExecute} disabled={executing}
                    className="flex-1 py-2 bg-accent-green text-white text-sm rounded-lg hover:bg-accent-green/80 disabled:opacity-50">
                    {executing ? 'Executing...' : `Execute ${result.actions.length} action(s)`}
                  </button>
                  <button onClick={() => { setResult(null); }}
                    className="px-4 py-2 bg-dark-bg border border-dark-border text-sm rounded-lg hover:bg-dark-hover">
                    Edit
                  </button>
                  <button onClick={handleDismiss}
                    className="px-4 py-2 text-sm text-dark-muted hover:text-dark-text">
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Execution results */}
            {executionResult && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-accent-green text-lg">&#10003;</span>
                  <span className="text-sm font-semibold">Done!</span>
                </div>
                <div className="space-y-1 mb-4">
                  {executionResult.map((r, i) => (
                    <p key={i} className="text-sm text-dark-muted flex items-center gap-2">
                      <span className="text-accent-green text-xs">&#10003;</span>
                      {r}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  {result?.idea.matched_project_id && (
                    <button
                      onClick={() => { navigate(`/project/${result.idea.matched_project_id}`); handleClose(); }}
                      className="px-4 py-2 bg-accent-blue/20 text-accent-blue text-sm rounded-lg hover:bg-accent-blue/30">
                      Go to project
                    </button>
                  )}
                  <button onClick={() => { setInput(''); setResult(null); setExecutionResult(null); }}
                    className="px-4 py-2 bg-dark-bg border border-dark-border text-sm rounded-lg hover:bg-dark-hover">
                    New idea
                  </button>
                  <button onClick={handleClose}
                    className="px-4 py-2 text-sm text-dark-muted hover:text-dark-text">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
