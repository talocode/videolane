# SDK Reference

## TypeScript

```typescript
import { VideoLaneClient } from "@talocode/videolane";

const client = new VideoLaneClient();

// Initialize project
const { project, plan, dir } = await client.initProject({
  name: "my-video",
  template: "tera-tutorial",
});

// Generate plan from script
const planResult = await client.plan({
  path: "./script.md",
});

// Generate captions
const captions = await client.generateCaptions({
  script: "./script.md",
  out: "./captions.srt",
  format: "srt",
});

// Generate audio
const audio = await client.generateAudio({
  durationSeconds: 60,
  style: "cinematic",
  outPath: "./music.wav",
});

// Generate metadata
const metadata = await client.generateMetadata({
  plan: planResult,
  title: "My Video",
  ctaUrl: "https://example.com",
  outDir: "./metadata",
});

// Generate thumbnail
const thumbnail = await client.generateThumbnail({
  title: "My Video",
  style: "dark",
  outPath: "./thumbnail.json",
});

// Check environment
const doctor = await client.doctor();
```

## HTTP Mode

```typescript
const client = new VideoLaneClient({
  baseUrl: "http://localhost:3110",
});
```

## Exports

```typescript
import {
  VideoLaneClient,
  createPlan,
  createPlanFromTemplate,
  generateStoryboard,
  generateCaptions,
  generateAudio,
  generateShortsPlan,
  generateThumbnailBrief,
  generateMetadata,
  packageYouTube,
  checkFFmpeg,
  checkPlaywrightInstalled,
} from "@talocode/videolane";
```
