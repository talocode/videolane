"""Tests for VideoLane Python package."""

import json
import pytest
from talocode_videolane import VideoLaneClient


def test_client_init():
    client = VideoLaneClient()
    assert client.base_url == "http://localhost:3110"


def test_client_custom_url():
    client = VideoLaneClient(base_url="http://localhost:9999")
    assert client.base_url == "http://localhost:9999"


def test_client_has_methods():
    client = VideoLaneClient()
    assert hasattr(client, "health")
    assert hasattr(client, "doctor")
    assert hasattr(client, "plan")
    assert hasattr(client, "render")
    assert hasattr(client, "captions")
    assert hasattr(client, "audio")
    assert hasattr(client, "metadata")
    assert hasattr(client, "package_youtube")
    assert hasattr(client, "demo")
