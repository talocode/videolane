# Install

## npm

```bash
npm install -g @talocode/videolane
```

Or run without installing:

```bash
npx @talocode/videolane@latest --help
```

## Python

```bash
pip install talocode-videolane
```

## Dependencies

### Required

- Node.js >= 18.0.0

### Optional

- **Playwright** — Browser recording
  ```bash
  npm install playwright
  npx playwright install chromium
  ```

- **ffmpeg** — Video rendering
  ```bash
  # Debian/Ubuntu
  apt install ffmpeg

  # macOS
  brew install ffmpeg
  ```

- **ScreenLane** — Screen capture integration
  ```bash
  npm install -g @talocode/screenlane
  ```

## Verify

```bash
videolane doctor
```

This checks:
- Node version
- Playwright installation
- ffmpeg installation
- Storage directory
- Environment variables
