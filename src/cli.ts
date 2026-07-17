#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { createPlan, createPlanFromTemplate, summarizePlan } from './core/plan.js';
import { initProject, createProject } from './core/project.js';
import { generateStoryboard, storyboardToMarkdown } from './core/storyboard.js';
import { recordBrowser, planRecordingActions, checkFFmpeg, generateDemoFrames, renderVideoFFmpeg } from './core/recorder.js';
import { checkPlaywrightInstalled, generateManualInstructions } from './core/browser.js';
import { generateCaptions } from './core/captions.js';
import { generateAudio } from './core/audio.js';
import { generateShortsPlan, exportShorts } from './core/shorts.js';
import { generateThumbnailBrief } from './core/thumbnail.js';
import { generateMetadata } from './core/metadata.js';
import { packageYouTube } from './core/package.js';
import { loadConfig, saveConfig, STORAGE_DIR, ensureStorage } from './core/config.js';
import { formatError } from './core/errors.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const VERSION = '0.1.0';

function printHelp(): void {
  console.log(`
VideoLane v${VERSION} — agentic video production engine

Usage:
  videolane <command> [options]

Commands:
  init              Initialize a new project
  create            Create a new project (alias for init)
  plan              Generate a plan from a script or package
  record            Record browser actions with Playwright
  capture           Capture screen or browser content
  render            Render video with ffmpeg
  captions          Generate captions from script or plan
  audio             Generate background audio
  shorts            Generate shorts cutdowns
  thumbnail         Generate thumbnail brief
  metadata          Generate YouTube metadata
  package-youtube   Package everything for YouTube upload
  demo              Run deterministic demo
  doctor            Check environment and dependencies
  serve             Start local HTTP API (port 3110)
  mcp               Start MCP server over stdio
  config            Manage configuration

Options:
  --help            Show this help
  --version         Show version

Run 'videolane <command> --help' for command-specific help.
`);
}

function printCommandHelp(command: string): void {
  const helps: Record<string, string> = {
    init: `
Usage: videolane init [options]

Options:
  --template <name>   Template: product-demo|youtube-tutorial|launch-video|shorts-demo|tera-tutorial
  --name <name>       Project name
  --out <dir>         Output directory
`,
    plan: `
Usage: videolane plan <input> [options]

Input can be:
  - A markdown script file
  - A folder with script.txt/prompts.txt (production package)
  - A JSON plan file
  - A template name

Options:
  --out <path>        Output plan file path
  --template <name>   Use a template
  --json              Output as JSON
`,
    record: `
Usage: videolane record [options]

Options:
  --plan <path>       Path to plan JSON
  --url <url>         URL to open in browser
  --out <path>        Output directory
  --browser <type>    Browser: chromium|firefox|webkit
  --headless          Run headless (default: true)
  --manual-login      Wait for manual login before continuing
  --profile-dir <path> Browser profile directory
  --dry-run           Print actions without launching browser
`,
    render: `
Usage: videolane render [options]

Options:
  --recording <path>  Path to recording file
  --plan <path>       Path to plan JSON
  --captions <path>   Path to captions file
  --audio <path>      Path to audio file
  --out <path>        Output video path
  --format <fmt>      Format: mp4|webm
  --aspect <ratio>    Aspect: 16:9|9:16|1:1
  --resolution <res>  Resolution: 1920x1080|1080x1920|1280x720
  --burn-captions     Burn captions into video
  --dry-run           Show command without executing
`,
    captions: `
Usage: videolane captions [options]

Options:
  --script <path>     Path to script file
  --plan <path>       Path to plan JSON
  --out <path>        Output captions file
  --format <fmt>      Format: srt|vtt|json
  --mode <mode>       Mode: script|timed|transcribe
`,
    audio: `
Usage: videolane audio [options]

Options:
  --duration <sec>    Duration in seconds
  --style <style>     Style: ambient|cinematic|minimal|study|tech
  --out <path>        Output audio file
`,
    shorts: `
Usage: videolane shorts [options]

Options:
  --video <path>      Path to video file
  --plan <path>       Path to plan JSON
  --out-dir <path>    Output directory
  --aspect <ratio>    Aspect: 9:16
  --max-duration <n>  Max duration in seconds (default: 60)
  --from-plan         Generate shorts from plan scenes
`,
    thumbnail: `
Usage: videolane thumbnail [options]

Options:
  --plan <path>       Path to plan JSON
  --title <title>     Video title
  --style <style>     Style: clean|bold|dark|education|tech
  --out <path>        Output path (JSON)
`,
    metadata: `
Usage: videolane metadata [options]

Options:
  --plan <path>       Path to plan JSON
  --title <title>     Video title
  --cta-url <url>     Call-to-action URL
  --utm-source <s>    UTM source (default: youtube)
  --utm-medium <m>    UTM medium (default: description)
  --utm-campaign <c>  UTM campaign name
  --out-dir <path>    Output directory
`,
    demo: `
Usage: videolane demo [options]

Runs a deterministic demo that generates:
  - A plan from the built-in demo script
  - Captions
  - Background audio (if ffmpeg available)
  - A demo render (if ffmpeg available)
  - YouTube metadata
  - Thumbnail brief
  - YouTube package

Options:
  --out <dir>         Output directory (default: ./demo-output)
`,
    doctor: `
Usage: videolane doctor

Checks:
  - Node version
  - Package version
  - Storage directory
  - Playwright installation
  - ffmpeg installation
  - Optional integrations
  - Environment variables
  - Project templates
`,
  };
  console.log(helps[command] || `No help available for '${command}'`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`VideoLane v${VERSION}`);
    return;
  }

  const command = args[0];
  const rest = args.slice(1);

  const getArg = (name: string): string | undefined => {
    const idx = rest.indexOf(`--${name}`);
    return idx >= 0 ? rest[idx + 1] : undefined;
  };

  const hasFlag = (name: string): boolean => rest.includes(`--${name}`);

  try {
    switch (command) {
      case 'init':
      case 'create': {
        const name = getArg('name') || 'my-video';
        const template = getArg('template');
        const out = getArg('out');
        const result = initProject({ name, template, outDir: out });
        console.log(`Project created: ${result.dir}`);
        console.log(`Plan: ${join(result.dir, 'plan.json')}`);
        break;
      }

      case 'plan': {
        const input = rest.find(a => !a.startsWith('-'));
        if (!input) {
          console.error('Error: provide an input path');
          process.exit(1);
        }
        const template = getArg('template');
        const out = getArg('out');

        let plan;
        if (template) {
          plan = createPlanFromTemplate(template, input);
        } else {
          plan = createPlan(input);
        }

        const outPath = out || join(process.cwd(), 'demo-plan.json');
        const outDir = join(outPath, '..');
        if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
        writeFileSync(outPath, JSON.stringify(plan, null, 2));
        console.log(`Plan generated: ${outPath}`);
        console.log(summarizePlan(plan));
        break;
      }

      case 'record': {
        const planPath = getArg('plan');
        const url = getArg('url');
        const out = getArg('out') || './recordings';
        const dryRun = hasFlag('dry-run');
        const manualLogin = hasFlag('manual-login');

        if (!planPath) {
          console.error('Error: provide --plan <path>');
          process.exit(1);
        }

        const plan = createPlan(planPath);
        const result = recordBrowser({
          plan,
          url,
          outDir: out,
          dryRun,
          manualLogin,
        });

        if (result.dryRun) {
          console.log('DRY RUN — Browser actions:');
          for (const a of result.actions) console.log(a);
        } else {
          console.log('Recording complete');
          console.log(`Output: ${out}`);
        }
        break;
      }

      case 'render': {
        const recording = getArg('recording');
        const planPath = getArg('plan');
        const captions = getArg('captions');
        const audio = getArg('audio');
        const out = getArg('out') || './output.mp4';
        const dryRun = hasFlag('dry-run');

        let plan;
        if (planPath) plan = createPlan(planPath);

        const result = renderVideoFFmpeg({
          recordingPath: recording,
          captionsPath: captions,
          audioPath: audio,
          outputPath: out,
          dryRun,
        });

        if (result.dryRun) {
          console.log('DRY RUN:');
          console.log(result.command);
        } else {
          console.log(`Rendered: ${out}`);
        }
        break;
      }

      case 'captions': {
        const script = getArg('script');
        const planPath = getArg('plan');
        const out = getArg('out') || './captions.srt';
        const format = (getArg('format') || 'srt') as 'srt' | 'vtt' | 'json';
        const mode = (getArg('mode') || 'script') as 'script' | 'timed';

        let plan;
        if (planPath) plan = createPlan(planPath);

        const result = generateCaptions({
          scriptPath: script,
          plan,
          outPath: out,
          format,
          mode,
        });

        console.log(`Captions generated: ${out}`);
        console.log(`Entries: ${result.entries.length}`);
        break;
      }

      case 'audio': {
        const duration = parseInt(getArg('duration') || '30');
        const style = (getArg('style') || 'ambient') as any;
        const out = getArg('out') || './background-music.wav';

        const result = generateAudio({
          durationSeconds: duration,
          style,
          outPath: out,
        });

        console.log(`Audio generated: ${result.path}`);
        console.log(`Method: ${result.method}`);
        break;
      }

      case 'shorts': {
        const video = getArg('video');
        const planPath = getArg('plan');
        const outDir = getArg('out-dir') || './shorts';
        const maxDuration = parseInt(getArg('max-duration') || '60');
        const fromPlan = hasFlag('from-plan');

        let plan;
        if (planPath) plan = createPlan(planPath);

        const result = exportShorts({
          videoPath: video,
          plan,
          outDir,
          maxDuration,
          fromPlan,
        });

        console.log(`Shorts: ${result.exported.length} exported`);
        for (const l of result.logs) console.log(l);
        break;
      }

      case 'thumbnail': {
        const planPath = getArg('plan');
        const title = getArg('title');
        const style = (getArg('style') || 'dark') as any;
        const out = getArg('out') || './thumbnail.json';

        let plan;
        if (planPath) plan = createPlan(planPath);

        const result = generateThumbnailBrief({
          plan,
          title,
          style,
          outPath: out,
        });

        console.log(`Thumbnail brief: ${out}`);
        console.log(`Text options: ${result.textOptions.length}`);
        break;
      }

      case 'metadata': {
        const planPath = getArg('plan');
        const title = getArg('title');
        const ctaUrl = getArg('cta-url');
        const utmCampaign = getArg('utm-campaign');
        const outDir = getArg('out-dir') || './youtube-metadata';

        let plan;
        if (planPath) plan = createPlan(planPath);

        const result = generateMetadata({
          plan,
          title,
          ctaUrl,
          utmCampaign,
          outDir,
        });

        console.log(`Metadata: ${outDir}`);
        console.log(`Title: ${result.title}`);
        console.log(`Tags: ${result.tags.length}`);
        break;
      }

      case 'package-youtube': {
        const video = getArg('video');
        const metadataDir = getArg('metadata-dir');
        const thumbnail = getArg('thumbnail');
        const out = getArg('out') || './youtube-package';

        const result = packageYouTube({
          videoPath: video,
          metadataDir,
          thumbnailPath: thumbnail,
          outDir: out,
        });

        console.log(`YouTube package: ${result.outDir}`);
        console.log(`Files: ${result.files.length}`);
        for (const f of result.files) console.log(`  ${f}`);
        break;
      }

      case 'demo': {
        const out = getArg('out') || './demo-output';
        if (!existsSync(out)) mkdirSync(out, { recursive: true });

        console.log('VideoLane Demo');
        console.log('=============\n');

        // 1. Generate plan
        console.log('1. Generating plan...');
        const demoScript = `# How to Study with AI

## Introduction
Studying is broken. You read the textbook, highlight everything, and remember nothing.

## Step 1: Understand the topic
Use AI to explain concepts simply.

Type this into Tera: "Explain photosynthesis like I'm 10 years old."

## Step 2: Test yourself
Generate quiz questions from what you learned.

Create 5 quiz questions about photosynthesis.

## Step 3: Build a study plan
Get a realistic 7-day study plan.

## Step 4: Summarize
Pull out the 5 key points you need to remember.

## Honest Assessment
AI doesn't replace studying. It makes studying smarter.

## CTA
Try it free at teraai.chat. 150 credits/month, no credit card.
`;
        const scriptPath = join(out, 'script.md');
        writeFileSync(scriptPath, demoScript);
        const plan = createPlan(scriptPath);
        writeFileSync(join(out, 'plan.json'), JSON.stringify(plan, null, 2));
        console.log(`   Plan: ${plan.scenes.length} scenes`);

        // 2. Generate storyboard
        console.log('2. Generating storyboard...');
        const storyboard = generateStoryboard(plan);
        writeFileSync(join(out, 'storyboard.md'), storyboardToMarkdown(storyboard));
        console.log('   Storyboard saved');

        // 3. Generate captions
        console.log('3. Generating captions...');
        const captions = generateCaptions({
          scriptPath,
          plan,
          outPath: join(out, 'captions.srt'),
          format: 'srt',
          mode: 'script',
        });
        console.log(`   Captions: ${captions.entries.length} entries`);

        // 4. Generate audio
        console.log('4. Generating audio...');
        const audio = generateAudio({
          durationSeconds: plan.durationTargetSeconds,
          style: 'cinematic',
          outPath: join(out, 'music.wav'),
        });
        console.log(`   Audio: ${audio.method}`);

        // 5. Render demo
        console.log('5. Rendering demo...');
        if (checkFFmpeg()) {
          const frames = generateDemoFrames(join(out, 'frames'), 10);
          console.log(`   Frames: ${frames.length}`);
          try {
            const concatFile = join(out, 'frames', 'concat.txt');
            writeFileSync(concatFile, frames.map(f => `file '${f}'`).join('\n'));
            const { execSync } = await import('node:child_process');
            execSync(`ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -y "${join(out, 'demo.mp4')}"`, { stdio: 'pipe' });
            console.log('   Rendered: demo.mp4');
          } catch {
            console.log('   Render skipped (ffmpeg concat failed)');
          }
        } else {
          console.log('   ffmpeg not found — frames generated only');
        }

        // 6. Generate metadata
        console.log('6. Generating YouTube metadata...');
        const metaDir = join(out, 'youtube-metadata');
        const metadata = generateMetadata({
          plan,
          title: 'How to Study with AI',
          ctaUrl: 'https://teraai.chat/auth/signin',
          utmCampaign: 'study_with_ai_2026',
          outDir: metaDir,
        });
        console.log(`   Title: ${metadata.title}`);
        console.log(`   Tags: ${metadata.tags.length}`);

        // 7. Generate thumbnail brief
        console.log('7. Generating thumbnail brief...');
        const thumbnail = generateThumbnailBrief({
          plan,
          title: 'How to Study with AI',
          style: 'dark',
          outPath: join(out, 'thumbnail.json'),
        });
        console.log(`   Text options: ${thumbnail.textOptions.length}`);

        // 8. Generate shorts plan
        console.log('8. Generating shorts plan...');
        const shorts = generateShortsPlan({
          plan,
          outDir: join(out, 'shorts'),
          maxDuration: 30,
        });
        console.log(`   Shorts clips: ${shorts.clips.length}`);

        // 9. Package YouTube
        console.log('9. Packaging for YouTube...');
        const pkg = packageYouTube({
          plan,
          metadataDir: metaDir,
          outDir: join(out, 'youtube-package'),
        });
        console.log(`   Package: ${pkg.files.length} files`);

        // Save demo output
        const demoOutput = {
          project: { name: 'demo', template: 'tera-tutorial' },
          plan: { title: plan.title, scenes: plan.scenes.length, duration: plan.durationTargetSeconds },
          captions: { entries: captions.entries.length, format: 'srt' },
          metadata: { title: metadata.title, tags: metadata.tags.length },
          thumbnailBrief: { textOptions: thumbnail.textOptions.length },
          shortsPlan: { clips: shorts.clips.length },
          audioMethod: audio.method,
          ffmpegAvailable: checkFFmpeg(),
          playwrightAvailable: checkPlaywrightInstalled(),
        };
        writeFileSync(join(out, 'demo-output.json'), JSON.stringify(demoOutput, null, 2));

        console.log('\nDemo complete!');
        console.log(`Output: ${out}`);
        console.log('\nFiles:');
        for (const f of readdirSync(out)) console.log(`  ${f}`);
        break;
      }

      case 'doctor': {
        console.log('VideoLane Doctor');
        console.log('================\n');

        console.log(`Node: ${process.version}`);
        console.log(`VideoLane: v${VERSION}`);
        console.log(`Storage: ${STORAGE_DIR}`);
        console.log(`Storage exists: ${existsSync(STORAGE_DIR)}`);

        const playwright = checkPlaywrightInstalled();
        console.log(`Playwright: ${playwright ? 'installed' : 'NOT installed'}`);

        const ffmpeg = checkFFmpeg();
        console.log(`ffmpeg: ${ffmpeg ? 'installed' : 'NOT installed'}`);

        console.log(`\nEnvironment:`);
        console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'set' : 'not set'}`);
        console.log(`  TALOCODE_API_KEY: ${process.env.TALOCODE_API_KEY ? 'set' : 'not set'}`);

        console.log(`\nTemplates:`);
        const templatesDir = join(import.meta.dirname || '.', '../../templates');
        if (existsSync(templatesDir)) {
          for (const t of readdirSync(templatesDir)) {
            console.log(`  - ${t}`);
          }
        } else {
          console.log('  (templates directory not found)');
        }

        if (!playwright) {
          console.log('\nTo install Playwright:');
          console.log('  npm install playwright');
          console.log('  npx playwright install chromium');
        }
        if (!ffmpeg) {
          console.log('\nTo install ffmpeg:');
          console.log('  apt install ffmpeg (Debian/Ubuntu)');
          console.log('  brew install ffmpeg (macOS)');
        }
        break;
      }

      case 'config': {
        const sub = rest[0];
        const key = rest[1];
        const value = rest[2];

        ensureStorage();
        const config = loadConfig();

        switch (sub) {
          case 'get':
            console.log(config[key] || '(not set)');
            break;
          case 'set':
            if (!key || !value) {
              console.error('Usage: videolane config set <key> <value>');
              process.exit(1);
            }
            config[key] = value;
            saveConfig(config);
            console.log(`Set ${key} = ${value}`);
            break;
          case 'list':
          default:
            for (const [k, v] of Object.entries(config)) {
              console.log(`${k} = ${v}`);
            }
            break;
        }
        break;
      }

      case 'capture': {
        const source = getArg('source') || 'manual';
        const url = getArg('url');
        const out = getArg('out') || './capture';
        const screenshot = hasFlag('screenshot');
        const html = hasFlag('html');

        console.log(`Capture source: ${source}`);
        if (url) console.log(`URL: ${url}`);
        console.log(`Output: ${out}`);
        if (source === 'screenlane') {
          console.log('ScreenLane integration: npm install -g @talocode/screenlane');
        } else {
          console.log('Manual capture mode — capture content yourself');
        }
        break;
      }

      case 'serve': {
        const port = parseInt(getArg('port') || '3110');
        console.log(`Starting VideoLane API on port ${port}...`);
        try {
          const { createServer } = await import('./api/server.js');
          const server = createServer(port);
          console.log(`API running at http://localhost:${port}`);
        } catch {
          console.log('API server not built yet. Run: npm run build');
        }
        break;
      }

      case 'mcp': {
        console.log('Starting VideoLane MCP server (stdio)...');
        try {
          const { startMCPServer } = await import('./mcp/server.js');
          await startMCPServer();
        } catch {
          console.error('MCP server not built yet. Run: npm run build');
        }
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "videolane --help" for available commands');
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${formatError(err)}`);
    process.exit(1);
  }
}

main();
