# MCP Reference

Start the MCP server:

```bash
videolane mcp
```

## Tools

### videolane_plan
Generate a video plan from a script or package.

### videolane_record_browser
Record browser actions using Playwright.

### videolane_render
Render video using ffmpeg.

### videolane_generate_captions
Generate captions from a script or plan.

### videolane_generate_audio
Generate background audio.

### videolane_generate_shorts
Generate shorts cutdown plan.

### videolane_generate_thumbnail
Generate thumbnail brief.

### videolane_generate_metadata
Generate YouTube metadata.

### videolane_package_youtube
Package for YouTube upload.

### videolane_doctor
Check environment and dependencies.

### videolane_demo
Run the deterministic demo.

## Usage with Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "videolane": {
      "command": "videolane",
      "args": ["mcp"]
    }
  }
}
```
