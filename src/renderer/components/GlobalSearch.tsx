import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearch, SearchResult } from '../services/api';

const TYPE_ICONS: Record<string, string> = {
  project: '\u229E',   // squared plus
  task: '\u25C7',       // diamond
  session: '\u25CE',    // bullseye
  decision: '\u2756',   // black diamond minus white X
  learning: '\u25C8',   // diamond with dot
};

const TYPE_LABELS: Record<string, string> = {
  project: 'Projects',
  task: 'Tasks',
  session: 'Sessions',
  decision: 'Decisions',
  learning: 'Learnings',
};

function groupByType(results: SearchResult[]): Record<string, SearchResult[]> {
  const groups: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  return groups;
}

function getNavTarget(result: SearchResult): string {
  switch (result.type) {
    case 'project':
      return `/project/${result.projectId}`;
    case 'task':
      return `/project/${result.projectId}?tab=Tasks`;
    case 'session':
      return `/project/${result.projectId}?tab=Memory`;
    case 'decision':
      return `/project/${result.projectId}?tab=Decisions`;
    case 'learning':
      return result.projectId ? `/project/${result.projectId}?tab=Learnings` : '/learnings';
    default:
      return '/';
  }
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Flatten results for keyboard navigation
  const flatResults = results;

  // Global Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    setLoading(true);
    try {
      const r = await globalSearch(q.trim());
      setResults(r);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const navigateToResult = useCallback((result: SearchResult) => {
    setOpen(false);
    navigate(getNavTarget(result));
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }
    if (e.key === 'Enter' && flatResults[selectedIndex]) {
      navigateToResult(flatResults[selectedIndex]);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const items = resultsRef.current.querySelectorAll('[data-search-item]');
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const grouped = groupByType(flatResults);
  const typeOrder = ['project', 'task', 'session', 'decision', 'learning'];
  let runningIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-dark-bg/80 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="w-full max-w-xl bg-dark-surface border border-dark-border rounded-xl shadow-2xl overflow-hidden animate-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border">
          <span className="text-dark-muted text-lg">/</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, tasks, sessions, decisions..."
            className="flex-1 bg-transparent text-dark-text text-sm outline-none placeholder:text-dark-muted/60"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-dark-muted bg-dark-hover border border-dark-border rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
          {query.trim().length < 2 && (
            <div className="px-4 py-8 text-center text-dark-muted text-sm">
              Type to search across all projects...
            </div>
          )}

          {query.trim().length >= 2 && loading && (
            <div className="px-4 py-8 flex flex-col items-center gap-2 text-dark-muted text-sm">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </div>
          )}

          {query.trim().length >= 2 && !loading && flatResults.length === 0 && (
            <div className="px-4 py-8 text-center text-dark-muted text-sm">
              No results found for "{query}"
            </div>
          )}

          {typeOrder.map(type => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            const startIndex = runningIndex;
            runningIndex += items.length;
            return (
              <div key={type}>
                <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-dark-muted uppercase tracking-wider">
                  {TYPE_LABELS[type] || type}
                </div>
                {items.map((result, i) => {
                  const globalIdx = startIndex + i;
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      data-search-item
                      onClick={() => navigateToResult(result)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-accent-blue/15 text-dark-text' : 'text-dark-muted hover:bg-dark-hover'
                      }`}
                    >
                      <span className="text-base shrink-0 w-5 text-center">{TYPE_ICONS[result.type] || '?'}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm truncate ${isSelected ? 'font-semibold text-dark-text' : 'font-medium text-dark-text/90'}`}>
                          {result.title}
                        </div>
                        <div className="text-xs text-dark-muted truncate">
                          {result.subtitle}
                        </div>
                      </div>
                      {isSelected && (
                        <kbd className="px-1.5 py-0.5 text-[10px] text-dark-muted bg-dark-hover border border-dark-border rounded font-mono shrink-0">
                          Enter
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-dark-border flex items-center gap-4 text-[11px] text-dark-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-dark-hover border border-dark-border rounded font-mono text-[10px]">Up</kbd>
            <kbd className="px-1 py-0.5 bg-dark-hover border border-dark-border rounded font-mono text-[10px]">Down</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-dark-hover border border-dark-border rounded font-mono text-[10px]">Enter</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-dark-hover border border-dark-border rounded font-mono text-[10px]">Esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
