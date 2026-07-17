# VideoLane

Turn product workflows into publish-ready videos.

Open-source agentic video production engine for product demos, tutorials, and launch videos — turn scripts and product workflows into recorded, edited, captioned, and publish-ready video assets.

## Why VideoLane

Agents should not only write scripts. They should help record, edit, package, and publish product videos.

VideoLane is a local-first tool that takes a script or production package and generates:

- A structured video plan with scenes
- Browser recording via Playwright (or dry-run/manual mode)
- Captions (SRT, VTT, JSON)
- Background audio
- Shorts cutdowns
- Thumbnail brief with text options
- YouTube metadata (title, description, tags, pinned comment)
- A packaged YouTube upload folder

## How It Works

```
Script / production package
        ↓
VideoLane plan
        ↓
Browser recording / screen capture
        ↓
Captions + audio + render
        ↓
Shorts + thumbnail brief + metadata
        ↓
YouTube package
```

## Install

```bash
npm install -g @talocode/videolane
```

Or run without installing:

```bash
npx @talocode/videolane@latest demo
```

Python:

```bash
pip install talocode-videolane
```

## Quickstart

```bash
# Initialize a project
videolane init --template tera-tutorial --name my-video

# Generate plan from a script
videolane plan ./my-video/script.md --out ./my-video/plan.json

# Dry-run browser recording
videolane record --plan ./my-video/plan.json --dry-run

# Generate captions
videolane captions --script ./my-video/script.md --out ./my-video/captions.srt

# Generate background audio
videolane audio --duration 30 --style cinematic --out ./my-video/music.wav

# Generate YouTube metadata
videolane metadata --plan ./my-video/plan.json --title "My Video" --cta-url "https://example.com" --out-dir ./my-video/metadata

# Package for YouTube
videolane package-youtube --video ./my-video/final.mp4 --metadata-dir ./my-video/metadata --out ./my-video/youtube-package

# Run the full demo
videolane demo
```

## Script-to-Recording Pipeline

VideoLane parses markdown scripts and production packages into structured video plans:

- Detects scenes/sections from headings
- Extracts prompts from code blocks
- Estimates duration from word count
- Generates browser action sequences
- Creates YouTube metadata drafts

```bash
videolane plan docs/video1-production-package.md --out plan.json
```

## Browser Recording with Playwright

```bash
videolane record --plan plan.json --url https://example.com --headless
```

Requires Playwright:

```bash
npm install playwright
npx playwright install chromium
```

If Playwright is not available, VideoLane falls back to dry-run mode showing the actions that would be executed.

## ffmpeg Rendering

```bash
videolane render --recording raw.mp4 --captions captions.srt --audio music.wav --out final.mp4
```

Features:
- H.264 + AAC encoding
- Caption burn-in
- Audio mixing
- Multiple aspect ratios (16:9, 9:16, 1:1)

## Captions

```bash
videolane captions --script script.md --out captions.srt --format srt
```

Modes:
- `script`: Split narration into timed captions (no API key needed)
- `timed`: Use scene timestamps from plan
- `transcribe`: Use OpenAI/Tera API (requires API key)

## Background Audio

```bash
videolane audio --duration 60 --style ambient --out music.wav
```

Styles: ambient, cinematic, minimal, study, tech

Generated locally — no API keys needed.

## Voiceover (TTS)

VideoLane generates voiceover narration from plan scenes using edge-tts.

```bash
# Generate voiceover from plan
videolane voiceover --plan plan.json --out voiceover.wav

# Render with auto voiceover (default)
videolane render --plan plan.json --out final.mp4

# Disable auto voiceover
videolane render --plan plan.json --out final.mp4 --no-voiceover
```

Voices: en-US-GuyNeural (default), en-US-ChristopherNeural, en-GB-RyanNeural, en-AU-WilliamNeural

Requires: `pip install edge-tts`

## Shorts Generation

```bash
videolane shorts --video final.mp4 --plan plan.json --out-dir shorts/
```

Generates a shorts plan and exports clips using ffmpeg.

## Thumbnail Brief

```bash
videolane thumbnail --plan plan.json --title "My Video" --style dark --out thumbnail.json
```

Generates:
- Thumbnail brief with text options, colors, layout
- SVG mockup
- Canva instructions

## YouTube Metadata

```bash
videolane metadata --plan plan.json --title "My Video" --cta-url "https://example.com" --utm-campaign my_video --out-dir metadata/
```

Generates:
- Title options
- Description with UTM link
- Tags
- Pinned comment
- Chapters
- Upload checklist

## YouTube Publishing Package

```bash
videolane package-youtube --video final.mp4 --metadata-dir metadata/ --out youtube-package/
```

Creates a folder with everything needed for manual YouTube upload.

## YouTube Upload Safety

VideoLane can upload videos to YouTube, but upload actions are protected by explicit confirmation flags.

```bash
# Package only. No upload.
videolane youtube upload --video final.mp4

# Upload as unlisted.
videolane youtube upload --video final.mp4 --confirm-upload

# Public upload requires an extra confirmation.
videolane youtube upload --video final.mp4 --confirm-upload --privacy public --confirm-public

# Preview only.
videolane youtube upload --video final.mp4 --dry-run
```

**Safety model:**

| Command | What happens |
|---------|-------------|
| `videolane youtube upload --video v.mp4` | Package only — no upload |
| `videolane youtube upload --video v.mp4 --confirm-upload` | Upload as unlisted |
| `videolane youtube upload --video v.mp4 --confirm-upload --privacy public` | **Blocked** — needs `--confirm-public` |
| `videolane youtube upload --video v.mp4 --confirm-upload --privacy public --confirm-public` | Upload as public |

**Setup:**

1. Enable YouTube Data API in Google Cloud Console
2. Create OAuth 2.0 credentials (Desktop app type)
3. Run OAuth flow to get refresh token
4. Save as `youtube-credentials.json` in project or `~/.videolane/`

Credentials are auto-discovered from:
- `--credentials <path>` flag
- `~/.videolane/youtube-credentials.json`
- `/workspace/.youtube-credentials.json`
- `YOUTUBE_CREDENTIALS_PATH` env var

## Templates

```bash
videolane init --template product-demo --name demo
videolane init --template youtube-tutorial --name tutorial
videolane init --template launch-video --name launch
videolane init --template shorts-demo --name shorts
videolane init --template tera-tutorial --name tera
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `videolane init` | Initialize a new project |
| `videolane plan` | Generate plan from script |
| `videolane record` | Record browser actions |
| `videolane capture` | Capture screen/browser |
| `videolane render` | Render video with ffmpeg |
| `videolane voiceover` | Generate TTS voiceover |
| `videolane captions` | Generate captions |
| `videolane audio` | Generate background audio |
| `videolane shorts` | Generate shorts cutdowns |
| `videolane thumbnail` | Generate thumbnail brief |
| `videolane metadata` | Generate YouTube metadata |
| `videolane package-youtube` | Package for YouTube |
| `videolane youtube upload` | Upload to YouTube (safe, requires confirmation) |
| `videolane demo` | Run deterministic demo |
| `videolane doctor` | Check dependencies |
| `videolane serve` | Start API server |
| `videolane mcp` | Start MCP server |
| `videolane config` | Manage configuration |

## SDK

```typescript
import { VideoLaneClient } from "@talocode/videolane";

const client = new VideoLaneClient();

const { project, plan } = await client.initProject({ name: "demo" });
const result = await client.plan({ path: "./script.md" });
const captions = await client.generateCaptions({ script: "./script.md", out: "./captions.srt" });
```

## API

```bash
videolane serve --port 3110

# Health check
curl http://localhost:3110/health

# Generate plan
curl -X POST http://localhost:3110/v1/videolane/plan \
  -H "Content-Type: application/json" \
  -d '{"input": "./script.md"}'
```

## MCP Tools

VideoLane provides MCP tools for AI agents:

- `videolane_plan` — Generate video plan
- `videolane_record_browser` — Record browser actions
- `videolane_render` — Render video
- `videolane_generate_captions` — Generate captions
- `videolane_generate_audio` — Generate background audio
- `videolane_generate_shorts` — Generate shorts plan
- `videolane_generate_thumbnail` — Generate thumbnail brief
- `videolane_generate_metadata` — Generate YouTube metadata
- `videolane_package_youtube` — Package for YouTube
- `videolane_youtube_upload` — Upload to YouTube (safe, requires confirmation)
- `videolane_doctor` — Check environment
- `videolane_demo` — Run demo

## Python Package

```bash
pip install talocode-videolane
videolane-py demo
videolane-py plan --input script.md
videolane-py metadata --plan plan.json --title "My Video"
```

## Integrations

- **Playwright** — Browser recording (optional)
- **ffmpeg** — Video rendering (optional)
- **ScreenLane** — Screen capture (optional)
- **SkillLane** — Skill export (optional)
- **Tera** — AI content generation (optional)

## Storage

Local storage at `~/.videolane/`:

```
~/.videolane/
  config.json
  projects/
    <project-id>/
      videolane.json
      plan.json
      recordings/
      renders/
      captions/
      thumbnails/
      metadata/
      shorts/
```

## Security / Privacy

- Local-first — no data leaves your machine by default
- No secrets required for core functionality
- No YouTube credentials stored unless explicitly configured
- Browser profiles kept local
- API keys only used when you provide them

## Talocode Ecosystem

| Product | Purpose |
|---------|---------|
| [ScreenLane](https://github.com/talocode/screenlane) | Screen capture and context |
| [SkillLane](https://github.com/talocode/skilllane) | Skill workflow structure |
| [VideoLane](https://github.com/talocode/videolane) | Video production (this package) |
| [ClipLoop](https://github.com/talocode/cliploop) | Product update promo content |
| [Tera](https://github.com/talocode/tera) | AI assistant for students/builders |
| [Codra](https://github.com/talocode/codra) | AI code editor |
| [SearchLane](https://github.com/talocode/searchlane) | Search API |
| [VectorLane](https://github.com/talocode/vectorlane) | Vector search |
| [XProLane](https://github.com/talocode/xprolane) | X Pro setup assistant |

## Demo Video

Run the demo:

```bash
videolane demo
```

This generates a complete demo output with plan, captions, audio, metadata, and YouTube package.

## Roadmap

- [ ] Full Playwright browser recording
- [ ] ffmpeg caption burn-in
- [ ] Background music generation
- [ ] Shorts auto-cut
- [x] YouTube Data API upload
- [ ] ScreenLane integration
- [ ] Multi-language captions
- [ ] Transcript-based captions (Whisper)
- [ ] Thumbnail image generation
- [ ] Video templates library

## Limitations

- v0.1 packages publish-ready assets; it does not fully replace human review
- YouTube auto-upload is not enabled by default
- Browser recording depends on Playwright and browser availability
- Rendering depends on ffmpeg
- Automatic login is not handled; use manual-login or browser profile
- Captions can be generated from scripts locally; transcription requires provider keys
- Thumbnail generation is brief-first; final thumbnail design may need Canva/editor review
- Background audio is generated locally and should be reviewed before publishing
- Complex editing still needs human review

## Contributing

Contributions welcome. Open an issue or PR at [github.com/talocode/videolane](https://github.com/talocode/videolane).

## License

MIT © Talocode
