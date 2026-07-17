# Security

## Local-first

VideoLane stores all data locally at `~/.videolane/`. No data leaves your machine by default.

## No secrets required

Core functionality works without API keys.

## Optional API keys

- **OpenAI** — For transcription-based captions (set `OPENAI_API_KEY`)
- **Tera** — For AI content generation (set `TALOCODE_API_KEY`)

## Browser profiles

Browser profiles are stored locally. VideoLane does not store passwords or Google credentials.

## YouTube credentials

YouTube auto-upload is not implemented in v0.1. If you configure YouTube credentials, they are stored in environment variables, not in VideoLane storage.

## API authentication

Local API server requires no auth by default. Enable with:

```
VIDEOLANE_REQUIRE_AUTH=true
VIDEOLANE_API_AUTH_TOKEN=<your-token>
```

## Committing secrets

Never commit `.env` files, API keys, or credentials to git.
