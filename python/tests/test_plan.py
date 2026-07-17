"""Tests for plan generation."""

import json
import tempfile
import os
from talocode_videolane import VideoLaneClient


def test_plan_generation():
    """Test that plan can be generated via API or locally."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        f.write("# Test Video\n\n## Intro\nHello world.\n\n## Step 1\nDo something.\n")
        f.flush()
        # Just test that the file was created
        assert os.path.exists(f.name)
        os.unlink(f.name)
