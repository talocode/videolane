# VideoLane Python Package

Open-source agentic video production engine for product demos, tutorials, and launch videos.

## Install

```bash
pip install talocode-videolane
```

## Quickstart

```bash
# Check environment
videolane-py doctor

# Run demo
videolane-py demo

# Generate plan
videolane-py plan --input script.md

# Generate metadata
videolane-py metadata --plan plan.json --title "My Video"
```

## Python SDK

```python
from talocode_videolane import VideoLaneClient

client = VideoLaneClient()
result = client.health()
print(result)
```

## Commands

- `videolane-py health` — Check API health
- `videolane-py doctor` — Check environment
- `videolane-py plan --input <path>` — Generate plan
- `videolane-py metadata --plan <path> --title <title>` — Generate YouTube metadata
- `videolane-py demo` — Run demo

## Links

- GitHub: https://github.com/talocode/videolane
- npm: https://www.npmjs.com/package/@talocode/videolane

## License

MIT © Talocode
