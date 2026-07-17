#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'demo');

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log('Generating demo video frames...');

const framesDir = join(OUT, 'frames');
if (!existsSync(framesDir)) mkdirSync(framesDir, { recursive: true });

const scenes = [
  { text: 'VideoLane', sub: 'Agentic video production engine' },
  { text: 'Script → Plan', sub: 'Parse markdown into scenes' },
  { text: 'Browser Recording', sub: 'Playwright-powered capture' },
  { text: 'Captions', sub: 'SRT, VTT, JSON generation' },
  { text: 'Background Audio', sub: 'Ambient/cinematic generation' },
  { text: 'Shorts', sub: 'Auto-cut vertical clips' },
  { text: 'Thumbnails', sub: 'Brief + SVG mockup' },
  { text: 'YouTube Metadata', sub: 'Title, description, tags' },
  { text: 'YouTube Package', sub: 'Ready for upload' },
  { text: 'VideoLane v0.1.0', sub: 'github.com/talocode/videolane' },
];

const frames = [];

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#0a0a0a"/>
  <text x="960" y="440" text-anchor="middle" fill="#00ff88" font-size="80" font-family="sans-serif" font-weight="bold">
    ${scene.text}
  </text>
  <text x="960" y="540" text-anchor="middle" fill="#ffffff" font-size="40" font-family="sans-serif">
    ${scene.sub}
  </text>
</svg>`;
  const framePath = join(framesDir, `frame-${String(i).padStart(3, '0')}.svg`);
  writeFileSync(framePath, svg);
  frames.push(framePath);
  console.log(`  Frame ${i + 1}: ${scene.text}`);
}

// Generate captions
const captions = scenes.map((s, i) => {
  const start = i * 3;
  const end = (i + 1) * 3;
  return `${i + 1}\n00:00:${String(start).padStart(2, '0')},000 --> 00:00:${String(end).padStart(2, '0')},000\n${s.sub}\n`;
}).join('\n');

writeFileSync(join(OUT, 'captions.srt'), captions);
console.log('Generated captions.srt');

// Try to render with ffmpeg
const concatFile = join(framesDir, 'concat.txt');
writeFileSync(concatFile, frames.map(f => `file '${f}'`).join('\n'));

try {
  execSync(`ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -y "${join(OUT, 'videolane-demo.mp4')}"`, { stdio: 'pipe' });
  console.log('Rendered videolane-demo.mp4');
} catch {
  console.log('ffmpeg not available — SVG frames generated only');
}

// Generate demo output JSON
const demoOutput = {
  version: '0.1.0',
  frames: frames.length,
  captions: scenes.length,
  ffmpegAvailable: false,
  scenes: scenes.map(s => ({ text: s.text, sub: s.sub })),
};
writeFileSync(join(OUT, 'demo-output.json'), JSON.stringify(demoOutput, null, 2));
console.log('Generated demo-output.json');
console.log('Demo generation complete');
