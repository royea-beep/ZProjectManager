import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import * as api from '../services/api';
import type { CrossProjectPattern, Project } from '../../shared/types';

type PatternCategory = 'all' | 'tech' | 'productivity' | 'health' | 'process';

const CATEGORY_CONFIG: Record<Exclude<PatternCategory, 'all'>, { label: string; color: string; bgColor: string; borderColor: string }> = {
  tech:         { label: 'Tech',         color: 'text-accent-blue',   bgColor: 'bg-accent-blue/15',   borderColor: 'border-accent-blue/30' },
  productivity: { label: 'Productivity', color: 'text-accent-green',  bgColor: 'bg-accent-green/15',  borderColor: 'border-accent-green/30' },
  health:       { label: 'Health',       color: 'text-orange-400',    bgColor: 'bg-orange-400/15',     borderColor: 'border-orange-400/30' },
  process:      { label: 'Process',      color: 'text-purple-400',    bgColor: 'bg-purple-400/15',     borderColor: 'border-purple-400/30' },
};

function getCategory(p: CrossProjectPattern): Exclude<PatternCategory, 'all'> {
  const text = ((p.pattern || '') + ' ' + (p.recommendation || '')).toLowerCase();
  if (text.includes('tech') || text.includes('stack') || text.includes('framework') || text.includes('migration') || text.includes('switch') || text.includes('template') || text.includes('git')) return 'tech';
  if (text.includes('session') || text.includes('productive') || text.includes('streak') || text.includes('velocity') || text.includes('launch') || text.includes('momentum') || text.includes('consistent') || text.includes('worked') || text.includes('fastest') || text.includes('confident')) return 'productivity';
  if (text.includes('health') || text.includes('stale') || text.includes('inactive') || text.includes('decay') || text.includes('blocker') || text.includes('frustrated') || text.includes('unhealthy') || text.includes('never worked')) return 'health';
  return 'process';
}

function timeAgo(dateStr: string): string {
  const detected = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - detected.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function getConfidenceColor(confidence: number): { bar: string; text: string } {
  if (confidence >= 0.8) return { bar: 'bg-accent-green', text: 'text-accent-green' };
  if (confidence >= 0.6) return { bar: 'bg-accent-blue', text: 'text-accent-blue' };
  return { bar: 'bg-yellow-400', text: 'text-yellow-400' };
}

export default function PatternsPage() {
  const { data: patterns, loading, refresh } = useData<CrossProjectPattern>(() => api.getPatterns());
  const { data: projects } = useData<Project>(() => api.getProjects());
  const [scanning, setScanning] = useState(false);
  const [lastScanCount, setLastScanCount] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<PatternCategory>('all');
  const navigate = useNavigate();

  const handleScan = async () => {
    setScanning(true);
    setLastScanCount(null);
    try {
      const count = await api.detectPatterns();
      setLastScanCount(count);
      await refresh();
    } catch (err) {
      console.error('Pattern detection failed:', err);
    } finally {
      setScanning(false);
    }
  };

  // Build a map of project name -> id for navigation
  const projectNameToId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) {
      map[p.name.toLowerCase()] = p.id;
    }
    return map;
  }, [projects]);

  // Categorized and filtered patterns
  const categorizedPatterns = useMemo(() => {
    return patterns.map(p => ({ ...p, category: getCategory(p) }));
  }, [patterns]);

  const filteredPatterns = useMemo(() => {
    if (activeCategory === 'all') return categorizedPatterns;
    return categorizedPatterns.filter(p => p.category === activeCategory);
  }, [categorizedPatterns, activeCategory]);

  // Summary stats
  const stats = useMemo(() => {
    const total = patterns.length;
    const avgConfidence = total > 0
      ? Math.round((patterns.reduce((sum, p) => sum + p.confidence, 0) / total) * 100)
      : 0;
    const lastScan = total > 0
      ? patterns.reduce((latest, p) => p.detected_at > latest ? p.detected_at : latest, patterns[0].detected_at)
      : null;
    const categoryCounts: Record<string, number> = { tech: 0, productivity: 0, health: 0, process: 0 };
    for (const p of categorizedPatterns) {
      categoryCounts[p.category]++;
    }
    return { total, avgConfidence, lastScan, categoryCounts };
  }, [patterns, categorizedPatterns]);

  const navigateToProject = (name: string) => {
    const id = projectNameToId[name.toLowerCase()];
    if (id) navigate(`/project/${id}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="skeleton h-7 w-56" />
          <div className="skeleton h-9 w-40 rounded-lg" />
        </div>
        <div className="skeleton h-4 w-72 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Cross-Project Patterns</h1>
        <div className="flex items-center gap-3">
          {lastScanCount !== null && (
            <span className="text-xs text-dark-muted">
              {lastScanCount} pattern{lastScanCount !== 1 ? 's' : ''} detected
            </span>
          )}
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent-blue text-white hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {scanning ? 'Scanning...' : 'Scan for Patterns'}
          </button>
        </div>
      </div>
      <p className="text-sm text-dark-muted mb-6">Detected patterns and recommendations across your project portfolio</p>

      {/* Summary Stats */}
      {patterns.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-dark-muted mt-1">Patterns Detected</div>
          </div>
          <div className="bg-dark-surface border border-dark-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.avgConfidence}%</div>
            <div className="text-xs text-dark-muted mt-1">Avg Confidence</div>
          </div>
          <div className="bg-dark-surface border border-dark-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.lastScan ? timeAgo(stats.lastScan) : '--'}</div>
            <div className="text-xs text-dark-muted mt-1">Last Scan</div>
          </div>
          <div className="bg-dark-surface border border-dark-border rounded-lg p-4 text-center">
            <div className="flex justify-center gap-2 text-sm font-medium">
              <span className="text-accent-blue">{stats.categoryCounts.tech}</span>
              <span className="text-accent-green">{stats.categoryCounts.productivity}</span>
              <span className="text-orange-400">{stats.categoryCounts.health}</span>
              <span className="text-purple-400">{stats.categoryCounts.process}</span>
            </div>
            <div className="text-xs text-dark-muted mt-1">By Category</div>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      {patterns.length > 0 && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeCategory === 'all'
                ? 'bg-dark-surface text-white border border-dark-border'
                : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            All ({stats.total})
          </button>
          {(Object.entries(CATEGORY_CONFIG) as [Exclude<PatternCategory, 'all'>, typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeCategory === key
                  ? `${cfg.bgColor} ${cfg.color} border ${cfg.borderColor}`
                  : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              {cfg.label} ({stats.categoryCounts[key]})
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {patterns.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-purple/10 flex items-center justify-center">
            <span className="text-2xl text-accent-purple/50">{'\u2B21'}</span>
          </div>
          <p className="text-lg text-dark-text mb-2">No patterns detected yet</p>
          <p className="text-sm text-dark-muted mb-6 max-w-sm mx-auto">
            The pattern engine analyzes your projects for recurring tech choices, productivity trends, and health signals.
          </p>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-6 py-3 text-sm font-medium rounded-lg bg-accent-blue text-white hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {scanning ? 'Scanning...' : 'Run First Scan'}
          </button>
        </div>
      )}

      {/* Pattern Cards */}
      <div className="space-y-4">
        {filteredPatterns.map(p => {
          let supportingProjects: string[] = [];
          try { supportingProjects = p.supporting_projects ? JSON.parse(p.supporting_projects) : []; } catch { /* ignore */ }
          const confidencePercent = Math.round(p.confidence * 100);
          const { bar: barColor, text: textColor } = getConfidenceColor(p.confidence);
          const cat = p.category;
          const catConfig = CATEGORY_CONFIG[cat];

          return (
            <div key={p.id} className="bg-dark-surface border border-dark-border rounded-lg p-4">
              {/* Top row: category badge + detected time */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catConfig.bgColor} ${catConfig.color}`}>
                  {catConfig.label}
                </span>
                <span className="text-xs text-dark-muted">
                  {p.detected_at ? timeAgo(p.detected_at) : ''}
                </span>
              </div>

              {/* Pattern text */}
              <h3 className="text-sm font-medium mb-3">{p.pattern}</h3>

              {/* Confidence bar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-1.5 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all`}
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${textColor} shrink-0`}>
                  {confidencePercent}%
                </span>
              </div>

              {/* Recommendation */}
              {p.recommendation && (
                <div className="bg-dark-bg border border-dark-border rounded-md p-3 mb-3">
                  <p className="text-sm text-accent-green/90">{p.recommendation}</p>
                </div>
              )}

              {/* Supporting projects */}
              {supportingProjects.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {supportingProjects.map((name: string) => {
                    const hasProject = projectNameToId[name.toLowerCase()];
                    return (
                      <button
                        key={name}
                        onClick={() => navigateToProject(name)}
                        disabled={!hasProject}
                        className={`text-xs px-2 py-0.5 rounded transition-colors ${
                          hasProject
                            ? 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 cursor-pointer'
                            : 'bg-dark-bg text-dark-muted cursor-default'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Filtered empty state */}
      {patterns.length > 0 && filteredPatterns.length === 0 && (
        <div className="text-center py-12 text-dark-muted">
          <p className="text-sm">No patterns in this category.</p>
        </div>
      )}
    </div>
  );
}
