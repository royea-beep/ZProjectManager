export interface Expert {
  id: string;
  name: string;
  company: string;
  role: string;
  domains: string[];
  thinking_style: string;
  known_for: string;
  asks_about: string[];
}

export const EXPERT_LIBRARY: Expert[] = [
  // ── UX / DESIGN ──────────────────────────────────────────────────────────
  {
    id: 'jony-ive', name: 'Jony Ive', company: 'Apple/LoveFrom', role: 'Chief Design Officer',
    domains: ['ux', 'mobile', 'product', 'design', 'animation'],
    thinking_style: 'Obsessive about simplicity. Removes until nothing is left to remove. Every friction is a failure.',
    known_for: 'Revealing when features solve the wrong problem by making the product more complex.',
    asks_about: ['What would you remove?', 'Does this belong?', 'What is the user feeling, not doing?'],
  },
  {
    id: 'don-norman', name: 'Don Norman', company: 'Nielsen Norman Group', role: 'UX Researcher',
    domains: ['ux', 'product', 'design', 'onboarding'],
    thinking_style: 'Human-centered. Discovers mismatches between mental models and system behavior.',
    known_for: 'Identifying where the user\'s model of the system diverges from how it actually works.',
    asks_about: ['What does the user think will happen?', 'What actually happens?', 'Where is the mental model broken?'],
  },
  {
    id: 'paul-stamatiou', name: 'Paul Stamatiou', company: 'Twitter/X', role: 'Product Designer',
    domains: ['ux', 'mobile', 'animation', 'gaming'],
    thinking_style: 'Detail-obsessed. Micro-animations and tactile feedback are the difference between good and great.',
    known_for: 'Noticing missing micro-interactions that break the feeling of quality.',
    asks_about: ['What does it feel like on a real phone?', 'What happens between states?', 'Does it respond?'],
  },

  // ── PRODUCT ──────────────────────────────────────────────────────────────
  {
    id: 'sam-altman', name: 'Sam Altman', company: 'OpenAI', role: 'CEO',
    domains: ['product', 'ai', 'growth', 'strategy', 'backend'],
    thinking_style: 'Thinks in exponential curves. Asks whether this is a 10x improvement or a 10% improvement.',
    known_for: 'Identifying whether something is a feature or a product. Pushes for the version that changes behavior.',
    asks_about: ['Will people use this daily?', 'Is this the 10x version or the safe version?', 'What breaks if you 10x the scale?'],
  },
  {
    id: 'paul-graham', name: 'Paul Graham', company: 'Y Combinator', role: 'Founder/Investor',
    domains: ['product', 'growth', 'strategy', 'onboarding'],
    thinking_style: 'Contrarian. Asks what the conventional wisdom is, then argues the opposite.',
    known_for: 'Finding the thing everyone agrees on that turns out to be wrong.',
    asks_about: ['What do users actually do vs what they say they want?', 'Is this a painkiller or a vitamin?', 'Who are your first 10 users?'],
  },
  {
    id: 'marty-cagan', name: 'Marty Cagan', company: 'SVPG', role: 'Product Executive',
    domains: ['product', 'strategy', 'roadmap', 'team'],
    thinking_style: 'Outcome-focused. Features are not the goal — user behavior change is the goal.',
    known_for: 'Distinguishing output (shipped features) from outcome (changed behavior).',
    asks_about: ['What behavior change does this create?', 'How will you know if it worked?', 'What is the riskiest assumption?'],
  },

  // ── ENGINEERING / BACKEND ─────────────────────────────────────────────────
  {
    id: 'bill-gates', name: 'Bill Gates', company: 'Microsoft', role: 'Co-founder',
    domains: ['backend', 'systems', 'architecture', 'security', 'ai'],
    thinking_style: 'Systems thinker. Traces second and third-order consequences of architectural decisions.',
    known_for: 'Identifying technical debt that compounds silently until it breaks everything.',
    asks_about: ['What happens at 10x scale?', 'Where is the hidden coupling?', 'What does this break 2 years from now?'],
  },
  {
    id: 'jeff-dean', name: 'Jeff Dean', company: 'Google/DeepMind', role: 'Senior Fellow',
    domains: ['backend', 'ai', 'architecture', 'performance', 'systems'],
    thinking_style: 'Infrastructure-first. Thinks about bottlenecks, latency, and fault tolerance before features.',
    known_for: 'Spotting single points of failure and hidden performance cliffs.',
    asks_about: ['What is the p99 latency?', 'What fails first?', 'Is this idempotent?'],
  },
  {
    id: 'martin-fowler', name: 'Martin Fowler', company: 'ThoughtWorks', role: 'Chief Scientist',
    domains: ['backend', 'architecture', 'refactoring', 'database'],
    thinking_style: 'Refactoring-oriented. Finds the primitive that the current design obscures.',
    known_for: 'Naming the design smells that developers feel but can\'t articulate.',
    asks_about: ['What is this really?', 'What would the pure version look like?', 'What is making this hard to change?'],
  },

  // ── MOBILE ───────────────────────────────────────────────────────────────
  {
    id: 'craig-federighi', name: 'Craig Federighi', company: 'Apple', role: 'SVP Software Engineering',
    domains: ['mobile', 'ios', 'performance', 'animation', 'ux'],
    thinking_style: 'Platform-native. Asks whether this uses the platform\'s native capabilities or fights against them.',
    known_for: 'Finding cases where apps re-implement what iOS already does, creating inconsistency.',
    asks_about: ['Does this feel native?', 'Are you using UIKit/SwiftUI correctly?', 'What happens in low memory?'],
  },
  {
    id: 'sundar-pichai', name: 'Sundar Pichai', company: 'Google', role: 'CEO',
    domains: ['mobile', 'android', 'ai', 'growth', 'product'],
    thinking_style: 'Scale-first. Thinks about the 1 billion user version of every feature.',
    known_for: 'Finding the accessibility and localization gaps that matter at global scale.',
    asks_about: ['Does this work on a 2-year-old Android?', 'Does this work in Hebrew RTL?', 'What about offline?'],
  },

  // ── GAMING ───────────────────────────────────────────────────────────────
  {
    id: 'shigeru-miyamoto', name: 'Shigeru Miyamoto', company: 'Nintendo', role: 'Creative Fellow',
    domains: ['gaming', 'ux', 'product', 'mobile', 'gamification'],
    thinking_style: 'Fun-first. Asks whether this creates a moment of delight, not whether it checks a feature box.',
    known_for: 'Finding the core mechanic that makes everything else fun — or finding its absence.',
    asks_about: ['Is the first 30 seconds fun?', 'What is the "just one more" hook?', 'Can a child understand it?'],
  },
  {
    id: 'will-wright', name: 'Will Wright', company: 'Maxis/Stupid Fun Club', role: 'Game Designer',
    domains: ['gaming', 'gamification', 'product', 'engagement'],
    thinking_style: 'Emergence-focused. The best games are systems that produce stories players didn\'t expect.',
    known_for: 'Finding the difference between a feature players execute and a system players explore.',
    asks_about: ['What does the player discover on their own?', 'What emerges from the rules?', 'Is there player expression?'],
  },
  {
    id: 'gabe-newell', name: 'Gabe Newell', company: 'Valve', role: 'CEO',
    domains: ['gaming', 'product', 'growth', 'gamification', 'community'],
    thinking_style: 'Economy-designer. The best games create player economies that persist.',
    known_for: 'Finding where the in-game economy creates or destroys fun.',
    asks_about: ['What do players value?', 'What is the player economy?', 'Is this trading fun for monetization?'],
  },

  // ── GROWTH / ENGAGEMENT ──────────────────────────────────────────────────
  {
    id: 'mark-zuckerberg', name: 'Mark Zuckerberg', company: 'Meta', role: 'CEO',
    domains: ['growth', 'engagement', 'social', 'product', 'mobile'],
    thinking_style: 'Engagement-maximizer. The first open every day is the most valuable moment.',
    known_for: 'Finding the missing social loop that would make users come back without thinking.',
    asks_about: ['What brings them back tomorrow?', 'What is the social proof mechanism?', 'What is the notification hook?'],
  },
  {
    id: 'nir-eyal', name: 'Nir Eyal', company: 'Author (Hooked)', role: 'Behavioral Designer',
    domains: ['engagement', 'gamification', 'mobile', 'product', 'onboarding'],
    thinking_style: 'Hook model. Every engagement loop has a trigger, action, reward, and investment.',
    known_for: 'Identifying missing investment steps that make users not return.',
    asks_about: ['What is the internal trigger?', 'What does the user invest in?', 'What is the variable reward?'],
  },

  // ── AI / ML ───────────────────────────────────────────────────────────────
  {
    id: 'andrej-karpathy', name: 'Andrej Karpathy', company: 'OpenAI/Tesla', role: 'AI Researcher',
    domains: ['ai', 'backend', 'architecture', 'product'],
    thinking_style: 'Implementation-down. Starts from what is actually computed, not the abstraction.',
    known_for: 'Demystifying AI hype — finding what the system actually does vs what it claims to do.',
    asks_about: ['What is the model actually doing?', 'Where does it fail silently?', 'What is the eval?'],
  },
  {
    id: 'claude', name: 'Claude', company: 'Anthropic', role: 'AI Assistant',
    domains: ['ai', 'product', 'ux', 'backend', 'strategy', 'architecture', 'mobile', 'gaming'],
    thinking_style: 'Prompt-engineer perspective. Asks what the AI needs to know to execute correctly.',
    known_for: 'Finding the information gaps in prompts that will cause silent failures.',
    asks_about: ['What will the AI assume?', 'What context is missing?', 'What is the most likely hallucination point?'],
  },

  // ── SECURITY ─────────────────────────────────────────────────────────────
  {
    id: 'bruce-schneier', name: 'Bruce Schneier', company: 'Harvard/EFF', role: 'Security Technologist',
    domains: ['security', 'backend', 'database', 'architecture'],
    thinking_style: 'Adversarial. Every system has an attacker. Find them before they find you.',
    known_for: 'Thinking like the attacker — the threat model nobody considered.',
    asks_about: ['Who is the attacker?', 'What is the threat model?', 'What is exposed if this is compromised?'],
  },

  // ── DEVOPS / INFRASTRUCTURE ───────────────────────────────────────────────
  {
    id: 'linus-torvalds', name: 'Linus Torvalds', company: 'Linux/Google', role: 'Creator, Linux',
    domains: ['devops', 'architecture', 'backend', 'systems', 'performance'],
    thinking_style: 'Simplicity-maximalist. The right code does one thing well. Abstractions that leak are bugs.',
    known_for: 'Finding over-engineering — the abstraction that creates more complexity than it removes.',
    asks_about: ['Why is this complex?', 'What does this code actually do?', 'What is the simplest version?'],
  },

  // ── FINTECH / PAYMENTS ────────────────────────────────────────────────────
  {
    id: 'patrick-collison', name: 'Patrick Collison', company: 'Stripe', role: 'CEO',
    domains: ['fintech', 'payments', 'product', 'developer', 'api'],
    thinking_style: 'Developer-first. The best payment product is the one developers never think about.',
    known_for: 'Finding friction in payment flows that developers normalize but users abandon at.',
    asks_about: ['What is the drop-off rate at this step?', 'Is this the 7-lines-of-code version?', 'What breaks at midnight?'],
  },

  // ── OPERATIONS / SCALE ────────────────────────────────────────────────────
  {
    id: 'jeff-bezos', name: 'Jeff Bezos', company: 'Amazon', role: 'Founder',
    domains: ['operations', 'scale', 'product', 'strategy', 'growth'],
    thinking_style: 'Customer-obsessed. Works backwards from the customer experience, not the technology.',
    known_for: 'Finding where the company\'s internal metrics diverge from the customer\'s experience.',
    asks_about: ['What is the customer experience in 2 years?', 'What is the flywheel?', 'What does the press release say?'],
  },
  {
    id: 'jensen-huang', name: 'Jensen Huang', company: 'NVIDIA', role: 'CEO',
    domains: ['architecture', 'ai', 'performance', 'systems', 'backend'],
    thinking_style: 'Parallel-first. Serial bottlenecks are the enemy. The future is massively parallel.',
    known_for: 'Finding the serial bottleneck that limits the entire system.',
    asks_about: ['What is serial?', 'What can be parallelized?', 'Where is the throughput ceiling?'],
  },
  {
    id: 'elon-musk', name: 'Elon Musk', company: 'X/Tesla/SpaceX', role: 'CEO',
    domains: ['product', 'operations', 'mobile', 'backend', 'strategy'],
    thinking_style: 'First-principles. Destroys assumptions. Every constraint is a candidate for removal.',
    known_for: 'Removing steps that everyone accepted as necessary.',
    asks_about: ['What steps can be eliminated?', 'What is the physics limit?', 'What assumption is wrong?'],
  },
];

export const DOMAIN_MAP: Record<string, string[]> = {
  'add-feature': ['product', 'ux', 'backend'],
  'fix-bugs': ['backend', 'devops', 'systems'],
  'audit-codebase': ['architecture', 'security', 'backend'],
  'audit-full': ['product', 'ux', 'architecture', 'security'],
  'add-database': ['backend', 'database', 'security'],
  'deploy-vercel': ['devops', 'operations'],
  'add-payments': ['fintech', 'security', 'ux'],
  'optimize-performance': ['performance', 'backend', 'mobile'],
  'add-mobile': ['mobile', 'ux'],
  'add-auth': ['security', 'backend', 'ux'],
  'add-ai': ['ai', 'backend', 'product'],
  'add-gamification': ['gaming', 'engagement', 'ux', 'product'],
  'add-social': ['social', 'growth', 'engagement'],
  'add-analytics': ['growth', 'backend', 'product'],
  'onboarding': ['ux', 'growth', 'onboarding'],
};

export const PROJECT_TYPE_EXPERTS: Record<string, string[]> = {
  'mobile': ['craig-federighi', 'sundar-pichai', 'jony-ive', 'paul-stamatiou'],
  'gaming': ['shigeru-miyamoto', 'will-wright', 'gabe-newell', 'nir-eyal'],
  'saas': ['sam-altman', 'paul-graham', 'marty-cagan', 'patrick-collison'],
  'ai': ['andrej-karpathy', 'sam-altman', 'claude', 'jeff-dean'],
  'fintech': ['patrick-collison', 'jeff-bezos', 'bruce-schneier', 'bill-gates'],
};

export function selectExperts(
  action: string,
  projectTags: string[],
  projectType: string,
  count = 5
): Expert[] {
  const domains = new Set<string>();

  const actionDomains = DOMAIN_MAP[action] || ['product', 'ux', 'backend'];
  actionDomains.forEach(d => domains.add(d));

  const typeExperts = PROJECT_TYPE_EXPERTS[projectType] || [];

  const scored = EXPERT_LIBRARY.map(expert => {
    let score = 0;
    for (const d of domains) {
      if (expert.domains.includes(d)) score += 2;
    }
    if (typeExperts.includes(expert.id)) score += 3;
    for (const tag of projectTags) {
      if (expert.domains.some(d => tag.toLowerCase().includes(d))) score++;
    }
    return { expert, score };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);
  const selected: Expert[] = [];
  const usedDomains = new Set<string>();

  for (const { expert } of sorted) {
    if (selected.length >= count) break;
    const primaryDomain = expert.domains[0];
    if (!usedDomains.has(primaryDomain) || selected.length < 3) {
      selected.push(expert);
      usedDomains.add(primaryDomain);
    }
  }

  return selected.slice(0, count);
}
