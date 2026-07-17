import { VideoPlan, YouTubeMetadata } from './config.js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface MetadataOptions {
  plan?: VideoPlan;
  title?: string;
  ctaUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  outDir: string;
}

export function generateMetadata(options: MetadataOptions): YouTubeMetadata {
  const title = options.title || options.plan?.title || 'Video';
  const ctaUrl = options.ctaUrl || 'https://example.com';
  const utmSource = options.utmSource || 'youtube';
  const utmMedium = options.utmMedium || 'description';
  const utmCampaign = options.utmCampaign || 'video_launch';

  const utmLink = `${ctaUrl}${ctaUrl.includes('?') ? '&' : '?'}utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;

  const titleOptions = [
    `${title} — Complete Guide (2026)`,
    `I tested ${title} — here's what happened`,
    `The ${title} method that actually works`,
    `How to ${title.toLowerCase()} (step by step)`,
  ];

  const tags = [
    title.toLowerCase(),
    `${title.toLowerCase()} guide`,
    'ai',
    'tutorial',
    'how to',
    '2026',
    'productivity',
    'developer tools',
    'demo',
    'step by step',
  ];

  const hashtags = [
    '#ai',
    '#tutorial',
    '#productivity',
    '#howto',
    title.toLowerCase().replace(/\s+/g, ''),
  ];

  const chapters = options.plan?.scenes.map(s => ({
    time: formatTime(options.plan!.scenes
      .filter(si => si.index < s.index)
      .reduce((a, si) => a + si.durationSeconds, 0)),
    title: s.title,
  })) || [];

  const metadata: YouTubeMetadata = {
    title: titleOptions[0],
    titleOptions,
    description: [
      `${title} — step-by-step guide with real demos.\n`,
      `What you'll learn:\n${options.plan?.scenes.map(s => `- ${s.title}`).join('\n') || '- Key concepts'}\n`,
      `\n🔗 Try it free:\n${utmLink}\n`,
      `\n⏱️ Timestamps:\n${chapters.map(c => `${c.time} — ${c.title}`).join('\n')}\n`,
      `\n#${hashtags.join(' #')}`,
    ].join('\n'),
    tags,
    hashtags,
    pinnedComment: `Try it yourself: ${utmLink}\n\nLet me know in the comments what you think!`,
    thumbnailText: title.toUpperCase().slice(0, 20),
    category: 'Education',
    visibilitySuggestion: 'Public',
    utmLink,
    chapters,
  };

  if (!existsSync(options.outDir)) mkdirSync(options.outDir, { recursive: true });

  writeFileSync(join(options.outDir, 'title-options.txt'), titleOptions.join('\n'));
  writeFileSync(join(options.outDir, 'description.txt'), metadata.description);
  writeFileSync(join(options.outDir, 'tags.txt'), tags.join(', '));
  writeFileSync(join(options.outDir, 'pinned-comment.txt'), metadata.pinnedComment);
  writeFileSync(join(options.outDir, 'chapters.txt'), chapters.map(c => `${c.time} ${c.title}`).join('\n'));
  writeFileSync(join(options.outDir, 'hashtags.txt'), hashtags.join('\n'));
  writeFileSync(join(options.outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  const checklist = [
    '# YouTube Upload Checklist',
    '',
    '- [ ] Go to studio.youtube.com',
    '- [ ] Click "Create" → "Upload videos"',
    '- [ ] Upload final video',
    '- [ ] Paste title from title-options.txt',
    '- [ ] Paste description from description.txt',
    '- [ ] Upload thumbnail',
    '- [ ] Add tags from tags.txt',
    '- [ ] Set audience: "No, it\'s not made for kids"',
    '- [ ] Set category: Education',
    '- [ ] Add end screen elements',
    '- [ ] Add cards',
    '- [ ] Schedule or publish',
    '- [ ] Pin comment from pinned-comment.txt',
    '',
    '## After Publishing',
    '',
    '- [ ] Share on social media',
    '- [ ] Monitor comments first 24 hours',
    '- [ ] Check analytics after 48 hours',
  ].join('\n');

  writeFileSync(join(options.outDir, 'upload-checklist.md'), checklist);

  return metadata;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
