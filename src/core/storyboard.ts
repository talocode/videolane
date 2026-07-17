import { VideoPlan, Scene } from './config.js';

export interface Storyboard {
  title: string;
  totalDurationSeconds: number;
  sections: StoryboardSection[];
}

export interface StoryboardSection {
  index: number;
  title: string;
  durationSeconds: number;
  narration: string;
  onScreenText: string;
  visualDescription: string;
  audioNotes: string;
  transitionIn: string;
  transitionOut: string;
}

function describeVisual(scene: Scene): string {
  const parts: string[] = [];
  if (scene.browserActions.length) {
    parts.push(`Browser: ${scene.browserActions.map(a => a.label || a.type).join(', ')}`);
  }
  if (scene.onScreenText) {
    parts.push(`Text overlay: "${scene.onScreenText.slice(0, 60)}"`);
  }
  if (scene.callouts.length) {
    parts.push(`Callouts: ${scene.callouts.join(', ')}`);
  }
  return parts.join(' | ') || 'Static screen or transition';
}

export function generateStoryboard(plan: VideoPlan): Storyboard {
  return {
    title: plan.title,
    totalDurationSeconds: plan.durationTargetSeconds,
    sections: plan.scenes.map(scene => ({
      index: scene.index,
      title: scene.title,
      durationSeconds: scene.durationSeconds,
      narration: scene.narration,
      onScreenText: scene.onScreenText,
      visualDescription: describeVisual(scene),
      audioNotes: scene.audioCue || 'Background ambient',
      transitionIn: scene.index === 0 ? 'Fade in' : 'Cut',
      transitionOut: scene.index === plan.scenes.length - 1 ? 'Fade out' : 'Cut',
    })),
  };
}

export function storyboardToMarkdown(storyboard: Storyboard): string {
  const lines = [
    `# ${storyboard.title}`,
    '',
    `Total duration: ${storyboard.totalDurationSeconds}s`,
    '',
    '---',
    '',
  ];

  for (const section of storyboard.sections) {
    lines.push(`## Scene ${section.index}: ${section.title}`);
    lines.push('');
    lines.push(`**Duration:** ${section.durationSeconds}s`);
    lines.push(`**Transition in:** ${section.transitionIn}`);
    lines.push(`**Transition out:** ${section.transitionOut}`);
    lines.push('');
    if (section.narration) {
      lines.push('**Narration:**');
      lines.push(section.narration);
      lines.push('');
    }
    if (section.onScreenText) {
      lines.push(`**On-screen text:** ${section.onScreenText}`);
      lines.push('');
    }
    lines.push(`**Visual:** ${section.visualDescription}`);
    lines.push('');
    lines.push(`**Audio:** ${section.audioNotes}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
