export type MessageSource = 'roye' | 'bot_output' | 'mixed' | 'unknown';

export interface ClassifiedMessage {
  source: MessageSource;
  confidence: number;
  botOutputBlocks: string[];
  royeBlocks: string[];
  indicators: string[];
}

const BOT_OUTPUT_PATTERNS = [
  /\|\s*#\s*\|\s*Agent\s*\|/i,
  /\|\s*#\s*\|\s*Task\s*\|/i,
  /\|\s*Status\s*\|\s*Notes\s*\|/i,
  /Sprint \d+ (done|complete|shipped)/i,
  /TypeScript:\s*clean/i,
  /Build:\s*clean/i,
  /Pushed:\s*[a-f0-9]{7}/i,
  /MEGA FINAL REPORT/i,
  /FINAL REPORT/i,
  /```bash/,
  /```typescript/,
  /✅\s*(Done|Pushed|Shipped|Complete)/i,
  /⎿\s+/,
  /● (Bash|Read|Write|Update|Search)\(/,
  /Commit(ted)?:\s*`?[a-f0-9]{7}`?/i,
  /✻ (Cooked|Brewed|Crunched|Worked) for \d+/,
];

const ROYE_PATTERNS = [
  /[\u0590-\u05FF]{3,}/,
  /^[א-ת\w\s,!?]{5,60}$/m,
  /^(כן|לא|אוקי|מעולה|נכון|תמשיך|שלח|תעשה|בסדר)$/m,
];

export function classifyMessage(text: string): ClassifiedMessage {
  const lines = text.split('\n');
  const indicators: string[] = [];
  const botOutputBlocks: string[] = [];
  const royeBlocks: string[] = [];

  let botScore = 0;
  let royeScore = 0;

  for (const pattern of BOT_OUTPUT_PATTERNS) {
    if (pattern.test(text)) {
      botScore += 2;
      indicators.push(`bot: ${pattern.toString().slice(1, 30)}`);
    }
  }

  for (const pattern of ROYE_PATTERNS) {
    if (pattern.test(text)) {
      royeScore += 1;
      indicators.push(`roye: ${pattern.toString().slice(1, 30)}`);
    }
  }

  let currentBlock = '';
  let currentType: 'text' | 'code' | 'table' = 'text';

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (currentBlock.trim()) {
        if (currentType === 'code') {
          botOutputBlocks.push(currentBlock.trim());
        } else {
          const isHebrew = /[\u0590-\u05FF]/.test(currentBlock);
          if (isHebrew || currentBlock.length < 100) royeBlocks.push(currentBlock.trim());
          else botOutputBlocks.push(currentBlock.trim());
        }
      }
      currentType = currentType === 'code' ? 'text' : 'code';
      currentBlock = '';
    } else if (line.startsWith('|')) {
      botOutputBlocks.push(line);
      currentType = 'table';
    } else {
      currentBlock += line + '\n';
    }
  }

  if (currentBlock.trim()) {
    const isHebrew = /[\u0590-\u05FF]/.test(currentBlock);
    if (isHebrew) royeBlocks.push(currentBlock.trim());
    else if (botScore > 2) botOutputBlocks.push(currentBlock.trim());
    else royeBlocks.push(currentBlock.trim());
  }

  let source: MessageSource = 'unknown';
  let confidence = 0.5;

  if (botScore > 5 && royeScore < 2) {
    source = 'bot_output';
    confidence = Math.min(0.95, botScore / 10);
  } else if (royeScore > 2 && botScore < 2) {
    source = 'roye';
    confidence = Math.min(0.9, royeScore / 5);
  } else if (botScore > 2 && royeScore > 1) {
    source = 'mixed';
    confidence = 0.7;
  } else if (royeScore > 0) {
    source = 'roye';
    confidence = 0.6;
  }

  return { source, confidence, botOutputBlocks, royeBlocks, indicators };
}

export function analyzeConversation(messages: Array<{
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}>): {
  royeRequests: string[];
  botOutputs: string[];
  turnsToBotOutput: number;
  approvalRate: number;
  languageDistribution: { hebrew: number; english: number };
} {
  const royeRequests: string[] = [];
  const botOutputs: string[] = [];
  let hebrewChars = 0;
  let totalChars = 0;
  let approvals = 0;
  let botOutputCount = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const classified = classifyMessage(msg.content);

    if (msg.role === 'user') {
      if (classified.source === 'bot_output') {
        botOutputs.push(...classified.botOutputBlocks);
        botOutputCount++;
        const nextMsg = messages[i + 2];
        if (nextMsg && nextMsg.content.length < 50) {
          approvals++;
        }
      } else {
        royeRequests.push(...classified.royeBlocks);
      }
    }

    const hebrew = (msg.content.match(/[\u0590-\u05FF]/g) || []).length;
    hebrewChars += hebrew;
    totalChars += msg.content.length;
  }

  return {
    royeRequests: royeRequests.filter(r => r.length > 5).slice(0, 20),
    botOutputs: botOutputs.filter(b => b.length > 10).slice(0, 20),
    turnsToBotOutput: botOutputCount > 0 ? Math.round(messages.length / botOutputCount) : 0,
    approvalRate: botOutputCount > 0 ? Math.round((approvals / botOutputCount) * 100) : 0,
    languageDistribution: {
      hebrew: totalChars > 0 ? Math.round((hebrewChars / totalChars) * 100) : 0,
      english: totalChars > 0 ? Math.round(((totalChars - hebrewChars) / totalChars) * 100) : 100,
    },
  };
}
