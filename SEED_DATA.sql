-- ZProjectManager Seed Data
-- Pre-populate with all 13 projects from C:\Projects audit (March 6, 2026)

INSERT INTO projects (name, description, type, stage, status, priority, goal, tech_stack, repo_path, has_git, monetization_model, main_blocker, next_action, health_score, last_worked_at) VALUES

('ftable', 'Israeli filmed poker league platform — tournaments, leaderboard, community, FTC coin economy', 'platform', 'live_optimization', 'launched', 'critical', 'National poker league platform for Israel with professional streaming', '["HTML","JS","CSS","Supabase","Tailwind","Deno Edge Functions"]', 'C:\Projects\ftable', 1, 'Tournament buy-ins + FTC shop + sponsorships (~₪2,700/mo)', '12 orphaned JS files, 11 admin pages missing auth guards', 'Fix auth guards on admin pages, clean dead code', 85, '2026-03-04'),

('Heroes-Hadera', 'Poker tournament registration platform for Heroes poker room', 'web-app', 'development', 'building', 'high', 'Replace outdated 019mail pages with modern tournament registration', '["HTML","JS","CSS","Supabase","Google Fonts"]', 'C:\Projects\Heroes-Hadera', 1, 'Tournament entry fees (₪350)', 'Admin pages incomplete, results entry flow missing', 'Complete admin tournament management and league points', 60, '2026-03-05'),

('ftable-hands', 'Automated poker video highlight detection and curation system', 'desktop-app', 'development', 'building', 'high', 'Scan poker videos, detect hands, cut highlights, generate YouTube reels', '["Python","Tkinter","OpenCV","Tesseract OCR","FFmpeg","YouTube API"]', 'C:\Projects\ftable-hands', 1, 'YouTube Partner Program (rejected, appeal in progress)', 'YouTube YPP rejection for reused content', 'Submit YouTube appeal, continue scanning new tournaments', 70, '2026-03-05'),

('clubgg', 'Settlement accounting system for 2-partner poker club (88 weeks)', 'web-app', 'development', 'building', 'medium', 'Reconcile who owes whom between two poker club partners', '["Python","FastAPI","SQLite","openpyxl","Jinja2","Tailwind"]', 'C:\Projects\clubgg', 1, NULL, '4 critical bugs (settlement formula, live chips, week range, expenses parser)', 'Fix the 4 critical calculation bugs', 45, '2026-03-05'),

('Wingman', 'Dating app where connections are socially vetted by friends', 'mobile-app', 'development', 'building', 'high', 'Launch MVP dating app with wingman verification in Tel Aviv', '["React Native","Expo","NestJS","PostgreSQL","Redis","Firebase Auth","Cloudflare R2"]', 'C:\Projects\Wingman', 1, 'In-app subscriptions + coin system + freemium', 'Delete account API missing, subscription receipt verification placeholder', 'Finish delete account, test subscription flow, prepare Tel Aviv pilot', 80, '2026-03-06'),

('letsmakebillions', 'Prediction market whale tracker — detect smart money, generate signals, paper trade', 'trading-bot', 'development', 'building', 'medium', 'Build intelligent prediction market trading system that follows whales', '["Python","http.server","JSON","Kalshi API","Polymarket","Claude AI"]', 'C:\Projects\letsmakebillions', 1, NULL, 'Dashboard JS errors, small sample size (11 settled trades)', 'Fix dashboard, accumulate more settled trade data', 65, '2026-03-05'),

('cryptowhale', 'Whale-gated grid trading bot for crypto perpetual futures', 'trading-bot', 'development', 'building', 'medium', 'Trade crypto futures only when validated whales signal high confidence', '["Python","FastAPI","SQLite","CCXT","APScheduler","Claude AI","Docker"]', 'C:\Projects\cryptowhale', 1, NULL, 'Exchange connection fragility, testnet data limitations', 'Test on mainnet with small paper balance, validate whale signals', 75, '2026-03-06'),

('crypto-arb-bot', 'Multi-engine crypto arbitrage scanner (cross-exchange, funding rate, triangular)', 'trading-bot', 'development', 'building', 'low', 'Detect and analyze profitable arbitrage opportunities across exchanges', '["Python","asyncio","ccxt","aiohttp","JSON"]', 'C:\Projects\crypto-arb-bot', 1, NULL, 'Triangular arb confirmed dead (HFT dominated), overlaps with letsmakebillions', 'Consider merging useful scanners into letsmakebillions, then archive', 35, '2026-03-02'),

('chicle', 'Israeli electronics e-commerce SPA with gamification', 'web-app', 'live_optimization', 'launched', 'low', 'E-commerce platform with coins, games, affiliate program', '["React 18","Firebase","PHP"]', 'C:\Projects\chicle', 1, 'E-commerce sales (simulated — no real payment gateway)', 'All payments simulated, no persistent backend', 'Either integrate real payments or archive as demo', 40, '2026-03-05'),

('preprompt-web', 'AI prompt crafting tool — expand short prompts into comprehensive pre-prompts', 'web-app', 'live_optimization', 'launched', 'low', 'Help users write better AI prompts through guided expansion', '["Next.js 16","React 18","localStorage"]', 'C:\Projects\preprompt-web', 1, NULL, NULL, 'Consider adding monetization or leave as free tool', 90, '2026-03-03'),

('MegaPromptGPT', 'CLI tool to expand prompts into mega prompts (Hebrew-first)', 'cli-tool', 'setup', 'building', 'low', 'Same as preprompt-web but as Python CLI', '["Python"]', 'C:\Projects\MegaPromptGPT', 1, NULL, 'Redundant with preprompt-web', 'Archive — preprompt-web does the same thing better', 20, '2026-03-02'),

('mypoly', 'Polymarket trading client wrapper', 'cli-tool', 'setup', 'paused', 'low', 'Programmatic trading on Polymarket', '["Python","py-clob-client"]', 'C:\Projects\mypoly', 1, NULL, 'Superseded by letsmakebillions', 'Archive — functionality absorbed by letsmakebillions', 15, '2026-03-01'),

('ExplainIt', 'Automated explainer video and documentation generator from any website — URL to video/PDF pipeline with Smart Mode', 'saas', 'development', 'building', 'medium', 'Transform any website into explainer videos + PDF docs automatically', '["Next.js 14","TypeScript","Playwright","PDFKit","Vitest","Tailwind"]', 'C:\Projects\ExplainIt', 1, NULL, NULL, 'Deploy to Railway/Render (needs server-side Chromium), add user auth', 75, '2026-03-06'),

('TokenWise', 'AI cost tracker and predictor for Claude Code — hooks into Claude CLI to log every interaction', 'cli-tool', 'development', 'building', 'medium', 'Track Claude Code costs per session/project with token estimation', '["TypeScript","Node.js","sql.js (WASM)","Claude Code Hooks"]', 'C:\Projects\TokenWise', 1, NULL, NULL, 'Phase 2: pattern recognition after 100+ logged interactions', 70, '2026-03-06'),

('1-2Clicks', 'Secure credential collector — send a link, client submits API keys encrypted, developer retrieves them', 'web-app', 'development', 'building', 'high', 'Let freelance devs collect client API keys securely via 1-2 click mobile links', '["Next.js 16","TypeScript","Prisma 7","SQLite","AES-256-GCM","JWT","Tailwind","Zod"]', 'C:\Projects\KeyDrop', 1, NULL, NULL, 'Add OAuth provider flows (Facebook, Google), AI-powered guide generation, deploy to Vercel', 80, '2026-03-06'),

('PostPilot', 'AI social media copilot — agency sends client a link, client uploads content, AI generates captions in their voice, publishes to all platforms', 'saas', 'development', 'building', 'high', 'Zero-friction social media posting with AI Style DNA learning', '["Next.js 16","TypeScript","Prisma 6","SQLite","Claude Haiku API","AES-256-GCM","JWT","Tailwind","Zod"]', 'C:\Projects\PostPilot', 1, 'Per-brand SaaS subscription for agencies', 'OAuth connect flow for Instagram/Facebook/TikTok not yet built', 'Implement real OAuth connect flow for at least Instagram, then deploy', 85, '2026-03-06'),

('90soccer', 'Football clip quiz — watch 10s clip, answer questions, 5 levels, leaderboard. Next.js + Capacitor iOS/Android.', 'mobile-app', 'development', 'building', 'high', 'Ship to TestFlight and Google Play internal; grow daily challenge + Facebook auto-post', '["Next.js 16","Capacitor","Supabase","Tailwind","TypeScript"]', 'C:\Projects\90soccer', 1, NULL, 'CI secrets for iOS/Android; ensure static export to out/ for Capacitor', 'Configure GitHub Actions secrets; run content pipeline; add DEPLOY.md', 75, '2026-03-08');

-- ============================================
-- LAUNCH COMMANDS
-- ============================================

INSERT INTO project_commands (project_id, label, command, command_type, shell, auto_run, order_index, ports_used) VALUES
((SELECT id FROM projects WHERE name='ftable'), 'Open in VS Code', 'code C:\Projects\ftable', 'vscode', 'powershell', 0, 1, NULL),
((SELECT id FROM projects WHERE name='ftable'), 'Deploy', 'bash deploy.sh', 'terminal', 'bash', 0, 2, NULL),

((SELECT id FROM projects WHERE name='Heroes-Hadera'), 'Open in VS Code', 'code C:\Projects\Heroes-Hadera', 'vscode', 'powershell', 0, 1, NULL),

((SELECT id FROM projects WHERE name='ftable-hands'), 'Run Master Dashboard', 'python MASTER_v11.py', 'terminal', 'powershell', 0, 1, NULL),
((SELECT id FROM projects WHERE name='ftable-hands'), 'Open in VS Code', 'code C:\Projects\ftable-hands', 'vscode', 'powershell', 0, 2, NULL),

((SELECT id FROM projects WHERE name='clubgg'), 'Start Server', 'python run.py', 'terminal', 'powershell', 0, 1, '["8000"]'),
((SELECT id FROM projects WHERE name='clubgg'), 'Open Browser', 'start http://localhost:8000', 'browser', 'powershell', 0, 2, NULL),

((SELECT id FROM projects WHERE name='Wingman'), 'Start API', 'cd apps/api && npm run start:dev', 'terminal', 'powershell', 0, 1, '["3000"]'),
((SELECT id FROM projects WHERE name='Wingman'), 'Start Mobile', 'cd apps/mobile && npx expo start', 'terminal', 'powershell', 0, 2, '["8081"]'),
((SELECT id FROM projects WHERE name='Wingman'), 'Docker Services', 'docker-compose up -d', 'terminal', 'powershell', 1, 0, '["5432","6379"]'),

((SELECT id FROM projects WHERE name='letsmakebillions'), 'Run Dashboard', 'python dashboard.py', 'terminal', 'powershell', 0, 1, '["8080"]'),
((SELECT id FROM projects WHERE name='letsmakebillions'), 'Open Dashboard', 'start http://localhost:8080', 'browser', 'powershell', 0, 2, NULL),

((SELECT id FROM projects WHERE name='cryptowhale'), 'Run Bot', 'python runner.py', 'terminal', 'powershell', 0, 1, '["8000"]'),
((SELECT id FROM projects WHERE name='cryptowhale'), 'Run Tests', 'pytest tests/', 'terminal', 'powershell', 0, 2, NULL),

((SELECT id FROM projects WHERE name='crypto-arb-bot'), 'Run Bot', 'python bot.py', 'terminal', 'powershell', 0, 1, NULL),

((SELECT id FROM projects WHERE name='chicle'), 'Deploy', 'bash deploy.sh', 'terminal', 'bash', 0, 1, NULL),

((SELECT id FROM projects WHERE name='preprompt-web'), 'Dev Server', 'npm run dev', 'terminal', 'powershell', 0, 1, '["3010"]'),
((SELECT id FROM projects WHERE name='preprompt-web'), 'Open Browser', 'start http://localhost:3010', 'browser', 'powershell', 0, 2, NULL),

((SELECT id FROM projects WHERE name='ExplainIt'), 'Dev Server', 'npm run dev', 'terminal', 'powershell', 0, 1, '["3000"]'),

((SELECT id FROM projects WHERE name='TokenWise'), 'Open in VS Code', 'code C:\Projects\TokenWise', 'vscode', 'powershell', 0, 1, NULL),
((SELECT id FROM projects WHERE name='TokenWise'), 'View Stats', 'npx ts-node src/cli.ts stats', 'terminal', 'powershell', 0, 2, NULL),

((SELECT id FROM projects WHERE name='1-2Clicks'), 'Dev Server', 'npm run dev', 'terminal', 'powershell', 0, 1, '["3000"]'),
((SELECT id FROM projects WHERE name='1-2Clicks'), 'Open Browser', 'start http://localhost:3000', 'browser', 'powershell', 0, 2, NULL),
((SELECT id FROM projects WHERE name='1-2Clicks'), 'Open in VS Code', 'code C:\Projects\KeyDrop', 'vscode', 'powershell', 0, 3, NULL),

((SELECT id FROM projects WHERE name='PostPilot'), 'Dev Server', 'npm run dev', 'terminal', 'powershell', 0, 1, '["3000"]'),
((SELECT id FROM projects WHERE name='PostPilot'), 'Open Browser', 'start http://localhost:3000', 'browser', 'powershell', 0, 2, NULL),
((SELECT id FROM projects WHERE name='PostPilot'), 'Prisma Studio', 'npx prisma studio', 'terminal', 'powershell', 0, 3, '["5555"]'),
((SELECT id FROM projects WHERE name='PostPilot'), 'Open in VS Code', 'code C:\Projects\PostPilot', 'vscode', 'powershell', 0, 4, NULL),

((SELECT id FROM projects WHERE name='90soccer'), 'Dev Server', 'npm run dev', 'terminal', 'powershell', 0, 1, '["3000"]'),
((SELECT id FROM projects WHERE name='90soccer'), 'Open in VS Code', 'code C:\Projects\90soccer', 'vscode', 'powershell', 0, 2, NULL),
((SELECT id FROM projects WHERE name='90soccer'), 'Content Pipeline', 'npx tsx agents/pipeline.ts', 'terminal', 'powershell', 0, 3, NULL);

-- ============================================
-- INITIAL LEARNINGS (from audit patterns)
-- ============================================

INSERT INTO learnings (project_id, learning, category, impact_score) VALUES
(NULL, 'Projects built in 1-3 day intense sprints tend to reach 60-90% completion then stall. Always define the next action before ending a sprint.', 'process', 9),
(NULL, 'Version control must be initialized on day 1. 8/13 projects had no git — risking total loss of work.', 'process', 10),
(NULL, 'No project has real payment processing. This is the gap between project and business. Prioritize Stripe/payment integration for revenue projects.', 'business', 9),
(NULL, 'Credentials are hardcoded across multiple projects. Always use .env files and add them to .gitignore from the start.', 'technical', 8),
(NULL, 'Redundant projects waste energy. Consolidate overlapping tools (e.g., crypto bots, prompt tools) before building new ones.', 'process', 7),
(NULL, 'Poker vertical is the strongest ecosystem — 5 interconnected projects with real revenue. Double down here.', 'business', 8),
(NULL, 'Hebrew RTL + mobile-first is a consistent requirement. Use Tailwind RTL plugin and test on mobile from day 1.', 'technical', 6),
(NULL, 'JWT auth with refresh token rotation is now a proven pattern across 3 projects (1-2Clicks, PostPilot, and the pattern in Wingman). Extract to shared library.', 'technical', 9),
(NULL, 'AES-256-GCM encryption with per-record IV is battle-tested in 1-2Clicks and PostPilot. Never roll custom crypto — reuse the crypto.ts pattern.', 'technical', 9),
(NULL, 'Rate limiting is implemented differently in each project (rate-limiter-flexible, custom Map, custom Map+proxy). Standardize on one approach.', 'technical', 7),
(NULL, 'CLAUDE.md files in every project dramatically accelerate future sessions. Always create one at project end.', 'process', 10),
(NULL, 'Zod validation at API boundaries catches bad input early. Every project with Zod (1-2Clicks, PostPilot) has zero runtime validation bugs.', 'technical', 8),
(NULL, 'Magic link pattern (token-based public access without auth) works great for client-facing flows. Used in 1-2Clicks (credential submission) and PostPilot (content upload). Consider for ExplainIt.', 'technical', 8),
(NULL, 'AI integration with graceful fallback (PostPilot captions work without API key) is the right pattern. Never make AI a hard dependency for MVP.', 'technical', 8),
(NULL, 'Audit logging is in 1-2Clicks and PostPilot but missing from ExplainIt. Add it everywhere — it costs nothing and saves debugging hours.', 'technical', 7);

-- ============================================
-- INITIAL PROJECT DECISIONS (manager-set conventions)
-- ============================================

INSERT INTO project_decisions (project_id, decision, reason, alternatives_considered, outcome) VALUES
((SELECT id FROM projects WHERE name='PostPilot' LIMIT 1), 'Use SQLite for local dev; use Postgres for production when deploying', 'Minimal local setup (no DB server); production needs scalability and serverless compatibility (e.g. Vercel).', 'SQLite everywhere; Postgres everywhere; hybrid by environment.', 'SQLite local works with file:./postpilot.db. When deploying: switch schema provider to postgresql and set DATABASE_URL to hosted Postgres.');

-- ============================================
-- INITIAL CROSS-PROJECT PATTERNS
-- ============================================

INSERT INTO cross_project_patterns (pattern, confidence, supporting_projects, recommendation) VALUES
('Projects reach 60-90% completion quickly but the final 10-20% (polish, payments, deployment) takes much longer', 0.85, '["Wingman","Heroes-Hadera","clubgg","letsmakebillions","cryptowhale"]', 'Define "done" criteria before starting. Ship MVP, then iterate.'),
('Burst development (1-3 day sprints) followed by momentum loss', 0.80, '["crypto-arb-bot","ExplainIt","MegaPromptGPT","chicle"]', 'Always end a sprint with a clear next action written down. Schedule the next work session.'),
('Crypto/trading projects overlap significantly', 0.90, '["letsmakebillions","cryptowhale","crypto-arb-bot","mypoly"]', 'Consolidate into 1-2 projects max. Merge scanners, kill redundant wrappers.'),
('No project has integrated real payment processing', 0.95, '["ftable","chicle","Wingman"]', 'Add Stripe to ftable first (lowest risk, existing revenue). Then Wingman (highest potential).'),
('Projects deployed to ftable.co.il share FTP credentials across repos', 0.90, '["ftable","Heroes-Hadera","chicle","clubgg","preprompt-web"]', 'Centralize deployment config. Rotate FTP password. Consider CI/CD.'),

('Shared auth architecture: JWT + refresh rotation + bcrypt + authFetch + auth-context.tsx', 0.95, '["1-2Clicks","PostPilot"]', 'Extract as @roy/next-auth-kit package or shared lib folder. Wingman uses NestJS auth — could align patterns.'),

('Shared encryption pattern: AES-256-GCM with per-record IV/authTag in crypto.ts', 0.95, '["1-2Clicks","PostPilot"]', 'Identical code in both projects. Extract as shared utility. Any project storing sensitive tokens should use this.'),

('Shared validation pattern: Zod schemas at API boundaries with consistent error handling', 0.90, '["1-2Clicks","PostPilot"]', 'Add Zod to ExplainIt API routes. Standardize error response format: { error, details? }.'),

('Magic link / token-based public access without auth', 0.90, '["1-2Clicks","PostPilot"]', 'Proven pattern for client-facing flows. ExplainIt could use this for sharing generated content with clients.'),

('Bilingual Hebrew/English support implemented per-project instead of shared i18n', 0.85, '["1-2Clicks","PostPilot","ExplainIt","ftable","Heroes-Hadera"]', 'Every project reinvents RTL support. Create shared language context + translation pattern.'),

('Rate limiting implemented 3 different ways across projects', 0.85, '["1-2Clicks","PostPilot","ExplainIt"]', '1-2Clicks uses rate-limiter-flexible, PostPilot/ExplainIt use custom Map. Pick one and standardize.'),

('Audit logging exists in newer projects but not older ones', 0.80, '["1-2Clicks","PostPilot"]', 'Add audit logging to ExplainIt, ftable, Heroes-Hadera. Schema: action, userId, metadata, ipAddress, timestamp.'),

('SSRF protection only exists in ExplainIt but any URL-accepting endpoint needs it', 0.85, '["ExplainIt"]', 'PostPilot will need SSRF protection when adding OAuth callbacks. Copy validate-url.ts pattern.'),

('Style DNA / pattern analysis engine in PostPilot could apply to other projects', 0.70, '["PostPilot"]', 'The NLP analysis pattern (keyword classification, emoji detection, frequency analysis) could enhance ftable (tournament patterns) or letsmakebillions (trading signal patterns).'),

('Database strategy for Next.js/Prisma apps: SQLite local, Postgres in production', 0.95, '["PostPilot","1-2Clicks"]', 'Local: provider sqlite, DATABASE_URL=file:./*.db so db push works with no server. Production: switch schema to postgresql and set DATABASE_URL to Neon/Vercel/Supabase. Per-project decisions record which approach each project uses.')
