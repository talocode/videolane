import { createServer as httpCreateServer, IncomingMessage, ServerResponse } from 'node:http';
import { createPlan } from '../core/plan.js';
import { generateCaptions } from '../core/captions.js';
import { generateAudio } from '../core/audio.js';
import { generateShortsPlan } from '../core/shorts.js';
import { generateThumbnailBrief } from '../core/thumbnail.js';
import { generateMetadata } from '../core/metadata.js';
import { packageYouTube } from '../core/package.js';
import { render } from '../core/renderer.js';
import { checkFFmpeg } from '../core/recorder.js';
import { checkPlaywrightInstalled } from '../core/browser.js';
import { STORAGE_DIR } from '../core/config.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function createServer(port: number = 3110) {
  const server = httpCreateServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    const path = url.pathname;
    const method = req.method || 'GET';

    try {
      if (path === '/health' || path === '/v1/videolane/health') {
        return json(res, { status: 'ok', version: '0.1.0' });
      }

      if (path === '/v1/videolane/doctor') {
        return json(res, {
          ok: true,
          nodeVersion: process.version,
          storagePath: STORAGE_DIR,
          storageExists: existsSync(STORAGE_DIR),
          playwrightInstalled: checkPlaywrightInstalled(),
          ffmpegInstalled: checkFFmpeg(),
        });
      }

      if (method === 'POST') {
        const body = await readBody(req);
        const data = JSON.parse(body);

        switch (path) {
          case '/v1/videolane/plan': {
            const plan = createPlan(data.input || data.path, data);
            return json(res, { plan });
          }
          case '/v1/videolane/render': {
            const result = render(data);
            return json(res, result);
          }
          case '/v1/videolane/captions': {
            const result = generateCaptions(data);
            return json(res, result);
          }
          case '/v1/videolane/audio': {
            const result = generateAudio(data);
            return json(res, result);
          }
          case '/v1/videolane/shorts': {
            const result = generateShortsPlan(data);
            return json(res, result);
          }
          case '/v1/videolane/thumbnail': {
            const result = generateThumbnailBrief(data);
            return json(res, result);
          }
          case '/v1/videolane/metadata': {
            const result = generateMetadata(data);
            return json(res, result);
          }
          case '/v1/videolane/package-youtube': {
            const result = packageYouTube(data);
            return json(res, result);
          }
          default:
            return json(res, { error: 'Not found' }, 404);
        }
      }

      return json(res, { error: 'Not found' }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return json(res, { error: message }, 500);
    }
  });

  server.listen(port, () => {
    console.log(`VideoLane API listening on port ${port}`);
  });

  return server;
}
