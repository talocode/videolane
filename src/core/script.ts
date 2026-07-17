import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import {
  VideoPlan, Scene, BrowserAction, AspectRatio, VideoFormat,
  createDefaultPlan, generateId,
} from './config.js';
import { PlanParseError } from './errors.js';

interface ParsedSection {
  title: string;
  narration: string;
  onScreenText: string;
  prompts: string[];
  browserActions: BrowserAction[];
  durationEstimate: number;
}

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(5, Math.ceil((words / 150) * 60));
}

function extractPrompts(text: string): string[] {
  const prompts: string[] = [];
  const codeBlocks = text.match(/```\w*\n([\s\S]*?)```/g) || [];
  for (const block of codeBlocks) {
    const inner = block.replace(/```\w*\n?/, '').replace(/```/, '').trim();
    if (inner.length > 10) prompts.push(inner);
  }
  const quoted = text.match(/["']([^"']{15,})["']/g) || [];
  for (const q of quoted) {
    const inner = q.slice(1, -1);
    if (!prompts.includes(inner)) prompts.push(inner);
  }
  return prompts;
}

function extractTimestamps(text: string): { time: string; title: string }[] {
  const timestamps: { time: string; title: string }[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/(\d{1,2}:\d{2})\s*[—–-]\s*(.+)/);
    if (match) timestamps.push({ time: match[1], title: match[2].trim() });
  }
  return timestamps;
}

function extractUTMLinks(text: string): string[] {
  const links: string[] = [];
  const regex = /https?:\/\/[^\s)>\]]+utm_[^\s)>\]]+/g;
  let m;
  while ((m = regex.exec(text)) !== null) links.push(m[0]);
  return links;
}

function detectFormat(text: string, filename: string): VideoFormat {
  const lower = (text + filename).toLowerCase();
  if (lower.includes('short') || lower.includes('9:16') || lower.includes('vertical')) return 'short';
  if (lower.includes('launch') || lower.includes('announcement')) return 'launch';
  if (lower.includes('tutorial') || lower.includes('how to')) return 'tutorial';
  if (lower.includes('demo') || lower.includes('product')) return 'demo';
  return 'longform';
}

function detectAspectRatio(text: string): AspectRatio {
  if (text.includes('9:16') || text.includes('vertical') || text.includes('short')) return '9:16';
  if (text.includes('1:1') || text.includes('square')) return '1:1';
  return '16:9';
}

function splitIntoSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = text.split('\n');
  let current: ParsedSection = {
    title: 'Introduction',
    narration: '',
    onScreenText: '',
    prompts: [],
    browserActions: [],
    durationEstimate: 0,
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    const stepMatch = line.match(/^(?:STEP\s+\d+|Step\s+\d+)[::\s]+(.+)/i);

    if (headingMatch || stepMatch) {
      if (current.narration.trim() || current.onScreenText.trim()) {
        current.durationEstimate = estimateDuration(current.narration || current.onScreenText);
        sections.push(current);
      }
      current = {
        title: (headingMatch?.[1] || stepMatch?.[1] || '').trim(),
        narration: '',
        onScreenText: '',
        prompts: [],
        browserActions: [],
        durationEstimate: 0,
      };
    } else {
      current.narration += line + '\n';
      if (line.includes('Type:') || line.includes('type:') || line.match(/^\[.*\]$/)) {
        current.onScreenText += line + '\n';
      }
    }
  }

  current.prompts = extractPrompts(current.narration);
  current.durationEstimate = estimateDuration(current.narration);
  if (current.narration.trim()) sections.push(current);

  for (const section of sections) {
    section.prompts = extractPrompts(section.narration);
  }

  return sections;
}

export function parseScriptToPlan(
  inputPath: string,
  options?: { template?: string; outDir?: string }
): VideoPlan {
  let content: string;
  let filename = '';

  if (existsSync(inputPath)) {
    content = readFileSync(inputPath, 'utf-8');
    filename = basename(inputPath);
  } else {
    throw new PlanParseError(`Input not found: ${inputPath}`);
  }

  const titleMatch = content.match(/^#\s+(.+)/m);
  const title = titleMatch?.[1] || filename.replace(/\.\w+$/, '').replace(/[-_]/g, ' ');

  const plan = createDefaultPlan('local', title);
  plan.format = detectFormat(content, filename);
  plan.aspectRatio = detectAspectRatio(content);

  const audienceMatch = content.match(/audience[:\s]+(.+)/i);
  plan.audience = audienceMatch?.[1]?.trim() || 'general';

  const durationMatch = content.match(/(\d+)\s*(?:minutes?|mins?)/i);
  if (durationMatch) plan.durationTargetSeconds = parseInt(durationMatch[1]) * 60;

  const sections = splitIntoSections(content);

  let cumulativeTime = 0;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const scene: Scene = {
      id: generateId(),
      index: i,
      title: s.title,
      durationSeconds: s.durationEstimate,
      narration: s.narration.trim(),
      onScreenText: s.onScreenText.trim(),
      browserActions: s.browserActions,
      screenActions: [],
      captions: [],
      callouts: [],
      notes: undefined,
    };

    for (const prompt of s.prompts) {
      scene.browserActions.push({
        type: 'type',
        text: prompt,
        label: `Type prompt: ${prompt.slice(0, 40)}...`,
      });
    }

    cumulativeTime += scene.durationSeconds;
    plan.scenes.push(scene);
  }

  const utmLinks = extractUTMLinks(content);
  plan.metadata = { utmLinks, filename, sourceLength: content.length };

  return plan;
}

export function parsePackageToPlan(packageDir: string): VideoPlan {
  const files: Record<string, string> = {};
  const possibleFiles = [
    'script.txt', 'script.md', 'prompts.txt', 'description.txt',
    'tags.txt', 'pinned-comment.txt', 'thumbnail-brief.md',
    'shorts-plan.md', 'voiceover-script.md', 'captions.md',
    'recording-plan.md', 'recording-checklist.md',
  ];

  for (const f of possibleFiles) {
    const path = join(packageDir, f);
    if (existsSync(path)) files[f] = readFileSync(path, 'utf-8');
  }

  const scriptContent = files['script.txt'] || files['script.md'] || files['voiceover-script.md'] || '';
  const plan = parseScriptToPlan(join(packageDir, 'script.txt'), { outDir: packageDir });

  plan.assets = {
    scriptPath: files['script.txt'] ? join(packageDir, 'script.txt') : undefined,
    promptsPath: files['prompts.txt'] ? join(packageDir, 'prompts.txt') : undefined,
    descriptionPath: files['description.txt'] ? join(packageDir, 'description.txt') : undefined,
    tagsPath: files['tags.txt'] ? join(packageDir, 'tags.txt') : undefined,
    pinnedCommentPath: files['pinned-comment.txt'] ? join(packageDir, 'pinned-comment.txt') : undefined,
    thumbnailBriefPath: files['thumbnail-brief.md'] ? join(packageDir, 'thumbnail-brief.md') : undefined,
    shortsPlanPath: files['shorts-plan.md'] ? join(packageDir, 'shorts-plan.md') : undefined,
  };

  const utmLinks = extractUTMLinks(Object.values(files).join('\n'));
  plan.metadata = { ...plan.metadata, utmLinks, packageDir, hasPackage: true };

  return plan;
}
