import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

export type YouTubePrivacy = 'private' | 'unlisted' | 'public';
export type YouTubeCategory = '1' | '2' | '10' | '17' | '19' | '20' | '22' | '23' | '24' | '25' | '26' | '27' | '28';

export interface YouTubeUploadOptions {
  videoPath: string;
  metadataDir?: string;
  title?: string;
  description?: string;
  tags?: string[];
  privacy?: YouTubePrivacy;
  category?: YouTubeCategory;
  confirmUpload?: boolean;
  confirmPublic?: boolean;
  credentialsPath?: string;
  dryRun?: boolean;
}

export interface YouTubeUploadResult {
  videoId?: string;
  url?: string;
  title: string;
  privacy: YouTubePrivacy;
  status: 'uploaded' | 'dry-run' | 'blocked' | 'packaged-only';
  reason?: string;
  logs: string[];
}

const CREDENTIALS_PATHS = [
  process.env.YOUTUBE_CREDENTIALS_PATH || '',
  join(process.env.HOME || '~', '.videolane', 'youtube-credentials.json'),
  '/workspace/.youtube-credentials.json',
];

function findCredentials(): string | null {
  for (const p of CREDENTIALS_PATHS) {
    if (p && existsSync(p)) return p;
  }
  return null;
}

function checkPythonDeps(): boolean {
  try {
    execSync('python3 -c "import google.oauth2.credentials; import googleapiclient.discovery"', {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function loadMetadata(metadataDir: string): {
  title?: string;
  description?: string;
  tags?: string[];
} {
  const result: { title?: string; description?: string; tags?: string[] } = {};

  const titlePath = join(metadataDir, 'title-options.txt');
  if (existsSync(titlePath)) {
    const content = readFileSync(titlePath, 'utf-8').trim();
    result.title = content.split('\n')[0].trim();
  }

  const descPath = join(metadataDir, 'description.txt');
  if (existsSync(descPath)) {
    result.description = readFileSync(descPath, 'utf-8').trim();
  }

  const tagsPath = join(metadataDir, 'tags.txt');
  if (existsSync(tagsPath)) {
    result.tags = readFileSync(tagsPath, 'utf-8')
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  return result;
}

export function youtubeUpload(options: YouTubeUploadOptions): YouTubeUploadResult {
  const logs: string[] = [];
  const privacy = options.privacy || 'unlisted';
  const confirmUpload = options.confirmUpload ?? false;
  const confirmPublic = options.confirmPublic ?? false;

  // ── Safety gate 1: confirm-upload required ──
  if (!confirmUpload && !options.dryRun) {
    return {
      title: options.title || '(unknown)',
      privacy,
      status: 'blocked',
      reason: 'Upload not confirmed. Add --confirm-upload to proceed. Without it, only packaging is performed.',
      logs: [
        'BLOCKED: --confirm-upload not provided',
        'To upload, run: videolane youtube upload --video <file> --confirm-upload --privacy unlisted',
        'To package only (no upload): videolane youtube upload --video <file>',
      ],
    };
  }

  // ── Safety gate 2: public requires --confirm-public ──
  if (privacy === 'public' && !confirmPublic && !options.dryRun) {
    return {
      title: options.title || '(unknown)',
      privacy,
      status: 'blocked',
      reason: 'Public upload requires --confirm-public flag.',
      logs: [
        'BLOCKED: --privacy public requires --confirm-public',
        'To upload as public: videolane youtube upload --video <file> --confirm-upload --privacy public --confirm-public',
        'Recommendation: upload as unlisted first, review, then switch to public.',
      ],
    };
  }

  // ── Validate video file ──
  if (!existsSync(options.videoPath)) {
    return {
      title: options.title || '(unknown)',
      privacy,
      status: 'blocked',
      reason: `Video file not found: ${options.videoPath}`,
      logs: [`Error: ${options.videoPath} does not exist`],
    };
  }

  // ── Load metadata ──
  let title = options.title || 'Untitled Video';
  let description = options.description || '';
  let tags = options.tags || [];

  if (options.metadataDir && existsSync(options.metadataDir)) {
    const meta = loadMetadata(options.metadataDir);
    if (meta.title) title = meta.title;
    if (meta.description) description = meta.description;
    if (meta.tags?.length) tags = meta.tags;
    logs.push(`Loaded metadata from ${options.metadataDir}`);
  }

  // ── Find credentials ──
  const credsPath = options.credentialsPath || findCredentials();
  if (!credsPath || !existsSync(credsPath)) {
    return {
      title,
      privacy,
      status: 'blocked',
      reason: 'YouTube credentials not found. Run OAuth setup first.',
      logs: [
        'Error: youtube-credentials.json not found',
        'Searched:',
        ...CREDENTIALS_PATHS.filter(p => p).map(p => `  ${p}`),
        'To set up: videolane youtube auth',
      ],
    };
  }

  logs.push(`Credentials: ${credsPath}`);
  logs.push(`Video: ${options.videoPath}`);
  logs.push(`Title: ${title}`);
  logs.push(`Privacy: ${privacy}`);
  logs.push(`Tags: ${tags.length}`);

  // ── Dry run ──
  if (options.dryRun) {
    logs.push('DRY RUN — would upload with:');
    logs.push(`  Title: ${title}`);
    logs.push(`  Privacy: ${privacy}`);
    logs.push(`  Description: ${description.slice(0, 100)}...`);
    logs.push(`  Tags: ${tags.join(', ')}`);

    if (privacy === 'public') {
      logs.push('  WARNING: This will publish publicly');
    }

    return {
      title,
      privacy,
      status: 'dry-run',
      logs,
    };
  }

  // ── Build upload script ──
  const uploadScript = `
import json, sys, requests, pickle, os

creds_path = ${JSON.stringify(credsPath)}
video_path = ${JSON.stringify(options.videoPath)}
title = ${JSON.stringify(title)}
description = ${JSON.stringify(description)}
tags = ${JSON.stringify(tags)}
privacy = ${JSON.stringify(privacy)}
category = ${JSON.stringify(options.category || '28')}

with open(creds_path) as f:
    creds = json.load(f)

token_resp = requests.post('https://oauth2.googleapis.com/token', data={
    'client_id': creds['client_id'],
    'client_secret': creds['client_secret'],
    'refresh_token': creds['refresh_token'],
    'grant_type': 'refresh_token',
    'scope': 'https://www.googleapis.com/auth/youtube.upload',
})
access_token = token_resp.json()['access_token']

body = {
    'snippet': {
        'title': title,
        'description': description,
        'tags': tags,
        'categoryId': category,
        'defaultLanguage': 'en',
    },
    'status': {
        'privacyStatus': privacy,
        'selfDeclaredMadeForKids': False,
        'embeddable': True,
        'publicStatsViewable': True,
    },
}

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json',
    'X-Upload-Content-Type': 'video/mp4',
}

resp = requests.post(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    headers=headers, json=body,
)

if resp.status_code != 200:
    print(json.dumps({'error': resp.text}))
    sys.exit(1)

upload_url = resp.headers.get('Location')
file_size = os.path.getsize(video_path)

with open(video_path, 'rb') as f:
    video_data = f.read()

upload_resp = requests.put(
    upload_url,
    headers={'Content-Length': str(file_size), 'Content-Type': 'video/mp4'},
    data=video_data,
)

if upload_resp.status_code in (200, 201):
    result = upload_resp.json()
    print(json.dumps({'videoId': result['id'], 'url': f'https://www.youtube.com/watch?v={result["id"]}'}))
else:
    print(json.dumps({'error': upload_resp.text}))
    sys.exit(1)
`.trim();

  // ── Execute upload ──
  try {
    logs.push('Uploading...');
    const scriptPath = join(process.env.TMPDIR || '/tmp', `vl-yt-upload-${Date.now()}.py`);
    writeFileSync(scriptPath, uploadScript);

    const output = execSync(`python3 "${scriptPath}"`, {
      stdio: 'pipe',
      timeout: 600_000,
    }).toString().trim();

    // Clean up script
    try { require('node:fs').unlinkSync(scriptPath); } catch {}

    const result = JSON.parse(output);
    if (result.error) {
      return {
        title,
        privacy,
        status: 'blocked',
        reason: `Upload failed: ${result.error}`,
        logs: [...logs, `Error: ${result.error}`],
      };
    }

    logs.push(`Upload complete: ${result.url}`);
    return {
      videoId: result.videoId,
      url: result.url,
      title,
      privacy,
      status: 'uploaded',
      logs,
    };
  } catch (err) {
    return {
      title,
      privacy,
      status: 'blocked',
      reason: `Upload error: ${err}`,
      logs: [...logs, `Error: ${err}`],
    };
  }
}
