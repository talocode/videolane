import { VideoPlan, RenderJob, generateId } from './config.js';
import { checkFFmpeg, renderVideoFFmpeg, generateDemoFrames } from './recorder.js';
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
  dryRun?: boolean;
}

export interface RenderResult {
  job: RenderJob;
  outputPath: string;
  dryRun: boolean;
  command?: string;
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
      const cmd = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -y "${options.outputPath}"`;
      if (options.dryRun) {
        logs.push(`DRY RUN: ${cmd}`);
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
          logs,
        };
      }
      const result = renderVideoFFmpeg({
        recordingPath: concatFile,
        outputPath: options.outputPath,
        dryRun: false,
      });
      logs.push(...result.logs);
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
        audioPath: options.audioPath,
        status: 'complete',
        logs,
        createdAt: new Date().toISOString(),
      },
      outputPath: options.outputPath,
      dryRun: false,
      logs,
    };
  }

  const result = renderVideoFFmpeg({
    recordingPath: options.recordingPath,
    captionsPath: options.captionsPath,
    audioPath: options.audioPath,
    outputPath: options.outputPath,
    format: options.format,
    aspect: options.aspect,
    resolution: options.resolution,
    burnCaptions: options.burnCaptions,
    dryRun: options.dryRun,
  });

  logs.push(...result.logs);

  return {
    job: {
      id: generateId(),
      projectId: 'local',
      recordingPath: options.recordingPath || '',
      outputPath: options.outputPath,
      captionsPath: options.captionsPath,
      audioPath: options.audioPath,
      status: 'complete',
      logs,
      createdAt: new Date().toISOString(),
    },
    outputPath: options.outputPath,
    dryRun: result.dryRun,
    command: result.command,
    logs,
  };
}
