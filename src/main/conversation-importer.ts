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
