import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_CHANNELS = new Set([
  // Projects
  'projects:getAll', 'projects:get', 'projects:create', 'projects:update', 'projects:delete',
  // Sessions
  'sessions:getAll', 'sessions:create', 'sessions:delete', 'sessions:getGlobal',
  // Tasks
  'tasks:getAll', 'tasks:create', 'tasks:update', 'tasks:delete',
  // Commands
  'commands:getAll', 'commands:create', 'commands:update', 'commands:delete', 'commands:launch',
  // Metrics
  'metrics:getAll', 'metrics:create', 'metrics:delete',
  // Learnings
  'learnings:getAll', 'learnings:getGlobal', 'learnings:create', 'learnings:delete',
  // Patterns
  'patterns:getAll',
  // Decisions
  'decisions:getAll', 'decisions:create', 'decisions:delete',
  // System
  'system:scanProjectsDir', 'system:getSuggestions', 'system:exportDb', 'system:lastSaveTime',
  // Ideas
  'ideas:process', 'ideas:getAll', 'ideas:update', 'ideas:dismiss', 'ideas:execute',
  // Design
  'design:getAll', 'design:upsert', 'design:init', 'design:overview',
]);

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: unknown[]) => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`Blocked IPC channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
});
