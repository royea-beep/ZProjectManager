export interface Project {
  id: number;
  name: string;
  description: string | null;
  type: string | null;
  stage: string;
  status: string;
  priority: string;
  goal: string | null;
  tech_stack: string | null;
  repo_path: string | null;
  repo_url: string | null;
  has_git: number;
  monetization_model: string | null;
  main_blocker: string | null;
  next_action: string | null;
  health_score: number;
  last_worked_at: string | null;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
  // GitHub API fields (v7)
  github_repo: string | null;
  github_stars: number | null;
  github_open_prs: number | null;
  github_ci_status: 'passing' | 'failing' | 'pending' | 'unknown' | null;
  github_last_push: string | null;
  github_synced_at: string | null;
  // Revenue fields (v7)
  mrr: number | null;
  arr: number | null;
  revenue_model: string | null;
  paying_customers: number | null;
  revenue_notes: string | null;
}

export interface RevenueEntry {
  id: number;
  project_id: number;
  amount: number;
  type: 'mrr' | 'one-time' | 'refund';
  date: string;
  notes: string | null;
  created_at: string;
  project_name?: string;
}

export interface ProjectSession {
  id: number;
  project_id: number;
  session_date: string;
  summary: string | null;
  what_done: string | null;
  what_worked: string | null;
  what_failed: string | null;
  blockers: string | null;
  next_step: string | null;
  files_changed: string | null;
  commands_used: string | null;
  prompts_used: string | null;
  mood: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  related_session_id: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface TaskSubtask {
  id: number;
  task_id: number;
  title: string;
  done: number;
  order_index: number;
  created_at: string;
}

export interface ProjectDecision {
  id: number;
  project_id: number;
  decision: string;
  reason: string | null;
  alternatives_considered: string | null;
  outcome: string | null;
  decided_at: string;
}

export interface ProjectCommand {
  id: number;
  project_id: number;
  label: string;
  command: string;
  command_type: string;
  shell: string;
  working_dir: string | null;
  auto_run: number;
  order_index: number;
  ports_used: string | null;
  notes: string | null;
}

export interface ProjectMetric {
  id: number;
  project_id: number;
  metric_name: string;
  metric_value: number;
  metric_unit: string | null;
  date: string;
  source: string | null;
  notes: string | null;
}

export interface Learning {
  id: number;
  project_id: number | null;
  learning: string;
  category: string | null;
  impact_score: number;
  created_at: string;
  project_name?: string;
}

export interface CrossProjectPattern {
  id: number;
  pattern: string;
  confidence: number;
  supporting_projects: string | null;
  recommendation: string | null;
  detected_at: string;
  last_validated_at: string | null;
}

export interface Idea {
  id: number;
  raw_input: string;
  parsed_title: string;
  parsed_description: string | null;
  matched_project_id: number | null;
  matched_project_name: string | null;
  suggested_type: string;
  suggested_actions: string;  // JSON array of action objects
  status: string;  // pending, accepted, dismissed, executed
  created_at: string;
}

export interface IdeaAction {
  type: 'task' | 'project' | 'next_action' | 'decision' | 'learning' | 'blocker_clear';
  title: string;
  description?: string;
  project_id?: number;
  priority?: string;
  executed?: boolean;
}

export interface ProcessedIdea {
  idea: Idea;
  actions: IdeaAction[];
  confidence: number;
  reasoning: string;
}

export type ProjectStatus = 'idea' | 'planning' | 'building' | 'testing' | 'launched' | 'paused' | 'archived';
export type ProjectStage = 'concept' | 'research' | 'architecture' | 'setup' | 'development' | 'content_assets' | 'launch_prep' | 'live_optimization';
export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type Mood = 'confident' | 'neutral' | 'frustrated' | 'stuck';

export interface WebsiteDesignScore {
  id: number;
  project_id: number;
  dimension: string;
  score: number;
  status: string;
  is_relevant: number;
  notes: string | null;
  updated_at: string;
}

export type DesignDimension =
  | 'color_psychology'
  | 'typography_psychology'
  | 'visual_hierarchy'
  | 'microinteractions'
  | 'motion_psychology'
  | 'conversion_psychology'
  | 'sensory_design'
  | 'sound_strategy'
  | 'copy_tone'
  | 'trust_architecture';

export type DesignStatus = 'not_assessed' | 'needs_work' | 'in_progress' | 'good' | 'excellent';

export interface ProjectTag {
  id: number;
  project_id: number;
  tag: string;
  color: string;
}

export interface ProjectNote {
  id: number;
  project_id: number;
  content: string;
  pinned: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyDigest {
  period: { start: string; end: string };
  projects_worked: { id: number; name: string; sessions: number; tasks_completed: number; tasks_created: number }[];
  total_sessions: number;
  total_tasks_completed: number;
  total_tasks_created: number;
  decisions_made: number;
  learnings_added: number;
  health_changes: { id: number; name: string; old_score: number; new_score: number }[];
  top_blockers: string[];
  streak_days: number;
}
