import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, createPlanFromTemplate, summarizePlan } from '../core/plan.js';
import { parseScriptToPlan } from '../core/script.js';
import { generateStoryboard, storyboardToMarkdown } from '../core/storyboard.js';
import { generateCaptions } from '../core/captions.js';
import { generateMetadata } from '../core/metadata.js';
import { generateThumbnailBrief } from '../core/thumbnail.js';
import { generateShortsPlan } from '../core/shorts.js';
import { generateAudio } from '../core/audio.js';
import { generateVoiceover, planToVoiceoverScript } from '../core/voiceover.js';
import { checkFFmpeg } from '../core/recorder.js';
import { generateId, createDefaultProject, createDefaultPlan } from '../core/config.js';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TEST_DIR = '/tmp/videolane-test';

function setup() {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
}

describe('Core types', () => {
  it('generateId returns string', () => {
    const id = generateId();
    assert.equal(typeof id, 'string');
    assert.equal(id.length, 12);
  });

  it('createDefaultProject has required fields', () => {
    const project = createDefaultProject('test', '/tmp/test');
    assert.equal(project.name, 'test');
    assert.equal(project.status, 'created');
    assert.ok(project.id);
    assert.ok(project.createdAt);
  });

  it('createDefaultPlan has required fields', () => {
    const plan = createDefaultPlan('proj1', 'Test Plan');
    assert.equal(plan.title, 'Test Plan');
    assert.equal(plan.projectId, 'proj1');
    assert.ok(plan.id);
  });
});

describe('Script parser', () => {
  it('parses a markdown script', () => {
    setup();
    const scriptPath = join(TEST_DIR, 'script.md');
    writeFileSync(scriptPath, `# My Video

## Introduction
This is the intro.

## Step 1: Do something
Do the first thing.

## Step 2: Do something else
Do the second thing.

## CTA
Try it now.
`);
    const plan = parseScriptToPlan(scriptPath);
    assert.ok(plan.scenes.length >= 3);
    assert.ok(plan.title);
    teardown();
  });
});

describe('Plan', () => {
  it('creates plan from template', () => {
    const plan = createPlanFromTemplate('product-demo', 'Test');
    assert.ok(plan.scenes.length > 0);
    assert.equal(plan.format, 'demo');
  });

  it('creates plan from tera-tutorial template', () => {
    const plan = createPlanFromTemplate('tera-tutorial', 'Tera Video');
    assert.ok(plan.scenes.length >= 4);
  });

  it('summarizes plan', () => {
    const plan = createPlanFromTemplate('product-demo', 'Test');
    const summary = summarizePlan(plan);
    assert.ok(summary.includes('Test'));
    assert.ok(summary.includes('demo'));
  });
});

describe('Storyboard', () => {
  it('generates storyboard from plan', () => {
    const plan = createPlanFromTemplate('product-demo', 'Test');
    const storyboard = generateStoryboard(plan);
    assert.equal(storyboard.title, 'Test');
    assert.ok(storyboard.sections.length > 0);
  });

  it('converts to markdown', () => {
    const plan = createPlanFromTemplate('product-demo', 'Test');
    const storyboard = generateStoryboard(plan);
    const md = storyboardToMarkdown(storyboard);
    assert.ok(md.includes('Test'));
    assert.ok(md.includes('Scene'));
  });
});

describe('Captions', () => {
  it('generates SRT captions', () => {
    setup();
    const plan = createPlanFromTemplate('product-demo', 'Test');
    const outPath = join(TEST_DIR, 'captions.srt');
    const result = generateCaptions({ plan, outPath, format: 'srt', mode: 'timed' });
    assert.ok(result.entries.length > 0);
    assert.equal(result.format, 'srt');
    teardown();
  });

  it('generates VTT captions', () => {
    setup();
    const plan = createPlanFromTemplate('product-demo', 'Test');
    const outPath = join(TEST_DIR, 'captions.vtt');
    const result = generateCaptions({ plan, outPath, format: 'vtt', mode: 'timed' });
    assert.equal(result.format, 'vtt');
    teardown();
  });
});

describe('Metadata', () => {
  it('generates YouTube metadata', () => {
    setup();
    const plan = createPlanFromTemplate('product-demo', 'Test');
    const outDir = join(TEST_DIR, 'metadata');
    const result = generateMetadata({ plan, title: 'Test Video', ctaUrl: 'https://example.com', outDir });
    assert.ok(result.title);
    assert.ok(result.tags.length > 0);
    assert.ok(result.description);
    assert.ok(result.pinnedComment);
    teardown();
  });
});

describe('Thumbnail', () => {
  it('generates thumbnail brief', () => {
    setup();
    const outPath = join(TEST_DIR, 'thumbnail.json');
    const result = generateThumbnailBrief({ title: 'Test', style: 'dark', outPath });
    assert.ok(result.title);
    assert.ok(result.textOptions.length > 0);
    assert.ok(result.colors);
    teardown();
  });
});

describe('Shorts', () => {
  it('generates shorts plan', () => {
    setup();
    const plan = createPlanFromTemplate('product-demo', 'Test');
    const outDir = join(TEST_DIR, 'shorts');
    const result = generateShortsPlan({ plan, outDir, maxDuration: 30 });
    assert.ok(result.clips.length > 0);
    teardown();
  });
});

describe('Audio', () => {
  it('generates audio', () => {
    setup();
    const outPath = join(TEST_DIR, 'audio.wav');
    const result = generateAudio({ durationSeconds: 5, style: 'ambient', outPath });
    assert.ok(result.path);
    assert.ok(result.method);
    teardown();
  });
});

describe('FFmpeg', () => {
  it('checks ffmpeg availability', () => {
    const available = checkFFmpeg();
    assert.equal(typeof available, 'boolean');
  });
});

describe('Voiceover', () => {
  it('extracts narration from plan', () => {
    const plan = createPlanFromTemplate('tera-tutorial', 'Test');
    const segments = planToVoiceoverScript(plan);
    assert.ok(segments.length > 0);
    assert.ok(typeof segments[0].start === 'number');
    assert.ok(segments[0].text.length > 0);
  });

  it('generates voiceover from plan', () => {
    setup();
    const plan = createPlanFromTemplate('product-demo', 'Test');
    const outPath = join(TEST_DIR, 'voiceover.wav');
    const result = generateVoiceover({ plan, outPath, dryRun: true });
    assert.ok(result.segments > 0);
    assert.equal(result.method, 'dry-run');
    teardown();
  });

  it('generates voiceover with custom segments', () => {
    setup();
    const outPath = join(TEST_DIR, 'voiceover-custom.wav');
    const result = generateVoiceover({
      segments: [
        { start: 0, text: 'Hello world' },
        { start: 3, text: 'This is a test' },
      ],
      outPath,
      dryRun: true,
    });
    assert.equal(result.segments, 2);
    assert.equal(result.method, 'dry-run');
    teardown();
  });
});
