import { IPC_CHANNELS } from '../../shared/constants';
import type { Project, ProjectSession, ProjectTask, ProjectCommand, ProjectMetric, Learning, CrossProjectPattern, ProjectDecision } from '../../shared/types';

declare global {
  interface Window {
    api: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    };
  }
}

const rawInvoke = window.api?.invoke ?? (async (channel: string) => { throw new Error(`IPC bridge unavailable (called: ${channel})`); });

const invoke = async (channel: string, ...args: unknown[]): Promise<unknown> => {
  try {
    return await rawInvoke(channel, ...args);
  } catch (err) {
    console.error(`[IPC Error] ${channel}:`, err);
    throw err;
  }
};

// Projects
export const getProjects = () => invoke(IPC_CHANNELS.GET_PROJECTS) as Promise<Project[]>;
export const getProject = (id: number) => invoke(IPC_CHANNELS.GET_PROJECT, id) as Promise<Project>;
export const createProject = (data: Partial<Project>) => invoke(IPC_CHANNELS.CREATE_PROJECT, data) as Promise<number>;
export const updateProject = (id: number, data: Partial<Project>) => invoke(IPC_CHANNELS.UPDATE_PROJECT, id, data) as Promise<Project>;
export const deleteProject = (id: number) => invoke(IPC_CHANNELS.DELETE_PROJECT, id) as Promise<boolean>;

// Sessions
export const getSessions = (projectId: number) => invoke(IPC_CHANNELS.GET_SESSIONS, projectId) as Promise<ProjectSession[]>;
export const createSession = (data: Partial<ProjectSession>) => invoke(IPC_CHANNELS.CREATE_SESSION, data) as Promise<number>;
export const updateSession = (id: number, data: Partial<ProjectSession>) => invoke(IPC_CHANNELS.UPDATE_SESSION, id, data) as Promise<boolean>;
export const deleteSession = (id: number) => invoke(IPC_CHANNELS.DELETE_SESSION, id) as Promise<boolean>;
export const getAllSessions = () => invoke(IPC_CHANNELS.GET_ALL_SESSIONS) as Promise<{ session_date: string }[]>;

// Tasks
export const getTasks = (projectId: number) => invoke(IPC_CHANNELS.GET_TASKS, projectId) as Promise<ProjectTask[]>;
export const createTask = (data: Partial<ProjectTask>) => invoke(IPC_CHANNELS.CREATE_TASK, data) as Promise<number>;
export const updateTask = (id: number, data: Partial<ProjectTask>) => invoke(IPC_CHANNELS.UPDATE_TASK, id, data) as Promise<boolean>;
export const deleteTask = (id: number) => invoke(IPC_CHANNELS.DELETE_TASK, id) as Promise<boolean>;

// Subtasks
import type { TaskSubtask } from '../../shared/types';
export const getSubtasks = (taskId: number) => invoke(IPC_CHANNELS.GET_SUBTASKS, taskId) as Promise<TaskSubtask[]>;
export const createSubtask = (data: Partial<TaskSubtask>) => invoke(IPC_CHANNELS.CREATE_SUBTASK, data) as Promise<number>;
export const updateSubtask = (id: number, data: Partial<TaskSubtask>) => invoke(IPC_CHANNELS.UPDATE_SUBTASK, id, data) as Promise<boolean>;
export const deleteSubtask = (id: number) => invoke(IPC_CHANNELS.DELETE_SUBTASK, id) as Promise<boolean>;

// Commands
export const getCommands = (projectId: number) => invoke(IPC_CHANNELS.GET_COMMANDS, projectId) as Promise<ProjectCommand[]>;
export const createCommand = (data: Partial<ProjectCommand>) => invoke(IPC_CHANNELS.CREATE_COMMAND, data) as Promise<number>;
export const updateCommand = (id: number, data: Partial<ProjectCommand>) => invoke(IPC_CHANNELS.UPDATE_COMMAND, id, data) as Promise<boolean>;
export const deleteCommand = (id: number) => invoke(IPC_CHANNELS.DELETE_COMMAND, id) as Promise<boolean>;
export const launchCommand = (id: number) => invoke(IPC_CHANNELS.LAUNCH_COMMAND, id) as Promise<{ ok: boolean; error?: string }>;

// Metrics
export const getMetrics = (projectId: number) => invoke(IPC_CHANNELS.GET_METRICS, projectId) as Promise<ProjectMetric[]>;
export const createMetric = (data: Partial<ProjectMetric>) => invoke(IPC_CHANNELS.CREATE_METRIC, data) as Promise<number>;
export const updateMetric = (id: number, data: Partial<ProjectMetric>) => invoke(IPC_CHANNELS.UPDATE_METRIC, id, data) as Promise<boolean>;
export const deleteMetric = (id: number) => invoke(IPC_CHANNELS.DELETE_METRIC, id) as Promise<boolean>;

// Learnings
export const getLearnings = (projectId: number) => invoke(IPC_CHANNELS.GET_LEARNINGS, projectId) as Promise<Learning[]>;
export const getAllLearnings = () => invoke(IPC_CHANNELS.GET_ALL_LEARNINGS) as Promise<Learning[]>;
export const createLearning = (data: Partial<Learning>) => invoke(IPC_CHANNELS.CREATE_LEARNING, data) as Promise<number>;
export const updateLearning = (id: number, data: Partial<Learning>) => invoke(IPC_CHANNELS.UPDATE_LEARNING, id, data) as Promise<boolean>;
export const deleteLearning = (id: number) => invoke(IPC_CHANNELS.DELETE_LEARNING, id) as Promise<boolean>;

// Patterns
export const getPatterns = () => invoke(IPC_CHANNELS.GET_PATTERNS) as Promise<CrossProjectPattern[]>;
export const detectPatterns = () => invoke(IPC_CHANNELS.DETECT_PATTERNS) as Promise<number>;

// Decisions
export const getDecisions = (projectId: number) => invoke(IPC_CHANNELS.GET_DECISIONS, projectId) as Promise<ProjectDecision[]>;
export const createDecision = (data: Partial<ProjectDecision>) => invoke(IPC_CHANNELS.CREATE_DECISION, data) as Promise<number>;
export const updateDecision = (id: number, data: Partial<ProjectDecision>) => invoke(IPC_CHANNELS.UPDATE_DECISION, id, data) as Promise<boolean>;
export const deleteDecision = (id: number) => invoke(IPC_CHANNELS.DELETE_DECISION, id) as Promise<boolean>;

// System
export interface ScannedProject {
  name: string;
  path: string;
  hasGit: boolean;
  hasPackageJson: boolean;
}

export interface Suggestion {
  type: string;
  message: string;
  action?: string;
  projectId?: number;
  projectName?: string;
  repoPath?: string;
}

export const scanProjectsDir = () => invoke(IPC_CHANNELS.SCAN_PROJECTS_DIR) as Promise<ScannedProject[]>;
export const getAppSetting = (key: string) => invoke(IPC_CHANNELS.GET_APP_SETTING, key) as Promise<string | null>;
export const setAppSetting = (key: string, value: string) => invoke(IPC_CHANNELS.SET_APP_SETTING, key, value) as Promise<void>;
export const getSuggestions = () => invoke(IPC_CHANNELS.GET_SUGGESTIONS) as Promise<Suggestion[]>;
export const openTerminal = (repoPath: string) => invoke(IPC_CHANNELS.OPEN_TERMINAL, repoPath) as Promise<{ ok: boolean }>;
export const openVSCode = (repoPath: string) => invoke(IPC_CHANNELS.OPEN_VSCODE, repoPath) as Promise<{ ok: boolean }>;

// Ideas
import type { Idea, ProcessedIdea } from '../../shared/types';

export const processIdea = (rawInput: string) => invoke(IPC_CHANNELS.PROCESS_IDEA, rawInput) as Promise<ProcessedIdea>;
export const getIdeas = () => invoke(IPC_CHANNELS.GET_IDEAS) as Promise<Idea[]>;
export const updateIdea = (id: number, data: Partial<Idea>) => invoke(IPC_CHANNELS.UPDATE_IDEA, id, data) as Promise<boolean>;
export const dismissIdea = (id: number) => invoke(IPC_CHANNELS.DISMISS_IDEA, id) as Promise<boolean>;
export const executeIdea = (id: number) => invoke(IPC_CHANNELS.EXECUTE_IDEA, id) as Promise<{ executed: number; results: string[] }>;

// Design Dimensions
import type { WebsiteDesignScore } from '../../shared/types';

export const getDesignScores = (projectId: number) => invoke(IPC_CHANNELS.GET_DESIGN_SCORES, projectId) as Promise<WebsiteDesignScore[]>;
export const upsertDesignScore = (data: Partial<WebsiteDesignScore>) => invoke(IPC_CHANNELS.UPSERT_DESIGN_SCORE, data) as Promise<number>;
export const initDesignScores = (projectId: number) => invoke(IPC_CHANNELS.INIT_DESIGN_SCORES, projectId) as Promise<WebsiteDesignScore[]>;
export const getDesignOverview = () => invoke(IPC_CHANNELS.GET_ALL_DESIGN_OVERVIEW) as Promise<Record<string, unknown>[]>;

// System: Last Save Time
export const getLastSaveTime = () => invoke(IPC_CHANNELS.GET_LAST_SAVE_TIME) as Promise<string | null>;

// Backup
export const exportDatabase = () => invoke(IPC_CHANNELS.EXPORT_DATABASE) as Promise<boolean>;

// TokenWise Integration
export interface TokenWiseStats {
  total_cost: number;
  total_interactions: number;
  total_sessions: number;
  last_7_days_cost: number;
  last_30_days_cost: number;
  per_project: { project_path: string; project_name: string; cost: number; interactions: number; last_used: string }[];
}
export interface ProjectCostData {
  total_cost: number;
  total_interactions: number;
  sessions: number;
  last_used: string | null;
  daily_costs: { date: string; cost: number }[];
}
export const isTokenWiseAvailable = () => invoke(IPC_CHANNELS.TOKENWISE_AVAILABLE) as Promise<boolean>;
export const getTokenWiseOverview = () => invoke(IPC_CHANNELS.TOKENWISE_OVERVIEW) as Promise<TokenWiseStats | null>;
export const getProjectCost = (repoPath: string) => invoke(IPC_CHANNELS.TOKENWISE_PROJECT_COST, repoPath) as Promise<ProjectCostData | null>;

// Session Intelligence
export interface DetectedSession {
  files_changed: string[];
  commands_used: string[];
  git_summary: string;
  suggested_summary: string;
  suggested_what_done: string;
  duration_estimate: number | null;
  commits: { hash: string; message: string; date: string }[];
}
export interface GitStatus {
  branch: string;
  uncommitted: number;
  untracked: number;
  ahead: number;
  behind: number;
}
export const detectSession = (repoPath: string, sinceDate?: string) => invoke(IPC_CHANNELS.DETECT_SESSION, repoPath, sinceDate) as Promise<DetectedSession | null>;
export const getGitStatus = (repoPath: string) => invoke(IPC_CHANNELS.GIT_STATUS, repoPath) as Promise<GitStatus | null>;
export const autoHealth = (projectId: number) => invoke(IPC_CHANNELS.AUTO_HEALTH, projectId) as Promise<number | null>;
export const getRecentCommits = (repoPath: string, limit?: number) => invoke(IPC_CHANNELS.RECENT_COMMITS, repoPath, limit) as Promise<{ hash: string; message: string; date: string; author: string }[]>;

// Audit Trail
export interface AuditEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  project_id: number | null;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  project_name?: string;
}
export const getAuditLog = (limit?: number) => invoke(IPC_CHANNELS.GET_AUDIT_LOG, limit) as Promise<AuditEntry[]>;
export const getProjectAuditLog = (projectId: number, limit?: number) => invoke(IPC_CHANNELS.GET_PROJECT_AUDIT_LOG, projectId, limit) as Promise<AuditEntry[]>;

// Global Search
export interface SearchResult {
  type: string;
  id: number;
  projectId: number | null;
  title: string;
  subtitle: string;
}
export const globalSearch = (query: string) => invoke(IPC_CHANNELS.GLOBAL_SEARCH, query) as Promise<SearchResult[]>;

// Export
export const exportProjectReport = (projectId: number, dateRange?: '7' | '30' | 'all') =>
  invoke(IPC_CHANNELS.EXPORT_PROJECT_REPORT, projectId, dateRange ?? 'all') as Promise<boolean>;

// Weekly Digest
import type { WeeklyDigest } from '../../shared/types';
export type { WeeklyDigest };
export const getWeeklyDigest = () => invoke(IPC_CHANNELS.GET_WEEKLY_DIGEST) as Promise<WeeklyDigest>;

// Auto Backup
export interface BackupInfo {
  name: string;
  size: number;
  date: string;
}
export interface BackupResult {
  success: boolean;
  path?: string;
  error?: string;
}
export const runBackup = () => invoke(IPC_CHANNELS.RUN_BACKUP) as Promise<BackupResult>;
export const getBackupList = () => invoke(IPC_CHANNELS.GET_BACKUP_LIST) as Promise<BackupInfo[]>;
export const getLastBackupTime = () => invoke(IPC_CHANNELS.GET_LAST_BACKUP_TIME) as Promise<string | null>;
export const restoreBackup = (backupName: string) => invoke(IPC_CHANNELS.RESTORE_BACKUP, backupName) as Promise<boolean>;
export const setBackupInterval = (hours: number) => invoke(IPC_CHANNELS.SET_BACKUP_INTERVAL, hours) as Promise<boolean>;
export const getBackupDir = () => invoke(IPC_CHANNELS.GET_BACKUP_DIR) as Promise<string>;

// Data Stats
export const getDataStats = () => invoke(IPC_CHANNELS.GET_DATA_STATS) as Promise<Record<string, number>>;

// Danger Zone
export const clearAuditLog = () => invoke(IPC_CHANNELS.CLEAR_AUDIT_LOG) as Promise<boolean>;

// Database Path
export const getDbPath = () => invoke(IPC_CHANNELS.GET_DB_PATH) as Promise<string>;

// Tags
import type { ProjectTag, ProjectNote } from '../../shared/types';
export const getTags = (projectId: number) => invoke(IPC_CHANNELS.GET_TAGS, projectId) as Promise<ProjectTag[]>;
export const addTag = (data: Partial<ProjectTag>) => invoke(IPC_CHANNELS.ADD_TAG, data) as Promise<number>;
export const removeTag = (id: number) => invoke(IPC_CHANNELS.REMOVE_TAG, id) as Promise<boolean>;
export const getAllTags = () => invoke(IPC_CHANNELS.GET_ALL_TAGS) as Promise<{ tag: string; color: string }[]>;

// Notes
export const getNotes = (projectId: number) => invoke(IPC_CHANNELS.GET_NOTES, projectId) as Promise<ProjectNote[]>;
export const createNote = (data: Partial<ProjectNote>) => invoke(IPC_CHANNELS.CREATE_NOTE, data) as Promise<number>;
export const updateNote = (id: number, data: Partial<ProjectNote>) => invoke(IPC_CHANNELS.UPDATE_NOTE, id, data) as Promise<boolean>;
export const deleteNote = (id: number) => invoke(IPC_CHANNELS.DELETE_NOTE, id) as Promise<boolean>;

// Kanban
export interface KanbanTask {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  project_name: string;
  subtask_total: number;
  subtask_done: number;
}
export const getKanbanTasks = () => invoke(IPC_CHANNELS.GET_KANBAN_TASKS) as Promise<KanbanTask[]>;
export const moveKanbanTask = (taskId: number, newStatus: string) => invoke(IPC_CHANNELS.MOVE_KANBAN_TASK, taskId, newStatus) as Promise<boolean>;

// Notifications
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  projectId?: number;
  projectName?: string;
  priority: string;
}
export const getNotifications = () => invoke(IPC_CHANNELS.GET_NOTIFICATIONS) as Promise<AppNotification[]>;
export const dismissNotification = (id: string) => invoke(IPC_CHANNELS.DISMISS_NOTIFICATION, id) as Promise<boolean>;

// Batch
export const batchTaskProgress = () => invoke(IPC_CHANNELS.BATCH_TASK_PROGRESS) as Promise<Record<number, { done: number; total: number }>>;
export const batchGitStatus = (projects: { id: number; repo_path: string }[]) => invoke(IPC_CHANNELS.BATCH_GIT_STATUS, projects) as Promise<Record<number, boolean | null>>;

// GitHub API
export const githubSyncAll = () => invoke(IPC_CHANNELS.GITHUB_SYNC_ALL) as Promise<{ synced: number; errors: number }>;
export const githubSetToken = (token: string) => invoke(IPC_CHANNELS.GITHUB_SET_TOKEN, token) as Promise<{ ok: boolean }>;

// Revenue
import type { RevenueEntry } from '../../shared/types';
export const getRevenueEntries = () => invoke(IPC_CHANNELS.REVENUE_GET_ALL) as Promise<RevenueEntry[]>;
export const createRevenueEntry = (data: { project_id: number; amount: number; type: string; date?: string; notes?: string }) =>
  invoke(IPC_CHANNELS.REVENUE_CREATE_ENTRY, data) as Promise<number>;
export const deleteRevenueEntry = (id: number) => invoke(IPC_CHANNELS.REVENUE_DELETE_ENTRY, id) as Promise<boolean>;
export const updateProjectRevenue = (id: number, data: { mrr?: number; arr?: number; revenue_model?: string; paying_customers?: number; revenue_notes?: string }) =>
  invoke(IPC_CHANNELS.REVENUE_UPDATE_PROJECT, id, data) as Promise<boolean>;
