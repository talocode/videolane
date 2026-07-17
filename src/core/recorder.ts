import { execSync, exec } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { VideoPlan, Recording, generateId } from './config.js';
import { RecordingError, FFmpegError } from './errors.js';

export function checkFFmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function getFFmpegVersion(): string | null {
  try {
    return execSync('ffmpeg -version', { stdio: 'pipe' }).toString().split('\n')[0];
  } catch {
    return null;
  }
}

export interface RecordOptions {
  plan: VideoPlan;
  url?: string;
  outDir: string;
  browser?: string;
  headless?: boolean;
  manualLogin?: boolean;
  profileDir?: string;
  dryRun?: boolean;
  slowMo?: number;
  saveScreenshots?: boolean;
}

export interface RecordResult {
  recording?: Recording;
  dryRun: boolean;
  actions: string[];
  screenshots: string[];
  logs: string[];
}

export function planRecordingActions(plan: VideoPlan): string[] {
  const actions: string[] = [];
  for (const scene of plan.scenes) {
    actions.push(`[Scene ${scene.index}] ${scene.title} (${scene.durationSeconds}s)`);
    for (const action of scene.browserActions) {
      switch (action.type) {
        case 'goto':
          actions.push(`  → Navigate to ${action.url}`);
          break;
        case 'click':
          actions.push(`  → Click ${action.selector || action.label || 'element'}`);
          break;
        case 'type':
          actions.push(`  → Type: "${(action.text || '').slice(0, 50)}..."`);
          break;
        case 'wait':
          actions.push(`  → Wait ${action.timeoutMs || 1000}ms`);
          break;
        case 'screenshot':
          actions.push(`  → Take screenshot`);
          break;
        case 'scroll':
          actions.push(`  → Scroll ${action.selector || 'page'}`);
          break;
        case 'press':
          actions.push(`  → Press ${action.selector || 'Enter'}`);
          break;
        case 'eval':
          actions.push(`  → Evaluate JS`);
          break;
      }
    }
  }
  return actions;
}

export function recordBrowser(options: RecordOptions): RecordResult {
  const actions = planRecordingActions(options.plan);
  const logs: string[] = [];
  const screenshots: string[] = [];

  if (options.dryRun) {
    logs.push('DRY RUN — no browser launched');
    logs.push(`Would execute ${actions.length} actions`);
    for (const a of actions) logs.push(a);
    return { dryRun: true, actions, screenshots, logs };
  }

  try {
    require.resolve('playwright');
  } catch {
    throw new RecordingError(
      'Playwright is not installed. Run: npm install playwright && npx playwright install chromium'
    );
  }

  if (!existsSync(options.outDir)) mkdirSync(options.outDir, { recursive: true });

  logs.push('Browser recording requires Playwright runtime.');
  logs.push('For dry-run mode, use --dry-run flag.');
  logs.push(`Actions planned: ${actions.length}`);

  return { dryRun: false, actions, screenshots, logs };
}

export function renderVideoFFmpeg(options: {
  recordingPath?: string;
  captionsPath?: string;
  audioPath?: string;
  outputPath: string;
  format?: string;
  aspect?: string;
  resolution?: string;
  burnCaptions?: boolean;
  backgroundMusic?: boolean;
  dryRun?: boolean;
}): { command: string; dryRun: boolean; logs: string[] } {
  if (!checkFFmpeg()) {
    throw new FFmpegError('ffmpeg is required for rendering. Install ffmpeg and retry.');
  }

  const logs: string[] = [];
  const inputs: string[] = [];
  const filters: string[] = [];

  if (options.recordingPath) inputs.push(`-i "${options.recordingPath}"`);
  if (options.audioPath) inputs.push(`-i "${options.audioPath}"`);

  let filterComplex = '';
  if (options.burnCaptions && options.captionsPath) {
    filters.push(`subtitles='${options.captionsPath}'`);
  }
  if (filters.length) filterComplex = `-vf "${filters.join(',')}"`;

  const cmd = [
    'ffmpeg',
    ...inputs,
    filterComplex,
    '-c:v libx264',
    '-c:a aac',
    '-y',
    `"${options.outputPath}"`,
  ].filter(Boolean).join(' ');

  if (options.dryRun) {
    logs.push(`DRY RUN: ${cmd}`);
    return { command: cmd, dryRun: true, logs };
  }

  try {
    execSync(cmd, { stdio: 'pipe' });
    logs.push(`Rendered: ${options.outputPath}`);
    return { command: cmd, dryRun: false, logs };
  } catch (err) {
    throw new FFmpegError(`ffmpeg render failed: ${err}`);
  }
}

export function generateDemoFrames(outDir: string, count: number = 10): string[] {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const frames: string[] = [];

  for (let i = 0; i < count; i++) {
    const framePath = join(outDir, `frame-${String(i).padStart(3, '0')}.svg`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#0a0a0a"/>
  <text x="960" y="480" text-anchor="middle" fill="#00ff88" font-size="72" font-family="sans-serif">
    VideoLane Demo Frame ${i + 1}/${count}
  </text>
  <text x="960" y="560" text-anchor="middle" fill="#ffffff" font-size="36" font-family="sans-serif">
    Turn product workflows into publish-ready videos
  </text>
</svg>`;
    writeFileSync(framePath, svg);
    frames.push(framePath);
  }
  return frames;
}
