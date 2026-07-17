import { VideoPlan, RenderJob, generateId } from './config.js';
import { checkFFmpeg, renderVideoFFmpeg, generateDemoFrames } from './recorder.js';
import { generateAudio } from './audio.js';
import { generateVoiceover, mixVoiceoverWithVideo, type TTSVoice } from './voiceover.js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RenderError, FFmpegError } from './errors.js';

export interface RenderOptions {
  recordingPath?: string;
  plan?: VideoPlan;
  captionsPath?: string;
  audioPath?: string;
  outputPath: string;
  format?: string;
  aspect?: string;
  resolution?: string;
  burnCaptions?: boolean;
  backgroundMusic?: boolean;
  voiceover?: boolean;
  voiceoverVoice?: TTSVoice;
  voiceoverRate?: string;
  dryRun?: boolean;
}

export interface RenderResult {
  job: RenderJob;
  outputPath: string;
  dryRun: boolean;
  command?: string;
  voiceoverPath?: string;
  logs: string[];
}

export function render(options: RenderOptions): RenderResult {
  const logs: string[] = [];
  const outDir = join(options.outputPath, '..');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  if (!checkFFmpeg()) {
    if (options.dryRun) {
      logs.push('DRY RUN: ffmpeg not found, would generate demo frames');
      logs.push(`Output: ${options.outputPath}`);

      const framesDir = join(outDir, 'frames');
      const frames = generateDemoFrames(framesDir);
      logs.push(`Generated ${frames.length} demo frames`);

      return {
        job: {
          id: generateId(),
          projectId: 'demo',
          recordingPath: options.recordingPath || '',
          outputPath: options.outputPath,
          captionsPath: options.captionsPath,
          audioPath: options.audioPath,
          status: 'complete',
          logs,
          createdAt: new Date().toISOString(),
        },
        outputPath: options.outputPath,
        dryRun: true,
        logs,
      };
    }
    throw new FFmpegError('ffmpeg is required for rendering. Install ffmpeg and retry.');
  }

  // Auto-generate voiceover from plan narration if enabled
  let voiceoverPath = options.audioPath;
  const voiceoverEnabled = options.voiceover !== false && options.plan;

  if (voiceoverEnabled && options.plan) {
    logs.push('Generating voiceover from plan narration...');
    const voResult = generateVoiceover({
      plan: options.plan,
      outPath: join(outDir, 'voiceover.wav'),
      voice: options.voiceoverVoice,
      rate: options.voiceoverRate,
      dryRun: options.dryRun,
    });

    if (voResult.method !== 'skipped' && voResult.path) {
      voiceoverPath = voResult.path;
      logs.push(`Voiceover: ${voResult.segments} segments, ${voResult.method}`);
      for (const l of voResult.logs) logs.push(`  ${l}`);
    } else {
      logs.push('Voiceover skipped — generating background audio only');
      for (const l of voResult.logs) logs.push(`  ${l}`);
    }
  }

  // Generate background music if no audio provided
  if (!voiceoverPath && (options.backgroundMusic !== false)) {
    const duration = options.plan?.durationTargetSeconds || 60;
    const musicPath = join(outDir, 'music.wav');
    const audioResult = generateAudio({
      durationSeconds: duration,
      style: (options.plan?.metadata?.audioStyle as any) || 'cinematic',
      outPath: musicPath,
    });
    voiceoverPath = audioResult.path;
    logs.push(`Background audio: ${audioResult.method}`);
  }

  if (!options.recordingPath && options.plan) {
    const framesDir = join(outDir, 'frames');
    const frames = generateDemoFrames(framesDir, options.plan.scenes.length * 3);
    logs.push(`Generated ${frames.length} demo frames from plan`);

    const concatFile = join(framesDir, 'concat.txt');
    writeFileSync(
      concatFile,
      frames.map(f => `file '${f}'`).join('\n')
    );

    try {
      // Render frames to temp video
      const tempVideo = join(outDir, '.temp-video.mp4');
      const cmd = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -y "${tempVideo}"`;
      if (options.dryRun) {
        logs.push(`DRY RUN: ${cmd}`);
        if (voiceoverPath) logs.push(`DRY RUN: would mix voiceover from ${voiceoverPath}`);
        return {
          job: {
            id: generateId(),
            projectId: 'demo',
            recordingPath: '',
            outputPath: options.outputPath,
            status: 'complete',
            logs,
            createdAt: new Date().toISOString(),
          },
          outputPath: options.outputPath,
          dryRun: true,
          command: cmd,
          voiceoverPath,
          logs,
        };
      }

      renderVideoFFmpeg({ recordingPath: concatFile, outputPath: tempVideo, dryRun: false });

      // Mix voiceover with rendered video
      if (voiceoverPath && existsSync(voiceoverPath)) {
        logs.push('Mixing voiceover with video...');
        mixVoiceoverWithVideo(tempVideo, voiceoverPath, options.outputPath, {
          voiceVolume: 1.0,
          videoVolume: 0.2,
        });
        logs.push(`Final video: ${options.outputPath} (voiceover + ambient)`);
      } else {
        // No voiceover — rename temp to final
        const { renameSync } = require('node:fs');
        renameSync(tempVideo, options.outputPath);
        logs.push(`Final video: ${options.outputPath} (no voiceover)`);
      }
    } catch (err) {
      throw new RenderError(`Failed to render: ${err}`);
    }

    return {
      job: {
        id: generateId(),
        projectId: 'demo',
        recordingPath: '',
        outputPath: options.outputPath,
        captionsPath: options.captionsPath,
        audioPath: voiceoverPath,
        status: 'complete',
        logs,
        createdAt: new Date().toISOString(),
      },
      outputPath: options.outputPath,
      dryRun: false,
      voiceoverPath,
      logs,
    };
  }

  const result = renderVideoFFmpeg({
    recordingPath: options.recordingPath,
    captionsPath: options.captionsPath,
    audioPath: voiceoverPath,
    outputPath: options.outputPath,
    format: options.format,
    aspect: options.aspect,
    resolution: options.resolution,
    burnCaptions: options.burnCaptions,
    dryRun: options.dryRun,
  });

  logs.push(...result.logs);

  // If voiceover was generated, mix it post-render
  if (voiceoverPath && existsSync(voiceoverPath) && !options.dryRun) {
    const tempOut = options.outputPath + '.tmp.mp4';
    const { renameSync } = require('node:fs');
    renameSync(options.outputPath, tempOut);
    try {
      mixVoiceoverWithVideo(tempOut, voiceoverPath, options.outputPath);
      logs.push('Mixed voiceover with rendered video');
      const { unlinkSync } = require('node:fs');
      unlinkSync(tempOut);
    } catch {
      // Keep original render if mixing fails
      renameSync(tempOut, options.outputPath);
      logs.push('Voiceover mix failed — keeping original render');
    }
  }

  return {
    job: {
      id: generateId(),
      projectId: 'local',
      recordingPath: options.recordingPath || '',
      outputPath: options.outputPath,
      captionsPath: options.captionsPath,
      audioPath: voiceoverPath,
      status: 'complete',
      logs,
      createdAt: new Date().toISOString(),
    },
    outputPath: options.outputPath,
    dryRun: result.dryRun,
    command: result.command,
    voiceoverPath,
    logs,
  };
}
