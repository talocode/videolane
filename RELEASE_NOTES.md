# VideoLane v0.1.0

Turn product workflows into publish-ready videos.

## What's New

VideoLane is an open-source agentic video production engine for product demos, tutorials, and launch videos. It takes scripts and production packages and generates publish-ready video assets.

## Features

- **Script parsing** — Markdown scripts and production packages into structured video plans
- **Browser recording** — Playwright-based recording with dry-run and manual modes
- **Video rendering** — ffmpeg-based H.264/AAC export
- **Captions** — SRT, VTT, JSON from scripts or plans
- **Background audio** — Generated ambient/cinematic audio
- **Shorts** — Cutdown planning and export
- **Thumbnails** — Brief generation with text options and colors
- **YouTube metadata** — Title, description, tags, pinned comment, chapters
- **YouTube package** — Everything ready for manual upload
- **Templates** — 5 project templates
- **CLI** — 16 commands
- **SDK** — TypeScript client
- **API** — HTTP server on port 3110
- **MCP** — 12 tools for AI agents
- **Python** — talocode-videolane package

## Install

```bash
npm install -g @talocode/videolane
```

Or:

```bash
npx @talocode/videolane@latest demo
```

Python:

```bash
pip install talocode-videolane
```

## Quick Demo

```bash
videolane demo
```

This generates a complete demo output with plan, captions, audio, metadata, thumbnail brief, shorts plan, and YouTube package.

## Limitations

- v0.1 packages publish-ready assets; it does not fully replace human review
- YouTube auto-upload is not enabled by default
- Browser recording depends on Playwright and browser availability
- Rendering depends on ffmpeg
- Automatic login is not handled
- Captions from scripts are local; transcription requires API keys
- Thumbnail is brief-first; final design may need Canva
- Background audio should be reviewed before publishing

## Links

- GitHub: https://github.com/talocode/videolane
- npm: https://www.npmjs.com/package/@talocode/videolane
- PyPI: https://pypi.org/project/talocode-videolane/

## License

MIT © Talocode
