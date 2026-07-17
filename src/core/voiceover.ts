import { VideoPlan } from './config.js';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { FFmpegError } from './errors.js';

export type TTSVoice =
  | 'en-US-GuyNeural'
  | 'en-US-ChristopherNeural'
  | 'en-US-JasonNeural'
  | 'en-GB-RyanNeural'
  | 'en-AU-WilliamNeural'
  | 'en-IN-PrabhatNeural';

export interface VoiceoverSegment {
  start: number;
  text: string;
}

export interface VoiceoverOptions {
  plan?: VideoPlan;
  scriptPath?: string;
  segments?: VoiceoverSegment[];
  outPath: string;
  voice?: TTSVoice;
  rate?: string;
  dryRun?: boolean;
}

export interface VoiceoverResult {
  path: string;
  segments: number;
  durationSeconds: number;
  method: string;
  logs: string[];
}

function findVoiceoverScript(): string {
  const candidates = [
    join(import.meta.dirname || '.', '../../scripts/voiceover.py'),
    join(process.cwd(), 'scripts/voiceover.py'),
    join(process.cwd(), 'node_modules/@talocode/videolane/scripts/voiceover.py'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'voiceover.py not found. Ensure scripts/voiceover.py exists in the VideoLane package.'
  );
}

function checkEdgeTTS(): boolean {
  try {
    execSync('python3 -c "import edge_tts"', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkFfmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function planToVoiceoverScript(plan: VideoPlan): VoiceoverSegment[] {
  const segments: VoiceoverSegment[] = [];
  let currentTime = 0;

  for (const scene of plan.scenes) {
    const narration = scene.narration?.trim();
    if (narration) {
      const clean = narration
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\*\*/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      if (clean) {
        segments.push({ start: currentTime, text: clean });
      }
    }
    currentTime += scene.durationSeconds;
  }

  return segments;
}

export function generateVoiceover(options: VoiceoverOptions): VoiceoverResult {
  const logs: string[] = [];
  const voice = options.voice || 'en-US-GuyNeural';
  const rate = options.rate || '-5%';

  // Build segments from plan or direct input
  let segments: VoiceoverSegment[] = [];
  if (options.segments) {
    segments = options.segments;
  } else if (options.plan) {
    segments = planToVoiceoverScript(options.plan);
  } else if (options.scriptPath && existsSync(options.scriptPath)) {
    // Extract narration from script file (fallback: read as plain text)
    const content = readFileSync(options.scriptPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    let t = 0;
    for (const line of lines) {
      const clean = line.replace(/\*\*/g, '').replace(/`/g, '').trim();
      if (clean.length > 5) {
        segments.push({ start: t, text: clean });
        t += Math.max(3, clean.split(/\s+/).length / 3); // ~3 words/sec
      }
    }
  }

  if (segments.length === 0) {
    logs.push('No narration found in plan — voiceover skipped');
    return {
      path: '',
      segments: 0,
      durationSeconds: 0,
      method: 'skipped',
      logs,
    };
  }

  logs.push(`Voiceover: ${segments.length} segments, voice=${voice}, rate=${rate}`);

  const outDir = join(options.outPath, '..');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  if (options.dryRun) {
    logs.push('DRY RUN — would generate voiceover');
    logs.push(`Output: ${options.outPath}`);
    return {
      path: options.outPath,
      segments: segments.length,
      durationSeconds: segments.length > 0
        ? Math.max(...segments.map(s => s.start)) + 10
        : 0,
      method: 'dry-run',
      logs,
    };
  }

  // Check dependencies
  if (!checkEdgeTTS()) {
    logs.push('edge-tts not installed — attempting fallback');
    return generateVoiceoverFallback(segments, options.outPath, logs);
  }

  if (!checkFfmpeg()) {
    throw new FFmpegError('ffmpeg is required for voiceover mixing. Install ffmpeg and retry.');
  }

  // Write segments to temp JSON
  const scriptJson = join(outDir, '.voiceover-script.json');
  writeFileSync(scriptJson, JSON.stringify(segments, null, 2));

  const scriptPy = findVoiceoverScript();
  const cmd = `python3 "${scriptPy}" "${scriptJson}" "${options.outPath}" "${voice}" "${rate}"`;

  try {
    const output = execSync(cmd, { stdio: 'pipe', timeout: 300_000 }).toString();
    logs.push(output.trim());

    const duration = segments.length > 0
      ? Math.max(...segments.map(s => s.start)) + 10
      : 0;

    return {
      path: options.outPath,
      segments: segments.length,
      durationSeconds: duration,
      method: 'edge-tts',
      logs,
    };
  } catch (err) {
    logs.push(`edge-tts failed: ${err}`);
    logs.push('Falling back to silent audio');
    return generateVoiceoverFallback(segments, options.outPath, logs);
  }
}

function generateVoiceoverFallback(
  segments: VoiceoverSegment[],
  outPath: string,
  logs: string[]
): VoiceoverResult {
  // Generate silent audio as fallback when TTS is unavailable
  const duration = segments.length > 0
    ? Math.max(...segments.map(s => s.start)) + 10
    : 30;

  if (checkFfmpeg()) {
    try {
      execSync(
        `ffmpeg -f lavfi -i "anullsrc=r=24000:cl=mono" -t ${duration} -y "${outPath}"`,
        { stdio: 'pipe' }
      );
      logs.push(`Generated ${duration}s silent audio (TTS unavailable)`);
      return {
        path: outPath,
        segments: segments.length,
        durationSeconds: duration,
        method: 'silent-fallback',
        logs,
      };
    } catch { /* fall through */ }
  }

  logs.push('No ffmpeg — voiceover skipped entirely');
  return {
    path: '',
    segments: segments.length,
    durationSeconds: duration,
    method: 'skipped',
    logs,
  };
}

export function mixVoiceoverWithMusic(
  voiceoverPath: string,
  musicPath: string,
  outputPath: string,
  options?: { voiceVolume?: number; musicVolume?: number }
): void {
  if (!checkFfmpeg()) {
    throw new FFmpegError('ffmpeg required for mixing');
  }

  const vv = options?.voiceVolume ?? 1.0;
  const mv = options?.musicVolume ?? 0.25;

  const cmd = [
    'ffmpeg', '-y',
    '-i', `"${musicPath}"`,
    '-i', `"${voiceoverPath}"`,
    '-filter_complex',
    `[0:a]volume=${mv}[music];[1:a]volume=${vv}[voice];[music][voice]amix=inputs=2:duration=shortest:normalize=0[out]`,
    '-map', '[out]',
    '-ar', '24000', '-c:a', 'aac', '-b:a', '192k',
    `"${outputPath}"`,
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (err) {
    throw new FFmpegError(`Failed to mix voiceover + music: ${err}`);
  }
}

export function mixVoiceoverWithVideo(
  videoPath: string,
  voiceoverPath: string,
  outputPath: string,
  options?: { voiceVolume?: number; videoVolume?: number }
): void {
  if (!checkFfmpeg()) {
    throw new FFmpegError('ffmpeg required for mixing');
  }

  const vv = options?.voiceVolume ?? 1.0;
  const mv = options?.videoVolume ?? 0.2;

  const cmd = [
    'ffmpeg', '-y',
    '-i', `"${videoPath}"`,
    '-i', `"${voiceoverPath}"`,
    '-filter_complex',
    `[0:a]volume=${mv}[ambient];[1:a]volume=${vv}[voice];[ambient][voice]amix=inputs=2:duration=first:normalize=0[mixed]`,
    '-map', '0:v', '-map', '[mixed]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    `"${outputPath}"`,
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (err) {
    throw new FFmpegError(`Failed to mix voiceover with video: ${err}`);
  }
}
