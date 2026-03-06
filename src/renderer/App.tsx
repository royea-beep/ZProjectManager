import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { getLastSaveTime } from './services/api';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import LearningsPage from './pages/LearningsPage';
import PatternsPage from './pages/PatternsPage';
import SettingsPage from './pages/SettingsPage';
import IdeaCollector from './components/IdeaCollector';
import { APP_VERSION } from '../shared/constants';

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
  { path: '/learnings', label: 'Learnings', icon: '◈' },
  { path: '/patterns', label: 'Patterns', icon: '⬡' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export default function App() {
  const location = useLocation();
  const isProjectPage = location.pathname.startsWith('/project/');
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);

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
    <ErrorBoundary>
    <div className="flex h-screen bg-dark-bg text-dark-text">
      <nav className="w-56 bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
        <div className="p-4 border-b border-dark-border">
          <h1 className="text-lg font-bold tracking-tight">ZProjectManager</h1>
          <p className="text-xs text-dark-muted mt-0.5">Project Operating System</p>
        </div>
        <div className="flex-1 py-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive && !isProjectPage
                    ? 'bg-accent-blue/10 text-accent-blue border-r-2 border-accent-blue'
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-dark-border text-xs text-dark-muted space-y-0.5">
          <div>v{APP_VERSION}</div>
          {lastSaved && <div>{lastSaved}</div>}
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/learnings" element={<LearningsPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <IdeaCollector />
    </div>
    </ErrorBoundary>
  );
}
