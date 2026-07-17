# VideoLane

Open-source agentic video production engine for product demos, tutorials, and launch videos — turn scripts and product workflows into recorded, edited, captioned, and publish-ready video assets.

## What It Is

VideoLane takes a markdown script or production package and generates:

- A structured video plan with scenes and browser actions
- Screen recording and rendering with ffmpeg
- Captions (SRT, VTT, JSON)
- Voiceover narration (TTS via edge-tts)
- Background audio (generated WAV)
- Shorts cutdown plans and exports
- Thumbnail briefs with text options and colors
- YouTube metadata (title, description, tags, pinned comment, chapters)
- A packaged YouTube upload folder
- YouTube upload with safety guards

## Why It Exists

Agents should not only write scripts. They should help record, edit, package, and publish product videos. VideoLane is local-first and works without cloud APIs for core functionality.

## Install

```bash
pip install talocode-videolane
```

## Quickstart

```bash
# Check environment
videolane-py doctor

# Run demo
videolane-py demo

# Generate plan from a script
videolane-py plan --input script.md

# Generate YouTube metadata
videolane-py metadata --plan plan.json --title "My Video"
```

## Python SDK

```python
from talocode_videolane import VideoLaneClient

# Local mode (connects to videolane serve on port 3110)
client = VideoLaneClient()

# Health check
health = client.health()
print(health)

# Check environment
doctor = client.doctor()
print(doctor)

# Generate plan
result = client.plan({"input": "./script.md"})
print(result)

# Generate YouTube metadata
metadata = client.metadata({
    "plan": plan,
    "title": "My Video",
    "ctaUrl": "https://example.com",
    "outDir": "./metadata"
})
print(metadata)
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `videolane-py health` | Check API health |
| `videolane-py doctor` | Check environment and dependencies |
| `videolane-py plan --input <path>` | Generate a video plan from a script |
| `videolane-py metadata --plan <path> --title <title>` | Generate YouTube metadata |
| `videolane-py demo` | Run the full demo |

## API Surface

The Python client connects to the VideoLane HTTP API (default port 3110).

Start the API server:

```bash
videolane serve --port 3110
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/videolane/doctor` | Environment check |
| POST | `/v1/videolane/plan` | Generate video plan |
| POST | `/v1/videolane/render` | Render video |
| POST | `/v1/videolane/voiceover` | Generate TTS voiceover |
| POST | `/v1/videolane/captions` | Generate captions |
| POST | `/v1/videolane/audio` | Generate background audio |
| POST | `/v1/videolane/shorts` | Generate shorts plan |
| POST | `/v1/videolane/thumbnail` | Generate thumbnail brief |
| POST | `/v1/videolane/metadata` | Generate YouTube metadata |
| POST | `/v1/videolane/package-youtube` | Package for YouTube |
| POST | `/v1/videolane/youtube/upload` | Upload to YouTube (safe) |

## YouTube Upload Safety

VideoLane can upload videos to YouTube, but upload actions are protected by explicit confirmation flags.

```bash
# Package only. No upload.
videolane-py youtube upload --video final.mp4

# Upload as unlisted.
videolane-py youtube upload --video final.mp4 --confirm-upload

# Public upload requires extra confirmation.
videolane-py youtube upload --video final.mp4 --confirm-upload --privacy public --confirm-public
```

| Command | What happens |
|---------|-------------|
| `youtube upload --video v.mp4` | Package only — no upload |
| `youtube upload --video v.mp4 --confirm-upload` | Upload as unlisted |
| `youtube upload --video v.mp4 --confirm-upload --privacy public` | **Blocked** — needs `--confirm-public` |
| `youtube upload --video v.mp4 --confirm-upload --privacy public --confirm-public` | Upload as public |

## How It Works

```
Script / production package
        ↓
VideoLane plan (scenes, actions, timestamps)
        ↓
Browser recording / screen capture (Playwright)
        ↓
Captions + audio + render (ffmpeg)
        ↓
Shorts + thumbnail brief + metadata
        ↓
YouTube package (ready for upload)
```

## Related Packages

| Package | Purpose |
|---------|---------|
| `talocode-videolane` | Video production engine (this package) |
| `talocode-tera` | AI assistant for students and builders |
| `talocode-codra` | AI code editor |
| `talocode-searchlane` | Search API |
| `talocode-screenlane` | Screen capture and context |
| `talocode-xprolane` | X Pro setup assistant |
| `tradia` | Trading tools |
| `contextlane` | Context management |

## Talocode Ecosystem

| Product | Purpose | Link |
|---------|---------|------|
| **VideoLane** (this package) | Video production engine | [GitHub](https://github.com/talocode/videolane) |
| Tera | AI assistant | [GitHub](https://github.com/talocode/tera) |
| Codra | AI code editor | [GitHub](https://github.com/talocode/codra) |
| SearchLane | Search API | [GitHub](https://github.com/talocode/searchlane) |
| ScreenLane | Screen capture | [GitHub](https://github.com/talocode/screenlane) |
| SkillLane | Skill workflow structure | [GitHub](https://github.com/talocode/skilllane) |
| ClipLoop | Product update promo | [GitHub](https://github.com/talocode/cliploop) |
| XProLane | X Pro setup assistant | [GitHub](https://github.com/talocode/xprolane) |
| VectorLane | Vector search | [GitHub](https://github.com/talocode/vectorlane) |
| Stacklane | Cloud dashboard | [GitHub](https://github.com/talocode/stacklane) |
| GateLane | Access control | [GitHub](https://github.com/talocode/gatelane) |
| ContextLane | Context management | [GitHub](https://github.com/talocode/contextlane) |
| InvoiceLane | Invoicing | [GitHub](https://github.com/talocode/invoicelane) |
| Tradia | Trading tools | [GitHub](https://github.com/talocode/tradia) |
| DevTool | Developer tools | [GitHub](https://github.com/talocode/devtool) |
| VerifyLane | Verification | [GitHub](https://github.com/talocode/verifylane) |
| TraceLane | Tracing | [GitHub](https://github.com/talocode/tracelane) |
| StyleLane | Style checking | [GitHub](https://github.com/talocode/stylelane) |
| GeoLane | Geolocation | [GitHub](https://github.com/talocode/geolane) |
| Agent Browser | Browser automation | [GitHub](https://github.com/talocode/agent-browser) |

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)

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

No remote database required.

## Security / Privacy

- Local-first — no data leaves your machine by default
- No secrets required for core functionality
- No YouTube credentials stored unless explicitly configured
- Browser profiles kept local
- API keys only used when you provide them
- YouTube upload protected by confirmation flags

## Limitations

- v0.3 packages publish-ready assets; it does not fully replace human review
- YouTube upload requires explicit confirmation flags (--confirm-upload)
- Browser recording depends on Playwright and browser availability
- Rendering depends on ffmpeg
- Automatic login is not handled; use manual-login or browser profile
- Captions can be generated from scripts locally; transcription requires provider keys
- Thumbnail generation is brief-first; final thumbnail design may need Canva/editor review
- Background audio is generated locally and should be reviewed before publishing
- Complex editing still needs human review

## Links

- GitHub: https://github.com/talocode/videolane
- npm: https://www.npmjs.com/package/@talocode/videolane
- PyPI: https://pypi.org/project/talocode-videolane/
- Release: https://github.com/talocode/videolane/releases/tag/v0.3.0

## License

MIT © Talocode
