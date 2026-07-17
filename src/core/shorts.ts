import { VideoPlan, ShortsPlan, ShortsClip, generateId } from './config.js';
import { checkFFmpeg } from './recorder.js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

export interface ShortsOptions {
  plan?: VideoPlan;
  videoPath?: string;
  outDir: string;
  aspect?: string;
  maxDuration?: number;
  fromPlan?: boolean;
}

function planClipsFromScenes(plan: VideoPlan, maxDuration: number): ShortsClip[] {
  const clips: ShortsClip[] = [];

  for (const scene of plan.scenes) {
    if (scene.durationSeconds <= maxDuration && scene.narration.trim()) {
      clips.push({
        title: scene.title,
        startTime: plan.scenes
          .filter(s => s.index < scene.index)
          .reduce((a, s) => a + s.durationSeconds, 0),
        endTime: plan.scenes
          .filter(s => s.index <= scene.index)
          .reduce((a, s) => a + s.durationSeconds, 0),
        hook: scene.onScreenText || scene.title,
        caption: scene.narration.slice(0, 100),
        cta: 'Link in description',
        outputName: `short-${scene.index}-${scene.title.toLowerCase().replace(/\s+/g, '-')}`,
      });
    }
  }

  if (clips.length === 0 && plan.scenes.length > 0) {
    const first = plan.scenes[0];
    clips.push({
      title: first.title,
      startTime: 0,
      endTime: Math.min(first.durationSeconds, maxDuration),
      hook: first.onScreenText || first.title,
      caption: first.narration.slice(0, 100),
      cta: 'Link in description',
      outputName: 'short-1-hook',
    });
  }

  return clips;
}

export function generateShortsPlan(options: ShortsOptions): ShortsPlan {
  const maxDuration = options.maxDuration || 60;
  const clips = options.plan
    ? planClipsFromScenes(options.plan, maxDuration)
    : [];

  if (!existsSync(options.outDir)) mkdirSync(options.outDir, { recursive: true });

  const plan: ShortsPlan = { clips };
  writeFileSync(
    join(options.outDir, 'shorts-plan.json'),
    JSON.stringify(plan, null, 2)
  );

  const md = [
    '# Shorts Plan',
    '',
    `Clips: ${clips.length}`,
    `Max duration: ${maxDuration}s`,
    '',
    ...clips.map((c, i) => [
      `## Clip ${i + 1}: ${c.title}`,
      `- Start: ${c.startTime}s`,
      `- End: ${c.endTime}s`,
      `- Hook: ${c.hook}`,
      `- Caption: ${c.caption}`,
      `- CTA: ${c.cta}`,
      `- Output: ${c.outputName}.mp4`,
      '',
    ].join('\n')),
  ].join('\n');

  writeFileSync(join(options.outDir, 'shorts-plan.md'), md);

  return plan;
}

export function exportShorts(options: ShortsOptions): { exported: string[]; logs: string[] } {
  const plan = generateShortsPlan(options);
  const logs: string[] = [];
  const exported: string[] = [];

  if (!options.videoPath || !existsSync(options.videoPath)) {
    logs.push('No video file provided — generated shorts plan only');
    return { exported, logs };
  }

  if (!checkFFmpeg()) {
    logs.push('ffmpeg not found — cannot cut shorts');
    logs.push('Generated shorts-plan.json only');
    return { exported, logs };
  }

  for (const clip of plan.clips) {
    const outPath = join(options.outDir, `${clip.outputName}.mp4`);
    const cmd = [
      'ffmpeg',
      `-ss ${clip.startTime}`,
      `-i "${options.videoPath}"`,
      `-t ${clip.endTime - clip.startTime}`,
      '-c:v libx264',
      '-c:a aac',
      '-y',
      `"${outPath}"`,
    ].join(' ');

    try {
      execSync(cmd, { stdio: 'pipe' });
      exported.push(outPath);
      logs.push(`Exported: ${clip.outputName}.mp4`);
    } catch (err) {
      logs.push(`Failed to export ${clip.outputName}: ${err}`);
    }
  }

  return { exported, logs };
}
