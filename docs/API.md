# API Reference

Start the API server:

```bash
videolane serve --port 3110
```

## Endpoints

### Health

```
GET /health
GET /v1/videolane/health
```

### Doctor

```
GET /v1/videolane/doctor
```

### Plan

```
POST /v1/videolane/plan
Content-Type: application/json

{
  "input": "./script.md",
  "template": "tera-tutorial"
}
```

### Render

```
POST /v1/videolane/render
Content-Type: application/json

{
  "recordingPath": "./raw.mp4",
  "captionsPath": "./captions.srt",
  "audioPath": "./music.wav",
  "outputPath": "./final.mp4"
}
```

### Captions

```
POST /v1/videolane/captions
Content-Type: application/json

{
  "scriptPath": "./script.md",
  "outPath": "./captions.srt",
  "format": "srt",
  "mode": "script"
}
```

### Audio

```
POST /v1/videolane/audio
Content-Type: application/json

{
  "durationSeconds": 60,
  "style": "cinematic",
  "outPath": "./music.wav"
}
```

### Shorts

```
POST /v1/videolane/shorts
Content-Type: application/json

{
  "planPath": "./plan.json",
  "outDir": "./shorts/",
  "maxDuration": 30
}
```

### Thumbnail

```
POST /v1/videolane/thumbnail
Content-Type: application/json

{
  "title": "My Video",
  "style": "dark",
  "outPath": "./thumbnail.json"
}
```

### Metadata

```
POST /v1/videolane/metadata
Content-Type: application/json

{
  "title": "My Video",
  "ctaUrl": "https://example.com",
  "utmCampaign": "my_video",
  "outDir": "./metadata/"
}
```

### Package YouTube

```
POST /v1/videolane/package-youtube
Content-Type: application/json

{
  "videoPath": "./final.mp4",
  "metadataDir": "./metadata/",
  "outDir": "./youtube-package/"
}
```

## Authentication

By default, localhost requires no auth.

Set `VIDEOLANE_REQUIRE_AUTH=true` and `VIDEOLANE_API_AUTH_TOKEN=<token>` to require:

```
Authorization: Bearer <token>
```

Health endpoint remains public.
