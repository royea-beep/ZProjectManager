export const APP_VERSION = '1.0.0';

export const STATUS_COLORS: Record<string, string> = {
  idea: '#8892a8',
  planning: '#a855f7',
  building: '#3b82f6',
  testing: '#eab308',
  launched: '#22c55e',
  paused: '#f97316',
  archived: '#6b7280',
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#8892a8',
};

export const STAGE_LABELS: Record<string, string> = {
  concept: 'Concept',
  research: 'Research',
  architecture: 'Architecture',
  setup: 'Setup',
  development: 'Development',
  content_assets: 'Content & Assets',
  launch_prep: 'Launch Prep',
  live_optimization: 'Live & Optimization',
};

export const STATUS_LABELS: Record<string, string> = {
  idea: 'Idea',
  planning: 'Planning',
  building: 'Building',
  testing: 'Testing',
  launched: 'Launched',
  paused: 'Paused',
  archived: 'Archived',
};

export const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

export const MOOD_LABELS: Record<string, string> = {
  confident: 'Confident',
  neutral: 'Neutral',
  frustrated: 'Frustrated',
  stuck: 'Stuck',
};

export const PROJECT_TYPES = [
  'web-app',
  'mobile-app',
  'desktop-app',
  'trading-bot',
  'cli-tool',
  'saas',
  'platform',
];

export const DESIGN_DIMENSIONS: Record<string, { label: string; icon: string; description: string; psychology: string }> = {
  color_psychology: {
    label: 'Color Psychology',
    icon: '\u{1F3A8}',
    description: 'Full color system: trust, action, warning, success, background tone, accent, per-page rules',
    psychology: 'Every color triggers a specific subconscious reaction',
  },
  typography_psychology: {
    label: 'Typography Psychology',
    icon: '\u{1F524}',
    description: 'Font personality, readability, spacing, weight hierarchy, emotional tone',
    psychology: 'Fonts speak before the user reads',
  },
  visual_hierarchy: {
    label: 'Visual Hierarchy & Eye Flow',
    icon: '\u{1F441}',
    description: 'Eye landing order, section flow, button placement, white space strategy',
    psychology: 'Designing the page as a guided journey',
  },
  microinteractions: {
    label: 'Microinteractions & Feedback',
    icon: '\u{1F4AB}',
    description: 'Hover effects, form reactions, success messages, loading states, progress indicators',
    psychology: 'The website understands me — alive but not annoying',
  },
  motion_psychology: {
    label: 'Motion Psychology',
    icon: '\u{1F30A}',
    description: 'Transition speed, softness, scroll motion, hover motion, page entry feeling',
    psychology: 'Motion is the body language of the website',
  },
  conversion_psychology: {
    label: 'Conversion Psychology',
    icon: '\u{1F3AF}',
    description: 'CTA wording, choice reduction, trust signals, urgency, social proof, friction removal',
    psychology: 'Interest → Trust → Action',
  },
  sensory_design: {
    label: 'Sensory Design & Texture',
    icon: '\u{2728}',
    description: 'Shapes, depth, shadows, rounded vs rigid, image treatment, visual atmosphere',
    psychology: 'Imply physical feeling through screen: warm, premium, soft, powerful',
  },
  sound_strategy: {
    label: 'Sound Strategy',
    icon: '\u{1F50A}',
    description: 'Whether sound exists, when used, UI sounds, mute-first behavior',
    psychology: 'Sound can make a site cinematic or intrusive — controlled use only',
  },
  copy_tone: {
    label: 'Copy Tone & Emotional Language',
    icon: '\u{270D}',
    description: 'Brand voice, sentence length, confidence level, emotional temperature, clarity vs mystery',
    psychology: 'Design and words must say the same thing',
  },
  trust_architecture: {
    label: 'Trust Architecture',
    icon: '\u{1F3DB}',
    description: 'Consistency, real photos, testimonials, stats, transparency, FAQ, pricing clarity, security cues',
    psychology: 'People decide in seconds: legit or off — sum of tiny trust cues',
  },
};

export const DESIGN_STATUS_LABELS: Record<string, string> = {
  not_assessed: 'Not Assessed',
  needs_work: 'Needs Work',
  in_progress: 'In Progress',
  good: 'Good',
  excellent: 'Excellent',
};

export const DESIGN_STATUS_COLORS: Record<string, string> = {
  not_assessed: '#6b7280',
  needs_work: '#ef4444',
  in_progress: '#eab308',
  good: '#22c55e',
  excellent: '#a855f7',
};

export const WEB_RELEVANT_TYPES = ['web-app', 'saas', 'platform'];

export const IPC_CHANNELS = {
  // Projects
  GET_PROJECTS: 'projects:getAll',
  GET_PROJECT: 'projects:get',
  CREATE_PROJECT: 'projects:create',
  UPDATE_PROJECT: 'projects:update',
  DELETE_PROJECT: 'projects:delete',
  // Sessions
  GET_SESSIONS: 'sessions:getAll',
  CREATE_SESSION: 'sessions:create',
  DELETE_SESSION: 'sessions:delete',
  // Tasks
  GET_TASKS: 'tasks:getAll',
  CREATE_TASK: 'tasks:create',
  UPDATE_TASK: 'tasks:update',
  DELETE_TASK: 'tasks:delete',
  // Commands
  GET_COMMANDS: 'commands:getAll',
  CREATE_COMMAND: 'commands:create',
  UPDATE_COMMAND: 'commands:update',
  DELETE_COMMAND: 'commands:delete',
  LAUNCH_COMMAND: 'commands:launch',
  // Metrics
  GET_METRICS: 'metrics:getAll',
  CREATE_METRIC: 'metrics:create',
  DELETE_METRIC: 'metrics:delete',
  // Learnings
  GET_LEARNINGS: 'learnings:getAll',
  GET_ALL_LEARNINGS: 'learnings:getGlobal',
  CREATE_LEARNING: 'learnings:create',
  DELETE_LEARNING: 'learnings:delete',
  // Patterns
  GET_PATTERNS: 'patterns:getAll',
  // Decisions
  GET_DECISIONS: 'decisions:getAll',
  CREATE_DECISION: 'decisions:create',
  DELETE_DECISION: 'decisions:delete',
  // System
  SCAN_PROJECTS_DIR: 'system:scanProjectsDir',
  GET_SUGGESTIONS: 'system:getSuggestions',
  // Ideas
  PROCESS_IDEA: 'ideas:process',
  GET_IDEAS: 'ideas:getAll',
  UPDATE_IDEA: 'ideas:update',
  DISMISS_IDEA: 'ideas:dismiss',
  EXECUTE_IDEA: 'ideas:execute',
  // Design Dimensions
  GET_DESIGN_SCORES: 'design:getAll',
  UPSERT_DESIGN_SCORE: 'design:upsert',
  INIT_DESIGN_SCORES: 'design:init',
  GET_ALL_DESIGN_OVERVIEW: 'design:overview',
  // Activity
  GET_ALL_SESSIONS: 'sessions:getGlobal',
  // Backup
  EXPORT_DATABASE: 'system:exportDb',
  GET_LAST_SAVE_TIME: 'system:lastSaveTime',
} as const;
