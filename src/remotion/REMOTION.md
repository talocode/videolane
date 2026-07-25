# VideoLane Remotion Engine

Professional motion graphics for Talocode brand videos.

## Setup

```bash
cd src/remotion
npm install
npx remotion render CompositionId out.mp4
```

## Project Structure

```
src/remotion/
├── remotion.config.ts
├── package.json
├── tsconfig.json
├── theme.ts
├── motion.ts
├── compositions/
│   ├── ProductDemo.tsx
│   ├── LaunchTeaser.tsx
│   ├── SelfHealingDemo.tsx
│   └── TalocodeIntro.tsx
├── components/
│   ├── Title.tsx
│   ├── Subtitle.tsx
│   ├── Feature.tsx
│   ├── CTA.tsx
│   ├── Scene.tsx
│   ├── Transition.tsx
│   ├── Background.tsx
│   └── Caption.tsx
└── templates/
    ├── product-demo/
    ├── launch-teaser/
    └── self-healing/
```

## Motion Rules

1. Never linear interpolation — springs/bezier + clamp always
2. Entrances animate 2-3 properties together
3. Stagger everything
4. Exits exist and are faster than entrances
5. Five-layer stack: bg mesh → assets → graphics → grade → grain+vignette
6. All timing derives from fps — no magic frame numbers
7. Render → inspect frames → fix → re-render

## Talocode Design System

| Token | Value | Usage |
|-------|-------|-------|
| --bg-dark | #171718 | Primary background |
| --bg-surface | #232326 | Card/surface backgrounds |
| --border | #37373c | Dividers and borders |
| --accent | #00d4aa | Primary accent (teal) |
| --gold | #ffd166 | Secondary accent |
| --text | #e8e8e8 | Primary text |
| --text-dim | #9ca3af | Secondary text |

## Brand Font

Default: system sans-serif for Remotion renders
Fallback: DejaVu Sans Bold