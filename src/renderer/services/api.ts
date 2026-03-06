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
export const deleteSession = (id: number) => invoke(IPC_CHANNELS.DELETE_SESSION, id) as Promise<boolean>;
export const getAllSessions = () => invoke(IPC_CHANNELS.GET_ALL_SESSIONS) as Promise<{ session_date: string }[]>;

// Tasks
export const getTasks = (projectId: number) => invoke(IPC_CHANNELS.GET_TASKS, projectId) as Promise<ProjectTask[]>;
export const createTask = (data: Partial<ProjectTask>) => invoke(IPC_CHANNELS.CREATE_TASK, data) as Promise<number>;
export const updateTask = (id: number, data: Partial<ProjectTask>) => invoke(IPC_CHANNELS.UPDATE_TASK, id, data) as Promise<boolean>;
export const deleteTask = (id: number) => invoke(IPC_CHANNELS.DELETE_TASK, id) as Promise<boolean>;

// Commands
export const getCommands = (projectId: number) => invoke(IPC_CHANNELS.GET_COMMANDS, projectId) as Promise<ProjectCommand[]>;
export const createCommand = (data: Partial<ProjectCommand>) => invoke(IPC_CHANNELS.CREATE_COMMAND, data) as Promise<number>;
export const updateCommand = (id: number, data: Partial<ProjectCommand>) => invoke(IPC_CHANNELS.UPDATE_COMMAND, id, data) as Promise<boolean>;
export const deleteCommand = (id: number) => invoke(IPC_CHANNELS.DELETE_COMMAND, id) as Promise<boolean>;
export const launchCommand = (id: number) => invoke(IPC_CHANNELS.LAUNCH_COMMAND, id) as Promise<{ ok: boolean; error?: string }>;

// Metrics
export const getMetrics = (projectId: number) => invoke(IPC_CHANNELS.GET_METRICS, projectId) as Promise<ProjectMetric[]>;
export const createMetric = (data: Partial<ProjectMetric>) => invoke(IPC_CHANNELS.CREATE_METRIC, data) as Promise<number>;
export const deleteMetric = (id: number) => invoke(IPC_CHANNELS.DELETE_METRIC, id) as Promise<boolean>;

// Learnings
export const getLearnings = (projectId: number) => invoke(IPC_CHANNELS.GET_LEARNINGS, projectId) as Promise<Learning[]>;
export const getAllLearnings = () => invoke(IPC_CHANNELS.GET_ALL_LEARNINGS) as Promise<Learning[]>;
export const createLearning = (data: Partial<Learning>) => invoke(IPC_CHANNELS.CREATE_LEARNING, data) as Promise<number>;
export const deleteLearning = (id: number) => invoke(IPC_CHANNELS.DELETE_LEARNING, id) as Promise<boolean>;

// Patterns
export const getPatterns = () => invoke(IPC_CHANNELS.GET_PATTERNS) as Promise<CrossProjectPattern[]>;

// Decisions
export const getDecisions = (projectId: number) => invoke(IPC_CHANNELS.GET_DECISIONS, projectId) as Promise<ProjectDecision[]>;
export const createDecision = (data: Partial<ProjectDecision>) => invoke(IPC_CHANNELS.CREATE_DECISION, data) as Promise<number>;
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
  projectId?: number;
  projectName?: string;
}

export const scanProjectsDir = () => invoke(IPC_CHANNELS.SCAN_PROJECTS_DIR) as Promise<ScannedProject[]>;
export const getSuggestions = () => invoke(IPC_CHANNELS.GET_SUGGESTIONS) as Promise<Suggestion[]>;

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
