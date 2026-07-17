import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export type VideoFormat = 'longform' | 'short' | 'demo' | 'tutorial' | 'launch';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type ProjectStatus = 'created' | 'planned' | 'recording' | 'rendering' | 'complete' | 'error';
export type BrowserType = 'chromium' | 'firefox' | 'webkit';
export type AudioStyle = 'ambient' | 'cinematic' | 'minimal' | 'study' | 'tech';
export type CaptionFormat = 'srt' | 'vtt' | 'json';
export type CaptionMode = 'script' | 'timed' | 'transcribe';
export type RenderFormat = 'mp4' | 'webm';
export type Resolution = '1920x1080' | '1080x1920' | '1280x720';
export type ThumbnailStyle = 'clean' | 'bold' | 'dark' | 'education' | 'tech';
export type CaptureSource = 'screen' | 'window' | 'browser' | 'url' | 'manual' | 'screenlane';
export type PlanInputFormat = 'script' | 'package' | 'template' | 'json';

export interface VideoProject {
  id: string;
  name: string;
  description: string;
  template?: string;
  createdAt: string;
  updatedAt: string;
  rootDir: string;
  status: ProjectStatus;
  metadata: Record<string, unknown>;
}

export interface VideoPlan {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  audience: string;
  durationTargetSeconds: number;
  format: VideoFormat;
  aspectRatio: AspectRatio;
  scenes: Scene[];
  assets: PlanAssets;
  output: PlanOutput;
  metadata: Record<string, unknown>;
}

export interface Scene {
  id: string;
  index: number;
  title: string;
  durationSeconds: number;
  narration: string;
  onScreenText: string;
  browserActions: BrowserAction[];
  screenActions: ScreenAction[];
  captions: CaptionEntry[];
  callouts: string[];
  audioCue?: string;
  expectedOutput?: string;
  notes?: string;
}

export interface BrowserAction {
  type: 'goto' | 'click' | 'type' | 'wait' | 'screenshot' | 'scroll' | 'press' | 'eval';
  selector?: string;
  url?: string;
  text?: string;
  timeoutMs?: number;
  label?: string;
}

export interface ScreenAction {
  type: 'screenshot' | 'record' | 'pause' | 'zoom';
  durationMs?: number;
  label?: string;
}

export interface CaptionEntry {
  start: number;
  end: number;
  text: string;
}

export interface PlanAssets {
  scriptPath?: string;
  storyboardPath?: string;
  promptsPath?: string;
  descriptionPath?: string;
  tagsPath?: string;
  pinnedCommentPath?: string;
  thumbnailBriefPath?: string;
  shortsPlanPath?: string;
}

export interface PlanOutput {
  dir: string;
  planPath: string;
  captionsPath?: string;
  audioPath?: string;
  recordingPath?: string;
  renderPath?: string;
  thumbnailPath?: string;
  metadataDir?: string;
  shortsDir?: string;
  youtubePackagePath?: string;
}

export interface Recording {
  id: string;
  projectId: string;
  planId: string;
  path: string;
  format: string;
  durationSeconds: number;
  width: number;
  height: number;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface RenderJob {
  id: string;
  projectId: string;
  recordingPath: string;
  outputPath: string;
  captionsPath?: string;
  audioPath?: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  logs: string[];
  createdAt: string;
}

export interface CaptionTrack {
  format: CaptionFormat;
  language: string;
  entries: CaptionEntry[];
}

export interface YouTubeMetadata {
  title: string;
  titleOptions: string[];
  description: string;
  tags: string[];
  hashtags: string[];
  pinnedComment: string;
  thumbnailText: string;
  category: string;
  visibilitySuggestion: string;
  utmLink: string;
  chapters: { time: string; title: string }[];
}

export interface ThumbnailBrief {
  title: string;
  concept: string;
  layout: string;
  colors: Record<string, string>;
  textOptions: { text: string; subtext: string; style: string }[];
  imageDirection: string;
  exportSize: string;
  canvaSteps: string[];
  style?: string;
}

export interface ShortsPlan {
  clips: ShortsClip[];
}

export interface ShortsClip {
  title: string;
  startTime: number;
  endTime: number;
  hook: string;
  caption: string;
  cta: string;
  outputName: string;
}

export interface DoctorResult {
  ok: boolean;
  nodeVersion: string;
  packageVersion: string;
  storagePath: string;
  storageExists: boolean;
  playwrightInstalled: boolean;
  playwrightBrowsers: boolean;
  ffmpegInstalled: boolean;
  screenlaneInstalled: boolean;
  skilllaneInstalled: boolean;
  envVars: Record<string, boolean>;
  templatesAvailable: string[];
}

export interface DemoOutput {
  project: VideoProject;
  plan: VideoPlan;
  captions: CaptionTrack;
  metadata: YouTubeMetadata;
  thumbnailBrief: ThumbnailBrief;
  shortsPlan: ShortsPlan;
  audioGenerated: boolean;
  renderGenerated: boolean;
  youtubePackageDir?: string;
}

export const STORAGE_DIR = join(homedir(), '.videolane');
export const CONFIG_FILE = join(STORAGE_DIR, 'config.json');
export const PROJECTS_DIR = join(STORAGE_DIR, 'projects');

export function ensureStorage(): void {
  if (!existsSync(STORAGE_DIR)) mkdirSync(STORAGE_DIR, { recursive: true });
  if (!existsSync(PROJECTS_DIR)) mkdirSync(PROJECTS_DIR, { recursive: true });
}

export function loadConfig(): Record<string, unknown> {
  ensureStorage();
  if (!existsSync(CONFIG_FILE)) return {};
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

export function saveConfig(config: Record<string, unknown>): void {
  ensureStorage();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function generateId(): string {
  return randomUUID().slice(0, 12);
}

export function projectDir(projectId: string): string {
  return join(PROJECTS_DIR, projectId);
}

export function createDefaultProject(name: string, rootDir: string): VideoProject {
  const id = generateId();
  const now = new Date().toISOString();
  return {
    id,
    name,
    description: '',
    createdAt: now,
    updatedAt: now,
    rootDir,
    status: 'created',
    metadata: {},
  };
}

export function createDefaultPlan(projectId: string, title: string): VideoPlan {
  return {
    id: generateId(),
    projectId,
    title,
    objective: '',
    audience: 'general',
    durationTargetSeconds: 300,
    format: 'demo',
    aspectRatio: '16:9',
    scenes: [],
    assets: {},
    output: { dir: '', planPath: '' },
    metadata: {},
  };
}
