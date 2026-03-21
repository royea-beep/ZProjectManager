import * as fs from 'fs';
import * as path from 'path';

export function generateIpcReference(ipcPath: string, preloadPath: string, outputPath: string): void {
  const ipcContent = fs.existsSync(ipcPath) ? fs.readFileSync(ipcPath, 'utf8') : '';

  // Extract all handle registrations
  const handleRegex = /ipcMain\.handle\(['"`]([^'"`]+)['"`]/g;
  const channels: string[] = [];
  let match;
  while ((match = handleRegex.exec(ipcContent)) !== null) {
    channels.push(match[1]);
  }

  // Group by prefix
  const groups: Record<string, string[]> = {};
  for (const ch of channels) {
    const prefix = ch.split(':')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(ch);
  }

  const lines = [
    `# ZProjectManager IPC Reference`,
    `**Auto-generated:** ${new Date().toISOString().slice(0, 16)} IST`,
    `**Total handlers:** ${channels.length}`,
    ``,
    `> All channels are exposed via \`window.api.invoke('channel:name')\``,
    ``,
  ];

  for (const [prefix, chs] of Object.entries(groups).sort()) {
    lines.push(`## ${prefix}`);
    chs.sort().forEach(ch => lines.push(`- \`${ch}\``));
    lines.push(``);
  }

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`[IPC Reference] Generated: ${channels.length} handlers → ${outputPath}`);
}
