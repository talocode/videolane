import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkFFmpeg } from './recorder.js';

export interface MarketingScene {
  id: string;
  title: string;
  text: string;
  subtitle?: string;
  durationSeconds: number;
  transition: 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'none';
  background: 'dark' | 'gradient' | 'brand' | 'custom';
  customColor?: string;
  fontSize?: number;
  animation?: 'typewriter' | 'fade-up' | 'scale-in' | 'none';
}

export interface MarketingVideoOptions {
  scenes: MarketingScene[];
  outputPath: string;
  width?: number;
  height?: number;
  fps?: number;
  brandColor?: string;
  bgColor?: string;
  fontFamily?: string;
  musicPath?: string;
  musicVolume?: number;
  dryRun?: boolean;
}

export interface MarketingVideoResult {
  outputPath: string;
  duration: number;
  sceneCount: number;
  command: string;
  logs: string[];
}

const BRAND_COLORS = {
  dark: '#171718',
  surface: '#232326',
  border: '#37373c',
  accent: '#00d4aa',
  gold: '#ffd166',
  text: '#e8e8e8',
  dim: '#9ca3af',
};

function generateSceneFilter(
  scene: MarketingScene,
  width: number,
  height: number,
  startTime: number,
 品牌Color: string,
  fontFamily: string,
): string[] {
  const filters: string[] = [];
  const fontSize = scene.fontSize || 72;
  const bgColor = scene.background === 'brand' ? brandColor :
    scene.background === 'custom' ? (scene.customColor || BRAND_COLORS.dark) :
    scene.background === 'gradient' ? BRAND_COLORS.dark :
    BRAND_COLORS.dark;

  // Background
  if (scene.background === 'gradient') {
    filters.push(
      `color=c=${bgColor}:s=${width}x${height}:d=${scene.durationSeconds}[bg]`,
      `color=c=${brandColor}:s=${width}x${height}:d=${scene.durationSeconds}[accent]`,
      `[accent]crop=${width/2}:${height}:${width/2}:0[accent-half]`,
      `[bg][accent-half]overlay=0:0[base]`
    );
  } else {
    filters.push(
      `color=c=${bgColor}:s=${width}x${height}:d=${scene.durationSeconds}[base]`
    );
  }

  // Main text with animation
  const text = scene.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
  const animation = scene.animation || 'fade-up';

  if (animation === 'typewriter') {
    // Typewriter effect using drawtext with enable
    filters.push(
      `[base]drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${BRAND_COLORS.text}:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=${fontFamily}:enable='between(t,${startTime},${startTime + scene.durationSeconds})'[text]`
    );
  } else if (animation === 'fade-up') {
    // Fade in from bottom
    const fadeDuration = 0.5;
    filters.push(
      `[base]drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${BRAND_COLORS.text}@'if(lt(t-${startTime},${fadeDuration}),((t-${startTime})/${fadeDuration}),1)':x=(w-text_w)/2:y=(h-text_h)/2+${50 * (1 - Math.min(1, (0) / fadeDuration))}:fontfile=${fontFamily}[text]`
    );
  } else if (animation === 'scale-in') {
    filters.push(
      `[base]drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${BRAND_COLORS.text}:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=${fontFamily}[text]`
    );
  } else {
    filters.push(
      `[base]drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${BRAND_COLORS.text}:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=${fontFamily}[text]`
    );
  }

  // Subtitle
  if (scene.subtitle) {
    const subtitle = scene.subtitle.replace(/'/g, "\\'").replace(/:/g, "\\:");
    filters.push(
      `[text]drawtext=text='${subtitle}':fontsize=${Math.round(fontSize * 0.4)}:fontcolor=${BRAND_COLORS.dim}:x=(w-text_w)/2:y=(h/2)+${fontSize}:fontfile=${fontFamily}[final]`
    );
  } else {
    filters.push(`[text]copy[final]`);
  }

  return filters;
}

function generateTransitionFilter(
  transition: MarketingScene['transition'],
  duration: number,
): string {
  const fadeDuration = Math.min(0.5, duration * 0.1);

  switch (transition) {
    case 'fade':
      return `fade=t=in:st=0:d=${fadeDuration},fade=t=out:st=${duration - fadeDuration}:d=${fadeDuration}`;
    case 'slide-left':
      return `fade=t=in:st=0:d=${fadeDuration}`;
    case 'slide-right':
      return `fade=t=in:st=0:d=${fadeDuration}`;
    case 'zoom-in':
      return `fade=t=in:st=0:d=${fadeDuration},fade=t=out:st=${duration - fadeDuration}:d=${fadeDuration}`;
    case 'zoom-out':
      return `fade=t=in:st=0:d=${fadeDuration}`;
    case 'none':
    default:
      return '';
  }
}

export function generateMarketingVideo(options: MarketingVideoOptions): MarketingVideoResult {
  const logs: string[] = [];
  const width = options.width || 1920;
  const height = options.height || 1080;
  const fps = options.fps || 30;
  const brandColor = options.brandColor || BRAND_COLORS.accent;
  const fontFamily = options.fontFamily || '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

  if (!checkFFmpeg()) {
    throw new Error('ffmpeg is required for marketing video generation');
  }

  const outDir = options.outputPath.replace(/\/[^\/]+$/, '');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const segments: string[] = [];
  const filterParts: string[] = [];
  let currentTime = 0;
  const allLogs: string[] = [];

  // Generate each scene
  for (let i = 0; i < options.scenes.length; i++) {
    const scene = options.scenes[i];
    const segmentFile = join(outDir, `seg_${String(i + 1).padStart(2, '0')}.mp4`);

    // Build filter for this scene
    const sceneFilters = generateSceneFilter(scene, width, height, 0, brandColor, fontFamily);
    const transitionFilter = generateTransitionFilter(scene.transition, scene.durationSeconds);

    // Create complex filtergraph
    const filtergraph = sceneFilters.join(';');

    // Generate scene video with ffmpeg
    const cmd = `ffmpeg -f lavfi -i "color=c=${BRAND_COLORS.dark}:s=${width}x${height}:d=${scene.durationSeconds}:r=${fps}" -vf "${filtergraph}" -c:v libx264 -pix_fmt yuv420p -t ${scene.durationSeconds} -y "${segmentFile}"`;

    allLogs.push(`Scene ${i + 1}: ${scene.title} (${scene.durationSeconds}s)`);
    allLogs.push(`  Command: ${cmd}`);

    segments.push(segmentFile);
    currentTime += scene.durationSeconds;
  }

  // Concatenate all segments
  const concatFile = join(outDir, 'concat.txt');
  writeFileSync(concatFile, segments.map(s => `file '${s}'`).join('\n'));

  const concatCmd = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -y "${options.outputPath}.tmp.mp4"`;
  allLogs.push(`Concatenating ${segments.length} segments`);

  // Add music if provided
  let finalCmd: string;
  if (options.musicPath && existsSync(options.musicPath)) {
    const musicVol = options.musicVolume || 0.3;
    finalCmd = `${concatCmd} && ffmpeg -i "${options.outputPath}.tmp.mp4" -i "${options.musicPath}" -filter_complex "[1:a]volume=${musicVol}[music];[0:a][music]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -y "${options.outputPath}"`;
    allLogs.push(`Mixing background music (volume: ${musicVol})`);
  } else {
    finalCmd = `${concatCmd} && mv "${options.outputPath}.tmp.mp4" "${options.outputPath}"`;
  }

  if (options.dryRun) {
    allLogs.push('DRY RUN — commands generated but not executed');
    return {
      outputPath: options.outputPath,
      duration: currentTime,
      sceneCount: options.scenes.length,
      command: finalCmd,
      logs: allLogs,
    };
  }

  // Execute commands
  const { execSync } = require('child_process');
  try {
    for (let i = 0; i < options.scenes.length; i++) {
      const scene = options.scenes[i];
      const segmentFile = segments[i];
      const sceneFilters = generateSceneFilter(scene, width, height, 0, brandColor, fontFamily);
      const filtergraph = sceneFilters.join(';');
      const cmd = `ffmpeg -f lavfi -i "color=c=${BRAND_COLORS.dark}:s=${width}x${height}:d=${scene.durationSeconds}:r=${fps}" -vf "${filtergraph}" -c:v libx264 -pix_fmt yuv420p -t ${scene.durationSeconds} -y "${segmentFile}"`;
      execSync(cmd, { stdio: 'pipe' });
    }

    execSync(concatCmd, { stdio: 'pipe' });

    if (options.musicPath && existsSync(options.musicPath)) {
      execSync(finalCmd, { stdio: 'pipe' });
      // Clean up temp
      const { unlinkSync } = require('node:fs');
      try { unlinkSync(`${options.outputPath}.tmp.mp4`); } catch {}
    } else {
      const { renameSync } = require('node:fs');
      renameSync(`${options.outputPath}.tmp.mp4`, options.outputPath);
    }

    allLogs.push(`Marketing video created: ${options.outputPath}`);
  } catch (err) {
    throw new Error(`Failed to generate marketing video: ${err}`);
  }

  return {
    outputPath: options.outputPath,
    duration: currentTime,
    sceneCount: options.scenes.length,
    command: finalCmd,
    logs: allLogs,
  };
}

export function createProductDemoScenes(productName: string, tagline: string, features: string[]): MarketingScene[] {
  const scenes: MarketingScene[] = [
    {
      id: randomUUID(),
      title: 'Hook',
      text: productName,
      subtitle: tagline,
      durationSeconds: 3,
      transition: 'fade',
      background: 'brand',
      animation: 'scale-in',
      fontSize: 96,
    },
    {
      id: randomUUID(),
      title: 'Problem',
      text: 'Tired of slow, broken tools?',
      subtitle: 'There is a better way.',
      durationSeconds: 3,
      transition: 'fade',
      background: 'dark',
      animation: 'fade-up',
    },
  ];

  features.forEach((feature, i) => {
    scenes.push({
      id: randomUUID(),
      title: `Feature ${i + 1}`,
      text: feature,
      durationSeconds: 2.5,
      transition: i % 2 === 0 ? 'slide-left' : 'slide-right',
      background: 'gradient',
      animation: 'typewriter',
    });
  });

  scenes.push({
    id: randomUUID(),
    title: 'CTA',
    text: 'Try it free',
    subtitle: 'github.com/talocode',
    durationSeconds: 3,
    transition: 'zoom-in',
    background: 'brand',
    animation: 'scale-in',
    fontSize: 84,
  });

  return scenes;
}

export function createLaunchVideoScenes(productName: string, tagline: string, features: string[]): MarketingScene[] {
  const scenes: MarketingScene[] = [
    {
      id: randomUUID(),
      title: 'Teaser',
      text: 'Something big is coming',
      durationSeconds: 2,
      transition: 'fade',
      background: 'dark',
      animation: 'fade-up',
      fontSize: 64,
    },
    {
      id: randomUUID(),
      title: 'Reveal',
      text: productName,
      subtitle: tagline,
      durationSeconds: 3,
      transition: 'zoom-in',
      background: 'brand',
      animation: 'scale-in',
      fontSize: 96,
    },
  ];

  features.forEach((feature, i) => {
    scenes.push({
      id: randomUUID(),
      title: `Feature ${i + 1}`,
      text: feature,
      durationSeconds: 2,
      transition: 'slide-left',
      background: 'gradient',
      animation: 'typewriter',
    });
  });

  scenes.push({
    id: randomUUID(),
    title: 'CTA',
    text: 'Ship faster',
    subtitle: 'npm install ' + productName.toLowerCase().replace(/\s+/g, '-'),
    durationSeconds: 3,
    transition: 'fade',
    background: 'brand',
    animation: 'scale-in',
    fontSize: 72,
  });

  return scenes;
}
