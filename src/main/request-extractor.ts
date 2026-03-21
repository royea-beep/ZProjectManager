export interface ExtractedRequest {
  id: number;
  text: string;
  priority: 'high' | 'medium' | 'low';
  project?: string;
  actionType?: string;
  confidence: number;
  isConfirmed: boolean;
  isCompleted: boolean;
}

const ACTION_VERBS = [
  'תעשה', 'תוסיף', 'תתקן', 'תבנה', 'תיצור', 'תשנה', 'תסיר', 'תעדכן',
  'תבדוק', 'תשלח', 'תפתח', 'תסגור', 'תחבר', 'תנתק', 'תכתוב', 'תקרא',
  'אני רוצה', 'צריך', 'חסר', 'צריכים', 'נצטרך',
  'add', 'fix', 'build', 'create', 'update', 'remove', 'connect',
  'deploy', 'generate', 'implement', 'integrate', 'wire', 'make',
  'need', 'want', 'should', 'must',
];

const PROJECT_KEYWORDS: Record<string, string[]> = {
  '9soccer': ['9soccer', '9Soccer', 'soccer', 'football', 'כדורגל'],
  'caps': ['caps', 'Caps', 'poker', 'פוקר'],
  'wingman': ['wingman', 'Wingman', 'דייטינג', 'dating'],
  'postpilot': ['postpilot', 'PostPilot', 'instagram', 'תזמון'],
  'keydrop': ['keydrop', 'KeyDrop', 'keys', 'מפתחות'],
  'venuekit': ['venuekit', 'VenueKit', 'venue', 'אולם'],
  'analyzer': ['analyzer', 'Analyzer'],
  'explainit': ['explainit', 'ExplainIt'],
  'zprojectmanager': ['zprojectmanager', 'ZProjectManager', 'zpm'],
};

function detectPriority(text: string): 'high' | 'medium' | 'low' {
  const t = text.toLowerCase();
  if (t.includes('דחוף') || t.includes('urgent') || t.includes('critical') || t.includes('crash') || t.includes('broken')) return 'high';
  if (t.includes('אחר כך') || t.includes('later') || t.includes('eventually') || t.includes('nice to have')) return 'low';
  return 'medium';
}

function detectProject(text: string): string | undefined {
  for (const [project, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
      return project;
    }
  }
  return undefined;
}

function detectActionType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('fix') || t.includes('תתקן') || t.includes('bug') || t.includes('error')) return 'fix-bugs';
  if (t.includes('deploy') || t.includes('תפרוס') || t.includes('vercel')) return 'deploy-vercel';
  if (t.includes('audit') || t.includes('אודיט') || t.includes('בדוק')) return 'audit-codebase';
  if (t.includes('database') || t.includes('supabase') || t.includes('migration')) return 'add-database';
  return 'add-feature';
}

export function extractRequests(text: string): ExtractedRequest[] {
  const requests: ExtractedRequest[] = [];
  let id = 1;

  // Strategy 1: Numbered/bulleted lists (including 📋 prefix)
  const listPattern = /(?:^|\n)\s*(?:\d+[.)]\s*|[-•*]\s*|📋\s*)(.+?)(?=\n\s*(?:\d+[.)]\s*|[-•*]\s*|📋\s*)|$)/gs;
  const listMatches = [...text.matchAll(listPattern)];

  if (listMatches.length > 1) {
    for (const match of listMatches) {
      const clean = match[1]?.trim();
      if (!clean || clean.length < 5) continue;
      requests.push({
        id: id++,
        text: clean,
        priority: detectPriority(clean),
        project: detectProject(clean),
        actionType: detectActionType(clean),
        confidence: 0.9,
        isConfirmed: false,
        isCompleted: false,
      });
    }
  }

  // Strategy 2: Sentences with action verbs
  if (requests.length < 2) {
    const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 10);
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasActionVerb = ACTION_VERBS.some(v => lowerSentence.includes(v.toLowerCase()));
      if (hasActionVerb && !requests.some(r => r.text === sentence)) {
        requests.push({
          id: id++,
          text: sentence,
          priority: detectPriority(sentence),
          project: detectProject(sentence),
          actionType: detectActionType(sentence),
          confidence: 0.6,
          isConfirmed: false,
          isCompleted: false,
        });
      }
    }
  }

  // Strategy 3: Paragraphs fallback
  if (requests.length === 0) {
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20);
    for (const para of paragraphs) {
      requests.push({
        id: id++,
        text: para.slice(0, 200),
        priority: 'medium',
        project: detectProject(para),
        actionType: detectActionType(para),
        confidence: 0.4,
        isConfirmed: false,
        isCompleted: false,
      });
    }
  }

  return requests.filter(r => r.confidence > 0.3);
}

export function generateConfirmationMessage(requests: ExtractedRequest[]): string {
  const lines = [`הבנתי **${requests.length} דברים לעשות:**\n`];
  for (const req of requests) {
    const priority = req.priority === 'high' ? '🔴' : req.priority === 'low' ? '🟡' : '🔵';
    const project = req.project ? ` (${req.project})` : '';
    lines.push(`${req.id}. ${priority} ${req.text}${project}`);
  }
  lines.push(`\nמתחיל עם פריט 1. אם חסר משהו — תגיד לפני שאשלח לבוט.`);
  return lines.join('\n');
}
