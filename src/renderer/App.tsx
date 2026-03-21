import React from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getLastSaveTime } from './services/api';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import LearningsPage from './pages/LearningsPage';
import PatternsPage from './pages/PatternsPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import KanbanPage from './pages/KanbanPage';
import SynergyPage from './pages/SynergyPage';
import RevenuePage from './pages/RevenuePage';
import PortfolioPage from './pages/PortfolioPage';
import PromptAnalyticsPage from './pages/PromptAnalyticsPage';
import IntelligencePage from './pages/IntelligencePage';
import BillingPage from './pages/BillingPage';
import PipelinePage from './pages/PipelinePage';
import IdeaCollector from './components/IdeaCollector';
import GlobalSearch from './components/GlobalSearch';
import NotificationBell from './components/NotificationBell';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import MorningBriefing from './components/MorningBriefing';
import { APP_VERSION } from '../shared/constants';
import { getActiveTimer, STORAGE_KEY } from './components/SessionTimer';
import { LanguageContext, useLanguageProvider } from './hooks/useLanguage';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React render error:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-screen bg-dark-bg text-dark-text">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-bold text-accent-red mb-3">Something went wrong</h1>
            <p className="text-sm text-dark-muted mb-4">{this.state.error.message}</p>
            <button onClick={() => { this.setState({ error: null }); window.location.hash = '/'; }}
              className="px-4 py-2 bg-accent-blue text-white text-sm rounded hover:bg-accent-blue/80">
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: '⊞' },
  { path: '/portfolio', label: 'Portfolio', icon: '📁' },
  { path: '/kanban', label: 'Kanban', icon: '▦' },
  { path: '/revenue', label: 'Revenue', icon: '◈' },
  { path: '/learnings', label: 'Learnings', icon: '◉' },
  { path: '/patterns', label: 'Patterns', icon: '⬡' },
  { path: '/synergy', label: 'Synergy', icon: '⬢' },
  { path: '/activity', label: 'Activity', icon: '◎' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
  { path: '/prompt-analytics', label: 'Prompt Stats', icon: '📊' },
  { path: '/intelligence', label: 'Intelligence', icon: '🧠' },
  { path: '/billing', label: 'Billing', icon: '💼' },
  { path: '/pipeline', label: 'Pipeline', icon: '📊' },
];

// Keyboard shortcut definitions
const SHORTCUTS: { key: string; ctrl?: boolean; alt?: boolean; shift?: boolean; description: string; action: string }[] = [
  { key: 'k', ctrl: true, description: 'Global Search', action: 'search' },
  { key: '1', alt: true, description: 'Dashboard', action: 'nav:/' },
  { key: '2', alt: true, description: 'Portfolio', action: 'nav:/portfolio' },
  { key: '3', alt: true, description: 'Kanban', action: 'nav:/kanban' },
  { key: '4', alt: true, description: 'Revenue', action: 'nav:/revenue' },
  { key: '5', alt: true, description: 'Learnings', action: 'nav:/learnings' },
  { key: '6', alt: true, description: 'Patterns', action: 'nav:/patterns' },
  { key: '7', alt: true, description: 'Synergy', action: 'nav:/synergy' },
  { key: '8', alt: true, description: 'Activity', action: 'nav:/activity' },
  { key: '9', alt: true, description: 'Settings', action: 'nav:/settings' },
  { key: '0', alt: true, description: 'Prompt Stats', action: 'nav:/prompt-analytics' },
  { key: 'i', alt: true, description: 'Intelligence', action: 'nav:/intelligence' },
  { key: 'b', alt: true, description: 'Billing', action: 'nav:/billing' },
  { key: 'p', alt: true, description: 'Learning Pipeline', action: 'nav:/pipeline' },
  { key: 'n', ctrl: true, description: 'New Project', action: 'new-project' },
  { key: '/', ctrl: false, description: 'Focus Search', action: 'search' },
];

function useKeyboardShortcuts(navigate: ReturnType<typeof useNavigate>) {
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire in inputs/textareas unless it's Ctrl/Alt combos
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === '?' && e.shiftKey && !isInput) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      for (const shortcut of SHORTCUTS) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (e.key === shortcut.key && ctrlMatch && altMatch && shiftMatch) {
          // For non-modifier shortcuts, skip if in input
          if (!shortcut.ctrl && !shortcut.alt && isInput) continue;

          e.preventDefault();
          if (shortcut.action === 'search') {
            // GlobalSearch listens for Ctrl+K itself, but '/' also triggers it
            if (shortcut.key === '/') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }
          } else if (shortcut.action.startsWith('nav:')) {
            navigate(shortcut.action.slice(4));
          } else if (shortcut.action === 'new-project') {
            navigate('/?new=1');
          }
          return;
        }
      }

      // Escape closes help
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, showHelp]);

  return { showHelp, setShowHelp };
}

const SHORTCUT_LIST = [
  ['Ctrl+K', 'Global Search'],
  ['/', 'Focus Search'],
  ['Ctrl+N', 'New Project'],
  ['Alt+1', 'Dashboard'],
  ['Alt+2', 'Portfolio'],
  ['Alt+3', 'Kanban'],
  ['Alt+4', 'Revenue'],
  ['Alt+5', 'Learnings'],
  ['Alt+6', 'Patterns'],
  ['Alt+7', 'Synergy'],
  ['Alt+8', 'Activity'],
  ['Alt+9', 'Settings'],
  ['Alt+0', 'Prompt Stats'],
  ['Alt+I', 'Intelligence'],
  ['Alt+B', 'Billing'],
  ['Alt+P', 'Pipeline'],
  ['Shift+?', 'This overlay'],
] as const;

function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-text text-lg leading-none">✕</button>
        </div>
        <div className="space-y-0.5">
          {SHORTCUT_LIST.map(([key, label]) => (
            <div key={key} className="flex justify-between py-1.5 border-b border-dark-border/50 last:border-0">
              <span className="text-xs text-dark-muted">{label}</span>
              <kbd className="text-[10px] font-mono bg-dark-hover border border-dark-border px-1.5 py-0.5 rounded text-dark-text">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isProjectPage = location.pathname.startsWith('/project/');
  const currentPath = location.pathname;
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);
  const [activeTimer, setActiveTimer] = React.useState<{ projectId: number; projectName: string } | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState(0);
  const [showBriefing, setShowBriefing] = React.useState(false);
  const languageValue = useLanguageProvider();
  const { showHelp, setShowHelp } = useKeyboardShortcuts(navigate);

  React.useEffect(() => {
    const lastDismiss = localStorage.getItem('briefing_dismissed');
    if (!lastDismiss || Date.now() - parseInt(lastDismiss) > 4 * 60 * 60 * 1000) {
      setShowBriefing(true);
    }
  }, []);

  const dismissBriefing = () => {
    localStorage.setItem('briefing_dismissed', String(Date.now()));
    setShowBriefing(false);
  };

  // Poll localStorage for active timer
  React.useEffect(() => {
    const checkTimer = () => {
      const timer = getActiveTimer();
      setActiveTimer(timer ? { projectId: timer.projectId, projectName: timer.projectName } : null);
    };
    checkTimer();
    const interval = setInterval(checkTimer, 2000);
    window.addEventListener('storage', checkTimer);
    return () => { clearInterval(interval); window.removeEventListener('storage', checkTimer); };
  }, []);

  // Dynamic window title per page
  React.useEffect(() => {
    const PAGE_TITLES: Record<string, string> = {
      '/': 'ZProjectManager',
      '/portfolio': 'ZProjectManager — Portfolio',
      '/kanban': 'ZProjectManager — Kanban',
      '/revenue': 'ZProjectManager — Revenue',
      '/learnings': 'ZProjectManager — Learnings',
      '/patterns': 'ZProjectManager — Patterns',
      '/synergy': 'ZProjectManager — Synergy',
      '/activity': 'ZProjectManager — Activity',
      '/settings': 'ZProjectManager — Settings',
      '/prompt-analytics': 'ZProjectManager — Prompt Stats',
    };
    if (!isProjectPage) {
      document.title = PAGE_TITLES[currentPath] || 'ZProjectManager';
    }
  }, [currentPath, isProjectPage]);

  React.useEffect(() => {
    const update = async () => {
      const time = await getLastSaveTime();
      if (!time) { setLastSaved(null); return; }
      const diff = Math.floor((Date.now() - new Date(time).getTime()) / 1000);
      if (diff < 60) setLastSaved('Saved just now');
      else setLastSaved(`Saved ${Math.floor(diff / 60)}m ago`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LanguageContext.Provider value={languageValue}>
    <ErrorBoundary>
    <div className="flex h-screen bg-dark-bg text-dark-text">
      <nav className="sidebar-fixed w-56 bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
        <div className="p-4 border-b border-dark-border">
          <h1 className="text-lg font-bold tracking-tight">ZProjectManager</h1>
          <p className="text-xs text-dark-muted mt-0.5">Project Operating System</p>
        </div>
        <div className="flex-1 py-2 overflow-y-auto">
          <WorkspaceSwitcher onWorkspaceChange={setActiveWorkspaceId} />
          <div className="border-t border-dark-border/50 mt-1 mb-1" />
          {navItems.map(item => {
            const isActive = item.path === '/'
              ? currentPath === '/' && !isProjectPage
              : currentPath.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue border-r-2 border-accent-blue'
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </div>
        {activeTimer && (
          <NavLink to={`/project/${activeTimer.projectId}`}
            className="mx-3 mb-2 px-3 py-2 bg-accent-green/10 border border-accent-green/30 rounded-lg flex items-center gap-2 hover:bg-accent-green/20 transition-colors cursor-pointer">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
            </span>
            <span className="text-xs text-accent-green truncate">Timer: {activeTimer.projectName}</span>
          </NavLink>
        )}
        <div className="p-4 border-t border-dark-border text-xs text-dark-muted space-y-0.5">
          <div className="flex items-center justify-between">
            <span>v{APP_VERSION}</span>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button onClick={() => setShowHelp(true)} className="hover:text-dark-text transition-colors" title="Keyboard shortcuts (Shift+?)">?</button>
            </div>
          </div>
          {lastSaved && <div>{lastSaved}</div>}
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard activeWorkspaceId={activeWorkspaceId} />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/learnings" element={<LearningsPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/synergy" element={<SynergyPage />} />
          <Route path="/portfolio" element={<PortfolioPage activeWorkspaceId={activeWorkspaceId} />} />
          <Route path="/prompt-analytics" element={<PromptAnalyticsPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
        </Routes>
      </main>

      <IdeaCollector />
      <GlobalSearch />
      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
      {showBriefing && <MorningBriefing onDismiss={dismissBriefing} />}
    </div>
    </ErrorBoundary>
    </LanguageContext.Provider>
  );
}
