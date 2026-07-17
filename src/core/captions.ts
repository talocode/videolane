import { VideoPlan, CaptionTrack, CaptionEntry, CaptionFormat } from './config.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface CaptionOptions {
  scriptPath?: string;
  plan?: VideoPlan;
  audioPath?: string;
  outPath: string;
  format?: CaptionFormat;
  mode?: 'script' | 'timed' | 'transcribe';
  provider?: string;
}

function estimateTimings(plan: VideoPlan): CaptionEntry[] {
  const entries: CaptionEntry[] = [];
  let currentTime = 0;

  for (const scene of plan.scenes) {
    const sentences = scene.narration
      .replace(/([.!?])\s+/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length === 0 && scene.onScreenText) {
      sentences.push(scene.onScreenText);
    }

    if (sentences.length === 0) {
      currentTime += scene.durationSeconds;
      continue;
    }

    const perSentence = scene.durationSeconds / sentences.length;

    for (const sentence of sentences) {
      const start = currentTime;
      const end = Math.min(currentTime + perSentence, currentTime + scene.durationSeconds);
      entries.push({ start, end, text: sentence });
      currentTime = end;
    }
  }

  return entries;
}

function entriesFromScript(scriptPath: string): CaptionEntry[] {
  const content = readFileSync(scriptPath, 'utf-8');
  const sections = content.split(/\n\n+/);
  const entries: CaptionEntry[] = [];
  let currentTime = 0;

  for (const section of sections) {
    const lines = section.trim().split('\n');
    for (const line of lines) {
      const stripped = line.replace(/^#+\s*/, '').trim();
      if (!stripped) continue;

      const words = stripped.split(/\s+/).length;
      const duration = Math.max(2, Math.ceil((words / 150) * 60));
      entries.push({
        start: currentTime,
        end: currentTime + duration,
        text: stripped,
      });
      currentTime += duration;
    }
  }

  return entries;
}

function formatSRT(entries: CaptionEntry[]): string {
  return entries
    .map((entry, i) => {
      const start = formatSRTTime(entry.start);
      const end = formatSRTTime(entry.end);
      return `${i + 1}\n${start} --> ${end}\n${entry.text}\n`;
    })
    .join('\n');
}

function formatVTT(entries: CaptionEntry[]): string {
  const lines = ['WEBVTT\n'];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const start = formatVTTTime(entry.start);
    const end = formatVTTTime(entry.end);
    lines.push(`${i + 1}`);
    lines.push(`${start} --> ${end}`);
    lines.push(entry.text);
    lines.push('');
  }
  return lines.join('\n');
}

function formatJSON(entries: CaptionEntry[]): string {
  return JSON.stringify({ captions: entries }, null, 2);
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}

function pad(n: number, len: number = 2): string {
  return String(n).padStart(len, '0');
}

export function generateCaptions(options: CaptionOptions): CaptionTrack {
  let entries: CaptionEntry[];

  if (options.mode === 'timed' && options.plan) {
    entries = estimateTimings(options.plan);
  } else if (options.scriptPath && existsSync(options.scriptPath)) {
    entries = entriesFromScript(options.scriptPath);
  } else if (options.plan) {
    entries = estimateTimings(options.plan);
  } else {
    entries = [{ start: 0, end: 3, text: 'VideoLane caption' }];
  }

  const format = options.format || 'srt';
  let content: string;

  switch (format) {
    case 'srt':
      content = formatSRT(entries);
      break;
    case 'vtt':
      content = formatVTT(entries);
      break;
    case 'json':
      content = formatJSON(entries);
      break;
    default:
      content = formatSRT(entries);
  }

  const outDir = join(options.outPath, '..');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(options.outPath, content);

  return {
    format,
    language: 'en',
    entries,
  };
}
