import React, { useState, useMemo } from 'react';

// ═══ DATA ═══

interface ProjectEntry {
  name: string;
  oneLiner: string;
  status: 'live' | 'ready' | 'working' | 'mvp' | 'pre-launch' | 'done' | 'incomplete' | 'dormant';
  ecosystem: 'poker' | 'saas' | 'trading' | 'standalone';
  stack: string[];
  url?: string;
  deployedTo?: string;
}

interface ReusableLib {
  name: string;
  source: string;
  file: string;
  category: LibCategory;
  description: string;
  canUseIn: string[];
  effort: 'trivial' | 'easy' | 'medium';
}

interface Opportunity {
  action: string;
  from: string;
  to: string;
  effort: 'quick' | 'medium' | 'big';
  impact: 'high' | 'medium' | 'low';
  description: string;
}

interface FeatureFlow {
  feature: string;
  description: string;
  useIn: string;
}

interface FlowGroup {
  from: string;
  to: string[];
  tag: string;
  features: FeatureFlow[];
}

type LibCategory = 'auth' | 'ai' | 'analytics' | 'ui' | 'data' | 'video' | 'comms' | 'trading' | 'gamification';
type ViewMode = 'registry' | 'libraries' | 'opportunities' | 'flows' | 'stacks';

const PROJECTS: ProjectEntry[] = [
  // Poker
  { name: 'ftable', oneLiner: 'Israeli poker portal — tournaments, leaderboards, FTC coins, news, clubs', status: 'live', ecosystem: 'poker', stack: ['Vanilla JS', 'Supabase', 'cPanel'], url: 'ftable.co.il', deployedTo: 'cPanel' },
  { name: 'ftable-hands', oneLiner: 'Video highlight detection — OCR hand scanning, clip cutting, YouTube', status: 'working', ecosystem: 'poker', stack: ['Python', 'OpenCV', 'ffmpeg'] },
  { name: 'clubgg', oneLiner: 'Financial settlement for 2-partner poker club (88 weeks)', status: 'done', ecosystem: 'poker', stack: ['Python', 'SQLite', 'Excel'] },
  { name: 'Heroes-Hadera', oneLiner: 'Tournament registration & league system for Heroes club', status: 'mvp', ecosystem: 'poker', stack: ['Vanilla JS', 'Supabase', 'cPanel'] },
  { name: 'ExplainIt', oneLiner: 'Transform websites into explainer videos/PDFs', status: 'live', ecosystem: 'poker', stack: ['Next.js', 'Playwright', 'PDFKit'], url: 'explainit-one.vercel.app', deployedTo: 'Vercel' },
  // SaaS
  { name: 'PostPilot', oneLiner: 'AI social media manager — upload, get AI captions, publish', status: 'live', ecosystem: 'saas', stack: ['Next.js', 'Prisma', 'Claude API'], url: 'postpilot-app-nine.vercel.app', deployedTo: 'Vercel' },
  { name: 'KeyDrop', oneLiner: 'Secure credential collection via encrypted links', status: 'ready', ecosystem: 'saas', stack: ['Next.js', 'Prisma', 'AES-256'] },
  { name: 'TokenWise', oneLiner: 'Claude Code cost tracker — hooks into sessions, logs tokens', status: 'working', ecosystem: 'saas', stack: ['Node.js', 'sql.js', 'TypeScript'] },
  { name: 'MegaPromptGPT', oneLiner: 'CLI prompt expander with checkpoints', status: 'working', ecosystem: 'saas', stack: ['Python'] },
  { name: 'preprompt-web', oneLiner: 'Web prompt builder with AI suggestions, versioning, KB', status: 'mvp', ecosystem: 'saas', stack: ['Next.js', 'OpenAI API'] },
  { name: 'chicle', oneLiner: 'E-commerce SPA with gamification, coins, affiliate, 4 languages', status: 'dormant', ecosystem: 'saas', stack: ['React CDN', 'Firebase'] },
  // Trading
  { name: 'cryptowhale', oneLiner: 'Whale-tracking grid trading bot on Bybit', status: 'live', ecosystem: 'trading', stack: ['Python', 'FastAPI', 'Bybit API'], deployedTo: 'Railway' },
  { name: 'letsmakebillions', oneLiner: 'Prediction market trader — Kalshi/Polymarket, 17-signal ensemble', status: 'live', ecosystem: 'trading', stack: ['Python', 'Kalshi API', 'Polymarket'], deployedTo: 'Railway' },
  { name: 'crypto-arb-bot', oneLiner: 'Multi-engine arbitrage scanner across 5+ exchanges', status: 'working', ecosystem: 'trading', stack: ['Python', 'CCXT', 'asyncio'] },
  { name: 'mypoly', oneLiner: 'Polymarket API setup utility', status: 'incomplete', ecosystem: 'trading', stack: ['Python', 'py-clob-client'] },
  // Standalone
  { name: 'Wingman', oneLiner: 'Dating app — friends vouch for matches', status: 'pre-launch', ecosystem: 'standalone', stack: ['React Native', 'NestJS', 'Supabase'] },
  { name: 'ZProjectManager', oneLiner: 'Desktop app managing all 17 projects', status: 'working', ecosystem: 'standalone', stack: ['Electron', 'React', 'SQLite'] },
];

const LIBRARIES: ReusableLib[] = [
  // Auth & Security
  { name: 'JWT Auth + Refresh', source: 'KeyDrop', file: 'src/lib/auth.ts', category: 'auth', description: '15min access + 7d refresh tokens, bcrypt, rotation', canUseIn: ['Heroes-Hadera', 'Any SaaS'], effort: 'easy' },
  { name: 'AES-256-GCM Crypto', source: 'KeyDrop', file: 'src/lib/crypto.ts', category: 'auth', description: 'Encrypt/decrypt with unique IVs + auth tags', canUseIn: ['PostPilot', 'ftable', 'Any project'], effort: 'trivial' },
  { name: 'Rate Limiter', source: 'ExplainIt', file: 'src/lib/rate-limit.ts', category: 'auth', description: 'In-memory per-IP rate limiting (no Redis)', canUseIn: ['Heroes-Hadera', 'ftable', 'Any API'], effort: 'trivial' },
  { name: 'SSRF Validator', source: 'ExplainIt', file: 'src/lib/validate-url.ts', category: 'auth', description: 'URL validation + DNS rebinding + private IP blocking', canUseIn: ['Any project accepting URLs'], effort: 'trivial' },
  { name: 'Auth Context (React)', source: 'PostPilot', file: 'src/lib/auth-context.tsx', category: 'auth', description: 'useAuth() hook, auto-refresh, authFetch() wrapper', canUseIn: ['Any React app'], effort: 'easy' },
  { name: 'Supabase Auth Wrapper', source: 'ftable', file: 'js/supabaseClient.js', category: 'auth', description: 'OAuth, guards, session, toast, XSS escape', canUseIn: ['Heroes-Hadera'], effort: 'easy' },
  // AI
  { name: 'AI Caption Generator', source: 'PostPilot', file: 'src/lib/ai-captions.ts', category: 'ai', description: 'Claude API -> 3 caption styles + bilingual fallback', canUseIn: ['ftable', 'Heroes-Hadera'], effort: 'medium' },
  { name: 'Style DNA Engine', source: 'PostPilot', file: 'src/lib/style-engine.ts', category: 'ai', description: 'Learn brand voice from posts (tone, emoji, hashtags)', canUseIn: ['ftable social posting'], effort: 'medium' },
  { name: 'Token Cost Estimator', source: 'TokenWise', file: 'src/estimator.ts', category: 'ai', description: 'Character -> token -> USD for Claude models', canUseIn: ['ZProjectManager'], effort: 'easy' },
  { name: 'Claude Hook Manager', source: 'TokenWise', file: 'src/cli.ts', category: 'ai', description: 'Install/uninstall Claude Code lifecycle hooks', canUseIn: ['Any Claude extension'], effort: 'easy' },
  { name: 'Prompt Template Engine', source: 'MegaPromptGPT', file: 'megaprompt_local.py', category: 'ai', description: 'Short prompt -> structured mega prompt', canUseIn: ['preprompt-web (merge)'], effort: 'medium' },
  { name: 'Knowledge Base', source: 'preprompt-web', file: 'lib/kb.js', category: 'ai', description: 'Q&A frequency tracking, answer ranking, eviction', canUseIn: ['Any learning system'], effort: 'easy' },
  // Analytics
  { name: 'ftTracker.js', source: 'ftable', file: 'js/ftTracker.js', category: 'analytics', description: 'Full analytics: views, clicks, scroll, UTM, sessions, device', canUseIn: ['Heroes-Hadera'], effort: 'trivial' },
  { name: 'Error Handler', source: 'ftable', file: 'js/errorHandler.js', category: 'analytics', description: 'Global error catching -> Supabase js_errors table', canUseIn: ['Heroes-Hadera'], effort: 'trivial' },
  { name: 'Token Usage Logger', source: 'TokenWise', file: 'src/logger.ts', category: 'analytics', description: 'Claude Code hook event processing + SQL storage', canUseIn: ['ZProjectManager'], effort: 'easy' },
  // UI
  { name: 'Web Components (14)', source: 'ftable', file: 'components/*.js', category: 'ui', description: 'navbar, footer, cookie-consent, daily-checkin, bottom-nav', canUseIn: ['Heroes-Hadera'], effort: 'easy' },
  { name: 'Mini Games', source: 'chicle', file: 'index.html', category: 'ui', description: 'Spin wheel, scratch card, coin catcher', canUseIn: ['ftable FTC earning'], effort: 'medium' },
  { name: 'Language Context', source: 'ExplainIt', file: 'src/lib/language-context.tsx', category: 'ui', description: 'React bilingual provider (HE/EN) + RTL toggle', canUseIn: ['Any React app'], effort: 'trivial' },
  { name: 'Version Diff Viewer', source: 'preprompt-web', file: 'lib/versions.js', category: 'ui', description: 'LCS diff algorithm for text comparison', canUseIn: ['Code review, prompt iteration'], effort: 'easy' },
  { name: 'Markdown Renderer', source: 'preprompt-web', file: 'lib/', category: 'ui', description: 'Regex-based inline markdown -> HTML (no deps)', canUseIn: ['Any app rendering markdown'], effort: 'trivial' },
  // Data
  { name: 'SQLite WASM Wrapper', source: 'TokenWise', file: 'src/database.ts', category: 'data', description: 'sql.js lazy-load, auto-migration, PRAGMA setup', canUseIn: ['Any Node.js app'], effort: 'easy' },
  { name: 'Atomic JSON Save', source: 'ftable-hands', file: 'utils.py', category: 'data', description: 'Write to .tmp then rename (crash-safe)', canUseIn: ['Any Python project'], effort: 'trivial' },
  { name: 'CSV Export', source: 'Heroes-Hadera', file: 'js/utils.js', category: 'data', description: 'exportToCSV() with BOM for Hebrew support', canUseIn: ['ftable', 'Any project'], effort: 'trivial' },
  // Video
  { name: 'Capture Engine', source: 'ExplainIt', file: 'src/lib/capture-engine.ts', category: 'video', description: 'Playwright screenshots + element detection + URL discovery', canUseIn: ['Auto-generate tutorials'], effort: 'medium' },
  { name: 'Video Producer', source: 'ExplainIt', file: 'src/lib/video-producer.ts', category: 'video', description: 'HTML animation videos (no FFmpeg)', canUseIn: ['Promo videos'], effort: 'medium' },
  { name: 'OCR Pipeline', source: 'ftable-hands', file: 'chip_count_ocr.py', category: 'video', description: 'Ticker + overlay parsing, name fuzzy matching', canUseIn: ['Video text extraction'], effort: 'medium' },
  { name: 'R2 Upload Service', source: 'Wingman', file: 'photos/r2.service.ts', category: 'video', description: 'S3-compatible upload/delete/presigned URLs', canUseIn: ['ftable club logos'], effort: 'easy' },
  // Comms
  { name: 'Socket.IO Chat', source: 'Wingman', file: 'services/socket.ts', category: 'comms', description: 'Real-time messaging + reconnection + exponential backoff', canUseIn: ['ftable community chat'], effort: 'medium' },
  { name: 'FCM Push', source: 'Wingman', file: 'notification/fcm.service.ts', category: 'comms', description: 'Multi-device push with stale token cleanup', canUseIn: ['Any mobile app'], effort: 'easy' },
  { name: 'Web Push + SW', source: 'ftable', file: 'sw.js', category: 'comms', description: 'Service Worker push handling + subscription', canUseIn: ['Heroes-Hadera'], effort: 'easy' },
  { name: 'FTC Reward Toasts', source: 'ftable', file: 'js/ftcRewards.js', category: 'comms', description: 'Animated reward toast with 80-particle confetti', canUseIn: ['Any gamified app'], effort: 'trivial' },
  // Trading
  { name: 'Risk Manager', source: 'cryptowhale', file: 'core/risk_manager.py', category: 'trading', description: 'Bankroll limits, drawdown, kill switch, leverage', canUseIn: ['All trading bots'], effort: 'easy' },
  { name: 'Whale Tracker', source: 'cryptowhale', file: 'core/whale_tracker.py', category: 'trading', description: 'On-chain whale classification + tiered profiles', canUseIn: ['letsmakebillions'], effort: 'medium' },
  { name: 'Signal Engine', source: 'cryptowhale', file: 'core/signal_engine.py', category: 'trading', description: 'Multi-signal with freshness decay + alpha lag', canUseIn: ['Any signal system'], effort: 'medium' },
  { name: 'Shark Council', source: 'letsmakebillions', file: 'shark_council.py', category: 'trading', description: '17-signal ensemble learner with gradient descent', canUseIn: ['Adaptive weighting'], effort: 'medium' },
  { name: 'Backtest Engine', source: 'cryptowhale', file: 'backtest/engine.py', category: 'trading', description: 'Historical trade simulation + Sharpe ratio', canUseIn: ['Strategy validation'], effort: 'medium' },
  // Gamification
  { name: 'FTC Coin Economy', source: 'ftable', file: 'js/ftcRewards.js', category: 'gamification', description: 'Earn/spend coins with dedup, streak bonuses', canUseIn: ['Heroes-Hadera'], effort: 'medium' },
  { name: 'Affiliate System', source: 'chicle', file: 'index.html', category: 'gamification', description: '3-tier referral tracking with commissions', canUseIn: ['ftable referral'], effort: 'medium' },
  { name: 'Coin Constants', source: 'Wingman', file: 'packages/shared/constants.ts', category: 'gamification', description: 'Structured rewards, daily caps, level tiers', canUseIn: ['Any gamified app'], effort: 'trivial' },
  // Packaged mini-utils (@royea/*)
  { name: 'url-guard', source: 'url-guard', file: 'src/index.ts', category: 'auth', description: 'SSRF-safe URL validation + DNS rebinding. Used: ExplainIt, PostPilot (future logoUrl/website).', canUseIn: ['Any project accepting URLs'], effort: 'trivial' },
  { name: 'PromptGuard', source: 'PromptGuard', file: 'src/index.ts', category: 'ai', description: 'Sanitize user text before LLMs. Used: Wingman, PostPilot, preprompt-web.', canUseIn: ['Any AI app'], effort: 'trivial' },
  { name: 'CoinLedger', source: 'CoinLedger', file: 'src/index.ts', category: 'gamification', description: 'Virtual currency: credit/debit/balance, idempotency, memory + Prisma adapters', canUseIn: ['Wingman', 'ftable', 'chicle', 'Any app with coins'], effort: 'easy' },
  { name: 'FlushQueue', source: 'FlushQueue', file: 'src/index.ts', category: 'analytics', description: 'Client event buffer, batch POST, retry. Used: PostPilot, KeyDrop, ExplainIt. Next: Wingman.', canUseIn: ['Any web/RN app'], effort: 'easy' },
];

const OPPORTUNITIES: Opportunity[] = [
  // Quick wins
  { action: 'Copy ftTracker.js to Heroes', from: 'ftable', to: 'Heroes-Hadera', effort: 'quick', impact: 'high', description: '✓ Done — Heroes has tracker.js + errorHandler.js on all pages' },
  { action: 'Copy errorHandler.js to Heroes', from: 'ftable', to: 'Heroes-Hadera', effort: 'quick', impact: 'medium', description: '✓ Done — Heroes has errorHandler.js (Supabase js_errors)' },
  { action: 'Upgrade Heroes Supabase client', from: 'ftable', to: 'Heroes-Hadera', effort: 'quick', impact: 'high', description: '✓ Done — auth-guard.js (requireAuth + esc), Auth + Utils in place' },
  { action: 'Copy rate-limit.ts to APIs', from: 'KeyDrop', to: 'Any API', effort: 'quick', impact: 'medium', description: 'Drop-in DDoS protection for any public endpoint' },
  { action: 'Use TokenWise estimator in ZPM', from: 'TokenWise', to: 'ZProjectManager', effort: 'quick', impact: 'medium', description: '✓ Done — Dashboard shows cost, sort by cost, per-project on cards' },
  // Medium effort
  { action: 'Connect PostPilot to ftable', from: 'PostPilot', to: 'ftable', effort: 'medium', impact: 'high', description: 'Auto-generate social posts for tournaments, news, club features' },
  { action: 'Add mini-games to FTC', from: 'chicle', to: 'ftable', effort: 'medium', impact: 'high', description: 'Spin wheel + scratch card for earning FTC coins = engagement boost' },
  { action: 'Add Socket.IO chat to ftable', from: 'Wingman', to: 'ftable', effort: 'medium', impact: 'medium', description: 'Real-time community chat for poker players' },
  { action: 'Deploy Heroes-Hadera', from: 'Heroes-Hadera', to: 'Production', effort: 'medium', impact: 'high', description: 'Heroes club goes live — cPanel deploy + Supabase schema' },
  { action: 'Merge MegaPrompt + preprompt-web', from: 'MegaPromptGPT', to: 'preprompt-web', effort: 'medium', impact: 'medium', description: 'One tool: CLI + web + knowledge base + versioning' },
  { action: 'YouTube auto-publish highlights', from: 'ftable-hands', to: 'ftable', effort: 'medium', impact: 'high', description: 'Auto-publish tournament highlights to ftable from ftable-hands clips' },
  { action: 'Use ExplainIt for tutorials', from: 'ExplainIt', to: 'ftable', effort: 'medium', impact: 'medium', description: 'Auto-generate video guides for club registration, FTC earning' },
  // Big builds
  { action: 'Extract shared auth library', from: 'KeyDrop + PostPilot', to: 'All SaaS', effort: 'big', impact: 'high', description: 'Reusable JWT + crypto + guards for all future projects' },
  { action: 'Unify trading risk manager', from: 'All trading bots', to: 'Shared lib', effort: 'big', impact: 'medium', description: 'Single battle-tested risk/position management library' },
  { action: 'Create ftable-shared package', from: 'ftable + Heroes', to: 'Shared', effort: 'big', impact: 'high', description: 'Shared utils, analytics, components for poker ecosystem' },
];

const FLOWS: FlowGroup[] = [
  {
    from: 'PostPilot',
    to: ['ftable', 'Heroes-Hadera', 'Wingman'],
    tag: 'AI Content',
    features: [
      { feature: 'AI Caption Generator', description: 'Claude API -> 3 caption styles + fallback templates', useIn: 'ftable news posts, Heroes tournament announcements' },
      { feature: 'Style DNA Engine', description: 'Learns brand voice from past posts (tone, emoji, hashtags)', useIn: 'ftable could learn its posting style' },
      { feature: 'Auto-Publish Flow', description: 'Upload -> AI caption -> select -> publish', useIn: 'ftable already has auto-post-social edge function — connect them' },
    ],
  },
  {
    from: 'TokenWise',
    to: ['ZProjectManager'],
    tag: 'Cost Tracking',
    features: [
      { feature: 'Cost Estimator', description: 'Token count -> USD cost for Claude models', useIn: 'ZProjectManager could show cost-per-project' },
      { feature: 'Hook System', description: 'Taps into Claude Code lifecycle events', useIn: 'ZProjectManager session tracking' },
      { feature: 'SQLite Wrapper', description: 'sql.js with auto-migration', useIn: 'Already using similar pattern in ZProjectManager' },
    ],
  },
  {
    from: 'ExplainIt',
    to: ['ftable', 'Heroes-Hadera', 'Wingman'],
    tag: 'Automation',
    features: [
      { feature: 'Capture Engine', description: 'Playwright screenshots + element detection', useIn: 'Auto-generate tutorials for ftable features' },
      { feature: 'Video Producer', description: 'HTML animation videos (no FFmpeg needed)', useIn: 'Create promo videos for clubs directory' },
      { feature: 'SSRF Validator', description: 'URL validation with DNS rebinding protection', useIn: 'Any project accepting URLs' },
      { feature: 'Rate Limiter', description: 'In-memory per-IP (no Redis)', useIn: 'Heroes, ftable API protection' },
    ],
  },
  {
    from: 'KeyDrop + PostPilot',
    to: ['Heroes-Hadera', 'Any SaaS'],
    tag: 'Shared Auth',
    features: [
      { feature: 'JWT Auth + Refresh', description: '15min access + 7d refresh with rotation', useIn: 'Heroes admin, any new SaaS' },
      { feature: 'AES-256-GCM Crypto', description: 'Encrypt/decrypt with unique IVs', useIn: 'Store sensitive data anywhere' },
      { feature: 'Auth Context (React)', description: 'useAuth() hook + authFetch() wrapper', useIn: 'Any React app' },
      { feature: 'Zod Validation', description: 'Schema-based input validation', useIn: 'Any Node.js backend' },
    ],
  },
  {
    from: 'Wingman',
    to: ['ftable', 'chicle'],
    tag: 'Real-time & Push',
    features: [
      { feature: 'Socket.IO Chat', description: 'Real-time messaging with reconnection + token refresh', useIn: 'ftable community chat' },
      { feature: 'Coin Economy Constants', description: 'Structured rewards, daily caps, streak bonuses', useIn: 'ftable FTC system (already similar)' },
      { feature: 'FCM Push Notifications', description: 'Multi-device push with stale token cleanup', useIn: 'ftable already has push — could improve' },
      { feature: 'Cloudflare R2 Upload', description: 'Photo upload with presigned URLs', useIn: 'ftable club logos/covers' },
      { feature: 'Claude AI Game', description: 'Conversational AI scoring (prompt injection protection)', useIn: 'ftable could add poker quiz game' },
    ],
  },
  {
    from: 'ftable',
    to: ['Heroes-Hadera'],
    tag: 'IMMEDIATE',
    features: [
      { feature: 'ftTracker.js', description: 'Full analytics (page views, clicks, scroll depth, UTM, sessions)', useIn: 'Heroes needs analytics — just copy it' },
      { feature: 'supabaseClient.js', description: 'Auth guards, OAuth, toast, XSS escape', useIn: 'Heroes has bare 9-line setup — upgrade it' },
      { feature: 'Web Components', description: 'navbar, footer, cookie-consent, daily-checkin', useIn: 'Heroes can reuse the pattern' },
      { feature: 'FTC Rewards System', description: 'Earn/spend coins with dedup', useIn: 'Heroes could reward tournament attendance' },
      { feature: 'Error Handler', description: 'Global error catching -> Supabase logging', useIn: 'Heroes has no error logging' },
    ],
  },
  {
    from: 'Trading Bots',
    to: ['cryptowhale', 'letsmakebillions', 'crypto-arb-bot'],
    tag: 'Shared Infra',
    features: [
      { feature: 'RiskManager', description: 'Bankroll limits, drawdown, kill switch', useIn: 'All 3 trading bots' },
      { feature: 'WhaleTracker', description: 'Tier-based trader classification', useIn: 'cryptowhale + letsmakebillions' },
      { feature: 'SignalEngine', description: 'Multi-signal with freshness decay', useIn: 'Both trading bots' },
      { feature: 'Claude AI Scorer', description: 'Market quality/signal analysis', useIn: 'Both use Claude — unify the wrapper' },
    ],
  },
  {
    from: 'MegaPromptGPT + preprompt-web',
    to: ['Combined Tool'],
    tag: 'Merge',
    features: [
      { feature: 'Prompt Template Engine', description: 'Short -> mega prompt with sections', useIn: 'Combine both into one web tool' },
      { feature: 'Knowledge Base', description: 'Q&A frequency tracking, answer ranking', useIn: 'preprompt-web has this — add to combined' },
      { feature: 'Version Control + Diff', description: 'LCS diff viewer for prompt iterations', useIn: 'preprompt-web has this' },
      { feature: 'Profile System', description: 'Custom AI profiles (tone, style)', useIn: 'Both have this concept' },
    ],
  },
  {
    from: 'chicle',
    to: ['ftable'],
    tag: 'Gamification',
    features: [
      { feature: 'Mini Games', description: 'Spin wheel, scratch card, coin catcher', useIn: 'ftable FTC earning games' },
      { feature: 'Affiliate System', description: '3-tier referral tracking with commissions', useIn: 'ftable referral program (already has basic)' },
      { feature: 'Translation System', description: '4-language TX object', useIn: 'ftable currently He-only, could expand' },
      { feature: 'Wishlist + Sharing', description: 'Save items, share via WhatsApp/link', useIn: 'ftable club favorites (already built similar)' },
    ],
  },
];

const CATEGORY_COLORS: Record<LibCategory, string> = {
  auth: '#ef4444',
  ai: '#a855f7',
  analytics: '#3b82f6',
  ui: '#22c55e',
  data: '#eab308',
  video: '#f97316',
  comms: '#06b6d4',
  trading: '#ec4899',
  gamification: '#e8b829',
};

const CATEGORY_LABELS: Record<LibCategory, string> = {
  auth: 'Auth & Security',
  ai: 'AI & LLM',
  analytics: 'Analytics',
  ui: 'UI Components',
  data: 'Data & Storage',
  video: 'Video & Media',
  comms: 'Communication',
  trading: 'Trading Infra',
  gamification: 'Gamification',
};

const STATUS_COLORS: Record<string, string> = {
  live: '#22c55e',
  ready: '#3b82f6',
  working: '#eab308',
  mvp: '#f97316',
  'pre-launch': '#a855f7',
  done: '#6b7280',
  incomplete: '#ef4444',
  dormant: '#4b5563',
};

const ECOSYSTEM_COLORS: Record<string, string> = {
  poker: '#ef4444',
  saas: '#3b82f6',
  trading: '#22c55e',
  standalone: '#a855f7',
};

const EFFORT_COLORS: Record<string, string> = {
  quick: '#22c55e',
  trivial: '#22c55e',
  easy: '#3b82f6',
  medium: '#eab308',
  big: '#f97316',
};

// ═══ COMPONENTS ═══

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function ProjectRegistry({ search }: { search: string }) {
  const grouped = useMemo(() => {
    const filtered = PROJECTS.filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.oneLiner.toLowerCase().includes(search.toLowerCase())
    );
    const groups: Record<string, ProjectEntry[]> = { poker: [], saas: [], trading: [], standalone: [] };
    filtered.forEach(p => groups[p.ecosystem]?.push(p));
    return groups;
  }, [search]);

  const ecosystemLabels: Record<string, string> = { poker: 'Poker Ecosystem', saas: 'AI / SaaS Tools', trading: 'Trading Ecosystem', standalone: 'Standalone' };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).filter(([, projects]) => projects.length > 0).map(([eco, projects]) => (
        <div key={eco}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: ECOSYSTEM_COLORS[eco] }} />
            <h3 className="text-sm font-bold text-dark-text">{ecosystemLabels[eco]}</h3>
            <span className="text-xs text-dark-muted">({projects.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {projects.map(p => (
              <div key={p.name} className="p-3 rounded-lg bg-dark-surface border border-dark-border hover:border-dark-border/80 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{p.name}</span>
                  <div className="flex items-center gap-1.5">
                    {p.deployedTo && <Badge label={p.deployedTo} color="#6b7280" />}
                    <Badge label={p.status} color={STATUS_COLORS[p.status]} />
                  </div>
                </div>
                <p className="text-xs text-dark-muted leading-relaxed mb-2">{p.oneLiner}</p>
                <div className="flex flex-wrap gap-1">
                  {p.stack.map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-hover text-dark-muted">{s}</span>
                  ))}
                </div>
                {p.url && <div className="text-[10px] text-accent-blue mt-1.5 truncate">{p.url}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LibraryBrowser({ search, categoryFilter }: { search: string; categoryFilter: LibCategory | 'all' }) {
  const filtered = useMemo(() => {
    return LIBRARIES.filter(lib => {
      if (categoryFilter !== 'all' && lib.category !== categoryFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return lib.name.toLowerCase().includes(q) || lib.source.toLowerCase().includes(q) || lib.description.toLowerCase().includes(q);
    });
  }, [search, categoryFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, ReusableLib[]> = {};
    filtered.forEach(lib => {
      if (!g[lib.category]) g[lib.category] = [];
      g[lib.category].push(lib);
    });
    return g;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, libs]) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat as LibCategory] }} />
            <h3 className="text-sm font-bold text-dark-text">{CATEGORY_LABELS[cat as LibCategory]}</h3>
            <span className="text-xs text-dark-muted">({libs.length})</span>
          </div>
          <div className="space-y-1.5">
            {libs.map(lib => (
              <div key={lib.name + lib.source} className="p-3 rounded-lg bg-dark-surface border border-dark-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{lib.name}</span>
                    <Badge label={lib.effort} color={EFFORT_COLORS[lib.effort]} />
                  </div>
                  <span className="text-xs text-dark-muted">from <span className="text-accent-blue">{lib.source}</span></span>
                </div>
                <p className="text-xs text-dark-muted mb-1.5">{lib.description}</p>
                <div className="flex items-center justify-between">
                  <code className="text-[10px] text-dark-muted bg-dark-hover px-1.5 py-0.5 rounded font-mono">{lib.file}</code>
                  <div className="flex gap-1">
                    {lib.canUseIn.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-12 text-dark-muted text-sm">No libraries match your search</div>
      )}
    </div>
  );
}

function OpportunityBoard({ search }: { search: string }) {
  const filtered = useMemo(() => {
    return OPPORTUNITIES.filter(o => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.action.toLowerCase().includes(q) || o.from.toLowerCase().includes(q) || o.to.toLowerCase().includes(q);
    });
  }, [search]);

  const groups: Record<string, Opportunity[]> = { quick: [], medium: [], big: [] };
  filtered.forEach(o => groups[o.effort]?.push(o));

  const effortLabels: Record<string, string> = { quick: 'Quick Wins (< 1 hour)', medium: 'Medium Effort (1-2 days)', big: 'Big Builds (2-3 days)' };

  return (
    <div className="space-y-6">
      {Object.entries(groups).filter(([, ops]) => ops.length > 0).map(([effort, ops]) => (
        <div key={effort}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: EFFORT_COLORS[effort] }} />
            <h3 className="text-sm font-bold text-dark-text">{effortLabels[effort]}</h3>
            <span className="text-xs text-dark-muted">({ops.length})</span>
          </div>
          <div className="space-y-2">
            {ops.map((o, i) => (
              <div key={i} className="p-3 rounded-lg bg-dark-surface border border-dark-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{o.action}</span>
                  <Badge label={o.impact + ' impact'} color={o.impact === 'high' ? '#22c55e' : o.impact === 'medium' ? '#eab308' : '#6b7280'} />
                </div>
                <p className="text-xs text-dark-muted mb-2">{o.description}</p>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-accent-blue font-semibold">{o.from}</span>
                  <span className="text-dark-muted">{'->'}</span>
                  <span className="text-accent-green font-semibold">{o.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StackMatrix() {
  const stacks = useMemo(() => {
    const map: Record<string, string[]> = {};
    PROJECTS.forEach(p => {
      p.stack.forEach(s => {
        if (!map[s]) map[s] = [];
        map[s].push(p.name);
      });
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-xs text-dark-muted mb-4">Projects sharing the same tech can share code more easily.</p>
      {stacks.map(([tech, projects]) => (
        <div key={tech} className="p-3 rounded-lg bg-dark-surface border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">{tech}</span>
            <span className="text-xs text-dark-muted">{projects.length} projects</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {projects.map(p => {
              const proj = PROJECTS.find(pr => pr.name === p);
              return (
                <span key={p} className="text-[11px] px-2 py-0.5 rounded font-medium"
                  style={{ background: `${ECOSYSTEM_COLORS[proj?.ecosystem || 'standalone']}15`, color: ECOSYSTEM_COLORS[proj?.ecosystem || 'standalone'] }}>
                  {p}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FlowBoard({ search }: { search: string }) {
  const filtered = useMemo(() => {
    if (!search) return FLOWS;
    const q = search.toLowerCase();
    return FLOWS.filter(g =>
      g.from.toLowerCase().includes(q) ||
      g.to.some(t => t.toLowerCase().includes(q)) ||
      g.tag.toLowerCase().includes(q) ||
      g.features.some(f => f.feature.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
    );
  }, [search]);

  const TAG_COLORS: Record<string, string> = {
    'AI Content': '#a855f7',
    'Cost Tracking': '#3b82f6',
    'Automation': '#f97316',
    'Shared Auth': '#ef4444',
    'Real-time & Push': '#06b6d4',
    'IMMEDIATE': '#22c55e',
    'Shared Infra': '#ec4899',
    'Merge': '#eab308',
    'Gamification': '#e8b829',
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-dark-muted mb-2">Directional feature flows — what each project can contribute to others.</p>
      {filtered.map((g, i) => {
        const tagColor = TAG_COLORS[g.tag] || '#6b7280';
        return (
          <div key={i} className="rounded-lg bg-dark-surface border border-dark-border overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-accent-blue">{g.from}</span>
                <span className="text-dark-muted text-xs">{'→'}</span>
                <span className="text-sm font-semibold text-accent-green">{g.to.join(', ')}</span>
              </div>
              <Badge label={g.tag} color={tagColor} />
            </div>
            <div className="divide-y divide-dark-border">
              {g.features.map((f, j) => (
                <div key={j} className="px-4 py-2.5 flex items-start gap-3">
                  <span className="text-sm font-semibold shrink-0 w-40 truncate" title={f.feature}>{f.feature}</span>
                  <span className="text-xs text-dark-muted flex-1">{f.description}</span>
                  <span className="text-[10px] text-accent-blue/80 shrink-0 max-w-[200px] text-right">{f.useIn}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-dark-muted text-sm">No flows match your search</div>
      )}
    </div>
  );
}

// ═══ MAIN PAGE ═══

export default function SynergyPage() {
  const [view, setView] = useState<ViewMode>('registry');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LibCategory | 'all'>('all');

  const stats = useMemo(() => ({
    total: PROJECTS.length,
    live: PROJECTS.filter(p => p.status === 'live').length,
    libraries: LIBRARIES.length,
    opportunities: OPPORTUNITIES.length,
    quickWins: OPPORTUNITIES.filter(o => o.effort === 'quick').length,
  }), []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Project Synergy</h1>
        <p className="text-sm text-dark-muted mt-1">Cross-project intelligence — reusable libraries, integration opportunities, tech stack map</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Projects', value: stats.total, color: '#3b82f6' },
          { label: 'Live', value: stats.live, color: '#22c55e' },
          { label: 'Libraries', value: stats.libraries, color: '#a855f7' },
          { label: 'Opportunities', value: stats.opportunities, color: '#eab308' },
          { label: 'Quick Wins', value: stats.quickWins, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-lg bg-dark-surface border border-dark-border text-center">
            <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-dark-muted font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* View tabs + search */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1.5">
          {([
            { id: 'registry', label: 'Projects' },
            { id: 'libraries', label: 'Libraries' },
            { id: 'opportunities', label: 'Opportunities' },
            { id: 'flows', label: 'Flows' },
            { id: 'stacks', label: 'Tech Stacks' },
          ] as { id: ViewMode; label: string }[]).map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                view === tab.id
                  ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                  : 'text-dark-muted hover:text-dark-text border border-dark-border hover:border-dark-border/80'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {view === 'libraries' && (
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as LibCategory | 'all')}
              className="text-xs bg-dark-surface border border-dark-border rounded-lg px-2 py-1.5 text-dark-muted outline-none">
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          )}
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..." className="text-xs bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-dark-text outline-none focus:border-accent-blue/30 w-48" />
        </div>
      </div>

      {/* Content */}
      {view === 'registry' && <ProjectRegistry search={search} />}
      {view === 'libraries' && <LibraryBrowser search={search} categoryFilter={categoryFilter} />}
      {view === 'opportunities' && <OpportunityBoard search={search} />}
      {view === 'flows' && <FlowBoard search={search} />}
      {view === 'stacks' && <StackMatrix />}
    </div>
  );
}
