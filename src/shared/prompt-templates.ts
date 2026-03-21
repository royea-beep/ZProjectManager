export type ProjectCategory =
  | 'web-saas'
  | 'mobile-app'
  | 'desktop-app'
  | 'api-backend'
  | 'landing-page'
  | 'internal-tool'
  | 'ai-tool'
  | 'game';

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: 'web-saas', label: 'Web SaaS' },
  { value: 'mobile-app', label: 'Mobile App' },
  { value: 'desktop-app', label: 'Desktop App' },
  { value: 'api-backend', label: 'API / Backend' },
  { value: 'landing-page', label: 'Landing Page' },
  { value: 'internal-tool', label: 'Internal Tool' },
  { value: 'ai-tool', label: 'AI Tool' },
  { value: 'game', label: 'Game' },
];

export type PromptAction =
  // Building
  | 'scaffold-project'
  | 'add-feature'
  | 'fix-bugs'
  | 'audit-codebase'
  | 'refactor'
  | 'add-auth'
  | 'add-payments'
  | 'add-database'
  | 'add-realtime'
  | 'add-notifications'
  | 'add-analytics'
  | 'add-tests'
  // Deployment
  | 'deploy-vercel'
  | 'deploy-railway'
  | 'testflight-submit'
  | 'setup-ci-cd'
  // Quality
  | 'security-audit'
  | 'performance-audit'
  | 'seo-audit'
  | 'accessibility-audit'
  // Monetization
  | 'add-paywall'
  | 'add-subscription'
  | 'add-freemium'
  // Launch
  | 'app-store-prep'
  | 'launch-checklist'
  | 'marketing-page'
  // Operations
  | 'add-admin-dashboard'
  | 'add-bug-reporter'
  | 'add-feedback-widget'
  | 'update-state-docs';

export interface ActionGroup {
  label: string;
  icon: string;
  actions: PromptAction[];
}

export const ACTION_GROUPS: ActionGroup[] = [
  {
    label: 'Building',
    icon: '🔨',
    actions: ['scaffold-project', 'add-feature', 'fix-bugs', 'audit-codebase', 'refactor', 'add-auth', 'add-payments', 'add-database', 'add-realtime', 'add-notifications', 'add-analytics', 'add-tests'],
  },
  {
    label: 'Deployment',
    icon: '🚀',
    actions: ['deploy-vercel', 'deploy-railway', 'testflight-submit', 'setup-ci-cd'],
  },
  {
    label: 'Quality',
    icon: '🔍',
    actions: ['security-audit', 'performance-audit', 'seo-audit', 'accessibility-audit'],
  },
  {
    label: 'Monetization',
    icon: '💰',
    actions: ['add-paywall', 'add-subscription', 'add-freemium'],
  },
  {
    label: 'Launch',
    icon: '🏁',
    actions: ['app-store-prep', 'launch-checklist', 'marketing-page'],
  },
  {
    label: 'Operations',
    icon: '⚙️',
    actions: ['add-admin-dashboard', 'add-bug-reporter', 'add-feedback-widget', 'update-state-docs'],
  },
];

export const ACTION_LABELS: Record<PromptAction, string> = {
  'scaffold-project': 'Scaffold from scratch',
  'add-feature': 'Add feature',
  'fix-bugs': 'Fix bugs',
  'audit-codebase': 'Audit codebase',
  'refactor': 'Refactor',
  'add-auth': 'Add authentication',
  'add-payments': 'Add payments (Payplus)',
  'add-database': 'Add database (Supabase)',
  'add-realtime': 'Add realtime',
  'add-notifications': 'Add push notifications',
  'add-analytics': 'Add analytics + error logging',
  'add-tests': 'Write tests',
  'deploy-vercel': 'Deploy to Vercel',
  'deploy-railway': 'Deploy to Railway',
  'testflight-submit': 'Submit to TestFlight',
  'setup-ci-cd': 'Set up CI/CD',
  'security-audit': 'Security audit',
  'performance-audit': 'Performance audit',
  'seo-audit': 'SEO audit',
  'accessibility-audit': 'Accessibility audit',
  'add-paywall': 'Add paywall',
  'add-subscription': 'Add subscription',
  'add-freemium': 'Add freemium tier',
  'app-store-prep': 'App Store prep',
  'launch-checklist': 'Launch checklist',
  'marketing-page': 'Marketing page',
  'add-admin-dashboard': 'Add admin dashboard',
  'add-bug-reporter': 'Add BugReporter',
  'add-feedback-widget': 'Add feedback widget',
  'update-state-docs': 'Update state docs',
};
