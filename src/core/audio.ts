import { AudioStyle } from './config.js';
import { checkFFmpeg } from './recorder.js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { FFmpegError } from './errors.js';

export interface AudioOptions {
  durationSeconds: number;
  style?: AudioStyle;
  outPath: string;
  format?: string;
  volume?: number;
}

const STYLE_PARAMS: Record<AudioStyle, { freq: string; filter: string }> = {
  ambient: { freq: '220', filter: 'sine=f=220:duration=30,aecho=0.8:0.88:60:0.4' },
  cinematic: { freq: '110', filter: 'sine=f=110:duration=30,lowpass=f=300' },
  minimal: { freq: '440', filter: 'sine=f=440:duration=30,volume=0.1' },
  study: { freq: '262', filter: 'sine=f=262:duration=30,aecho=0.6:0.3:40:0.5' },
  tech: { freq: '330', filter: 'sine=f=330:duration=30,highpass=f=200' },
};

function generateSilentWav(durationSeconds: number, outPath: string): void {
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSeconds;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 220;
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.1 * Math.exp(-t * 0.05);
    const value = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    buffer.writeInt16LE(value, 44 + i * 2);
  }

  writeFileSync(outPath, buffer);
}

export function generateAudio(options: AudioOptions): { path: string; method: string } {
  const outDir = join(options.outPath, '..');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  if (checkFFmpeg()) {
    const style = options.style || 'ambient';
    const params = STYLE_PARAMS[style] || STYLE_PARAMS.ambient;
    const duration = options.durationSeconds;
    const vol = options.volume ?? 0.15;

    const cmd = [
      'ffmpeg',
      '-f lavfi',
      `-i "sine=frequency=220:duration=${duration}"`,
      '-af',
      `"volume=${vol},aecho=0.8:0.88:60:0.4,afade=t=in:st=0:d=2,afade=t=out:st=' + ${duration - 2} + ':d=2"`,
      '-y',
      `"${options.outPath}"`,
    ].join(' ');

    try {
      execSync(cmd, { stdio: 'pipe' });
      return { path: options.outPath, method: 'ffmpeg' };
    } catch {
      // Fall through to silent wav generation
    }
  }

  generateSilentWav(options.durationSeconds, options.outPath);
  return { path: options.outPath, method: 'generated-silent' };
}
