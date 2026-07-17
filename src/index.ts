export { createPlan, createPlanFromTemplate, summarizePlan } from './core/plan.js';
export { parseScriptToPlan, parsePackageToPlan } from './core/script.js';
export { generateStoryboard, storyboardToMarkdown } from './core/storyboard.js';
export { recordBrowser, planRecordingActions, checkFFmpeg, renderVideoFFmpeg, generateDemoFrames } from './core/recorder.js';
export { checkPlaywrightInstalled, generateManualInstructions, buildPlaywrightScript } from './core/browser.js';
export { render } from './core/renderer.js';
export { generateCaptions } from './core/captions.js';
export { generateAudio } from './core/audio.js';
export { generateVoiceover, mixVoiceoverWithVideo, mixVoiceoverWithMusic, planToVoiceoverScript } from './core/voiceover.js';
export { generateShortsPlan, exportShorts } from './core/shorts.js';
export { generateThumbnailBrief } from './core/thumbnail.js';
export { generateMetadata } from './core/metadata.js';
export { packageYouTube } from './core/package.js';
export { youtubeUpload } from './core/youtube.js';
export { initProject, createProject } from './core/project.js';
export { saveProject, loadProject, listProjects, savePlan, loadPlan } from './core/storage.js';
export {
  VideoProject, VideoPlan, Scene, BrowserAction, Recording, RenderJob,
  CaptionTrack, CaptionEntry, YouTubeMetadata, ThumbnailBrief, ShortsPlan,
  DoctorResult, DemoOutput, generateId, ensureStorage, loadConfig, saveConfig,
} from './core/config.js';
export type { TTSVoice, VoiceoverSegment, VoiceoverOptions, VoiceoverResult } from './core/voiceover.js';
export type { YouTubePrivacy, YouTubeCategory, YouTubeUploadOptions, YouTubeUploadResult } from './core/youtube.js';

export class VideoLaneClient {
  private baseUrl?: string;

  constructor(options?: { baseUrl?: string }) {
    this.baseUrl = options?.baseUrl;
  }

  async initProject(input: { name: string; template?: string }) {
    const { initProject } = await import('./core/project.js');
    return initProject(input);
  }

  async plan(input: { path: string; template?: string }) {
    const { createPlan, createPlanFromTemplate } = await import('./core/plan.js');
    return input.template
      ? createPlanFromTemplate(input.template, input.path)
      : createPlan(input.path);
  }

  async render(input: any) {
    const { render } = await import('./core/renderer.js');
    return render(input);
  }

  async generateCaptions(input: any) {
    const { generateCaptions } = await import('./core/captions.js');
    return generateCaptions(input);
  }

  async generateAudio(input: any) {
    const { generateAudio } = await import('./core/audio.js');
    return generateAudio(input);
  }

  async generateVoiceover(input: any) {
    const { generateVoiceover } = await import('./core/voiceover.js');
    return generateVoiceover(input);
  }

  async generateShorts(input: any) {
    const { generateShortsPlan } = await import('./core/shorts.js');
    return generateShortsPlan(input);
  }

  async generateThumbnail(input: any) {
    const { generateThumbnailBrief } = await import('./core/thumbnail.js');
    return generateThumbnailBrief(input);
  }

  async generateMetadata(input: any) {
    const { generateMetadata } = await import('./core/metadata.js');
    return generateMetadata(input);
  }

  async packageYouTube(input: any) {
    const { packageYouTube } = await import('./core/package.js');
    return packageYouTube(input);
  }

  async youtubeUpload(input: any) {
    const { youtubeUpload } = await import('./core/youtube.js');
    return youtubeUpload(input);
  }

  async doctor() {
    const { checkFFmpeg } = await import('./core/recorder.js');
    const { checkPlaywrightInstalled } = await import('./core/browser.js');
    const { STORAGE_DIR } = await import('./core/config.js');
    const { existsSync } = await import('node:fs');

    return {
      ok: true,
      nodeVersion: process.version,
      packageVersion: '0.1.0',
      storagePath: STORAGE_DIR,
      storageExists: existsSync(STORAGE_DIR),
      playwrightInstalled: checkPlaywrightInstalled(),
      ffmpegInstalled: checkFFmpeg(),
    };
  }
}
