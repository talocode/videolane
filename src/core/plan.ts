import { readFileSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import {
  VideoPlan, Scene, createDefaultPlan, generateId,
} from './config.js';
import { parseScriptToPlan, parsePackageToPlan } from './script.js';

export type PlanInput = string;

export function createPlan(input: string, options?: {
  template?: string;
  outDir?: string;
}): VideoPlan {
  if (existsSync(input)) {
    const stat = input;
    const base = basename(input);
    const ext = extname(input);

    if (ext === '.json') {
      try {
        const data = JSON.parse(readFileSync(input, 'utf-8'));
        return data as VideoPlan;
      } catch {
        return parseScriptToPlan(input, options);
      }
    }

    if (ext === '.md' || ext === '.txt') {
      return parseScriptToPlan(input, options);
    }

    if (existsSync(join(input, 'script.txt')) || existsSync(join(input, 'script.md'))) {
      return parsePackageToPlan(input);
    }

    if (existsSync(join(input, 'README.md'))) {
      return parsePackageToPlan(input);
    }
  }

  return parseScriptToPlan(input, options);
}

export function createPlanFromTemplate(
  templateName: string,
  projectName: string
): VideoPlan {
  const plan = createDefaultPlan('local', projectName);
  plan.metadata = { template: templateName };

  const templateScenes: Record<string, Scene[]> = {
    'product-demo': [
      {
        id: generateId(), index: 0, title: 'Hook', durationSeconds: 15,
        narration: 'Show the problem or pain point.',
        onScreenText: 'The problem', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 1, title: 'Show the product', durationSeconds: 30,
        narration: 'Open the product and demonstrate the core feature.',
        onScreenText: '', browserActions: [
          { type: 'goto', url: 'https://example.com', label: 'Open product' },
          { type: 'screenshot', label: 'Capture homepage' },
        ], screenActions: [], captions: [], callouts: [],
      },
      {
        id: generateId(), index: 2, title: 'CTA', durationSeconds: 10,
        narration: 'Tell viewers what to do next.',
        onScreenText: 'Try it free', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
    ],
    'youtube-tutorial': [
      {
        id: generateId(), index: 0, title: 'Hook', durationSeconds: 20,
        narration: 'What the viewer will learn.',
        onScreenText: '', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 1, title: 'Step 1', durationSeconds: 60,
        narration: 'First step of the tutorial.',
        onScreenText: 'Step 1', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 2, title: 'Step 2', durationSeconds: 60,
        narration: 'Second step.',
        onScreenText: 'Step 2', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 3, title: 'CTA', durationSeconds: 15,
        narration: 'Wrap up and call to action.',
        onScreenText: 'Subscribe', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
    ],
    'launch-video': [
      {
        id: generateId(), index: 0, title: 'Announcement', durationSeconds: 10,
        narration: 'Big reveal.',
        onScreenText: 'Introducing...', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 1, title: 'Features', durationSeconds: 45,
        narration: 'Show key features.',
        onScreenText: '', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 2, title: 'CTA', durationSeconds: 10,
        narration: 'Get started.',
        onScreenText: 'Available now', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
    ],
    'shorts-demo': [
      {
        id: generateId(), index: 0, title: 'Hook', durationSeconds: 5,
        narration: 'Attention-grabbing opening.',
        onScreenText: 'Wait for it...', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 1, title: 'Demo', durationSeconds: 20,
        narration: 'Quick demo of the feature.',
        onScreenText: '', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 2, title: 'CTA', durationSeconds: 5,
        narration: 'Link in bio.',
        onScreenText: 'Link in bio', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
    ],
    'tera-tutorial': [
      {
        id: generateId(), index: 0, title: 'Hook', durationSeconds: 15,
        narration: 'Show the problem with traditional studying.',
        onScreenText: 'Studying is broken.', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
      {
        id: generateId(), index: 1, title: 'Understand', durationSeconds: 90,
        narration: 'Use Tera to understand a topic.',
        onScreenText: 'STEP 1: Understand', browserActions: [
          { type: 'goto', url: 'https://teraai.chat', label: 'Open Tera' },
          { type: 'type', text: 'Explain photosynthesis like I am 10.', label: 'Type prompt' },
        ], screenActions: [], captions: [], callouts: ['150 free credits/month'],
      },
      {
        id: generateId(), index: 2, title: 'Test', durationSeconds: 90,
        narration: 'Test yourself with quiz questions.',
        onScreenText: 'STEP 2: Test yourself', browserActions: [
          { type: 'type', text: 'Create 5 quiz questions.', label: 'Type quiz prompt' },
        ], screenActions: [], captions: [], callouts: [],
      },
      {
        id: generateId(), index: 3, title: 'Plan', durationSeconds: 90,
        narration: 'Build a study plan.',
        onScreenText: 'STEP 3: Study plan', browserActions: [
          { type: 'type', text: 'Create a 7-day study plan.', label: 'Type plan prompt' },
        ], screenActions: [], captions: [], callouts: [],
      },
      {
        id: generateId(), index: 4, title: 'CTA', durationSeconds: 15,
        narration: 'Try it free.',
        onScreenText: 'Free at teraai.chat', browserActions: [], screenActions: [],
        captions: [], callouts: [],
      },
    ],
  };

  plan.scenes = templateScenes[templateName] || templateScenes['product-demo'] || [];
  plan.format = templateName.includes('short') ? 'short' : 'demo';
  plan.durationTargetSeconds = plan.scenes.reduce((a, s) => a + s.durationSeconds, 0);

  return plan;
}

export function summarizePlan(plan: VideoPlan): string {
  const lines = [
    `Plan: ${plan.title}`,
    `Format: ${plan.format}`,
    `Aspect: ${plan.aspectRatio}`,
    `Duration target: ${plan.durationTargetSeconds}s`,
    `Scenes: ${plan.scenes.length}`,
    '',
  ];
  for (const s of plan.scenes) {
    lines.push(`  [${s.index}] ${s.title} (${s.durationSeconds}s)`);
    if (s.browserActions.length) lines.push(`       Actions: ${s.browserActions.length}`);
    if (s.onScreenText) lines.push(`       Text: ${s.onScreenText.slice(0, 50)}`);
  }
  return lines.join('\n');
}
