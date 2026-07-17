import { VideoPlan, ThumbnailBrief, ThumbnailStyle } from './config.js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ThumbnailOptions {
  plan?: VideoPlan;
  title?: string;
  style?: ThumbnailStyle;
  outPath: string;
  imagePath?: string;
}

const STYLE_THEMES: Record<ThumbnailStyle, { bg: string; accent: string; text: string }> = {
  clean: { bg: '#ffffff', accent: '#0066ff', text: '#000000' },
  bold: { bg: '#000000', accent: '#ff3300', text: '#ffffff' },
  dark: { bg: '#0a0a0a', accent: '#00ff88', text: '#ffffff' },
  education: { bg: '#1a1a2e', accent: '#e94560', text: '#ffffff' },
  tech: { bg: '#0d1117', accent: '#58a6ff', text: '#ffffff' },
};

function generateThumbnailSVG(brief: ThumbnailBrief): string {
  const theme = STYLE_THEMES[(brief.style as ThumbnailStyle) || 'dark'];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="${theme.bg}"/>
  <text x="640" y="280" text-anchor="middle" fill="${theme.text}" font-size="72" font-family="sans-serif" font-weight="bold">
    ${brief.title.slice(0, 30)}
  </text>
  ${brief.textOptions[0] ? `<text x="640" y="380" text-anchor="middle" fill="${theme.accent}" font-size="48" font-family="sans-serif">
    ${brief.textOptions[0].text}
  </text>` : ''}
  <text x="640" y="500" text-anchor="middle" fill="${theme.text}" font-size="32" font-family="sans-serif" opacity="0.6">
    ${brief.concept.slice(0, 50)}
  </text>
</svg>`;
}

export function generateThumbnailBrief(options: ThumbnailOptions): ThumbnailBrief {
  const style = options.style || 'dark';
  const theme = STYLE_THEMES[style];
  const title = options.title || options.plan?.title || 'Video';

  const textOptions = [
    { text: title.toUpperCase().slice(0, 20), subtext: 'with AI', style: 'main' },
    { text: 'I tested this', subtext: 'results inside', style: 'curiosity' },
    { text: 'Complete guide', subtext: '2026', style: 'authority' },
  ];

  const brief: ThumbnailBrief = {
    title,
    concept: `Clean, ${style} background with bold text and product context`,
    layout: 'Title top-left, accent text center, logo top-right, image bottom-right',
    colors: {
      background: theme.bg,
      mainText: theme.text,
      accent: theme.accent,
    },
    textOptions,
    imageDirection: 'Screen recording crop or product screenshot in bottom-right',
    exportSize: '1280x720',
    canvaSteps: [
      'Create new design: 1280x720px',
      `Set background to ${theme.bg}`,
      `Add main text — bold, 72pt, ${theme.text}`,
      `Add accent text — 48pt, ${theme.accent}`,
      'Add product logo top-right',
      'Add subtle glow or gradient behind text',
      'Export as PNG, under 2MB',
    ],
    style,
  };

  const outDir = join(options.outPath, '..');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  writeFileSync(options.outPath, JSON.stringify(brief, null, 2));

  const md = [
    `# Thumbnail Brief: ${brief.title}`,
    '',
    `**Concept:** ${brief.concept}`,
    `**Layout:** ${brief.layout}`,
    `**Export size:** ${brief.exportSize}`,
    '',
    '## Colors',
    '',
    Object.entries(brief.colors).map(([k, v]) => `- **${k}:** ${v}`).join('\n'),
    '',
    '## Text Options',
    '',
    ...brief.textOptions.map((t, i) => `### Option ${i + 1}\n- Text: ${t.text}\n- Subtext: ${t.subtext}\n- Style: ${t.style}\n`),
    '## Image Direction',
    brief.imageDirection,
    '',
    '## Canva Steps',
    '',
    ...brief.canvaSteps.map((s, i) => `${i + 1}. ${s}`),
  ].join('\n');

  writeFileSync(options.outPath.replace('.json', '.md'), md);

  const svg = generateThumbnailSVG(brief);
  writeFileSync(options.outPath.replace('.json', '.svg'), svg);

  return brief;
}
