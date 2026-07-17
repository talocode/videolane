#!/usr/bin/env python3
"""
VideoLane TTS Voiceover Generator
Generates voiceover audio from timed narration script using edge-tts.
Usage: python voiceover.py <script.json> <output.wav> [voice] [rate]
"""
import sys, os, json, subprocess, tempfile, asyncio

try:
    import edge_tts
except ImportError:
    print("edge-tts not installed. Run: pip install edge-tts", file=sys.stderr)
    sys.exit(1)

DEFAULT_VOICE = "en-US-GuyNeural"
DEFAULT_RATE = "-5%"

async def generate_segment(text: str, voice: str, rate: str, out_path: str):
    comm = edge_tts.Communicate(text, voice, rate=rate)
    await comm.save(out_path)

def generate_voiceover(script_path: str, out_path: str, voice: str = DEFAULT_VOICE, rate: str = DEFAULT_RATE):
    """
    script.json format:
    [
      {"start": 0.0, "text": "Welcome to the video."},
      {"start": 3.5, "text": "Let me show you how this works."}
    ]
    """
    with open(script_path) as f:
        segments = json.load(f)

    if not segments:
        print("No segments in script", file=sys.stderr)
        return False

    tmpdir = tempfile.mkdtemp(prefix="vl_tts_")
    mp3_files = []

    # Generate individual segments
    for i, seg in enumerate(segments):
        mp3_path = os.path.join(tmpdir, f"seg-{i:03d}.mp3")
        asyncio.run(generate_segment(seg["text"], voice, rate, mp3_path))
        mp3_files.append((seg["start"], mp3_path))
        print(f"  TTS [{i+1}/{len(segments)}]: {seg['text'][:50]}...", file=sys.stderr)

    # Build ffmpeg filter to place each segment at its start time
    inputs = []
    filter_parts = []
    for i, (start, path) in enumerate(mp3_files):
        inputs.extend(["-i", path])
        delay_ms = int(start * 1000)
        filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[d{i}]")

    mix_inputs = "".join(f"[d{i}]" for i in range(len(mp3_files)))
    filter_parts.append(f"{mix_inputs}amix=inputs={len(mp3_files)}:duration=longest:normalize=0[voice]")
    filter_str = ";\n".join(filter_parts)

    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", filter_str,
        "-map", "[voice]",
        "-ar", "24000", "-ac", "1",
        out_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        print(f"ffmpeg error: {result.stderr[-300:]}", file=sys.stderr)
        return False

    # Cleanup temp files
    for _, f in mp3_files:
        try: os.remove(f)
        except: pass
    try: os.rmdir(tmpdir)
    except: pass

    return True

def extract_narration_from_plan(plan_path: str, out_script_path: str):
    """Extract timed narration from a VideoPlan JSON into voiceover script format."""
    with open(plan_path) as f:
        plan = json.load(f)

    segments = []
    current_time = 0.0

    for scene in plan.get("scenes", []):
        narration = scene.get("narration", "").strip()
        if narration:
            # Clean up narration — remove code blocks, markdown artifacts
            clean = narration.replace("```", "").replace("**", "").strip()
            if clean:
                segments.append({"start": current_time, "text": clean})
        current_time += scene.get("durationSeconds", 10)

    with open(out_script_path, "w") as f:
        json.dump(segments, f, indent=2)

    return len(segments)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: voiceover.py <script.json> <output.wav> [voice] [rate]", file=sys.stderr)
        sys.exit(1)

    script_path = sys.argv[1]
    out_path = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_VOICE
    rate = sys.argv[4] if len(sys.argv) > 4 else DEFAULT_RATE

    success = generate_voiceover(script_path, out_path, voice, rate)
    sys.exit(0 if success else 1)
