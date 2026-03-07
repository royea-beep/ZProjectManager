import React, { useState, useMemo, useCallback, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKanbanTasks, moveKanbanTask, createTask, getProjects, type KanbanTask } from '../services/api';
import { useData } from '../hooks/useData';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import type { Project } from '../../shared/types';

type ColumnStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

interface Column {
  status: ColumnStatus;
  label: string;
  accent: string;
  dotColor: string;
}

const COLUMNS: Column[] = [
  { status: 'todo', label: 'To Do', accent: 'bg-accent-blue', dotColor: 'bg-accent-blue' },
  { status: 'in_progress', label: 'In Progress', accent: 'bg-accent-yellow', dotColor: 'bg-accent-yellow' },
  { status: 'blocked', label: 'Blocked', accent: 'bg-accent-red', dotColor: 'bg-accent-red' },
  { status: 'done', label: 'Done', accent: 'bg-accent-green', dotColor: 'bg-accent-green' },
];

const PRIORITY_BORDER: Record<string, string> = {
  critical: 'border-l-accent-red',
  high: 'border-l-orange-500',
  medium: 'border-l-accent-yellow',
  low: 'border-l-dark-border',
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-accent-red/20 text-accent-red',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-accent-yellow/20 text-accent-yellow',
  low: 'bg-dark-hover text-dark-muted',
};

export default function KanbanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: tasks, loading, refresh } = useData<KanbanTask>(() => getKanbanTasks());
  const { data: projects } = useData<Project>(() => getProjects());
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dragOverColumn, setDragOverColumn] = useState<ColumnStatus | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [addingTo, setAddingTo] = useState<ColumnStatus | null>(null);

  const projectNames = useMemo(() => {
    const names = new Set(tasks.map(t => t.project_name).filter(Boolean));
    return Array.from(names).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    if (projectFilter === 'all') return tasks;
    return tasks.filter(t => t.project_name === projectFilter);
  }, [tasks, projectFilter]);

  const tasksByStatus = useMemo(() => {
    const map: Record<ColumnStatus, KanbanTask[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    for (const task of filtered) {
      const status = task.status as ColumnStatus;
      if (map[status]) {
        map[status].push(task);
      }
    }
    return map;
  }, [filtered]);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, task: KanbanTask) => {
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(task.id);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, status: ColumnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>, newStatus: ColumnStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggingId(null);
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      await moveKanbanTask(taskId, newStatus);
      toast(`Moved "${task.title}" to ${COLUMNS.find(c => c.status === newStatus)?.label}`, 'success');
      await refresh();
    } catch {
      toast('Failed to move task', 'error');
    }
  }, [tasks, refresh, toast]);

  const handleDragEnd = useCallback(() => {
    setDragOverColumn(null);
    setDraggingId(null);
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (days < 0) return { text: formatted, className: 'text-accent-red' };
    if (days <= 2) return { text: formatted, className: 'text-accent-yellow' };
    return { text: formatted, className: 'text-dark-muted' };
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="skeleton h-7 w-44 mb-2" />
            <div className="skeleton h-4 w-56" />
          </div>
          <div className="skeleton h-9 w-40 rounded-lg" />
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-xl bg-dark-bg">
              <div className="skeleton h-10 rounded-t-xl" />
              <div className="p-2 space-y-2">
                {Array.from({ length: i === 1 ? 3 : 1 }).map((_, j) => (
                  <div key={j} className="skeleton h-20 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Kanban Board</h1>
          <p className="text-sm text-dark-muted">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''} across {projectNames.length} project{projectNames.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-dark-muted">Filter by project:</label>
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue transition-colors"
          >
            <option value="all">All Projects</option>
            {projectNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-0">
        {COLUMNS.map(col => {
          const colTasks = tasksByStatus[col.status];
          const isDropTarget = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              className={`flex flex-col rounded-xl transition-all duration-200 ${
                isDropTarget
                  ? 'bg-dark-hover ring-2 ring-accent-blue/50'
                  : 'bg-dark-bg'
              }`}
              onDragOver={e => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-3 py-3 border-b border-dark-border">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="ml-auto text-xs text-dark-muted bg-dark-surface px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colTasks.length === 0 ? (
                  <button
                    onClick={() => setAddingTo(col.status)}
                    className="flex flex-col items-center justify-center h-24 w-full text-dark-muted text-xs border border-dashed border-dark-border rounded-lg hover:border-accent-blue/40 hover:text-accent-blue/70 hover:bg-accent-blue/5 transition-all group"
                  >
                    <span className="text-lg mb-1 opacity-50 group-hover:opacity-100 transition-opacity">+</span>
                    Add task
                  </button>
                ) : (
                  <>
                    {colTasks.map(task => {
                      const dueInfo = formatDate(task.due_date);
                      const isDragging = draggingId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={e => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => navigate(`/project/${task.project_id}?tab=Tasks`)}
                          className={`bg-dark-surface border border-dark-border border-l-[3px] ${
                            PRIORITY_BORDER[task.priority] || 'border-l-dark-border'
                          } rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-dark-hover transition-all duration-150 ${
                            isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                          }`}
                        >
                          {/* Title */}
                          <p className="text-sm font-medium mb-2 line-clamp-2">{task.title}</p>

                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Project badge */}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-blue/15 text-accent-blue truncate max-w-[120px]">
                              {task.project_name}
                            </span>

                            {/* Priority badge */}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.low
                            }`}>
                              {task.priority}
                            </span>

                            {/* Subtask progress */}
                            {task.subtask_total > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                task.subtask_done === task.subtask_total
                                  ? 'bg-accent-green/20 text-accent-green'
                                  : 'bg-dark-hover text-dark-muted'
                              }`}>
                                {task.subtask_done}/{task.subtask_total}
                              </span>
                            )}

                            {/* Due date */}
                            {dueInfo && (
                              <span className={`text-[10px] ml-auto ${dueInfo.className}`}>
                                {dueInfo.text}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Add task button at bottom of non-empty columns */}
                    <button
                      onClick={() => setAddingTo(col.status)}
                      className="w-full py-1.5 text-xs text-dark-muted hover:text-accent-blue rounded-lg hover:bg-accent-blue/5 transition-colors"
                    >
                      + Add task
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Task Modal */}
      {addingTo && (
        <QuickAddTaskModal
          status={addingTo}
          projects={projects}
          onClose={() => setAddingTo(null)}
          onCreated={(title) => {
            toast(`Task "${title}" created`, 'success');
            refresh();
            setAddingTo(null);
          }}
        />
      )}
    </div>
  );
}

function QuickAddTaskModal({
  status,
  projects,
  onClose,
  onCreated,
}: {
  status: ColumnStatus;
  projects: Project[];
  onClose: () => void;
  onCreated: (title: string) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<number>(projects[0]?.id ?? 0);
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const statusLabel = COLUMNS.find(c => c.status === status)?.label ?? status;

  const handleSubmit = async () => {
    if (!title.trim() || !projectId) return;
    setSubmitting(true);
    try {
      await createTask({
        project_id: projectId,
        title: title.trim(),
        status,
        priority,
      });
      onCreated(title.trim());
    } catch {
      toast('Failed to create task', 'error');
      setSubmitting(false);
    }
  };

  const activeProjects = projects.filter(p => p.status !== 'archived');

  return (
    <Modal open onClose={onClose} title={`Add task to ${statusLabel}`}>
      <div className="space-y-3">
        <input
          ref={inputRef}
          placeholder="Task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-blue/50"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={projectId}
            onChange={e => setProjectId(Number(e.target.value))}
            className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none"
          >
            {activeProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm focus:outline-none"
          >
            {['critical', 'high', 'medium', 'low'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !projectId || submitting}
          className="w-full py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </Modal>
  );
}
