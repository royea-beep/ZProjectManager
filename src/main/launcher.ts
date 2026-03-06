import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { shell } from 'electron';

export function launchTerminalCommand(command: string, workingDir: string, shellType: string = 'powershell'): void {
  if (!fs.existsSync(workingDir)) {
    throw new Error(`Working directory does not exist: ${workingDir}`);
  }
  console.log(`[launcher] Terminal command: shell=${shellType}, cwd=${workingDir}, command=${command}`);
  if (shellType === 'powershell') {
    spawn('powershell.exe', ['-NoExit', '-Command', command], {
      cwd: workingDir,
      detached: true,
      stdio: 'ignore',
    }).unref();
  } else if (shellType === 'bash') {
    spawn('bash', ['-c', command], {
      cwd: workingDir,
      detached: true,
      stdio: 'ignore',
    }).unref();
  } else {
    spawn('cmd.exe', ['/k', command], {
      cwd: workingDir,
      detached: true,
      stdio: 'ignore',
    }).unref();
  }
}

export function openVSCode(projectPath: string): void {
  console.log(`[launcher] Opening VS Code: path=${projectPath}`);
  spawn('code', [projectPath], {
    detached: true,
    stdio: 'ignore',
    shell: true,
  }).unref();
}

export function openBrowser(url: string): void {
  console.log(`[launcher] Opening browser: url=${url}`);
  shell.openExternal(url);
}

export function launchProjectCommand(command: string, commandType: string, shellType: string, workingDir: string): void {
  if (workingDir && !path.isAbsolute(workingDir)) {
    throw new Error(`Working directory must be an absolute path: ${workingDir}`);
  }
  console.log(`[launcher] launchProjectCommand: type=${commandType}, shell=${shellType}, cwd=${workingDir}, command=${command}`);
  switch (commandType) {
    case 'vscode':
      openVSCode(command.replace(/^code\s+/, ''));
      break;
    case 'browser':
      openBrowser(command.replace(/^start\s+/, ''));
      break;
    case 'terminal':
    case 'script':
    default:
      launchTerminalCommand(command, workingDir, shellType);
      break;
  }
}
