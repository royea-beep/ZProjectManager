import { classifyMessage, analyzeConversation } from './context-classifier';

export interface ConversationAnalysis {
  royeRequests: string[];
  botOutputs: string[];
  turnsToBotOutput: number;
  approvalRate: number;
  languageDistribution: { hebrew: number; english: number };
  qualitySignals: string[];
}

export interface ParsedClaudeOutput {
  decisions: string[];
  filesChanged: string[];
  bugsFixed: string[];
  nextSteps: string[];
}

export function parseClaudeOutput(rawText: string): ParsedClaudeOutput {
  const lines = rawText.split('\n');
  const decisions: string[] = [];
  const filesChanged: string[] = [];
  const bugsFixed: string[] = [];
  const nextSteps: string[] = [];
  let currentSection = '';

  for (const line of lines) {
    const l = line.trim();

    // Section detection
    if (l.match(/what.*(was built|shipped|changed)/i)) currentSection = 'built';
    else if (l.match(/decision/i)) currentSection = 'decisions';
    else if (l.match(/fix(ed)?|bug/i)) currentSection = 'bugs';
    else if (l.match(/next.*(session|step|action)|continue at/i)) currentSection = 'next';
    else if (l.match(/^##\s/)) currentSection = ''; // Unknown section resets

    // Bullet / numbered list items
    if (l.startsWith('-') || l.startsWith('•') || l.match(/^\d+\./)) {
      const content = l.replace(/^[-•\d.]+\s*/, '').trim();
      if (!content || content.length < 3) continue;
      if (currentSection === 'built') filesChanged.push(content);
      else if (currentSection === 'decisions') decisions.push(content);
      else if (currentSection === 'bugs') bugsFixed.push(content);
      else if (currentSection === 'next') nextSteps.push(content);
    }

    // Also catch backtick file paths as "files changed"
    const backtickMatch = l.match(/`([^`]+\.[a-z]{2,4})`/g);
    if (backtickMatch && currentSection === 'built') {
      for (const m of backtickMatch) {
        const name = m.replace(/`/g, '').trim();
        if (!filesChanged.includes(name)) filesChanged.push(name);
      }
    }
  }

  return { decisions, filesChanged, bugsFixed, nextSteps };
}

export function parseConversationWithClassification(rawText: string): {
  parsed: ParsedClaudeOutput;
  analysis: ConversationAnalysis;
} {
  const turns = rawText.split(/\n(?=Human:|Assistant:|Roye:|Bot:)/i);

  if (turns.length > 2) {
    const messages = turns.map(t => {
      const isUser = /^(Human:|Roye:)/i.test(t);
      return {
        role: isUser ? 'user' as const : 'assistant' as const,
        content: t.replace(/^(Human:|Assistant:|Roye:|Bot:)/i, '').trim(),
      };
    });

    const analysis = analyzeConversation(messages);
    const parsed = parseClaudeOutput(rawText);

    const qualitySignals: string[] = [];
    if (analysis.approvalRate > 70) qualitySignals.push('High approval rate — clear bot outputs');
    if (analysis.approvalRate < 30 && analysis.approvalRate > 0) qualitySignals.push('Low approval rate — outputs needed revision');
    if (analysis.turnsToBotOutput > 0 && analysis.turnsToBotOutput < 3) qualitySignals.push('Fast cycle — efficient collaboration');
    if (analysis.turnsToBotOutput > 8) qualitySignals.push('Slow cycle — many iterations needed');

    return { parsed, analysis: { ...analysis, qualitySignals } };
  }

  const parsed = parseClaudeOutput(rawText);
  const classified = classifyMessage(rawText);
  return {
    parsed,
    analysis: {
      royeRequests: classified.royeBlocks,
      botOutputs: classified.botOutputBlocks,
      turnsToBotOutput: 0,
      approvalRate: 0,
      languageDistribution: { hebrew: 0, english: 100 },
      qualitySignals: [],
    },
  };
}

export function exportToSessionLog(
  projectName: string,
  phase: string,
  analysis: ConversationAnalysis,
  qualityScore?: number
): object {
  const q = qualityScore || Math.min(10, Math.round(analysis.approvalRate / 10));
  return {
    project: projectName,
    phase,
    quality: q,
    turn_count: analysis.turnsToBotOutput * 2,
    error_count: analysis.approvalRate < 50 ? 3 : 0,
    roye_request_style: analysis.royeRequests[0]?.slice(0, 100),
    approval_rate: analysis.approvalRate,
    language: analysis.languageDistribution,
    timestamp: new Date().toISOString(),
  };
}
