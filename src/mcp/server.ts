import { createPlan } from '../core/plan.js';
import { generateCaptions } from '../core/captions.js';
import { generateAudio } from '../core/audio.js';
import { generateVoiceover, mixVoiceoverWithVideo } from '../core/voiceover.js';
import { generateShortsPlan } from '../core/shorts.js';
import { generateThumbnailBrief } from '../core/thumbnail.js';
import { generateMetadata } from '../core/metadata.js';
import { packageYouTube } from '../core/package.js';
import { youtubeUpload } from '../core/youtube.js';
import { render } from '../core/renderer.js';
import { checkFFmpeg } from '../core/recorder.js';
import { checkPlaywrightInstalled } from '../core/browser.js';
import { STORAGE_DIR } from '../core/config.js';
import { existsSync } from 'node:fs';

interface MCPRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

function reply(id: number | string, result: unknown): string {
  return JSON.stringify({ jsonrpc: '2.0', id, result });
}

function errorReply(id: number | string, code: number, message: string): string {
  return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
}

const TOOLS = [
  {
    name: 'videolane_plan',
    description: 'Generate a video plan from a script, storyboard, or production package',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'Path to script, storyboard, or package directory' },
        out: { type: 'string', description: 'Output plan file path' },
        template: { type: 'string', description: 'Template name' },
      },
      required: ['input'],
    },
  },
  {
    name: 'videolane_record_browser',
    description: 'Record browser actions using Playwright',
    inputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'string', description: 'Path to plan JSON' },
        url: { type: 'string', description: 'URL to open' },
        out: { type: 'string', description: 'Output directory' },
        headless: { type: 'boolean' },
        manualLogin: { type: 'boolean' },
        dryRun: { type: 'boolean' },
      },
      required: ['plan'],
    },
  },
  {
    name: 'videolane_render',
    description: 'Render video using ffmpeg',
    inputSchema: {
      type: 'object',
      properties: {
        recording: { type: 'string' },
        plan: { type: 'string' },
        captions: { type: 'string' },
        audio: { type: 'string' },
        out: { type: 'string' },
        aspect: { type: 'string' },
        resolution: { type: 'string' },
        burnCaptions: { type: 'boolean' },
        dryRun: { type: 'boolean' },
      },
      required: ['out'],
    },
  },
  {
    name: 'videolane_generate_captions',
    description: 'Generate captions from a script or plan',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string' },
        plan: { type: 'string' },
        out: { type: 'string' },
        format: { type: 'string', enum: ['srt', 'vtt', 'json'] },
        mode: { type: 'string', enum: ['script', 'timed'] },
      },
      required: ['out'],
    },
  },
  {
    name: 'videolane_generate_audio',
    description: 'Generate background audio',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number' },
        style: { type: 'string', enum: ['ambient', 'cinematic', 'minimal', 'study', 'tech'] },
        out: { type: 'string' },
      },
      required: ['duration', 'out'],
    },
  },
  {
    name: 'videolane_generate_voiceover',
    description: 'Generate TTS voiceover from plan narration or script using edge-tts',
    inputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'string', description: 'Path to plan JSON (reads scene narration)' },
        script: { type: 'string', description: 'Path to voiceover script JSON [{start, text}]' },
        out: { type: 'string', description: 'Output audio file path' },
        voice: { type: 'string', description: 'TTS voice name (default: en-US-GuyNeural)' },
        rate: { type: 'string', description: 'Speaking rate (default: -5%)' },
        dryRun: { type: 'boolean' },
      },
      required: ['out'],
    },
  },
  {
    name: 'videolane_generate_shorts',
    description: 'Generate shorts cutdown plan',
    inputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'string' },
        outDir: { type: 'string' },
        maxDuration: { type: 'number' },
      },
      required: ['plan', 'outDir'],
    },
  },
  {
    name: 'videolane_generate_thumbnail',
    description: 'Generate thumbnail brief',
    inputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'string' },
        title: { type: 'string' },
        style: { type: 'string' },
        out: { type: 'string' },
      },
      required: ['out'],
    },
  },
  {
    name: 'videolane_generate_metadata',
    description: 'Generate YouTube metadata',
    inputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'string' },
        title: { type: 'string' },
        ctaUrl: { type: 'string' },
        utmCampaign: { type: 'string' },
        outDir: { type: 'string' },
      },
      required: ['outDir'],
    },
  },
  {
    name: 'videolane_package_youtube',
    description: 'Package everything for YouTube upload',
    inputSchema: {
      type: 'object',
      properties: {
        video: { type: 'string' },
        metadataDir: { type: 'string' },
        thumbnail: { type: 'string' },
        out: { type: 'string' },
      },
      required: ['out'],
    },
  },
  {
    name: 'videolane_youtube_upload',
    description: 'Upload video to YouTube with safety guards. Default: packages only. Requires confirmUpload=true to actually upload.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: { type: 'string', description: 'Path to video file' },
        metadataDir: { type: 'string', description: 'Path to metadata directory' },
        title: { type: 'string', description: 'Video title' },
        description: { type: 'string', description: 'Description text' },
        tags: { type: 'array', items: { type: 'string' } },
        privacy: { type: 'string', enum: ['private', 'unlisted', 'public'], default: 'unlisted' },
        category: { type: 'string', description: 'YouTube category ID (default: 28)' },
        confirmUpload: { type: 'boolean', description: 'Must be true to upload' },
        confirmPublic: { type: 'boolean', description: 'Must be true for public upload' },
        dryRun: { type: 'boolean' },
      },
      required: ['videoPath'],
    },
  },
  {
    name: 'videolane_doctor',
    description: 'Check environment and dependencies',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'videolane_demo',
    description: 'Run the deterministic demo',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'videolane_plan': {
      const plan = createPlan(args.input as string, { template: args.template as string });
      return { plan };
    }
    case 'videolane_render':
      return render(args as any);
    case 'videolane_generate_captions':
      return generateCaptions(args as any);
    case 'videolane_generate_audio':
      return generateAudio({
        durationSeconds: args.duration as number,
        style: args.style as any,
        outPath: args.out as string,
      });
    case 'videolane_generate_voiceover': {
      let plan;
      if (args.plan) plan = createPlan(args.plan as string);
      return generateVoiceover({
        plan,
        scriptPath: args.script as string,
        outPath: args.out as string,
        voice: args.voice as any,
        rate: args.rate as string,
        dryRun: args.dryRun as boolean,
      });
    }
    case 'videolane_generate_shorts':
      return generateShortsPlan(args as any);
    case 'videolane_generate_thumbnail':
      return generateThumbnailBrief(args as any);
    case 'videolane_generate_metadata':
      return generateMetadata(args as any);
    case 'videolane_package_youtube':
      return packageYouTube(args as any);
    case 'videolane_youtube_upload':
      return youtubeUpload(args as any);
    case 'videolane_doctor':
      return {
        ok: true,
        nodeVersion: process.version,
        storagePath: STORAGE_DIR,
        playwrightInstalled: checkPlaywrightInstalled(),
        ffmpegInstalled: checkFFmpeg(),
      };
    case 'videolane_demo':
      return { message: 'Run videolane demo from CLI for full demo' };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function startMCPServer(): Promise<void> {
  const stdin = process.stdin;
  const stdout = process.stdout;
  let buffer = '';

  stdin.setEncoding('utf-8');
  stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const req: MCPRequest = JSON.parse(line);
        await handleRequest(req, stdout);
      } catch (err) {
        stdout.write(errorReply(0, -32700, 'Parse error') + '\n');
      }
    }
  });

  stdin.on('end', () => process.exit(0));
}

async function handleRequest(req: MCPRequest, stdout: NodeJS.WriteStream): Promise<void> {
  switch (req.method) {
    case 'initialize':
      stdout.write(reply(req.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'videolane', version: '0.1.0' },
      }) + '\n');
      break;
    case 'notifications/initialized':
      break;
    case 'tools/list':
      stdout.write(reply(req.id, { tools: TOOLS }) + '\n');
      break;
    case 'tools/call': {
      const toolName = (req.params as any)?.name;
      const toolArgs = (req.params as any)?.arguments || {};
      try {
        const result = await handleTool(toolName, toolArgs);
        stdout.write(reply(req.id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }) + '\n');
      } catch (err) {
        stdout.write(errorReply(req.id, -32000, err instanceof Error ? err.message : String(err)) + '\n');
      }
      break;
    }
    default:
      stdout.write(errorReply(req.id, -32601, `Method not found: ${req.method}`) + '\n');
  }
}
