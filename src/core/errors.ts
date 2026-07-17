export class VideoLaneError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'VideoLaneError';
    this.code = code;
  }
}

export class PlanParseError extends VideoLaneError {
  constructor(message: string) {
    super('PLAN_PARSE_ERROR', message);
    this.name = 'PlanParseError';
  }
}

export class RecordingError extends VideoLaneError {
  constructor(message: string) {
    super('RECORDING_ERROR', message);
    this.name = 'RecordingError';
  }
}

export class RenderError extends VideoLaneError {
  constructor(message: string) {
    super('RENDER_ERROR', message);
    this.name = 'RenderError';
  }
}

export class FFmpegError extends VideoLaneError {
  constructor(message: string) {
    super('FFMPEG_ERROR', message);
    this.name = 'FFmpegError';
  }
}

export class PlaywrightError extends VideoLaneError {
  constructor(message: string) {
    super('PLAYWRIGHT_ERROR', message);
    this.name = 'PlaywrightError';
  }
}

export class ConfigError extends VideoLaneError {
  constructor(message: string) {
    super('CONFIG_ERROR', message);
    this.name = 'ConfigError';
  }
}

export function formatError(err: unknown): string {
  if (err instanceof VideoLaneError) return `[${err.code}] ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}
