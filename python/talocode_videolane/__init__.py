"""VideoLane Python client — lightweight wrapper for local VideoLane API."""

import json
import subprocess
import os
from typing import Any, Optional


class VideoLaneClient:
    """Python client for VideoLane local API."""

    def __init__(self, base_url: str = "http://localhost:3110"):
        self.base_url = base_url

    def health(self) -> dict:
        """Check API health."""
        import requests
        resp = requests.get(f"{self.base_url}/health")
        return resp.json()

    def doctor(self) -> dict:
        """Check environment dependencies."""
        import requests
        resp = requests.get(f"{self.base_url}/v1/videolane/doctor")
        return resp.json()

    def plan(self, payload: dict) -> dict:
        """Generate a video plan."""
        import requests
        resp = requests.post(f"{self.base_url}/v1/videolane/plan", json=payload)
        return resp.json()

    def render(self, payload: dict) -> dict:
        """Render a video."""
        import requests
        resp = requests.post(f"{self.base_url}/v1/videolane/render", json=payload)
        return resp.json()

    def captions(self, payload: dict) -> dict:
        """Generate captions."""
        import requests
        resp = requests.post(f"{self.base_url}/v1/videolane/captions", json=payload)
        return resp.json()

    def audio(self, payload: dict) -> dict:
        """Generate background audio."""
        import requests
        resp = requests.post(f"{self.base_url}/v1/videolane/audio", json=payload)
        return resp.json()

    def metadata(self, payload: dict) -> dict:
        """Generate YouTube metadata."""
        import requests
        resp = requests.post(f"{self.base_url}/v1/videolane/metadata", json=payload)
        return resp.json()

    def package_youtube(self, payload: dict) -> dict:
        """Package for YouTube upload."""
        import requests
        resp = requests.post(f"{self.base_url}/v1/videolane/package-youtube", json=payload)
        return resp.json()

    def demo(self) -> dict:
        """Run the demo."""
        import requests
        resp = requests.post(f"{self.base_url}/v1/videolane/demo", json={})
        return resp.json()
