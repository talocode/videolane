#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

const releaseNotes = `# VideoLane v${pkg.version}

${pkg.description}

## Install

\`\`\`bash
npm install -g @talocode/videolane
\`\`\`

Or:

\`\`\`bash
npx @talocode/videolane@latest demo
\`\`\`

## Quick Demo

\`\`\`bash
videolane demo
\`\`\`

## Features

- Script-to-recording pipeline
- Browser recording with Playwright
- ffmpeg video rendering
- Caption generation (SRT, VTT, JSON)
- Background audio generation
- Shorts cutdown planning
- Thumbnail brief generation
- YouTube metadata generation
- YouTube publishing package
- 5 project templates
- CLI, SDK, API, MCP
- Python package

## Links

- GitHub: https://github.com/talocode/videolane
- npm: https://www.npmjs.com/package/@talocode/videolane
- PyPI: https://pypi.org/project/talocode-videolane/

## License

MIT © Talocode
`;

writeFileSync(join(ROOT, 'RELEASE_NOTES.md'), releaseNotes);
console.log(`Release notes generated for v${pkg.version}`);
