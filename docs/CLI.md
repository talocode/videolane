# CLI Reference

## Commands

### videolane init

Initialize a new project.

```bash
videolane init --template tera-tutorial --name my-video
videolane create my-video --template product-demo
```

### videolane plan

Generate a plan from a script or package.

```bash
videolane plan script.md --out plan.json
videolane plan ./production-package/ --out plan.json
videolane plan script.md --template tera-tutorial
```

### videolane record

Record browser actions with Playwright.

```bash
videolane record --plan plan.json --dry-run
videolane record --plan plan.json --url https://example.com --headless
videolane record --plan plan.json --manual-login
```

### videolane render

Render video with ffmpeg.

```bash
videolane render --recording raw.mp4 --captions captions.srt --audio music.wav --out final.mp4
videolane render --plan plan.json --out final.mp4 --dry-run
```

### videolane captions

Generate captions.

```bash
videolane captions --script script.md --out captions.srt
videolane captions --plan plan.json --out captions.vtt --format vtt
videolane captions --script script.md --out captions.json --format json
```

### videolane audio

Generate background audio.

```bash
videolane audio --duration 60 --style cinematic --out music.wav
videolane audio --duration 30 --style ambient --out music.wav
```

### videolane shorts

Generate shorts cutdowns.

```bash
videolane shorts --video final.mp4 --plan plan.json --out-dir shorts/
videolane shorts --plan plan.json --out-dir shorts/ --max-duration 30
```

### videolane thumbnail

Generate thumbnail brief.

```bash
videolane thumbnail --plan plan.json --title "My Video" --style dark --out thumbnail.json
```

### videolane metadata

Generate YouTube metadata.

```bash
videolane metadata --plan plan.json --title "My Video" --cta-url "https://example.com" --out-dir metadata/
```

### videolane package-youtube

Package for YouTube upload.

```bash
videolane package-youtube --video final.mp4 --metadata-dir metadata/ --out youtube-package/
```

### videolane demo

Run deterministic demo.

```bash
videolane demo
videolane demo --out ./my-demo
```

### videolane doctor

Check environment.

```bash
videolane doctor
```

### videolane config

Manage configuration.

```bash
videolane config list
videolane config get storage.path
videolane config set storage.path ~/.videolane
```

### videolane serve

Start API server.

```bash
videolane serve --port 3110
```

### videolane mcp

Start MCP server.

```bash
videolane mcp
```
