import { selectExperts } from './expert-library';
import type { Expert } from './expert-library';

export interface ExpertOpinion {
  expertId: string;
  expertName: string;
  company: string;
  score: number;
  criticalIssue?: string;
  topRecommendation: string;
  wouldRemove?: string;
  quote: string;
  confidence: number;
}

export interface ExpertPanelResult {
  task: string;
  project: string;
  experts: Expert[];
  opinions: ExpertOpinion[];
  topRecommendations: Array<{
    title: string;
    score: number;
    experts: string[];
    type: 'add' | 'remove' | 'improve' | 'risk';
    quote: string;
  }>;
  consensusScore: number;
  criticalRisks: string[];
  removals: string[];
  panelSummary: string;
  generatedAt: string;
}

export async function runExpertPanel(args: {
  action: string;
  taskDescription: string;
  projectName: string;
  projectType: string;
  projectTags: string[];
  techStack: string;
  currentState: string;
  anthropicKey: string;
  expertCount?: number;
}): Promise<ExpertPanelResult> {
  const experts = selectExperts(args.action, args.projectTags, args.projectType, args.expertCount ?? 5);

  // Run all experts in parallel
  const results = await Promise.allSettled(
    experts.map(expert => simulateExpert(expert, args))
  );

  const opinions: ExpertOpinion[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      opinions.push(r.value);
    } else {
      console.error(`Expert ${experts[i].name} simulation failed:`, r.reason);
    }
  }

  const allRecs = opinions.flatMap(o => [
    { title: o.topRecommendation, score: o.score, expertName: o.expertName, type: 'add' as const, quote: o.quote },
    ...(o.wouldRemove ? [{ title: o.wouldRemove, score: o.score * 0.8, expertName: o.expertName, type: 'remove' as const, quote: `${o.expertName}: Remove ${o.wouldRemove}` }] : []),
  ]);

  const topRecommendations = mergeRecommendations(allRecs).slice(0, 10);

  const consensusScore = opinions.length > 0
    ? Math.round((opinions.reduce((sum, o) => sum + o.score, 0) / opinions.length) * 10) / 10
    : 7;

  const criticalRisks = opinions
    .filter(o => o.criticalIssue)
    .map(o => `${o.expertName}: ${o.criticalIssue}`);

  const removals = opinions
    .filter(o => o.wouldRemove)
    .map(o => `${o.expertName} would remove: ${o.wouldRemove}`);

  const panelSummary = generatePanelSummary(args.taskDescription, opinions, topRecommendations);

  return {
    task: args.taskDescription,
    project: args.projectName,
    experts,
    opinions,
    topRecommendations,
    consensusScore,
    criticalRisks,
    removals,
    panelSummary,
    generatedAt: new Date().toISOString(),
  };
}

async function simulateExpert(expert: Expert, args: {
  action: string;
  taskDescription: string;
  projectName: string;
  projectType: string;
  techStack: string;
  currentState: string;
  anthropicKey: string;
}): Promise<ExpertOpinion> {
  const systemPrompt = `You are ${expert.name}, ${expert.role} at ${expert.company}.

Your thinking style: ${expert.thinking_style}
You are known for: ${expert.known_for}
The questions you always ask: ${expert.asks_about.join(' | ')}

You are reviewing a software development task. Be direct, opinionated, and specific.
Respond ONLY with a valid JSON object — no other text.`;

  const userPrompt = `Review this task for the ${args.projectName} project:

TASK: ${args.taskDescription}
ACTION TYPE: ${args.action}
PROJECT TYPE: ${args.projectType}
TECH STACK: ${args.techStack}
CURRENT STATE: ${args.currentState}

Respond with JSON:
{
  "score": <1-10>,
  "critical_issue": "<the single most important thing that could go wrong — null if none>",
  "top_recommendation": "<your most important recommendation in 1 sentence>",
  "would_remove": "<something you'd cut from the plan — null if nothing>",
  "quote": "<your signature insight in 1-2 sentences, in your own voice>"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': args.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json() as { content?: Array<{ text: string }> };
  const text = data.content?.[0]?.text || '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  const parsed = JSON.parse(jsonMatch[0]) as {
    score?: number;
    critical_issue?: string | null;
    top_recommendation?: string;
    would_remove?: string | null;
    quote?: string;
  };

  return {
    expertId: expert.id,
    expertName: expert.name,
    company: expert.company,
    score: Math.max(1, Math.min(10, parsed.score || 7)),
    criticalIssue: parsed.critical_issue || undefined,
    topRecommendation: parsed.top_recommendation || '',
    wouldRemove: parsed.would_remove || undefined,
    quote: parsed.quote || '',
    confidence: 0.85,
  };
}

function mergeRecommendations(recs: Array<{ title: string; score: number; expertName: string; type: 'add' | 'remove' | 'improve' | 'risk'; quote: string }>): ExpertPanelResult['topRecommendations'] {
  const grouped = new Map<string, { title: string; score: number; experts: string[]; type: 'add' | 'remove' | 'improve' | 'risk'; quote: string }>();

  for (const rec of recs) {
    if (!rec.title) continue;
    const key = rec.title.toLowerCase().slice(0, 30);
    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.score = Math.max(existing.score, rec.score);
      existing.experts.push(rec.expertName);
    } else {
      grouped.set(key, { title: rec.title, score: rec.score, experts: [rec.expertName], type: rec.type, quote: rec.quote });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.score - a.score);
}

function generatePanelSummary(task: string, opinions: ExpertOpinion[], topRecs: ExpertPanelResult['topRecommendations']): string {
  const avgScore = opinions.length > 0
    ? opinions.reduce((s, o) => s + o.score, 0) / opinions.length
    : 7;
  const criticisms = opinions.filter(o => o.criticalIssue).length;
  const removals = opinions.filter(o => o.wouldRemove).length;
  return `${opinions.length} experts reviewed "${task.slice(0, 60)}". Avg score: ${avgScore.toFixed(1)}/10. ${criticisms} critical issues flagged. ${removals} things recommended for removal. Top recommendation: ${topRecs[0]?.title || 'none'}.`;
}

export function formatPanelForPrompt(panel: ExpertPanelResult): string {
  const lines = [
    `## EXPERT PANEL SIMULATION`,
    `**Task reviewed by ${panel.experts.length} domain experts · Avg score: ${panel.consensusScore}/10**`,
    ``,
    `### Top ${Math.min(panel.topRecommendations.length, 7)} recommendations:`,
  ];

  for (let i = 0; i < Math.min(panel.topRecommendations.length, 7); i++) {
    const rec = panel.topRecommendations[i];
    const typeEmoji = rec.type === 'remove' ? '🗑️' : rec.type === 'risk' ? '⚠️' : '✅';
    lines.push(`${i + 1}. ${typeEmoji} [${rec.score.toFixed(1)}/10] ${rec.title}`);
    lines.push(`   — ${rec.experts.join(', ')}: "${rec.quote.slice(0, 100)}"`);
  }

  if (panel.criticalRisks.length > 0) {
    lines.push(``, `### Critical risks flagged:`);
    panel.criticalRisks.forEach(r => lines.push(`- ${r}`));
  }

  if (panel.removals.length > 0) {
    lines.push(``, `### Things to consider removing:`);
    panel.removals.forEach(r => lines.push(`- ${r}`));
  }

  lines.push(``, `### Panel summary:`, panel.panelSummary);
  lines.push(``, `**USE THE ABOVE TO GUIDE IMPLEMENTATION. Build what scored ≥8. Question what scored <6.**`);

  return lines.join('\n');
}
