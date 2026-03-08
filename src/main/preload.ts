import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_CHANNELS = new Set([
  // Projects
  'projects:getAll', 'projects:get', 'projects:create', 'projects:update', 'projects:delete',
  // Sessions
  'sessions:getAll', 'sessions:create', 'sessions:update', 'sessions:delete', 'sessions:getGlobal',
  // Tasks
  'tasks:getAll', 'tasks:create', 'tasks:update', 'tasks:delete',
  // Subtasks
  'subtasks:getAll', 'subtasks:create', 'subtasks:update', 'subtasks:delete',
  // Commands
  'commands:getAll', 'commands:create', 'commands:update', 'commands:delete', 'commands:launch',
  // Metrics
  'metrics:getAll', 'metrics:create', 'metrics:update', 'metrics:delete',
  // Learnings
  'learnings:getAll', 'learnings:getGlobal', 'learnings:create', 'learnings:update', 'learnings:delete',
  // Patterns
  'patterns:getAll', 'patterns:detect',
  // Decisions
  'decisions:getAll', 'decisions:create', 'decisions:update', 'decisions:delete',
  // System
  'system:scanProjectsDir', 'system:getAppSetting', 'system:setAppSetting', 'system:getSuggestions', 'system:exportDb', 'system:lastSaveTime',
  'system:openTerminal', 'system:openVscode',
  // Ideas
  'ideas:process', 'ideas:getAll', 'ideas:update', 'ideas:dismiss', 'ideas:execute',
  // Design
  'design:getAll', 'design:upsert', 'design:init', 'design:overview',
  // TokenWise
  'tokenwise:available', 'tokenwise:overview', 'tokenwise:projectCost',
  // Session Intelligence
  'session:detect', 'session:gitStatus', 'session:autoHealth',
  // Audit Trail
  'audit:getAll', 'audit:getProject',
  // Global Search
  'system:globalSearch',
  // Export
  'system:exportReport',
  // Weekly Digest
  'system:weeklyDigest',
  // Auto Backup
  'backup:run', 'backup:list', 'backup:lastTime', 'backup:restore', 'backup:setInterval', 'backup:getDir',
  // Data Stats & Danger Zone
  'system:dataStats', 'audit:clear', 'system:dbPath',
  // Tags
  'tags:getAll', 'tags:add', 'tags:remove', 'tags:getAllUnique',
  // Notes
  'notes:getAll', 'notes:create', 'notes:update', 'notes:delete',
  // Kanban
  'kanban:getTasks', 'kanban:moveTask',
  // Notifications
  'notifications:getAll', 'notifications:dismiss',
  // Batch
  'batch:taskProgress', 'batch:gitStatus',
]);

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: unknown[]) => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`Blocked IPC channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
});
